import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PedidoService } from '../../../services/pedido.service';
import { ProductoService } from '../../../services/producto.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoPersonalizadoService } from '../../../services/producto-personalizado.service';
import Swal from 'sweetalert2';

interface ProductoPersonalizadoRequest {
  idPedido: string;
  idProducto: string;
  nombrePersonalizado: string;
  descripcionPersonalizada: string;
  detallesPersonalizacion: string;
}

@Component({
  selector: 'app-personalizacion-producto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personalizacion-producto.component.html',
  styleUrl: './personalizacion-producto.component.scss'
})
export class PersonalizacionProductoComponent implements OnInit {

  idPedido: string | null = null;
  idProducto: string | null = null;
  private routeSubscription: Subscription | null = null;

  nombrePersonalizado: string = '';
  descripcionPersonalizada: string = '';
  detallePersonalizacion: string = '';

  constructor(private productoService: ProductoService, private pedidoService: PedidoService, private route: ActivatedRoute, public router: Router, private productoPersonalizadoService: ProductoPersonalizadoService) {
    }

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.idPedido = params.get('idPedido');
      this.idProducto = params.get('idProducto');
      if(this.idPedido && this.idProducto) {
        this.productoPersonalizadoService.getProductoPersonalizadoByIdPedidoIdProducto(this.idPedido || '', this.idProducto || '').subscribe(
          (productoPersonalizado: any) => {
            if (productoPersonalizado) {
              this.nombrePersonalizado = productoPersonalizado.nombrePersonalizado;
              this.descripcionPersonalizada = productoPersonalizado.descripcionPersonalizada;
              this.detallePersonalizacion = productoPersonalizado.detallesPersonalizacion;
            } else {
              this.getProducto(this.idProducto || '');
            }
          },
          (error) => {
            console.error('Error al cargar el producto personalizado', error);
            this.getProducto(this.idProducto || '');
          }
        );
      }
    });
  }

  getProducto(idProducto: string): void {
    this.productoService.getProductoById(idProducto).subscribe(
      (producto) => {
        if(producto) {
          this.nombrePersonalizado = producto.nombre;
          this.descripcionPersonalizada = producto.descripcion;
        }
        console.log('Producto:', producto);
      },
      (error) => {
        console.error('Error al cargar el producto', error);
      }
    );
  }

  savePersonalizacion(): void {

    let request: ProductoPersonalizadoRequest = {
      idPedido: this.idPedido || '',
      idProducto: this.idProducto || '',
      nombrePersonalizado: this.nombrePersonalizado,
      descripcionPersonalizada: this.descripcionPersonalizada,
      detallesPersonalizacion: this.detallePersonalizacion
    }

    this.productoPersonalizadoService.saveProductoPersonalizado(request).subscribe(
      (producto) => {
        if(producto) {
          Swal.fire({
            icon: 'success',
            title: '¡Listo!',
            text: 'Los datos de personalización del producto han sido guardados.',
            confirmButtonText: 'Aceptar'
          }).then((result) => {
            this.router.navigate(['/pages/atencion-cliente/registro-pedido', this.idPedido]);
          });
        }
      },
      (error) => {
        console.error('Error al guardar el producto personalizado', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo guardar el producto personalizado.',
          confirmButtonText: 'Aceptar'
        });
      }
    );
  }

}
