import { Routes } from '@angular/router';
import { atencionClienteRoutes } from './atencion-cliente/atencion-cliente.routes';
import { produccionRoutes } from './produccion/produccion.routes';
import { gestionProductoRoutes } from './gestion-producto/gestion-producto.routes';
import { AuthGuard } from '../guards/auth.guard';

export const pagesRoutes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)},
    { path: 'atencion-cliente', children: atencionClienteRoutes },
    { path: 'produccion', children: produccionRoutes, canActivate: [AuthGuard], data: { roles: [1] } },
    { path: 'gestion-producto', children: gestionProductoRoutes, canActivate: [AuthGuard], data: { roles: [1] } },
    // { path: 'produccion', loadChildren: () => import('./pages/produccion/produccion.routes') },
    // { path: 'compras', loadChildren: () => import('./pages/compras/compras.routes') },
    // { path: 'gestion-producto', loadChildren: () => import('./pages/gestion-producto/gestion-producto.routes') },
    // { path: 'inventario', loadChildren: () => import('./pages/inventario/inventario.routes') },
    // { path: 'venta-rapida', loadChildren: () => import('./pages/venta-rapida/venta-rapida.routes') },
    // { path: 'administracion', loadChildren: () => import('./pages/administracion/administracion.routes') },
    // { path: '**', redirectTo: 'auth/login' }
];