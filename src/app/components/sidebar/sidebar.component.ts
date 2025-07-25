import {Component, ViewEncapsulation} from '@angular/core';
import {Router} from "@angular/router";
import {DataService} from "../../services/data.service";
import {ScrollPanelModule} from "primeng/scrollpanel";
import {ButtonModule} from "primeng/button";
import {PanelMenuModule} from "primeng/panelmenu";
import {MenuItem} from "primeng/api";

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [ScrollPanelModule,ButtonModule,PanelMenuModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
	encapsulation: ViewEncapsulation.None,
})
export class SidebarComponent {
	items: MenuItem[]=[];
	constructor(private router: Router, public dataService: DataService) {

		const user = this.dataService.getLoggedUser();
		const atencionClienteAccessRoles = [1, 5];
		const atencionClienteItems = [
			...(atencionClienteAccessRoles.includes(user.rol.idRol) ? [
				{
					key: '0_0',
					label: 'Registro de Cliente',
					command: () => this.irA('pages/atencion-cliente/registro-cliente')
				},
				{
					key: '0_0',
					label: 'Mantenimiento de Cliente',
					command: () => this.irA('pages/atencion-cliente/mantenimiento-clientes')
				},
			] : []),
			...([1,2,3,4,5].includes(user.rol.idRol) ? [
				{
					key: '0_1',
					label: 'Registro de Pedido',
					command: () => this.irA('pages/atencion-cliente/registro-pedido')
				},
				{
					key: '0_2',
					label: 'Bandeja de Pedidos',
					command: () => this.irA('pages/atencion-cliente/bandeja-pedidos')
				}
			] : []),
			...(atencionClienteAccessRoles.includes(user.rol.idRol) ? [
				{
					key: '0_3',
					label: 'Bandeja de Personalización',
					command: () => this.irA('pages/atencion-cliente/bandeja-personalizacion')
				},
				{
					key: '0_4',
					label: 'Venta rápida',
					command: () => this.irA('venta-rapida/productos-venta-rapida')
				},
				{
					key: '0_5',
					label: 'Visualizador de pagos',
					command: () => this.irA('pages/atencion-cliente/visualizador-pagos')
				},
				{
					key: '0_6',
					label: 'Reporte de Ventas',
					command: () => this.irA('pages/atencion-cliente/reporte-ventas')
				}
			] : [])
		];

		this.items = [
			...(atencionClienteItems.length > 0 ? [{
				key: '0',
				label: 'Atención al Cliente',
				icon: 'pi pi-users',
				items: atencionClienteItems
			}] : []),
			...(user.rol.idRol === 1 || user.rol.idRol === 5 || user.rol.idRol === 6 || user.rol.idRol === 7 || user.rol.idRol === 8 || user.rol.idRol === 9 ? [
				{
					key: '1',
					label: 'Producción',
					icon: 'pi pi-cog',
					items: [
						...([1, 6].includes(user.rol.idRol) ? [
							{
								key: '1_0',
								label: 'Bandeja de producción',
								command: () => this.irA('pages/produccion/bandeja-produccion')
							}
						] : []),
						...([1, 7].includes(user.rol.idRol) ? [
							{
								key: '1_1',
							label: 'Bandeja de calidad',
							command: () => this.irA('pages/produccion/bandeja-calidad')
							}
						] : []),
						...([1, 8].includes(user.rol.idRol) ? [
							{
								key: '1_2',
								label: 'Bandeja de envasado',
								command: () => this.irA('pages/produccion/bandeja-envasado')
							}
						] : []),
						...([1, 9].includes(user.rol.idRol) ? [
							{
								key: '1_3',
								label: 'Bandeja de etiquetado',
								command: () => this.irA('pages/produccion/bandeja-etiquetado')
							}
						] : []),
						...([1, 5].includes(user.rol.idRol) ? [
							{
								key: '1_4',
								label: 'Bandeja de despacho',
								command: () => this.irA('pages/produccion/bandeja-despacho')
							}
						] : [])
					]
				}
			] : []),
			...(user.rol.idRol === 1 ? [
				{
					key: '2',
					label: 'Gestión Producto',
					icon: 'pi pi-box',
					items: [
						{
							key: '2_0',
							label: 'Registro de Producto',
							command: () => this.irA('pages/gestion-producto/registro-producto')
						},
						{
							key: '2_1',
							label: 'Registro de Cupón',
							command: () => this.irA('pages/gestion-producto/registro-cupon')
						},
						{
							key: '2_2',
							label: 'Listado de Cupones',
							command: () => this.irA('pages/gestion-producto/listado-cupones')
						},
						{
							key: '2_3',
							label: 'Catálogo de Precios',
							command: () => this.irA('pages/gestion-producto/catalogo-precios')
						}
					]
				},
				{
					key: '3',
					label: 'Compras',
					icon: 'pi pi-shopping-cart',
					items: [
						{
							key: '3_0',
							label: 'Bandeja de Requerimientos',
							command: () => this.irA('pages/compras/bandeja-requerimientos')
						},
						{
							key: '3_1',
							label: 'Requerimiento manual',
							command: () => this.irA('pages/compras/requerimiento-manual')
						},
						{
							key: '3_2',
							label: 'Seleccionar Proveedor x Cotización',
							command: () => this.irA('pages/compras/seleccionar-proveedor')
						},
						{
							key: '3_3',
							label: 'Ordenes de Compras',
							command: () => this.irA('pages/compras/ordencompra')
						}
					]
				},
				{
					key: '4',
					label: 'Proveedor',
					icon: 'pi pi-building',
					items: [
						{
							key: '4_0',
							label: 'Mantenimiento Proveedor',
							command: () => this.irA('pages/proveedor/mantenimiento-proveedor')
						},
						{
							key: '4_1',
							label: 'Asignar Materia Prima x Proveedor',
							command: () => this.irA('pages/proveedor/asignar-proveedor')
						},

						{
							key: '4_2',
							label: 'Cotizaciones Proveedor',
							command: () => this.irA('pages/proveedor/cotizacion-proveedor')
						},
						{
							key: '4_3',
							label: 'Orden Compra Proveedor',
							command: () => this.irA('pages/proveedor/ordencompra-proveedor')
						}
					]
				}
			] : [])
		];

	}
	irA(ruta: string): void {
		if(ruta == "pages/atencion-cliente/bandeja-pedidos" && localStorage.getItem('usuario-magistrack-bc') != null && JSON.parse(localStorage.getItem('usuario-magistrack-bc')!).rol.idRol == 1){
			ruta = "pages/atencion-cliente/bandeja-pedidos-administrador";
		}
		this.router.navigate([`/${ruta}`]);
	}

	toggleAll() {
		const expanded = !this.areAllItemsExpanded();
		this.items = this.toggleAllRecursive(this.items, expanded);
	}

	private toggleAllRecursive(items: MenuItem[], expanded: boolean): MenuItem[] {
		return items.map((menuItem) => {
			menuItem.expanded = expanded;
			if (menuItem.items) {
				menuItem.items = this.toggleAllRecursive(menuItem.items, expanded);
			}
			return menuItem;
		});
	}

	private areAllItemsExpanded(): boolean {
		return this.items.every((menuItem) => menuItem.expanded);
	}
}
