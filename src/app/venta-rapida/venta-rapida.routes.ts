import { Routes } from '@angular/router';

export const ventaRapidaRoutes: Routes = [
  { path: 'carrito-venta-rapida', loadComponent: () => import('./carrito-venta-rapida/carrito-venta-rapida.component').then(m => m.CarritoVentaRapidaComponent) },
  { path: 'productos-venta-rapida', loadComponent: () => import('./productos-venta-rapida/productos-venta-rapida.component').then(m => m.ProductosVentaRapidaComponent) },
];