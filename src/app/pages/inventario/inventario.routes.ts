import { Routes } from '@angular/router';
import { AuthGuard } from '../../guards/auth.guard';

export const inventarioRoutes: Routes = [
	{ path: 'inventario-matprima', loadComponent: () => import('./inventario-matprima/inventario-matprima.component').then(m => m.InventarioMatprimaComponent), canActivate: [AuthGuard], data: { roles: [1, 14] } },
	{ path: 'kardex-producto/:id_materia_prima', loadComponent: () => import('./kardex-producto/kardex-producto.component').then(m => m.KardexProductoComponent), canActivate: [AuthGuard], data: { roles: [1, 14] } },
];
