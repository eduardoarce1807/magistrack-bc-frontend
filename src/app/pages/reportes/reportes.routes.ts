import { Routes } from '@angular/router';
import { AuthGuard } from '../../guards/auth.guard';

export const reportesRoutes: Routes = [
  { path: 'consulta-ventas', loadComponent: () => import('./consulta-ventas/consulta-ventas.component').then(m => m.ConsultaVentasComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'reportes-graficos', loadComponent: () => import('./reportes-graficos/reportes-graficos.component').then(m => m.ReportesGraficosComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'ventas-productos', loadComponent: () => import('./reporte-ventas-productos/reporte-ventas-productos.component').then(m => m.ReporteVentasProductosComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'ventas-clientes', loadComponent: () => import('./reporte-ventas-clientes/reporte-ventas-clientes.component').then(m => m.ReporteVentasClientesComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'ventas-roles', loadComponent: () => import('./reporte-ventas-roles/reporte-ventas-roles.component').then(m => m.ReporteVentasRolesComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'ventas-canales', loadComponent: () => import('./reporte-ventas-canales/reporte-ventas-canales.component').then(m => m.ReporteVentasCanalesComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'top-n', loadComponent: () => import('./reporte-top-n/reporte-top-n.component').then(m => m.ReporteTopNComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'pedidos-produccion', loadComponent: () => import('./reporte-pedidos-produccion/reporte-pedidos-produccion.component').then(m => m.ReportePedidosProduccionComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'cumplimiento-fee', loadComponent: () => import('./reporte-cumplimiento-fee/reporte-cumplimiento-fee.component').then(m => m.ReporteCumplimientoFeeComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'reporte-despacho', loadComponent: () => import('./reporte-despacho/reporte-despacho.component').then(m => m.ReporteDespachoComponent), canActivate: [AuthGuard], data: { roles: [1, 12] } },
];