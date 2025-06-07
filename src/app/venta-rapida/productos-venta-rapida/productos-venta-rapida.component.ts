import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProductoService } from '../../services/producto.service';
import Swal from 'sweetalert2';
import { CarritoService } from '../../services/carrito.service';

@Component({
  selector: 'app-productos-venta-rapida',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos-venta-rapida.component.html',
  styleUrls: ['./productos-venta-rapida.component.scss']
})
export class ProductosVentaRapidaComponent implements OnInit {
  productos: any = [];
  cantidad: number = 1;
  buscar = '';
  productoSelected: any = null;

  constructor(public router: Router, private productoService: ProductoService, private carritoService: CarritoService) {}
  ngOnInit(): void {
    this.getProductos();
  }

  getProductos() {
    this.productoService.getProductos().subscribe((data) => {
      this.productos = data;
    });
  }

  buscarProducto(){
    if (this.buscar) {
      this.productoService.getBuscarProductos(this.buscar).subscribe((data: any) => {
        this.productos = data;
      },
      (error) => {
        console.error('Error al registrar cliente', error);
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: 'No se pudo registrar el cliente, inténtelo de nuevo.',
          showConfirmButton: true
        });
      });
    } else {
      this.productos = [];
    }
  }

  selectProducto(producto: any) {
    this.productoSelected = producto;
    this.cantidad = 1; // Reiniciar la cantidad al seleccionar un nuevo producto
  }

  agregar(producto: any) {
    console.log('Agregar al carrito:', producto, 'Cantidad:', this.cantidad);
    producto.cantidadSeleccionada = this.cantidad; // Asignar la cantidad seleccionada al producto
    this.carritoService.agregarProducto(producto);
    
    this.productoSelected = null; // Limpiar la selección después de agregar
    this.cantidad = 1; // Reiniciar la cantidad después de agregar
    Swal.fire({
      icon: 'success',
      title: 'Producto agregado',
      text: `${producto.nombre} ha sido agregado al carrito.`,
      showConfirmButton: true
    });
    // Aquí puedes emitir un evento o comunicar con el carrito
  }
}