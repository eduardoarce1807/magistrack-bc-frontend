import { Routes } from '@angular/router';
import { AuthGuard } from '../guards/auth.guard';
export const pagesRoutes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
		canActivate: [AuthGuard]},
	{
		path: 'atencion-cliente',
		loadChildren: () => import('./atencion-cliente/atencion-cliente.routes').then(m => m.atencionClienteRoutes),
		canActivate: [AuthGuard]
	},
	{
		path: 'produccion',
		loadChildren: () => import('./produccion/produccion.routes').then(m => m.produccionRoutes),
		canActivate: [AuthGuard]
	},
	{
		path: 'gestion-producto',
		loadChildren: () => import('./gestion-producto/gestion-producto.routes').then(m => m.gestionProductoRoutes),
		canActivate: [AuthGuard]
	},
	{
		path: 'compras',
		loadChildren: () => import('./compras/compras.routes').then(m => m.comprasRoutes),
		canActivate: [AuthGuard]
	},
	{
		path: 'proveedor',
		loadChildren: () => import('./proveedor/proveedor.routes').then(m => m.proveedorRoutes),
		canActivate: [AuthGuard]
	},
	{
		path: 'inventario',
		loadChildren: () => import('./inventario/inventario.routes').then(m => m.inventarioRoutes),
		canActivate: [AuthGuard]
	},
	{ path: '**', redirectTo: 'auth/login' }

];
