import { Routes } from '@angular/router';
import { AuthGuard } from '../../guards/auth.guard';

export const atencionClienteRoutes: Routes = [
  { path: 'registro-cliente', loadComponent: () => import('./registro-cliente/registro-cliente.component').then(m => m.RegistroClienteComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'registro-cliente/:idCliente', loadComponent: () => import('./registro-cliente/registro-cliente.component').then(m => m.RegistroClienteComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'bandeja-pedidos', loadComponent: () => import('./bandeja-pedidos/bandeja-pedidos.component').then(m => m.BandejaPedidosComponent), canActivate: [AuthGuard], data: { roles: [2, 5] } },
  { path: 'bandeja-pedidos-administrador', loadComponent: () => import('./bandeja-pedidos-administrador/bandeja-pedidos-administrador.component').then(m => m.BandejaPedidosAdministradorComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'registro-pedido', loadComponent: () => import('./registro-pedido/registro-pedido.component').then(m => m.RegistroPedidoComponent), canActivate: [AuthGuard], data: { roles: [1, 2, 5] } },
  { path: 'registro-pedido/:idPedido', loadComponent: () => import('./registro-pedido/registro-pedido.component').then(m => m.RegistroPedidoComponent), canActivate: [AuthGuard], data: { roles: [1, 2, 5] } },
  { path: 'personalizacion-producto/:idPedido/:idProducto', loadComponent: () => import('./personalizacion-producto/personalizacion-producto.component').then(m => m.PersonalizacionProductoComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'registro-pago-manual', loadComponent: () => import('./registrar-pago-manual/registrar-pago-manual.component').then(m => m.RegistrarPagoManualComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'trazabilidad-pedido/:idPedido', loadComponent: () => import('./trazabilidad-pedido/trazabilidad-pedido.component').then(m => m.TrazabilidadPedidoComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'bandeja-personalizacion', loadComponent: () => import('./bandeja-personalizacion/bandeja-personalizacion.component').then(m => m.BandejaPersonalizacionComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'pagar-pedido/:idPedido', loadComponent: () => import('./pagar-pedido/pagar-pedido.component').then(m => m.PagarPedidoComponent), canActivate: [AuthGuard], data: { roles: [1, 2, 5] } },
  { path: 'calculadora-maestra', loadComponent: () => import('./calculadora-maestra/calculadora-maestra.component').then(m => m.CalculadoraMaestraComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'calculadora-maestra/:idPedido/:idProducto', loadComponent: () => import('./calculadora-maestra/calculadora-maestra.component').then(m => m.CalculadoraMaestraComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'mantenimiento-clientes', loadComponent: () => import('./mantenimiento-clientes/mantenimiento-clientes.component').then(m => m.MantenimientoClientesComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'visualizador-pagos', loadComponent: () => import('./visualizador-pagos/visualizador-pagos.component').then(m => m.VisualizadorPagosComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'reporte-ventas', loadComponent: () => import('./reporte-ventas/reporte-ventas.component').then(m => m.ReporteVentasComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  //   { path: 'panel-formulador', loadComponent: () => import('./panel-formulador/panel-formulador.component').then(m => m.PanelFormuladorComponent) }
];