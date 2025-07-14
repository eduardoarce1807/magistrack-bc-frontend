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
  carrito: Producto[] = [];
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
  crearPedido(){

    if(this.carrito.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Carrito vacío',
        text: 'No hay productos en el carrito para procesar la venta.',
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
    this.pedidoService.createPedidoVentaRapida(request).subscribe((data: any) => {
      if(data){
        this.idPedido = data.idPedido;
        Swal.fire({
          icon: 'success',
          title: "¡Listo!",
          text: "Venta guardada correctamente. ¿Desea enviar el comprobante?",
          showCancelButton: true,
          confirmButtonText: 'Sí, enviar Comprobante',
          cancelButtonText: 'No',
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
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: 'No se pudo guardar la venta, inténtelo de nuevo.',
        showConfirmButton: true
      });
    });
    
  }

  @ViewChild('enviarComprobante', { static: true })
    enviarComprobante!: TemplateRef<any>;
  openModal(content: TemplateRef<any>) {
    this.modalService.dismissAll(); // Cierra cualquier modal abierto antes de abrir uno nuevo
    this.modalService.open(content, {backdrop: 'static', keyboard: false});
  }

  ticketVenta(){

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
