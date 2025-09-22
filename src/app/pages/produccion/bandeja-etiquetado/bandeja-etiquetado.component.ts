import { Component, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal, NgbPaginationModule, NgbTypeaheadModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import JsBarcode from 'jsbarcode';
import Swal from 'sweetalert2';
import { DataService } from '../../../services/data.service';
import { PedidoService } from '../../../services/pedido.service';
import { ProductoService } from '../../../services/producto.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-bandeja-etiquetado',
  standalone: true,
  imports: [
        FormsModule,
        NgbTypeaheadModule,
        NgbPaginationModule,
        NgbTooltipModule,
        CommonModule
      ],
  templateUrl: './bandeja-etiquetado.component.html',
  styleUrl: './bandeja-etiquetado.component.scss'
})
export class BandejaEtiquetadoComponent implements OnInit {

  productos: any[] = [];
  productosTable: any[] = [];
  page = 1;
  pageSize = 5;
  collectionSize = this.productos.length;
  lstProductosSeleccionados: any[] = [];
  private modalService = inject(NgbModal);

  idProductoBusqueda: string = '';
  isSearching: boolean = false;

  idPedidoNota: string | null = null;
  idProductoNota: string | null = null;
  observacionNota: string = '';

  // Variables para el modal de etiqueta
  productoEtiqueta: any = null;

  tipoEnvio = 0;

  codigoProductoValidar = '';
  procedimientoData: any;

  constructor(
    private pedidoService: PedidoService,
    private productoService: ProductoService,
    private dataService: DataService,
    public router: Router
  ) {}

  ngOnInit(): void {
    // Iniciamos sin cargar productos automáticamente
    // this.getProductosAll();
  }

