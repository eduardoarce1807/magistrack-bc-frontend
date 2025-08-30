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
				},
			] : [])
		];

		this.items = [
			...(atencionClienteItems.length > 0 ? [{
				key: '0',
				label: 'Atención al Cliente',
				icon: 'pi pi-users',
				items: atencionClienteItems
			}] : []),
			...(atencionClienteAccessRoles.includes(user.rol.idRol) ? [{
				key: '7',
				label: 'Reportes',
				icon: 'pi pi-chart-line',
				items: [
					{
						key: '7_0',
						label: 'Consulta de Ventas',
						command: () => this.irA('pages/reportes/consulta-ventas')
					},
					// {
					// 	key: '7_1',
					// 	label: 'Reportes Gráficos',
					// 	command: () => this.irA('pages/reportes/reportes-graficos')
					// },
					{
						key: '7_2',
						label: 'Ventas por Producto',
						command: () => this.irA('pages/reportes/ventas-productos')
					},
					{
						key: '7_3',
						label: 'Ventas por Cliente',
						command: () => this.irA('pages/reportes/ventas-clientes')
					},
					{
						key: '7_4',
						label: 'Ventas por Tipo Cliente',
						command: () => this.irA('pages/reportes/ventas-roles')
					},
					{
						key: '7_5',
						label: 'Ventas por Canal',
						command: () => this.irA('pages/reportes/ventas-canales')
					},
					{
						key: '7_6',
						label: 'Top N',
						command: () => this.irA('pages/reportes/top-n')
					},
					{
						key: '7_7',
						label: 'Pedidos en Producción',
						command: () => this.irA('pages/reportes/pedidos-produccion')
					},
					{
						key: '7_8',
						label: 'Cumplimiento FEE',
						command: () => this.irA('pages/reportes/cumplimiento-fee')
					}
				]
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
							key: '2_2',
							label: 'Registro de Cupón',
							command: () => this.irA('pages/gestion-producto/registro-cupon')
						},
						{
							key: '2_3',
							label: 'Listado de Cupones',
							command: () => this.irA('pages/gestion-producto/listado-cupones')
						},
						{
							key: '2_4',
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
							label: 'Historial de Requerimientos',
							command: () => this.irA('pages/compras/bandeja-requerimientos')
						},
						{
							key: '3_1',
							label: 'Solicitud de Requerimiento',
							command: () => this.irA('pages/compras/requerimiento-manual')
						},
						// {
						// 	key: '3_2',
						// 	label: 'Seleccionar Proveedor x Cotización',
						// 	command: () => this.irA('pages/compras/seleccionar-proveedor')
						// },
						{
							key: '3_3',
							label: 'Ordenes de Compras',
							command: () => this.irA('pages/compras/ordencompra')
						},
						// {
						// 	key: '4_3',
						// 	label: 'Orden Compra Proveedor',
						// 	command: () => this.irA('pages/proveedor/ordencompra-proveedor')
						// }
					]
				},
				{
					key: '5',
					label: 'Almacén',
					icon: 'pi pi-folder-open',
					items: [
						{
							key: '5_0',
							label: 'Listado de Materia Prima',
							command: () => this.irA('pages/inventario/inventario-matprima')
						},
						{
							key: '5_1',
							label: 'kardex x Mat.Prima',
							command: () => this.irA('pages/inventario/kardex-producto/0')
						}
					]
				},
				{
					key: '6',
					label: 'Investigación y Desarrollo',
					icon: 'pi pi-share-alt',
					items: [
						...(user.rol.idRol === 1
							? [
								{
									key: '6_0',
									label: 'Registro de Producto',
									command: () => this.irA('pages/gestion-producto/registro-producto')
								},
								{
									key: '6_1',
									label: 'Mantenimiento de Producto',
									command: () => this.irA('pages/gestion-producto/mantenimiento-producto')
								}
							]
							: []),
						{
							key: '6_2',
							label: 'Mantenimiento Proveedor',
							command: () => this.irA('pages/proveedor/mantenimiento-proveedor')
						},
						{
							key: '6_3',
							label: 'Asignar Materia Prima x Proveedor',
							command: () => this.irA('pages/proveedor/asignar-proveedor')
						},
						{
							key: '6_4',
							label: 'Calculadora Maestra',
							command: () => this.irA('pages/atencion-cliente/calculadora-maestra')
						},
						{
							key: '6_5',
							label: 'Calculadora de Productos',
							command: () => this.irA('pages/atencion-cliente/calculadora-productos')
						},
						{
							key: '6_6',
							label: 'Calculadora de Cápsulas/Óvulos',
							command: () => this.irA('pages/atencion-cliente/calculadora-capsulas')
						},
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
