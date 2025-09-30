import { Routes } from '@angular/router';
import { AuthGuard } from '../../guards/auth.guard';

export const gestionProductoRoutes: Routes = [
  { path: 'registro-producto', loadComponent: () => import('./registro-producto/registro-producto.component').then(m => m.RegistroProductoComponent), canActivate: [AuthGuard], data: { roles: [1, 15] } },
  { path: 'actualizar-producto/:idProductoMaestro', loadComponent: () => import('./registro-producto/registro-producto.component').then(m => m.RegistroProductoComponent), canActivate: [AuthGuard], data: { roles: [1, 15] } },
  { path: 'registro-cupon', loadComponent: () => import('./registro-cupon/registro-cupon.component').then(m => m.RegistroCuponComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'registro-cupon/:codigoCupon', loadComponent: () => import('./registro-cupon/registro-cupon.component').then(m => m.RegistroCuponComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'listado-cupones', loadComponent: () => import('./listado-cupones/listado-cupones.component').then(m => m.ListadoCuponesComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'catalogo-precios', loadComponent: () => import('./catalogo-precios/catalogo-precios.component').then(m => m.CatalogoPreciosComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'mantenimiento-producto', loadComponent: () => import('./mantenimiento-producto/mantenimiento-producto.component').then(m => m.MantenimientoProductoComponent), canActivate: [AuthGuard], data: { roles: [1, 15] } },
  { path: 'bandeja-solicitudes-preparados-magistrales', loadComponent: () => import('./bandeja-solicitudes-preparados-magistrales/bandeja-solicitudes-preparados-magistrales.component').then(m => m.BandejaSolicitudesPreparadosMagistralesComponent), canActivate: [AuthGuard], data: { roles: [1, 15] } },
  { path: 'registro-preparado-magistral', loadComponent: () => import('./registro-preparado-magistral/registro-preparado-magistral.component').then(m => m.RegistroPreparadoMagistralComponent), canActivate: [AuthGuard], data: { roles: [1, 15] } },
];