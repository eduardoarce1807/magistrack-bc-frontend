import { Routes } from '@angular/router';

export const proveedorRoutes: Routes = [
	{ path: 'mantenimiento-proveedor', loadComponent: () => import('./mantenimiento-proveedor/mantenimiento-proveedor.component').then(m => m.MantenimientoProveedorComponent) },
	{ path: 'asignar-proveedor', loadComponent: () => import('./asignar-proveedor/asignar-proveedor.component').then(m => m.AsignarProveedorComponent) },
	{ path: 'cotizacion-proveedor', loadComponent: () => import('./cotizacion-proveedor/cotizacion-proveedor.component').then(m => m.CotizacionProveedorComponent) },
	{ path: 'ordencompra-proveedor', loadComponent: () => import('./ordencompra-proveedor/ordencompra-proveedor.component').then(m => m.OrdencompraProveedorComponent) }
];
