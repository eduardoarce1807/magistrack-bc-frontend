import { Routes } from '@angular/router';
import { AuthGuard } from '../../guards/auth.guard';

export const atencionClienteRoutes: Routes = [
  { path: 'registro-cliente', loadComponent: () => import('./registro-cliente/registro-cliente.component').then(m => m.RegistroClienteComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'registro-cliente/:idCliente', loadComponent: () => import('./registro-cliente/registro-cliente.component').then(m => m.RegistroClienteComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'bandeja-pedidos', loadComponent: () => import('./bandeja-pedidos/bandeja-pedidos.component').then(m => m.BandejaPedidosComponent), canActivate: [AuthGuard], data: { roles: [2,3,4] } },
  { path: 'bandeja-pedidos-administrador', loadComponent: () => import('./bandeja-pedidos-administrador/bandeja-pedidos-administrador.component').then(m => m.BandejaPedidosAdministradorComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'bandeja-pedidos-historico', loadComponent: () => import('./bandeja-pedidos-historico/bandeja-pedidos-historico.component').then(m => m.BandejaPedidosHistoricoComponent), canActivate: [AuthGuard], data: { roles: [1, 5, 11, 12] } },
  { path: 'registro-pedido', loadComponent: () => import('./registro-pedido/registro-pedido.component').then(m => m.RegistroPedidoComponent), canActivate: [AuthGuard], data: { roles: [1, 2, 3, 4, 5] } },
  { path: 'registro-pedido/:idPedido', loadComponent: () => import('./registro-pedido/registro-pedido.component').then(m => m.RegistroPedidoComponent), canActivate: [AuthGuard], data: { roles: [1, 2, 3, 4, 5] } },
  { path: 'personalizacion-producto/:idPedido/:idProducto', loadComponent: () => import('./personalizacion-producto/personalizacion-producto.component').then(m => m.PersonalizacionProductoComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'registro-pago-manual', loadComponent: () => import('./registrar-pago-manual/registrar-pago-manual.component').then(m => m.RegistrarPagoManualComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'trazabilidad-pedido/:idPedido', loadComponent: () => import('./trazabilidad-pedido/trazabilidad-pedido.component').then(m => m.TrazabilidadPedidoComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'bandeja-personalizacion', loadComponent: () => import('./bandeja-personalizacion/bandeja-personalizacion.component').then(m => m.BandejaPersonalizacionComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'pagar-pedido/:idPedido', loadComponent: () => import('./pagar-pedido/pagar-pedido.component').then(m => m.PagarPedidoComponent), canActivate: [AuthGuard], data: { roles: [1, 2, 3, 4, 5] } },
  { path: 'calculadora-maestra', loadComponent: () => import('./calculadora-maestra/calculadora-maestra.component').then(m => m.CalculadoraMaestraComponent), canActivate: [AuthGuard], data: { roles: [1, 5, 15] } },
  { path: 'calculadora-maestra/:idPedido/:idProducto', loadComponent: () => import('./calculadora-maestra/calculadora-maestra.component').then(m => m.CalculadoraMaestraComponent), canActivate: [AuthGuard], data: { roles: [1, 5, 15] } },
  { path: 'mantenimiento-clientes', loadComponent: () => import('./mantenimiento-clientes/mantenimiento-clientes.component').then(m => m.MantenimientoClientesComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'visualizador-pagos', loadComponent: () => import('./visualizador-pagos/visualizador-pagos.component').then(m => m.VisualizadorPagosComponent), canActivate: [AuthGuard], data: { roles: [1, 5, 12] } },
  { path: 'reporte-ventas', loadComponent: () => import('./reporte-ventas/reporte-ventas.component').then(m => m.ReporteVentasComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
  { path: 'calculadora-productos', loadComponent: () => import('./calculadora-productos/calculadora-productos.component').then(m => m.CalculadoraProductosComponent), canActivate: [AuthGuard], data: { roles: [1, 5, 15] } },
  { path: 'calculadora-capsulas', loadComponent: () => import('./calculadora-capsulas/calculadora-capsulas.component').then(m => m.CalculadoraCapsulaComponent), canActivate: [AuthGuard], data: { roles: [1, 5, 15] } },
  { path: 'solicitud-preparado-magistral', loadComponent: () => import('./solicitud-preparado-magistral/solicitud-preparado-magistral.component').then(m => m.SolicitudPreparadoMagistralComponent), canActivate: [AuthGuard], data: { roles: [2, 3, 4] } },
  { path: 'quejas-reclamos', loadComponent: () => import('./quejas-reclamos/quejas-reclamos.component').then(m => m.QuejasReclamosComponent), canActivate: [AuthGuard], data: { roles: [2, 3, 4, 11] } },
  
  // Rutas del módulo de devoluciones (solo administrador, atención al cliente y logística)
  { path: 'devoluciones', loadComponent: () => import('./devoluciones/bandeja-devoluciones.component').then(m => m.BandejaDevolucionesComponent), canActivate: [AuthGuard], data: { roles: [1, 11, 12] } },
  { path: 'devoluciones/crear', loadComponent: () => import('./devoluciones/crear-editar-devolucion.component').then(m => m.CrearEditarDevolucionComponent), canActivate: [AuthGuard], data: { roles: [1, 11, 12] } },
  { path: 'devoluciones/editar/:id', loadComponent: () => import('./devoluciones/crear-editar-devolucion.component').then(m => m.CrearEditarDevolucionComponent), canActivate: [AuthGuard], data: { roles: [1, 11, 12] } },
  { path: 'devoluciones/detalle/:id', loadComponent: () => import('./devoluciones/detalle-devolucion.component').then(m => m.DetalleDevolucionComponent), canActivate: [AuthGuard], data: { roles: [1, 11, 12] } },
  
  //   { path: 'panel-formulador', loadComponent: () => import('./panel-formulador/panel-formulador.component').then(m => m.PanelFormuladorComponent) }
];