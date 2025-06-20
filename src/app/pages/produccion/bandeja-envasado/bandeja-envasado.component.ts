import { Component, ElementRef, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal, NgbPaginationModule, NgbTooltipModule, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { DataService } from '../../../services/data.service';
import { PedidoService } from '../../../services/pedido.service';
import { ProductoService } from '../../../services/producto.service';
import { FormsModule } from '@angular/forms';
import JsBarcode from 'jsbarcode';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bandeja-envasado',
  standalone: true,
  imports: [
      FormsModule,
      NgbTypeaheadModule,
      NgbPaginationModule,
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

  idPedidoNota: string | null = null;
  idProductoNota: string | null = null;
  observacionNota: string = '';

  tipoEnvio = 0;

  procedimientoData: any;

  constructor(
    private pedidoService: PedidoService,
    private productoService: ProductoService,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.getProductosAll();
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

  initBarcodes(): void {
    for (let i = 0; i < this.lstProductosSeleccionados.length; i++) {
      const element = this.lstProductosSeleccionados[i];
      JsBarcode(`#barcode-${i}`, element.idProducto);
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
          this.getProductosAll();
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

  enviarEtiquetadoMasivo() {
    let lstProductos = '';
    for (let i = 0; i < this.lstProductosSeleccionados.length; i++) {
      lstProductos +=
        this.lstProductosSeleccionados[i].idProducto + '<br>';
    }

    Swal.fire({
      title: '¿Estás seguro?',
      html: `<p>¿Deseas enviar los productos seleccionados a etiquetado?</p>
          <p>Productos seleccionados:</p>
          <div style="max-height: 200px; overflow-y: auto;">${lstProductos}</div>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.productoService
          .updateEstadoProductoPedidoMasivo({
            idProductos: this.lstProductosSeleccionados,
            idEstadoProducto: 6, // En etiquetado
            idEstadoPedido: 7, // En etiquetado
            idEstadoPedidoCliente: 3, // En producción
            idCliente:
              this.dataService.getLoggedUser().cliente.idCliente,
            accionRealizada: 'Productos enviados a etiquetado',
            observacion: '',
          })
          .subscribe(
            (response) => {
              Swal.fire({
                icon: 'success',
                title: '¡Listo!',
                text: 'Productos enviados a etiquetado correctamente.',
                showConfirmButton: true,
              }).then(() => {
                this.getProductosAll();
                this.lstProductosSeleccionados = [];
              });
            },
            (error) => {
              console.error(
                'Error al enviar productos a etiquetado',
                error
              );
              Swal.fire({
                icon: 'error',
                title: 'Oops!',
                text: 'No se pudo enviar los productos a etiquetado, inténtelo de nuevo.',
                showConfirmButton: true,
              });
            }
          );
      }
    });
  }

  enviarEtiquetado(item: any) {

    Swal.fire({
      title: '¿Estás seguro?',
      html: `<p>¿Deseas enviar el producto <strong>${item.idProducto}</strong> a etiquetado?</p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
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
                this.getProductosAll();
                this.lstProductosSeleccionados = [];
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
    });
    
  }
}
