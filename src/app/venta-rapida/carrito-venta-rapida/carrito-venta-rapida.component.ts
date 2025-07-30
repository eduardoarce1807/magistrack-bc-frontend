import { Component, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Producto, CarritoService } from '../../services/carrito.service';
import { Router } from '@angular/router';
import { TipoPagoService } from '../../services/tipo-pago.service';
import Swal from 'sweetalert2';
import { PedidoService } from '../../services/pedido.service';
import { FormsModule } from '@angular/forms';
import { UtilDate } from '../../util/util-date';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DocumentoService } from '../../services/documento.service';
import { BancoService } from '../../services/banco.service';

interface ProductoVentaRapida {
  idProducto: string;
  cantidad: number;
}

interface PedidoRequest {
  idCliente: number;
  fechaPedido: string;
  idEstadoPedido: number;
  idTipoPago: number;
  observaciones: string;
  fechaEstimadaEntrega: string;
  idCanalVenta: number;
  numeroOperacion: string;
  idBanco: number | null; // Si es null, no se envía
  fechaPago: string; // Solo si es necesario
  productos: ProductoVentaRapida[]; // Si es necesario enviar los productos
}

@Component({
  selector: 'app-carrito-venta-rapida',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './carrito-venta-rapida.component.html',
  styleUrls: ['./carrito-venta-rapida.component.scss']
})
export class CarritoVentaRapidaComponent implements OnInit {
  carrito: any[] = [];
  total = 0;
  lstTiposPago: any = [];
  lstBancos: any = [];
  idTipoPago: number = 0;
  idBanco: number | null = null;

  efectivoRecibido = 0;
  vuelto = 0;
  numeroOperacion = '';

  dni = '';
  nombreCliente = '';
  celular = '';

  tipoComprobante = 'ticket'; // Por defecto, se envía un ticket
  ruc = '';
  razonSocial = '';

  private modalService = inject(NgbModal);

  constructor(public router: Router,
    private carritoService: CarritoService,
    private tipoPagoService: TipoPagoService,
    private pedidoService: PedidoService,
    private documentoService: DocumentoService,
  private bancoService: BancoService) {}

  ngOnInit(): void {
    this.carritoService.carrito$.subscribe(productos => {
      this.carrito = productos;
      this.total = this.carritoService.obtenerTotal();
    });
    this.getBancos();
    this.getTiposPago();
  }

  getBancos() {
    this.bancoService.getBancos().subscribe((data: any) => {
      if(data){
        this.lstBancos = data;
      }
    });
  }

  getTiposPago() {
    this.tipoPagoService.getTiposPago().subscribe( (data: any) => {
      if(data){
        this.lstTiposPago = data;
      }
    })
  }

  quitar(idProducto: string) {
    this.carritoService.quitarProducto(idProducto);
  }

