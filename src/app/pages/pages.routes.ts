import { Routes } from '@angular/router';
import { AuthGuard } from '../guards/auth.guard';
import { ProfileCompleteGuard } from '../guards/profile-complete.guard';
export const pagesRoutes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
		canActivate: [AuthGuard, ProfileCompleteGuard]},
	{
		path: 'atencion-cliente',
		loadChildren: () => import('./atencion-cliente/atencion-cliente.routes').then(m => m.atencionClienteRoutes),
		canActivate: [AuthGuard, ProfileCompleteGuard]
	},
	{
		path: 'reportes',
		loadChildren: () => import('./reportes/reportes.routes').then(m => m.reportesRoutes),
		canActivate: [AuthGuard, ProfileCompleteGuard]
	},
	{
		path: 'produccion',
		loadChildren: () => import('./produccion/produccion.routes').then(m => m.produccionRoutes),
		canActivate: [AuthGuard, ProfileCompleteGuard]
	},
	{
		path: 'gestion-producto',
		loadChildren: () => import('./gestion-producto/gestion-producto.routes').then(m => m.gestionProductoRoutes),
		canActivate: [AuthGuard, ProfileCompleteGuard]
	},
	{
		path: 'compras',
		loadChildren: () => import('./compras/compras.routes').then(m => m.comprasRoutes),
		canActivate: [AuthGuard, ProfileCompleteGuard]
	},
	{
		path: 'proveedor',
		loadChildren: () => import('./proveedor/proveedor.routes').then(m => m.proveedorRoutes),
		canActivate: [AuthGuard, ProfileCompleteGuard]
	},
	{
		path: 'inventario',
		loadChildren: () => import('./inventario/inventario.routes').then(m => m.inventarioRoutes),
		canActivate: [AuthGuard, ProfileCompleteGuard]
	},
	{ 
		path: 'gestor-anuncios', 
		loadComponent: () => import('./gestor-anuncios/gestor-anuncios.component').then(m => m.GestorAnunciosComponent),
		canActivate: [AuthGuard, ProfileCompleteGuard],
		data: { roles: [1, 11] } // Solo administrador y atención al cliente
	},
	{ path: 'perfil', loadComponent: () => import('./atencion-cliente/registro-cliente/registro-cliente.component').then(m => m.RegistroClienteComponent), canActivate: [AuthGuard], data: { roles: [2, 3, 4, 11] } },
	{ path: '**', redirectTo: 'auth/login' }

];
