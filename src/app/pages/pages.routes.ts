import { Routes } from '@angular/router';
import { atencionClienteRoutes } from './atencion-cliente/atencion-cliente.routes';
import { produccionRoutes } from './produccion/produccion.routes';
import { gestionProductoRoutes } from './gestion-producto/gestion-producto.routes';
import {comprasRoutes} from "./compras/compras.routes";

export const pagesRoutes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', loadComponent: () => import('./home/home.component').then(m => m.HomeComponent) },
	{
		path: 'atencion-cliente',
		loadChildren: () => import('./atencion-cliente/atencion-cliente.routes').then(m => m.atencionClienteRoutes)
	},
	{
		path: 'produccion',
		loadChildren: () => import('./produccion/produccion.routes').then(m => m.produccionRoutes)
	},
	{
		path: 'gestion-producto',
		loadChildren: () => import('./gestion-producto/gestion-producto.routes').then(m => m.gestionProductoRoutes)
	},
	{
		path: 'compras',
		loadChildren: () => import('./compras/compras.routes').then(m => m.comprasRoutes)
	},
	{ path: '**', redirectTo: 'auth/login' }
    // { path: 'produccion', loadChildren: () => import('./pages/produccion/produccion.routes') },
    // { path: 'compras', loadChildren: () => import('./pages/compras/compras.routes') },
    // { path: 'gestion-producto', loadChildren: () => import('./pages/gestion-producto/gestion-producto.routes') },
    // { path: 'inventario', loadChildren: () => import('./pages/inventario/inventario.routes') },
    // { path: 'venta-rapida', loadChildren: () => import('./pages/venta-rapida/venta-rapida.routes') },
    // { path: 'administracion', loadChildren: () => import('./pages/administracion/administracion.routes') },
    // { path: '**', redirectTo: 'auth/login' }
];
