import { Routes } from '@angular/router';
import { pagesRoutes } from './pages/pages.routes';
import { PagesComponent } from './pages/pages.component';
import { ventaRapidaRoutes } from './venta-rapida/venta-rapida.routes';
import { VentaRapidaComponent } from './venta-rapida/venta-rapida.component';
import { AuthGuard } from './guards/auth.guard';
import { ProfileCompleteGuard } from './guards/profile-complete.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
    { path: 'auth/login', loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent) },
    { path: 'registro-publico', loadComponent: () => import('./pages/atencion-cliente/registro-cliente/registro-cliente.component').then(m => m.RegistroClienteComponent) },
    { path: 'pages', component: PagesComponent, children: pagesRoutes },
    // { path: 'venta-rapida', component: VentaRapidaComponent, children: ventaRapidaRoutes },
	{ path: 'venta-rapida', loadChildren: () => import('./venta-rapida/venta-rapida.routes').then(m => m.ventaRapidaRoutes), canActivate: [AuthGuard, ProfileCompleteGuard] },
	// { path: 'pages', loadChildren: () => import('./pages/pages.routes').then(m => m.pagesRoutes) },
];
