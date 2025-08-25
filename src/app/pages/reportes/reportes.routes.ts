import { Routes } from '@angular/router';
import { AuthGuard } from '../../guards/auth.guard';

export const reportesRoutes: Routes = [
  { path: 'consulta-ventas', loadComponent: () => import('./consulta-ventas/consulta-ventas.component').then(m => m.ConsultaVentasComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'reportes-graficos', loadComponent: () => import('./reportes-graficos/reportes-graficos.component').then(m => m.ReportesGraficosComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'ventas-productos', loadComponent: () => import('./reporte-ventas-productos/reporte-ventas-productos.component').then(m => m.ReporteVentasProductosComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'ventas-clientes', loadComponent: () => import('./reporte-ventas-clientes/reporte-ventas-clientes.component').then(m => m.ReporteVentasClientesComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'ventas-roles', loadComponent: () => import('./reporte-ventas-roles/reporte-ventas-roles.component').then(m => m.ReporteVentasRolesComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
];