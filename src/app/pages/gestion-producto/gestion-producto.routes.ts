import { Routes } from '@angular/router';

export const gestionProductoRoutes: Routes = [
  { path: 'registro-producto', loadComponent: () => import('./registro-producto/registro-producto.component').then(m => m.RegistroProductoComponent) }
];