  idPedido: string = '';
  loadingCreatePedido = false;
  crearPedido(){
    if(this.carrito.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Carrito vacío',
        text: 'No hay productos en el carrito para procesar la venta.',
        showConfirmButton: true
      });
      return;
    }else if (this.idTipoPago === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Tipo de pago no seleccionado',
        text: 'Por favor, seleccione un tipo de pago para continuar.',
        showConfirmButton: true
      });
      return;
    }

    // Obtener la fecha y hora actual en la zona horaria de Perú (UTC-5)
    const nowPeru = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }));

    // Suponiendo que tienes una utilidad UtilDate con el método toPeruIsoString
    const fechaPedido = UtilDate.toPeruIsoString(nowPeru);

    // Calcular la fecha estimada de entrega (7 días después) en la zona horaria de Perú
    const fechaEstimadaEntregaDate = new Date(nowPeru.getTime() + 7 * 24 * 60 * 60 * 1000);
    const fechaEstimadaEntrega = UtilDate.toPeruIsoString(fechaEstimadaEntregaDate);

    let request: PedidoRequest = {
      idCliente: 15, // cliente generico
      fechaPedido: fechaPedido.slice(0, 19),
      idEstadoPedido: 2, // pagado
      idTipoPago: this.idTipoPago,
      idBanco: this.idBanco ? this.idBanco : null, // Si es null, no se envía
      numeroOperacion: this.numeroOperacion,
      observaciones: '',
      fechaEstimadaEntrega: fechaPedido.slice(0, 19),
      //montoTotal: this.total,
      idCanalVenta: 2, // Venta rapida
      fechaPago: fechaPedido.slice(0, 19), // Fecha de pago es la misma que la del pedido
      productos: this.carrito.map(producto => ({
        idProducto: producto.idProducto,
        cantidad: producto.cantidadSeleccionada,
      })),
    };
    this.loadingCreatePedido = true;
    this.pedidoService.createPedidoVentaRapida(request).subscribe((data: any) => {
      this.loadingCreatePedido = false;
      if(data){
        this.idPedido = data.idPedido;
        Swal.fire({
          icon: 'success',
          title: "¡Listo!",
          text: "Venta guardada correctamente. ¿Desea enviar el comprobante?",
          showCancelButton: true,
          confirmButtonText: 'Sí, enviar Comprobante',
          cancelButtonText: 'No',
          allowEscapeKey: false,
          allowOutsideClick: false
        }).then((result) => {
          this.carritoService.vaciarCarrito();
          this.efectivoRecibido = 0;
          this.vuelto = 0;
          if (result.isConfirmed) {
            this.openModal(this.enviarComprobante);
          } else {
            this.router.navigate(['venta-rapida/productos-venta-rapida']);
          }
        });
      }
    }, error => {
      console.error('Error al crear pedido', error);
      this.loadingCreatePedido = false;
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: error.error.message || 'No se pudo guardar la venta, inténtelo de nuevo.',
        showConfirmButton: true
      });
    });
    
  }

  isValidDni(dni: string): boolean {
    return /^\d{8}$/.test(dni);
  }

  isValidRuc(ruc: string): boolean {
    return /^\d{11}$/.test(ruc);
  }

  // Only allow numeric input for RUC field
  onlyAllowNumbers(event: KeyboardEvent): void {
    const key = event.key;
    if (key < '0' || key > '9') {
      event.preventDefault();
    }
  }

  guardarDatosCliente() {
    if (this.tipoComprobante == "factura") { // Factura
      if (!this.isValidRuc(this.ruc)) {
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: 'El RUC debe tener 11 dígitos.',
          showConfirmButton: true
        });
        return;
      }
      if (this.razonSocial.trim() === '') {
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: 'La razón social no puede estar vacía.',
          showConfirmButton: true
        });
        return;
      }
    } else if (this.tipoComprobante == "boleta") { // Boleta
      if (!this.isValidDni(this.dni)) {
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: 'El DNI debe tener 8 dígitos.',
          showConfirmButton: true
        });
        return;
      }
      if (this.nombreCliente.trim() === '') {
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: 'El nombre completo no puede estar vacío.',
          showConfirmButton: true
        });
        return;
      }
    }

    //Falta validar si el cliente ya tiene un documento creado, y luego selecciona SIN COMPROBANTE

    const tipoComprobanteStr = this.tipoComprobante == "boleta" ? "03" : this.tipoComprobante === "factura" ? "01" : this.tipoComprobante === "boleta-simple" ? "03" : "";
    this.documentoService.crearDocumento({
      idPedido: this.idPedido!,
      tipoComprobante: tipoComprobanteStr,
      tipoDocumentoCliente: this.tipoComprobante === "factura" ? '6' : '1',
      numeroDocumentoCliente: this.tipoComprobante === "factura"
      ? this.ruc
      : this.tipoComprobante === "boleta"
        ? this.dni
        : this.tipoComprobante === "boleta-simple"
        ? "99999999"
        : null,
      razonSocialCliente: this.tipoComprobante === "factura" ? this.razonSocial : null,
      nombreCliente: this.tipoComprobante === "boleta" 
      ? this.nombreCliente 
      : this.tipoComprobante === "boleta-simple"
        ? "CLIENTES VARIOS"
        : null,
      direccionCliente: ""
    }).subscribe(
      (data) => {
      if(data && data.idResultado && data.idResultado > 0) {

        if(this.tipoComprobante == "boleta"){
        this.generarBoleta();
        } else if(this.tipoComprobante == "boleta-simple"){
        this.generarBoletaSimple();
        }else if(this.tipoComprobante == "factura"){
        this.generarFactura();
        }
      }else{
        Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: data.resultado,
        showConfirmButton: true
        });
      }
      },
      (error) => {
      console.error('Error al actualizar datos del cliente', error);
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: 'No se pudo actualizar los datos del cliente, inténtelo de nuevo.',
        showConfirmButton: true
      });
      }
    );
  }

  @ViewChild('enviarComprobante', { static: true })
    enviarComprobante!: TemplateRef<any>;
  openModal(content: TemplateRef<any>) {
    this.modalService.dismissAll(); // Cierra cualquier modal abierto antes de abrir uno nuevo
    this.modalService.open(content, {backdrop: 'static', keyboard: false});
  }

  loadingComprobante = false;

  generarBoletaSimple(){
    this.loadingComprobante = true;
    this.documentoService.generarBoleta(this.idPedido).subscribe({
      next: (data) => {
        this.loadingComprobante = false;
        if(data && data.idResultado && data.idResultado === 1) {
          this.modalService.dismissAll();
          Swal.fire({
            icon: 'success',
            title: '¡Listo!',
            text: data.resultado || 'Comprobante generado correctamente.',
            showConfirmButton: true,
            showCancelButton: true,
            confirmButtonText: 'Enviar por WhatsApp',
            cancelButtonText: 'Cerrar',
          }).then((result) => {
            if (result.isConfirmed) {
              let urlWpp = `https://wa.me/51${this.celular}?text=Hola, aquí está tu Boleta Simple:%0A${data.value}%0ABELLACURET`;
              window.open(urlWpp, '_blank');
            }
          });
        }else{
          Swal.fire({
            icon: 'error',
            title: 'Oops!',
            text: data.resultado || 'No se pudo generar el comprobante, inténtelo de nuevo.',
            showConfirmButton: true,
          });
        }
      },
      error: (error) => {
        this.loadingComprobante = false;
        console.error('Error al generar comprobante', error);
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: `No se pudo generar el comprobante, inténtelo de nuevo.`,
          showConfirmButton: true,
        });
      },
    });
  }

  generarBoleta(){
    this.loadingComprobante = true;
    this.documentoService.generarBoletaManual(this.idPedido, this.dni, this.nombreCliente).subscribe({
      next: (data) => {
        this.loadingComprobante = false;
        if(data && data.idResultado && data.idResultado === 1) {
          this.modalService.dismissAll();
          Swal.fire({
            icon: 'success',
            title: '¡Listo!',
            text: data.resultado || 'Comprobante generado correctamente.',
            showConfirmButton: true,
            showCancelButton: true,
            confirmButtonText: 'Enviar por WhatsApp',
            cancelButtonText: 'Cerrar',
          }).then((result) => {
            if (result.isConfirmed) {
              let urlWpp = `https://wa.me/51${this.celular}?text=Hola, aquí está tu Boleta:%0A${data.value}%0ABELLACURET`;
              window.open(urlWpp, '_blank');
            }
          });
        }else{
          Swal.fire({
            icon: 'error',
            title: 'Oops!',
            text: data.resultado || 'No se pudo generar el comprobante, inténtelo de nuevo.',
            showConfirmButton: true,
          });
        }
      },
      error: (error) => {
        this.loadingComprobante = false;
        console.error('Error al generar comprobante', error);
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: `No se pudo generar el comprobante, inténtelo de nuevo.`,
          showConfirmButton: true,
        });
      },
    });
  }

  generarFactura(){
    this.loadingComprobante = true;
    this.documentoService.generarFacturaManual(this.idPedido, this.ruc, this.razonSocial).subscribe({
      next: (data) => {
        this.loadingComprobante = false;
        if(data && data.idResultado && data.idResultado === 1) {
          this.modalService.dismissAll();
          Swal.fire({
            icon: 'success',
            title: '¡Listo!',
            text: data.resultado || 'Comprobante generado correctamente.',
            showConfirmButton: true,
            showCancelButton: true,
            confirmButtonText: 'Enviar por WhatsApp',
            cancelButtonText: 'Cerrar',
          }).then((result) => {
            if (result.isConfirmed) {
              let urlWpp = `https://wa.me/51${this.celular}?text=Hola, aquí está tu Factura:%0A${data.value}%0ABELLACURET`;
              window.open(urlWpp, '_blank');
            }
          });
        }else{
          Swal.fire({
            icon: 'error',
            title: 'Oops!',
            text: data.resultado || 'No se pudo generar el comprobante, inténtelo de nuevo.',
            showConfirmButton: true,
          });
        }
      },
      error: (error) => {
        this.loadingComprobante = false;
        console.error('Error al generar comprobante', error);
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: `No se pudo generar el comprobante, inténtelo de nuevo.`,
          showConfirmButton: true,
        });
      },
    });
  }

  generarComprobante(){

    // Eliminar espacios en blanco antes de validar
    this.celular = this.celular.replace(/\s+/g, '');

    if (!/^[9]\d{8}$/.test(this.celular)) {
      Swal.fire({
      icon: 'warning',
      title: 'Celular inválido',
      text: 'Ingrese un número de celular válido de 9 dígitos y sin espacios.',
      showConfirmButton: true
      });
      return;
    }

    if(this.tipoComprobante == "ticket"){
      this.ticketVenta();
    }else if(this.tipoComprobante == "boleta" || this.tipoComprobante == "factura" || this.tipoComprobante == "boleta-simple"){
      this.guardarDatosCliente();
    }
  }

  ticketVenta(){

    this.documentoService.sendNotaVenta(this.idPedido).subscribe({
      next: (url: string) => {
        // Si es un string, es la URL del PDF
        let urlWpp = `https://wa.me/51${this.celular}?text=Hola, aquí está tu ticket:%0A${url}%0ABELLACURET`;
        window.open(urlWpp, '_blank');
        this.modalService.dismissAll(); // Cierra el modal después de enviar el comprobante
        this.router.navigate(['venta-rapida/productos-venta-rapida']);
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error al enviar el comprobante',
          text: error.error,
          showConfirmButton: true
        });
      }
    });

  }
}
