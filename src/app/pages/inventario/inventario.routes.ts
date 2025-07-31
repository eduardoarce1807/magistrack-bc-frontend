import { Routes } from '@angular/router';

export const inventarioRoutes: Routes = [
	{ path: 'inventario-matprima', loadComponent: () => import('./inventario-matprima/inventario-matprima.component').then(m => m.InventarioMatprimaComponent) },
	{ path: 'kardex-producto/:id_materia_prima', loadComponent: () => import('./kardex-producto/kardex-producto.component').then(m => m.KardexProductoComponent) },
];
