import { Component, ElementRef, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal, NgbPaginationModule, NgbTooltipModule, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { DataService } from '../../../services/data.service';
import { PedidoService } from '../../../services/pedido.service';
import { ProductoService } from '../../../services/producto.service';
import { FormsModule } from '@angular/forms';
import JsBarcode from 'jsbarcode';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-bandeja-envasado',
  standalone: true,
  imports: [
      FormsModule,
      NgbTypeaheadModule,
      NgbPaginationModule,
      NgbTooltipModule,
      CommonModule
    ],
  templateUrl: './bandeja-envasado.component.html',
  styleUrl: './bandeja-envasado.component.scss'
})
export class BandejaEnvasadoComponent implements OnInit {

  productos: any[] = [];
  productosTable: any[] = [];
  page = 1;
  pageSize = 5;
  collectionSize = this.productos.length;
  lstProductosSeleccionados: any[] = [];
  private modalService = inject(NgbModal);

  idBulkBusqueda: string = '';
  isSearching: boolean = false;

  idPedidoNota: string | null = null;
  idProductoNota: string | null = null;
  observacionNota: string = '';

  // Para modal de código de barras individual
  productoCodigoBarras: any = null;

  tipoEnvio = 0;

  procedimientoData: any;

  constructor(
    private pedidoService: PedidoService,
    private productoService: ProductoService,
    private dataService: DataService,
    public router: Router,
  ) {}

  ngOnInit(): void {
    // Ya no se cargan automáticamente los productos
    // this.getProductosAll();
  }

