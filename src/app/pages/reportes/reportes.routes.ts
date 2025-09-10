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
  { path: 'orden-compra-periodo', loadComponent: () => import('./compras/orden-compra-periodo/orden-compra-periodo.component').then(m => m.OrdenCompraPeriodoComponent), canActivate: [AuthGuard], data: { roles: [1] } },
  { path: 'comparativo-precio', loadComponent: () => import('./compras/reporte-comparativo-precios/reporte-comparativo-precios.component').then(m => m.ReporteComparativoPreciosComponent), canActivate: [AuthGuard], data: { roles: [1] } },
  { path: 'proveedor-ranking', loadComponent: () => import('./compras/reporte-proveedores-ranking/reporte-proveedores-ranking.component').then(m => m.ReporteProveedoresRankingComponent), canActivate: [AuthGuard], data: { roles: [1] } },
  { path: 'comparativo-stock', loadComponent: () => import('./inventario/reporte-comparativo-stock/reporte-comparativo-stock.component').then(m => m.ReporteComparativoStockComponent), canActivate: [AuthGuard], data: { roles: [1] } },
  { path: 'entradas-salidas', loadComponent: () => import('./inventario/reporte-entradas-salidas/reporte-entradas-salidas.component').then(m => m.ReporteEntradasSalidasComponent), canActivate: [AuthGuard], data: { roles: [1] } },
  { path: 'reporte-valorizacion', loadComponent: () => import('./inventario/reporte-valorizacion/reporte-valorizacion.component').then(m => m.ReporteValorizacionComponent), canActivate: [AuthGuard], data: { roles: [1] } },
  { path: 'reporte-categoria-mp', loadComponent: () => import('./compras/reporte-categorida-mp/reporte-categorida-mp.component').then(m => m.ReporteCategoridaMpComponent), canActivate: [AuthGuard], data: { roles: [1] } },
];
