import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Producto, CarritoService } from '../../services/carrito.service';
import { Router } from '@angular/router';
import { TipoPagoService } from '../../services/tipo-pago.service';
import Swal from 'sweetalert2';
import { PedidoService } from '../../services/pedido.service';
import { FormsModule } from '@angular/forms';
import { UtilDate } from '../../util/util-date';

interface PedidoRequest {
  idCliente: number;
  fechaPedido: string;
  idEstadoPedido: number;
  idTipoPago: number;
  observaciones: string;
  fechaEstimadaEntrega: string;
  montoTotal: number;
  idCanalVenta: number;
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
  idTipoPago: number = 0;

  efectivoRecibido = 0;
  vuelto = 0;

  constructor(public router: Router, private carritoService: CarritoService, private tipoPagoService: TipoPagoService, private pedidoService: PedidoService) {}

  ngOnInit(): void {
    this.carritoService.carrito$.subscribe(productos => {
      this.carrito = productos;
      this.total = this.carritoService.obtenerTotal();
    });
    this.getTiposPago();
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
      observaciones: '',
      fechaEstimadaEntrega: fechaEstimadaEntrega.slice(0, 19),
      montoTotal: this.total,
      idCanalVenta: 2 // Venta rapida
    };
    this.pedidoService.createPedido(request).subscribe((data: any) => {
      if(data){
        Swal.fire({
          icon: 'success',
          title: "¡Listo!",
          text: "Venta guardada correctamente."
        }).then( ()=>{
          this.carritoService.vaciarCarrito();
          this.efectivoRecibido = 0;
          this.vuelto = 0;
          this.router.navigate(['venta-rapida/productos-venta-rapida']);
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
}