  getProductosAll(): void {
    this.pedidoService.getProductosEtiquetado().subscribe(
      (productos) => {
        console.log('Productos obtenidos:', productos);
        // Formatear items para uniformidad entre productos y preparados magistrales
        this.productosTable = productos.map((item: any) => this.formatearItem(item));
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

  // Helper para formatear items y unificar la estructura
  private formatearItem(item: any): any {
    const itemFormateado = { ...item };
    
    // Para preparados magistrales, mapear 'id' a 'idProducto' para compatibilidad
    if (item.tipoItem === 'PREPARADO_MAGISTRAL') {
      itemFormateado.idProducto = item.id;
      // Mantener también el id original para las operaciones de actualización
      itemFormateado.idPreparadoMagistral = item.id;
    }
    
    return itemFormateado;
  }

  buscarPorIdProducto(): void {
    if (!this.idProductoBusqueda.trim()) {
      Swal.fire({
        icon: 'warning',
        title: '¡Atención!',
        text: 'Por favor ingrese un ID Producto para buscar.',
        showConfirmButton: true,
      });
      return;
    }

    this.isSearching = true;
    this.pedidoService.getProductosEtiquetadoByIdProducto(this.idProductoBusqueda.trim()).subscribe(
      (response: any) => {
        console.log('Respuesta búsqueda por idProducto:', response);
        
        // Verificar si hay error (idResultado = 0)
        if (response && response.idResultado === 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Productos no encontrados',
            text: response.mensaje || 'El ID Producto ingresado no existe en etiquetado.',
            showConfirmButton: true,
          });
          this.productosTable = [];
          this.refreshProductos();
        } else {
          // Si no hay idResultado ni mensaje, es una lista válida de productos
          // Como puede retornar un array, lo asignamos directamente y formateamos
          const productosRaw = Array.isArray(response) ? response : [response];
          this.productosTable = productosRaw.map((item: any) => this.formatearItem(item));
          this.collectionSize = this.productosTable.length;
          this.refreshProductos();
        }
        this.isSearching = false;
      },
      (error: any) => {
        console.error('Error al buscar productos por idProducto', error);
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

  openModalNota(item: any, content: TemplateRef<any>) {
    this.modalService.open(content, { size: 'lg' });
    this.observacionNota = item.observacion;
    this.idPedidoNota = item.idPedido;
    this.idProductoNota = item.idProducto;
  }

  openModalEtiqueta(item: any, content: TemplateRef<any>) {
    this.productoEtiqueta = item;
    this.modalService.open(content, { size: 'lg', centered: true });
  }

  imprimirEtiqueta() {
    // Crear una ventana de impresión específica para la etiqueta
    const ventanaImpresion = window.open('', '_blank', 'width=600,height=700,scrollbars=yes,resizable=yes');
    
    if (ventanaImpresion) {
      // Generar el HTML para la impresión
      const htmlImpresion = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Etiqueta - ${this.productoEtiqueta?.nombre || 'Producto'}</title>
          <style>
            @media print {
              @page {
                size: A5;
                margin: 10mm;
              }
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
            }
            .etiqueta-container {
              max-width: 500px;
              margin: 0 auto;
              text-align: center;
            }
            .info-producto {
              margin-bottom: 20px;
              padding: 15px;
              border: 1px solid #ddd;
              border-radius: 8px;
              background-color: #f8f9fa;
            }
            .info-producto h3 {
              margin: 0 0 10px 0;
              color: #007bff;
            }
            .info-producto p {
              margin: 5px 0;
              font-size: 14px;
            }
            .etiqueta-imagen {
              max-width: 100%;
              height: auto;
              border: 1px solid #ddd;
              border-radius: 8px;
            }
            .footer-impresion {
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="etiqueta-container">
            <div class="info-producto">
              <h3>Información del Producto</h3>
              <p><strong>Código:</strong> ${this.productoEtiqueta?.id || 'N/A'}</p>
              <p><strong>Nombre:</strong> ${this.productoEtiqueta?.nombre || 'N/A'}</p>
              <p><strong>Presentación:</strong> ${this.productoEtiqueta?.presentacion || ''} ${this.productoEtiqueta?.tipoPresentacion || ''}</p>
              <p><strong>Cantidad:</strong> ${this.productoEtiqueta?.cantidad || 'N/A'}</p>
            </div>
            
            <div>
              <img src="${window.location.origin}/assets/img/etiqueta-generica.svg" 
                   alt="Etiqueta del producto" 
                   class="etiqueta-imagen" />
            </div>
            
            <div class="footer-impresion">
              <p>Etiqueta impresa el ${new Date().toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      // Escribir el contenido en la ventana
      ventanaImpresion.document.write(htmlImpresion);
      ventanaImpresion.document.close();
      
      // Esperar a que cargue y luego imprimir
      ventanaImpresion.onload = function() {
        setTimeout(() => {
          ventanaImpresion.print();
          // Opcional: cerrar la ventana después de imprimir
          setTimeout(() => {
            ventanaImpresion.close();
          }, 1000);
        }, 500);
      };
    } else {
      // Fallback si no se puede abrir la ventana
      alert('No se pudo abrir la ventana de impresión. Por favor, verifique que su navegador permita ventanas emergentes.');
    }
  }

  openModal(content: TemplateRef<any>) {
    this.modalService.dismissAll(); // Cierra cualquier modal abierto antes de abrir uno nuevo
    this.modalService.open(content, {backdrop: 'static', keyboard: false});
  }

  idPedidoValidar: string = '';
  idProductoValidar: string = '';
  openModalValidar(content: TemplateRef<any>, item: any) {
    this.modalService.dismissAll(); // Cierra cualquier modal abierto antes de abrir uno nuevo
    this.modalService.open(content, {backdrop: 'static', keyboard: false});
    this.idPedidoValidar = item.idPedido;
    this.idProductoValidar = item.idProducto;
  }

  openModalXL(content: TemplateRef<any>) {
    this.modalService.open(content, { size: 'xl' });
  }

  @ViewChild('procedimiento', { static: true }) procedimiento: TemplateRef<any> | null = null;
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

  idProductoValidado: string = '';
  nombreProductoValidado: string = '';
  descripcionProductoValidado: string = '';
  presentacionProductoValidado: string = '';

  @ViewChild('datosProductoValidar', { static: true })
  datosProductoValidar!: TemplateRef<any>;

  validarProducto() {
    if (!this.codigoProductoValidar) {
      Swal.fire({
        icon: 'warning',
        title: '¡Atención!',
        text: 'Por favor, ingrese un código de producto válido.',
        showConfirmButton: true,
      });
      return;
    }
    this.codigoProductoValidar = this.codigoProductoValidar.trim();
    this.productoService.getProductoById(this.codigoProductoValidar).subscribe(
      (producto) => {
        if (producto) {
          this.idProductoValidado = producto.idProducto;
          this.nombreProductoValidado = producto.productoMaestro.nombre;
          this.descripcionProductoValidado = producto.productoMaestro.descripcion;
          this.presentacionProductoValidado = producto.presentacion + ' ' + producto.tipoPresentacion.descripcion;
          this.modalService.dismissAll();
          this.codigoProductoValidar = '';

          if(this.idProductoValidar !== this.idProductoValidado) {
            Swal.fire({
              icon: 'warning',
              title: '¡Atención!',
              text: `El código ingresado no corresponde al producto ${this.idProductoValidar} seleccionado. Por favor, verifique el código.`,
              showConfirmButton: true,
            });
            return;
          }

          this.openModal(this.datosProductoValidar);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Producto no encontrado',
            text: 'No se encontró ningún producto con ese código.',
            showConfirmButton: true,
          });
        }
      },
      (error) => {
        console.error('Error al buscar el producto', error);
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: 'No se pudo buscar el producto, inténtelo de nuevo.',
          showConfirmButton: true,
        });
      }
    );
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
    // Si hay un idProducto en búsqueda, volver a buscar por ese idProducto
    if (this.idProductoBusqueda.trim()) {
      this.buscarPorIdProducto();
    } else {
      // Si no hay búsqueda específica, cargar todos (método original)
      this.getProductosAll();
    }
  }

  limpiarBusqueda(): void {
    this.idProductoBusqueda = '';
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
      this.enviarDespachoMasivo();
    }
  }

  enviarDespachoMasivo() {
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
      html: `<p>¿Deseas enviar los items seleccionados a despacho?</p>
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
              idEstadoProducto: 7, // En despacho
              idEstadoPedido: 8, // En despacho
              idEstadoPedidoCliente: 4, // En despacho
              idCliente: this.dataService.getLoggedUser().cliente.idCliente,
              accionRealizada: 'Productos enviados a despacho',
              observacion: '',
            })
          );
        }
        
        // Agregar request para preparados magistrales si hay alguno
        if (preparadosSeleccionados.length > 0) {
          requests.push(
            this.productoService.updateEstadoPreparadoMagistralBulk({
              idPreparadosMagistrales: preparadosSeleccionados,
              idEstadoProducto: 7, // En despacho
              idEstadoPedido: 8, // En despacho
              idEstadoPedidoCliente: 4, // En despacho
              idCliente: this.dataService.getLoggedUser().cliente.idCliente,
              accionRealizada: 'Preparados magistrales enviados a despacho',
              observacion: '',
            })
          );
        }
        
        // Ejecutar todas las requests en paralelo
        if (requests.length > 0) {
          forkJoin(requests).subscribe(
            (responses: any) => {
              Swal.fire({
                icon: 'success',
                title: '¡Listo!',
                text: 'Items enviados a despacho correctamente.',
                showConfirmButton: true,
              }).then(() => {
                this.actualizarListaProductos();
                this.lstProductosSeleccionados = [];
              });
            },
            (error: any) => {
              console.error('Error al enviar items a despacho', error);
              Swal.fire({
                icon: 'error',
                title: 'Oops!',
                text: 'No se pudo enviar los items a despacho, inténtelo de nuevo.',
                showConfirmButton: true,
              });
            }
          );
        }
      }
    });
  }

  enviarDespacho(item: any) {
    this.modalService.dismissAll(); // Cierra cualquier modal abierto antes de enviar

    const tipoTexto = item.tipoItem === 'PREPARADO_MAGISTRAL' ? 'preparado magistral' : 'producto';
    const presentacionTexto = item.tipoItem === 'PREPARADO_MAGISTRAL' 
      ? `${item.presentacion} ${item.tipoPresentacion}` 
      : `${item.presentacion || item.presentacionTotal} ${item.tipoPresentacion}`;

    Swal.fire({
      title: '¿Estás seguro?',
      html: `<p>¿Deseas enviar <strong>${item.cantidad} ${item.nombre} - ${presentacionTexto}</strong> (${tipoTexto}) a despacho?</p>`,
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
            idEstadoProducto: 7, // En despacho
            idEstadoPedido: 8, // En despacho
            idEstadoPedidoCliente: 4, // En despacho
            idCliente: this.dataService.getLoggedUser().cliente.idCliente,
            accionRealizada: 'Preparado magistral enviado a despacho',
            observacion: '',
          };

          this.productoService
            .updateEstadoPreparadoMagistralSingle(requestData)
            .subscribe(
              (response) => {
                Swal.fire({
                  icon: 'success',
                  title: '¡Listo!',
                  text: 'Preparado magistral enviado a despacho correctamente.',
                  showConfirmButton: true,
                }).then(() => {
                  this.actualizarListaProductos();
                  this.lstProductosSeleccionados = [];
                });
              },
              (error) => {
                console.error('Error al enviar preparado magistral a despacho', error);
                Swal.fire({
                  icon: 'error',
                  title: 'Oops!',
                  text: 'No se pudo enviar el preparado magistral a despacho, inténtelo de nuevo.',
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
              idEstadoProducto: 7, // En despacho
              idEstadoPedido: 8, // En despacho
              idEstadoPedidoCliente: 4, // En despacho
              idCliente: this.dataService.getLoggedUser().cliente.idCliente,
              accionRealizada: 'Producto enviado a despacho',
              observacion: '',
            })
            .subscribe(
              (response) => {
                Swal.fire({
                  icon: 'success',
                  title: '¡Listo!',
                  text: 'Producto enviado a despacho correctamente.',
                  showConfirmButton: true,
                }).then(() => {
                  this.actualizarListaProductos();
                  this.lstProductosSeleccionados = [];
                });
              },
              (error) => {
                console.error('Error al enviar producto a despacho', error);
                Swal.fire({
                  icon: 'error',
                  title: 'Oops!',
                  text: 'No se pudo enviar el producto a despacho, inténtelo de nuevo.',
                  showConfirmButton: true,
                });
              }
            );
        }
      }
    });
  }

  enviarDespachoDirecto(item: any) {
    const tipoTexto = item.tipoItem === 'PREPARADO_MAGISTRAL' ? 'preparado magistral' : 'producto';
    const presentacionTexto = item.tipoItem === 'PREPARADO_MAGISTRAL' 
      ? `${item.presentacion} ${item.tipoPresentacion}` 
      : `${item.presentacion || item.presentacionTotal} ${item.tipoPresentacion}`;

    Swal.fire({
      title: '¿Estás seguro?',
      html: `<p>¿Deseas enviar <strong>${item.cantidad} ${item.nombre} - ${presentacionTexto}</strong> (${tipoTexto}) a DESPACHO?</p>`,
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
            idEstadoProducto: 7, // En despacho
            idEstadoPedido: 8, // En despacho
            idEstadoPedidoCliente: 4, // En despacho
            idCliente: this.dataService.getLoggedUser().cliente.idCliente,
            accionRealizada: 'Preparado magistral enviado a despacho',
            observacion: '',
          };

          this.productoService
            .updateEstadoPreparadoMagistralSingle(requestData)
            .subscribe(
              (response) => {
                Swal.fire({
                  icon: 'success',
                  title: '¡Listo!',
                  text: 'Preparado magistral enviado a despacho correctamente.',
                  showConfirmButton: true,
                }).then(() => {
                  // Limpiar input y tabla
                  this.limpiarBusqueda();
                });
              },
              (error) => {
                console.error('Error al enviar preparado magistral a despacho', error);
                Swal.fire({
                  icon: 'error',
                  title: 'Oops!',
                  text: 'No se pudo enviar el preparado magistral a despacho, inténtelo de nuevo.',
                  showConfirmButton: true,
                });
              }
            );
        } else {
          // Lógica para productos normales (mantener como estaba)
          this.productoService
            .updateEstadoProducto({
              idProducto: item.id,
              idPedido: item.idPedido,
              idEstadoProducto: 7, // En despacho
              idEstadoPedido: 8, // En despacho
              idEstadoPedidoCliente: 4, // En despacho
              idCliente: this.dataService.getLoggedUser().cliente.idCliente,
              accionRealizada: 'Producto enviado a despacho',
              observacion: '',
            })
            .subscribe(
              (response) => {
                Swal.fire({
                  icon: 'success',
                  title: '¡Listo!',
                  text: 'Producto enviado a despacho correctamente.',
                  showConfirmButton: true,
                }).then(() => {
                  // Limpiar input y tabla
                  this.limpiarBusqueda();
                });
              },
              (error) => {
                console.error('Error al enviar producto a despacho', error);
                Swal.fire({
                  icon: 'error',
                  title: 'Oops!',
                  text: 'No se pudo enviar el producto a despacho, inténtelo de nuevo.',
                  showConfirmButton: true,
                });
              }
            );
        }
      }
    });
  }
}

