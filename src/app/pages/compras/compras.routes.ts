import { Routes } from '@angular/router';
import { AuthGuard } from '../../guards/auth.guard';

export const comprasRoutes: Routes = [
	{ path: 'bandeja-requerimientos', loadComponent: () => import('./bandeja-requerimientos/bandeja-requerimientos.component').then(m => m.BandejaRequerimientosComponent), canActivate: [AuthGuard], data: { roles: [1, 13] } },
	{ path: 'requerimiento-manual', loadComponent: () => import('./requerimiento-manual/requerimiento-manual.component').then(m => m.RequerimientoManualComponent), canActivate: [AuthGuard], data: { roles: [1, 13] } },
	{ path: 'seleccionar-proveedor', loadComponent: () => import('./seleccionar-proveedor/seleccionar-proveedor.component').then(m => m.SeleccionarProveedorComponent), canActivate: [AuthGuard], data: { roles: [1, 13] } },
	{ path: 'ordencompra', loadComponent: () => import('./ordencompra/ordencompra.component').then(m => m.OrdencompraComponent), canActivate: [AuthGuard], data: { roles: [1, 13] } },
];
