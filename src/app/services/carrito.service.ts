import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Producto {
  idProducto: string;
  nombre: string;
  descripcion: string;
  precio: number;
  presentacion: string;
  cantidadSeleccionada: number;
}

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private carrito: Producto[] = [];
  private carritoSubject = new BehaviorSubject<Producto[]>([]);

  carrito$ = this.carritoSubject.asObservable();

  agregarProducto(producto: Producto) {
    const existente = this.carrito.find(p => p.nombre === producto.nombre);
    if (existente) {
      existente.cantidadSeleccionada += producto.cantidadSeleccionada;
    } else {
      this.carrito.push({ ...producto });
    }
    this.carritoSubject.next(this.carrito);
  }

  quitarProducto(idProducto: string) {
    this.carrito = this.carrito.filter(p => p.idProducto !== idProducto);
    this.carritoSubject.next(this.carrito);
  }

  vaciarCarrito() {
    this.carrito = [];
    this.carritoSubject.next(this.carrito);
  }

  obtenerTotal(): number {
    return this.carrito.reduce((total, item) =>
      total + item.precio * item.cantidadSeleccionada, 0);
  }
}
