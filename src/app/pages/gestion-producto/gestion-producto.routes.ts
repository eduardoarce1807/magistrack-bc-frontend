import { Routes } from '@angular/router';

export const gestionProductoRoutes: Routes = [
  { path: 'registro-producto', loadComponent: () => import('./registro-producto/registro-producto.component').then(m => m.RegistroProductoComponent) },
  { path: 'actualizar-producto/:idProductoMaestro', loadComponent: () => import('./registro-producto/registro-producto.component').then(m => m.RegistroProductoComponent) },
  { path: 'registro-cupon', loadComponent: () => import('./registro-cupon/registro-cupon.component').then(m => m.RegistroCuponComponent) },
  { path: 'registro-cupon/:codigoCupon', loadComponent: () => import('./registro-cupon/registro-cupon.component').then(m => m.RegistroCuponComponent) },
  { path: 'listado-cupones', loadComponent: () => import('./listado-cupones/listado-cupones.component').then(m => m.ListadoCuponesComponent) },
  { path: 'catalogo-precios', loadComponent: () => import('./catalogo-precios/catalogo-precios.component').then(m => m.CatalogoPreciosComponent) },
  { path: 'mantenimiento-producto', loadComponent: () => import('./mantenimiento-producto/mantenimiento-producto.component').then(m => m.MantenimientoProductoComponent) },
];