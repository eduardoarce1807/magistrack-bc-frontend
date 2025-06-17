import { Routes } from '@angular/router';

export const produccionRoutes: Routes = [
  { path: 'bandeja-produccion', loadComponent: () => import('./bandeja-produccion/bandeja-produccion.component').then(m => m.BandejaProduccionComponent) },
    { path: 'bandeja-calidad', loadComponent: () => import('./bandeja-calidad/bandeja-calidad.component').then(m => m.BandejaCalidadComponent) },
    { path: 'bandeja-envasado', loadComponent: () => import('./bandeja-envasado/bandeja-envasado.component').then(m => m.BandejaEnvasadoComponent) },
    { path: 'bandeja-etiquetado', loadComponent: () => import('./bandeja-etiquetado/bandeja-etiquetado.component').then(m => m.BandejaEtiquetadoComponent) },
    { path: 'bandeja-despacho', loadComponent: () => import('./bandeja-despacho/bandeja-despacho.component').then(m => m.BandejaDespachoComponent) },
    { path: 'registro-despacho/:idPedido', loadComponent: () => import('./registro-despacho/registro-despacho.component').then(m => m.RegistroDespachoComponent) },

];