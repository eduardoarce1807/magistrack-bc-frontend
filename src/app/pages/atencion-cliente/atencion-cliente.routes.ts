import { Routes } from '@angular/router';

export const atencionClienteRoutes: Routes = [
  { path: 'registro-cliente', loadComponent: () => import('./registro-cliente/registro-cliente.component').then(m => m.RegistroClienteComponent) },
  { path: 'bandeja-pedidos', loadComponent: () => import('./bandeja-pedidos/bandeja-pedidos.component').then(m => m.BandejaPedidosComponent) },
  { path: 'bandeja-pedidos-administrador', loadComponent: () => import('./bandeja-pedidos-administrador/bandeja-pedidos-administrador.component').then(m => m.BandejaPedidosAdministradorComponent) },
  { path: 'registro-pedido', loadComponent: () => import('./registro-pedido/registro-pedido.component').then(m => m.RegistroPedidoComponent) },
  { path: 'registro-pedido/:idPedido', loadComponent: () => import('./registro-pedido/registro-pedido.component').then(m => m.RegistroPedidoComponent) },
  { path: 'personalizacion-producto/:idPedido/:idProducto', loadComponent: () => import('./personalizacion-producto/personalizacion-producto.component').then(m => m.PersonalizacionProductoComponent) },
  { path: 'registro-pago-manual', loadComponent: () => import('./registrar-pago-manual/registrar-pago-manual.component').then(m => m.RegistrarPagoManualComponent) },
  { path: 'trazabilidad-pedido/:idPedido', loadComponent: () => import('./trazabilidad-pedido/trazabilidad-pedido.component').then(m => m.TrazabilidadPedidoComponent) },
  { path: 'bandeja-personalizacion', loadComponent: () => import('./bandeja-personalizacion/bandeja-personalizacion.component').then(m => m.BandejaPersonalizacionComponent) },
  { path: 'pagar-pedido/:idPedido', loadComponent: () => import('./pagar-pedido/pagar-pedido.component').then(m => m.PagarPedidoComponent) },
  { path: 'calculadora-maestra/:idPedido/:idProducto', loadComponent: () => import('./calculadora-maestra/calculadora-maestra.component').then(m => m.CalculadoraMaestraComponent) },

//   { path: 'panel-formulador', loadComponent: () => import('./panel-formulador/panel-formulador.component').then(m => m.PanelFormuladorComponent) }
];