import { Routes } from '@angular/router';
import { pagesRoutes } from './pages/pages.routes';
import { PagesComponent } from './pages/pages.component';
import { ventaRapidaRoutes } from './venta-rapida/venta-rapida.routes';
import { VentaRapidaComponent } from './venta-rapida/venta-rapida.component';

export const routes: Routes = [
    { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
    { path: 'auth/login', loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent) },
    { path: 'pages', component: PagesComponent, children: pagesRoutes },
    { path: 'venta-rapida', component: VentaRapidaComponent, children: ventaRapidaRoutes },
];