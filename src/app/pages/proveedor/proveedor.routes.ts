import { Routes } from '@angular/router';
import { AuthGuard } from '../../guards/auth.guard';

export const proveedorRoutes: Routes = [
	{ path: 'mantenimiento-proveedor', loadComponent: () => import('./mantenimiento-proveedor/mantenimiento-proveedor.component').then(m => m.MantenimientoProveedorComponent), canActivate: [AuthGuard], data: { roles: [1, 15] } },
	{ path: 'asignar-proveedor', loadComponent: () => import('./asignar-proveedor/asignar-proveedor.component').then(m => m.AsignarProveedorComponent), canActivate: [AuthGuard], data: { roles: [1, 15] } },
	{ path: 'cotizacion-proveedor', loadComponent: () => import('./cotizacion-proveedor/cotizacion-proveedor.component').then(m => m.CotizacionProveedorComponent), canActivate: [AuthGuard], data: { roles: [1, 13] } },
	{ path: 'ordencompra-proveedor', loadComponent: () => import('./ordencompra-proveedor/ordencompra-proveedor.component').then(m => m.OrdencompraProveedorComponent), canActivate: [AuthGuard], data: { roles: [1, 13] } }
];
