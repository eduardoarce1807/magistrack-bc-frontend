import { Routes } from '@angular/router';

export const comprasRoutes: Routes = [
	{ path: 'bandeja-requerimientos', loadComponent: () => import('./bandeja-requerimientos/bandeja-requerimientos.component').then(m => m.BandejaRequerimientosComponent) },
	{ path: 'requerimiento-manual', loadComponent: () => import('./requerimiento-manual/requerimiento-manual.component').then(m => m.RequerimientoManualComponent)},
	{ path: 'seleccionar-proveedor', loadComponent: () => import('./seleccionar-proveedor/seleccionar-proveedor.component').then(m => m.SeleccionarProveedorComponent)},
];
