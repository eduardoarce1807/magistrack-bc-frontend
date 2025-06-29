import { Routes } from '@angular/router';
import { AuthGuard } from '../guards/auth.guard';

export const ventaRapidaRoutes: Routes = [
  { path: '', redirectTo: 'productos-venta-rapida', pathMatch: 'full' },
  { path: 'carrito-venta-rapida', loadComponent: () => import('./carrito-venta-rapida/carrito-venta-rapida.component').then(m => m.CarritoVentaRapidaComponent), canActivate: [AuthGuard], data: { roles: [1] } },
  { path: 'productos-venta-rapida', loadComponent: () => import('./productos-venta-rapida/productos-venta-rapida.component').then(m => m.ProductosVentaRapidaComponent), canActivate: [AuthGuard], data: { roles: [1] } },
];