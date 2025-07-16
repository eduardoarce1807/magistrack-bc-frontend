import { Routes } from '@angular/router';
import { AuthGuard } from '../../guards/auth.guard';

export const produccionRoutes: Routes = [
  { path: 'bandeja-produccion', loadComponent: () => import('./bandeja-produccion/bandeja-produccion.component').then(m => m.BandejaProduccionComponent), canActivate: [AuthGuard], data: { roles: [1, 6] } },
    { path: 'bandeja-calidad', loadComponent: () => import('./bandeja-calidad/bandeja-calidad.component').then(m => m.BandejaCalidadComponent), canActivate: [AuthGuard], data: { roles: [1, 7] } },
    { path: 'bandeja-envasado', loadComponent: () => import('./bandeja-envasado/bandeja-envasado.component').then(m => m.BandejaEnvasadoComponent), canActivate: [AuthGuard], data: { roles: [1, 8] } },
    { path: 'bandeja-etiquetado', loadComponent: () => import('./bandeja-etiquetado/bandeja-etiquetado.component').then(m => m.BandejaEtiquetadoComponent), canActivate: [AuthGuard], data: { roles: [1, 9] } },
    { path: 'bandeja-despacho', loadComponent: () => import('./bandeja-despacho/bandeja-despacho.component').then(m => m.BandejaDespachoComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },
    { path: 'registro-despacho/:idPedido', loadComponent: () => import('./registro-despacho/registro-despacho.component').then(m => m.RegistroDespachoComponent), canActivate: [AuthGuard], data: { roles: [1, 5] } },

];