  getProductosAll(): void {
    this.pedidoService.getProductosEnvasado().subscribe(
      (productos) => {
        console.log('Productos obtenidos:', productos);
        this.productosTable = productos;
        this.collectionSize = this.productosTable.length;
        this.refreshProductos();
      },
      (error) => {
        console.error('Error al obtener productos', error);
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: 'No se pudieron cargar los productos, inténtelo de nuevo.',
          showConfirmButton: true,
        });
      }
    );
  }

  buscarPorIdBulk(): void {
    if (!this.idBulkBusqueda.trim()) {
      Swal.fire({
        icon: 'warning',
        title: '¡Atención!',
        text: 'Por favor ingrese un ID Bulk para buscar.',
        showConfirmButton: true,
      });
      return;
    }

    this.isSearching = true;
    this.pedidoService.getProductosEnvasadoByIdBulk(this.idBulkBusqueda.trim()).subscribe(
      (response: any) => {
        console.log('Respuesta búsqueda por idBulk:', response);
        
        // Verificar si hay error (idResultado = 0)
        if (response && response.idResultado === 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Productos no encontrados',
            text: response.mensaje || 'El ID Bulk ingresado no existe en envasado.',
            showConfirmButton: true,
          });
          this.productosTable = [];
          this.refreshProductos();
        } else {
          // La respuesta es un array de productos que pueden ser normales o preparados magistrales
          // Mapear los campos según el tipo de item
          const productosFormateados = Array.isArray(response) ? response.map(item => this.formatearItem(item)) : [this.formatearItem(response)];
          this.productosTable = productosFormateados;
          this.collectionSize = this.productosTable.length;
          this.refreshProductos();
        }
        this.isSearching = false;
      },
      (error: any) => {
        console.error('Error al buscar productos por idBulk', error);
        Swal.fire({
          icon: 'error',
          title: 'Error de búsqueda',
          text: 'No se pudo realizar la búsqueda, inténtelo de nuevo.',
          showConfirmButton: true,
        });
        this.isSearching = false;
      }
    );
  }

  // Método helper para formatear los items según su tipo
  formatearItem(item: any): any {
    if (item.tipoItem === 'PREPARADO_MAGISTRAL') {
      return {
        ...item,
        idProducto: item.id, // Mapear 'id' a 'idProducto' para compatibilidad
        presentacionTotal: item.presentacion, // Para compatibilidad con el template
        // Mantener todos los otros campos del preparado magistral
      };
    } else {
      // Es un producto normal, mantener estructura original
      return {
        ...item,
        // Asegurar que tenga los campos necesarios
        idProducto: item.id || item.idProducto,
        presentacionTotal: item.presentacion || item.presentacionTotal,
      };
    }
  }

  openModalNota(item: any, content: TemplateRef<any>) {
    this.modalService.open(content, { size: 'lg' });
    this.observacionNota = item.observacion;
    this.idPedidoNota = item.idPedido;
    this.idProductoNota = item.idProducto;
  }

  openModalXL(content: TemplateRef<any>) {
    this.modalService.open(content, { size: 'xl' });
  }

  @ViewChild('procedimiento', { static: true }) procedimiento: TemplateRef<any> | null = null;
  @ViewChild('codigoBarrasIndividual', { static: true }) codigoBarrasIndividual: TemplateRef<any> | null = null;
  @ViewChild('codigoBarrasMasivo', { static: true }) codigoBarrasMasivo: TemplateRef<any> | null = null;
  getHojaProduccion(idProducto: string): void {
    this.productoService.getHojaProduccion(idProducto).subscribe(
      (hojaProduccion) => {
        console.log('Hoja de producción obtenida:', hojaProduccion);
        this.procedimientoData = hojaProduccion;
        if (this.procedimiento) {
          this.openModalXL(this.procedimiento);
        }
      },
      (error) => {
        console.error('Error al obtener la hoja de producción', error);
        Swal.fire({
      icon: 'error',
      title: 'Oops!',
      text: 'No se pudo obtener la hoja de producción, inténtelo de nuevo.',
      showConfirmButton: true,
      });
    }
    );
  }

  @ViewChild('printSection', { static: false }) printSection!: any;

  printDiv() {
    console.log('printSection:', this.printSection);
    if (!this.printSection) {
      console.error('printSection no está definido');
      return;
    }

    const printContents = this.printSection.nativeElement.innerHTML;
    const popupWin = window.open('', '_blank', 'width=800,height=600');
    const styles = document.head.querySelectorAll('style, link[rel="stylesheet"]');

    let stylesHTML = '';
    styles.forEach(style => {
      stylesHTML += style.outerHTML;
    });

    popupWin!.document.open();
    popupWin!.document.write(`
      <html>
        <head>
          <title>Imprimir</title>
          ${stylesHTML}
        </head>
        <body onload="window.print(); window.close();">
          ${printContents}
        </body>
      </html>
    `);
    popupWin!.document.close();
  }


  imprimirCodigosBarra(divId: string): void {
    const printContents = document.getElementById(divId)?.innerHTML;
    if (!printContents) {
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: 'No se encontró el contenido para imprimir.',
        showConfirmButton: true,
      });
      return;
    }
    const printWindow = window.open('', '', 'height=800,width=1100');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Códigos de Barra</title>');
      printWindow.document.write('<style>body{margin:0;padding:20px;} @media print { body { -webkit-print-color-adjust: exact; } }</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write(printContents);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  }

  imprimirCodigoBarraIndividual(): void {
    this.imprimirCodigosBarra('codigoBarraIndividualPrint');
  }

  openModalCodigoBarras(content: TemplateRef<any>) {
    if (this.lstProductosSeleccionados.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: '¡Atención!',
        text: 'No hay productos seleccionados para generar códigos de barras.',
        showConfirmButton: true,
      });
      return;
    }
    this.modalService.open(content, { size: 'xl' });
    setTimeout(() => {
      this.initBarcodes();
    }, 0);
  }

  openModalCodigoBarrasIndividual(content: TemplateRef<any>, producto: any) {
    this.productoCodigoBarras = producto;
    const modalRef = this.modalService.open(content, { 
      size: 'lg',
      centered: true
    });
    
    // Cuando se cierre el modal, limpiar input y tabla
    modalRef.result.then(() => {
      // Modal cerrado con botón de cerrar o acción
      this.limpiarBusqueda();
    }).catch(() => {
      // Modal cerrado con ESC o click fuera
      this.limpiarBusqueda();
    });
    
    setTimeout(() => {
      this.initBarcodeIndividual();
    }, 0);
  }

  initBarcodeIndividual(): void {
    if (this.productoCodigoBarras) {
      JsBarcode('#barcode-individual', this.productoCodigoBarras.idProducto, {
        width: 2, 
        height: 60, 
        displayValue: true, 
        fontSize: 16
      });
    }
  }

  initBarcodes(): void {
    for (let i = 0; i < this.lstProductosSeleccionados.length; i++) {
      const element = this.lstProductosSeleccionados[i];
      JsBarcode(`#barcode-${i}`, element.idProducto, {width: 1, height: 45, displayValue: true, fontSize: 12});
    }
  }

  refreshProductos(): void {
    this.productos = this.productosTable
      .map((producto, i) => ({ id: i + 1, ...producto }))
      .slice(
        (this.page - 1) * this.pageSize,
        (this.page - 1) * this.pageSize + this.pageSize
      );
  }

  actualizarListaProductos(): void {
    // Si hay un idBulk en búsqueda, volver a buscar por ese idBulk
    if (this.idBulkBusqueda.trim()) {
      this.buscarPorIdBulk();
    } else {
      // Si no hay búsqueda específica, cargar todos (método original)
      this.getProductosAll();
    }
  }

  limpiarBusqueda(): void {
    this.idBulkBusqueda = '';
    this.productosTable = [];
    this.productos = [];
    this.collectionSize = 0;
    this.lstProductosSeleccionados = [];
    this.refreshProductos();
  }

  saveObservacion(): void {
    this.pedidoService
      .saveObservacionPedido({
        idPedido: this.idPedidoNota,
        idProducto: this.idProductoNota,
        observacion: this.observacionNota,
      })
      .subscribe(
        (response) => {
          Swal.fire({
            icon: 'success',
            title: '¡Listo!',
            text: 'Observación guardada correctamente.',
            showConfirmButton: true,
          });
          this.actualizarListaProductos();
          this.modalService.dismissAll();
          this.observacionNota = '';
          this.idPedidoNota = null;
          this.idProductoNota = null;
        },
        (error) => {
          console.error('Error al guardar la observación', error);
          Swal.fire({
            icon: 'error',
            title: 'Oops!',
            text: 'No se pudo guardar la observación, inténtelo de nuevo.',
            showConfirmButton: true,
          });
        }
      );
  }

  // Check si un idProducto está seleccionado y cumple condiciones según tipoEnvio y pH
  isSeleccionado(idProducto: string, idPedido: string): boolean {
    return this.lstProductosSeleccionados.some(
      (item) =>
        item.idProducto === idProducto && item.idPedido === idPedido
    );
  }

  // Cambiar selección individual
  toggleSeleccionIndividual(
    idProducto: string,
    idPedido: string,
    event: Event
  ) {
    let checked = (event.target as HTMLInputElement)?.checked;
    if (checked) {
      if (
        !this.lstProductosSeleccionados.some(
          (item) =>
            item.idProducto === idProducto &&
            item.idPedido === idPedido
        )
      ) {
        this.lstProductosSeleccionados.push({
          idProducto: idProducto,
          idPedido: idPedido,
        });
      }
    } else {
      this.lstProductosSeleccionados =
        this.lstProductosSeleccionados.filter(
          (item) =>
            item.idProducto !== idProducto ||
            item.idPedido !== idPedido
        );
    }
    console.log('Productos seleccionados:', this.lstProductosSeleccionados);
  }

  // Check si todos los productos en la página están seleccionados (solo por idProducto y idPedido)
  isTodosSeleccionadosPagina(): boolean {
    if (this.productos.length === 0) return false;
    return this.productos.every((p) =>
      this.lstProductosSeleccionados.some(
        (item) =>
          item.idProducto === p.idProducto &&
          item.idPedido === p.idPedido
      )
    );
  }

  // Cambiar selección masiva en la página actual
  toggleSeleccionTodosPagina(event: Event) {
    const checked = (event.target as HTMLInputElement)?.checked;

    // Solo selecciona/deselecciona todos los productos de la página actual, sin validar phCalidad ni otros
    const idsPagina = this.productos.map((p) => ({
      idProducto: p.idProducto,
      idPedido: p.idPedido,
    }));

    if (checked) {
      idsPagina.forEach(({ idProducto, idPedido }) => {
        if (
          !this.lstProductosSeleccionados.some(
            (item) =>
              item.idProducto === idProducto &&
              item.idPedido === idPedido
          )
        ) {
          this.lstProductosSeleccionados.push({
            idProducto,
            idPedido,
          });
        }
      });
    } else {
      this.lstProductosSeleccionados =
        this.lstProductosSeleccionados.filter(
          (item) =>
            !idsPagina.some(
              (p) =>
                p.idProducto === item.idProducto &&
                p.idPedido === item.idPedido
            )
        );
    }
    console.log('Productos seleccionados:', this.lstProductosSeleccionados);
  }

  enviarMasivo() {
    if (this.lstProductosSeleccionados.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: '¡Atención!',
        text: 'No hay productos seleccionados para enviar.',
        showConfirmButton: true,
      });
      return;
    }
    if (this.tipoEnvio === 0) {
      this.enviarEtiquetadoMasivo();
    }
  }

  enviarEtiquetado(item: any) {
    const tipoTexto = item.tipoItem === 'PREPARADO_MAGISTRAL' ? 'preparado magistral' : 'producto';
    const presentacionTexto = item.tipoItem === 'PREPARADO_MAGISTRAL' 
      ? `${item.presentacion} ${item.tipoPresentacion}` 
      : `${item.presentacion || item.presentacionTotal} ${item.tipoPresentacion}`;

    Swal.fire({
      title: '¿Estás seguro?',
      html: `<p>¿Deseas enviar <strong>${item.cantidad} ${item.nombre} - ${presentacionTexto}</strong> (${tipoTexto}) a etiquetado?</p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        
        if (item.tipoItem === 'PREPARADO_MAGISTRAL') {
          // Lógica para preparados magistrales
          const requestData = {
            idPreparadoMagistral: item.id,
            idPedido: item.idPedido,
            idEstadoProducto: 6, // En etiquetado
            idEstadoPedido: 7, // En etiquetado
            idEstadoPedidoCliente: 3, // En producción
            idCliente: this.dataService.getLoggedUser().cliente.idCliente,
            accionRealizada: 'Preparado magistral enviado a etiquetado',
            observacion: '',
          };

          this.productoService
            .updateEstadoPreparadoMagistralSingle(requestData)
            .subscribe(
              (response) => {
                Swal.fire({
                  icon: 'success',
                  title: '¡Listo!',
                  text: 'Preparado magistral enviado a etiquetado correctamente.',
                  showConfirmButton: true,
                }).then(() => {
                  // No actualizar lista aquí, solo mostrar modal de código de barras
                  // La limpieza se hará cuando se cierre el modal del código de barras
                  this.lstProductosSeleccionados = [];
                  
                  // Mostrar modal de código de barras
                  if (this.codigoBarrasIndividual) {
                    this.openModalCodigoBarrasIndividual(this.codigoBarrasIndividual, item);
                  }
                });
              },
              (error) => {
                console.error('Error al enviar preparado magistral a etiquetado', error);
                Swal.fire({
                  icon: 'error',
                  title: 'Oops!',
                  text: 'No se pudo enviar el preparado magistral a etiquetado, inténtelo de nuevo.',
                  showConfirmButton: true,
                });
              }
            );
        } else {
          // Lógica para productos normales (mantener como estaba)
          this.productoService
            .updateEstadoProducto({
              idProducto: item.idProducto,
              idPedido: item.idPedido,
              idEstadoProducto: 6, // En etiquetado
              idEstadoPedido: 7, // En etiquetado
              idEstadoPedidoCliente: 3, // En producción
              idCliente: this.dataService.getLoggedUser().cliente.idCliente,
              accionRealizada: 'Producto enviado a etiquetado',
              observacion: '',
            })
            .subscribe(
              (response) => {
                Swal.fire({
                  icon: 'success',
                  title: '¡Listo!',
                  text: 'Producto enviado a etiquetado correctamente.',
                  showConfirmButton: true,
                }).then(() => {
                  // No actualizar lista aquí, solo mostrar modal de código de barras
                  // La limpieza se hará cuando se cierre el modal del código de barras
                  this.lstProductosSeleccionados = [];
                  
                  // Mostrar modal de código de barras
                  if (this.codigoBarrasIndividual) {
                    this.openModalCodigoBarrasIndividual(this.codigoBarrasIndividual, item);
                  }
                });
              },
              (error) => {
                console.error('Error al enviar producto a etiquetado', error);
                Swal.fire({
                  icon: 'error',
                  title: 'Oops!',
                  text: 'No se pudo enviar el producto a etiquetado, inténtelo de nuevo.',
                  showConfirmButton: true,
                });
              }
            );
        }
      }
    });
  }

  enviarEtiquetadoMasivo() {
    // Separar productos de preparados magistrales basado en los items completos de la lista
    const productosSeleccionados: any[] = [];
    const preparadosSeleccionados: any[] = [];
    
    // Obtener los items completos basándose en la selección
    this.lstProductosSeleccionados.forEach(seleccionado => {
      const itemCompleto = this.productos.find((item: any) => 
        item.idProducto === seleccionado.idProducto && item.idPedido === seleccionado.idPedido
      );
      
      if (itemCompleto) {
        if (itemCompleto.tipoItem === 'PREPARADO_MAGISTRAL') {
          preparadosSeleccionados.push({
            idPreparadoMagistral: itemCompleto.id,
            idPedido: itemCompleto.idPedido
          });
        } else {
          productosSeleccionados.push({
            idProducto: itemCompleto.idProducto,
            idPedido: itemCompleto.idPedido
          });
        }
      }
    });

    let lstItems = '';
    this.lstProductosSeleccionados.forEach(item => {
      const itemCompleto = this.productos.find((p: any) => 
        p.idProducto === item.idProducto && p.idPedido === item.idPedido
      );
      if (itemCompleto) {
        const tipoTexto = itemCompleto.tipoItem === 'PREPARADO_MAGISTRAL' ? '(PM)' : '(P)';
        lstItems += `${itemCompleto.nombre} ${tipoTexto}<br>`;
      }
    });

    Swal.fire({
      title: '¿Estás seguro?',
      html: `<p>¿Deseas enviar los items seleccionados a etiquetado?</p>
          <p>Items seleccionados:</p>
          <div style="max-height: 200px; overflow-y: auto;">${lstItems}</div>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        const requests: any[] = [];
        
        // Agregar request para productos si hay alguno
        if (productosSeleccionados.length > 0) {
          requests.push(
            this.productoService.updateEstadoProductoPedidoMasivo({
              idProductos: productosSeleccionados,
              idEstadoProducto: 6, // En etiquetado
              idEstadoPedido: 7, // En etiquetado
              idEstadoPedidoCliente: 3, // En producción
              idCliente: this.dataService.getLoggedUser().cliente.idCliente,
              accionRealizada: 'Productos enviados a etiquetado',
              observacion: '',
            })
          );
        }
        
        // Agregar request para preparados magistrales si hay alguno
        if (preparadosSeleccionados.length > 0) {
          requests.push(
            this.productoService.updateEstadoPreparadoMagistralBulk({
              idPreparadosMagistrales: preparadosSeleccionados,
              idEstadoProducto: 6, // En etiquetado
              idEstadoPedido: 7, // En etiquetado
              idEstadoPedidoCliente: 3, // En producción
              idCliente: this.dataService.getLoggedUser().cliente.idCliente,
              accionRealizada: 'Preparados magistrales enviados a etiquetado',
              observacion: '',
            })
          );
        }
        
        // Ejecutar todas las requests en paralelo
        if (requests.length > 0) {
          forkJoin(requests).subscribe(
            (responses) => {
              Swal.fire({
                icon: 'success',
                title: '¡Listo!',
                text: 'Items enviados a etiquetado correctamente.',
                showConfirmButton: true,
              }).then(() => {
                // No actualizar lista aquí, solo mostrar modal de códigos de barras
                // La limpieza se hará cuando se cierre el modal de códigos de barras
                
                // Mostrar modal de códigos de barras para items masivos
                if (this.lstProductosSeleccionados.length > 0 && this.codigoBarrasMasivo) {
                  const modalRef = this.modalService.open(this.codigoBarrasMasivo, { size: 'xl' });
                  
                  // Cuando se cierre el modal, limpiar todo
                  modalRef.result.then(() => {
                    // Modal cerrado con botón de cerrar o acción
                    this.limpiarBusqueda();
                  }).catch(() => {
                    // Modal cerrado con ESC o click fuera
                    this.limpiarBusqueda();
                  });
                  
                  setTimeout(() => {
                    this.initBarcodes();
                  }, 0);
                }
              });
            },
            (error) => {
              console.error('Error al enviar items a etiquetado', error);
              Swal.fire({
                icon: 'error',
                title: 'Oops!',
                text: 'No se pudo enviar los items a etiquetado, inténtelo de nuevo.',
                showConfirmButton: true,
              });
            }
          );
        }
      }
    });
  }
}
