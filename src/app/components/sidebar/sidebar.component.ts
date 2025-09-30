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
		
		// Definición de roles para acceso - incluye nuevos roles 11-15
		const atencionClienteAccessRoles = [1, 5]; // Excluye rol 11 - no tiene acceso a Ventas & Pedidos
		const logisticaAccessRoles = [1, 5, 12]; // Incluye nuevo rol Logística (12)
		const comprasAccessRoles = [1, 13]; // Incluye nuevo rol Compras (13)
		const almacenAccessRoles = [1, 14]; // Incluye nuevo rol Almacén (14)
		const investigacionAccessRoles = [1, 15]; // Incluye nuevo rol Investigación y Desarrollo (15)
		
		// Atención al Cliente - Reclamos, Registro de Devoluciones, Consulta de pedidos, Encuestas
		const atencionClienteItems = [
			...([2,3,4].includes(user.rol.idRol) ? [
				{
					key: '0_0',
					label: 'Quejas y Reclamos',
					command: () => this.irA('pages/atencion-cliente/quejas-reclamos')
				},
				{
					key: '0_1',
					label: 'Solicitud Preparado Magistral',
					command: () => this.irA('pages/atencion-cliente/solicitud-preparado-magistral')
				},
				{
					key: '0_2',
					label: 'Mi Perfil',
					command: () => this.irA('pages/perfil')
				}
			] : []),
			// Rol 11 (Atención al Cliente) solo tiene acceso a quejas/reclamos y perfil
			...(user.rol.idRol === 11 ? [
				{
					key: '0_0',
					label: 'Quejas y Reclamos',
					command: () => this.irA('pages/atencion-cliente/quejas-reclamos')
				},
				{
					key: '0_2',
					label: 'Mi Perfil',
					command: () => this.irA('pages/perfil')
				}
			] : []),
			...(atencionClienteAccessRoles.includes(user.rol.idRol) || user.rol.idRol === 11 ? [
				{
					key: '0_3',
					label: 'Gestión de Devoluciones',
					command: () => this.irA('pages/atencion-cliente/devoluciones')
				},
				{
					key: '0_4',
					label: 'Bandeja de Pedidos Histórico',
					command: () => this.irA('pages/atencion-cliente/bandeja-pedidos-historico')
				}
			] : [])
		];

		// Ventas & Pedidos - Registro clientes, Mantenimiento, Catálogo precios, Cupones, Registro de pedidos, Bandeja
		// Rol 11 (Atención al Cliente) NO tiene acceso a este módulo
		const ventasPedidosItems = [
			...([1, 5].includes(user.rol.idRol) ? [
				{
					key: '1_0',
					label: 'Registro de Cliente',
					command: () => this.irA('pages/atencion-cliente/registro-cliente')
				},
				{
					key: '1_1',
					label: 'Mantenimiento de Cliente',
					command: () => this.irA('pages/atencion-cliente/mantenimiento-clientes')
				},
				{
					key: '1_2',
					label: 'Catálogo de Precios',
					command: () => this.irA('pages/gestion-producto/catalogo-precios')
				},
				{
					key: '1_3',
					label: 'Registro de Cupón',
					command: () => this.irA('pages/gestion-producto/registro-cupon')
				},
				{
					key: '1_4',
					label: 'Listado de Cupones',
					command: () => this.irA('pages/gestion-producto/listado-cupones')
				},
				{
					key: '1_5',
					label: 'Venta rápida',
					command: () => this.irA('venta-rapida/productos-venta-rapida')
				}
			] : []),
			...([1,2,3,4,5].includes(user.rol.idRol) ? [
				{
					key: '1_6',
					label: 'Registro de Pedido',
					command: () => this.irA('pages/atencion-cliente/registro-pedido')
				},
				{
					key: '1_7',
					label: 'Bandeja de Pedidos',
					command: () => this.irA('pages/atencion-cliente/bandeja-pedidos')
				}
			] : []),
			...([1, 5].includes(user.rol.idRol) ? [
				{
					key: '1_8',
					label: 'Bandeja de Personalización',
					command: () => this.irA('pages/atencion-cliente/bandeja-personalizacion')
				},
				// Reportes de Ventas & Pedidos
				{
					key: '1_9',
					label: 'Consulta de Ventas',
					command: () => this.irA('pages/reportes/consulta-ventas')
				},
				{
					key: '1_10',
					label: 'Ventas por Producto',
					command: () => this.irA('pages/reportes/ventas-productos')
				},
				{
					key: '1_11',
					label: 'Ventas por Cliente',
					command: () => this.irA('pages/reportes/ventas-clientes')
				},
				{
					key: '1_12',
					label: 'Ventas por Tipo Cliente',
					command: () => this.irA('pages/reportes/ventas-roles')
				},
				{
					key: '1_13',
					label: 'Ventas por Canal',
					command: () => this.irA('pages/reportes/ventas-canales')
				},
				{
					key: '1_14',
					label: 'Top N',
					command: () => this.irA('pages/reportes/top-n')
				},
				{
					key: '1_15',
					label: 'Reporte de Ventas',
					command: () => this.irA('pages/atencion-cliente/reporte-ventas')
				}
			] : [])
		];

		// Logística - Despacho, Seguimiento entregas, Devoluciones físicas, Facturación/pagos
		// Rol Logística (12) solo tiene acceso a despacho
		const logisticaItems = [
			...(logisticaAccessRoles.includes(user.rol.idRol) ? [
				{
					key: '2_0',
					label: 'Bandeja de despacho',
					command: () => this.irA('pages/produccion/bandeja-despacho')
				}
			] : []),
			// Solo administrador y ventas pueden ver visualizador de pagos
			...([1, 5].includes(user.rol.idRol) ? [
				{
					key: '2_1',
					label: 'Visualizador de pagos',
					command: () => this.irA('pages/atencion-cliente/visualizador-pagos')
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
			...(ventasPedidosItems.length > 0 ? [{
				key: '1',
				label: 'Ventas & Pedidos',
				icon: 'pi pi-shopping-bag',
				items: ventasPedidosItems
			}] : []),
			...(logisticaItems.length > 0 ? [{
				key: '2',
				label: 'Logística',
				icon: 'pi pi-truck',
				items: logisticaItems
			}] : []),
			...(user.rol.idRol === 1 || user.rol.idRol === 5 || user.rol.idRol === 6 || user.rol.idRol === 7 || user.rol.idRol === 8 || user.rol.idRol === 9 ? [
				{
					key: '3',
					label: 'Producción',
					icon: 'pi pi-cog',
					items: [
						...([1, 6].includes(user.rol.idRol) ? [
							{
								key: '3_0',
								label: 'Bandeja de producción',
								command: () => this.irA('pages/produccion/bandeja-produccion')
							}
						] : []),
						...([1, 7].includes(user.rol.idRol) ? [
							{
								key: '3_1',
								label: 'Bandeja de calidad',
								command: () => this.irA('pages/produccion/bandeja-calidad')
							}
						] : []),
						...([1, 8].includes(user.rol.idRol) ? [
							{
								key: '3_2',
								label: 'Bandeja de envasado',
								command: () => this.irA('pages/produccion/bandeja-envasado')
							}
						] : []),
						...([1, 9].includes(user.rol.idRol) ? [
							{
								key: '3_3',
								label: 'Bandeja de etiquetado',
								command: () => this.irA('pages/produccion/bandeja-etiquetado')
							}
						] : []),
						// Reportes de Producción
						...(atencionClienteAccessRoles.includes(user.rol.idRol) ? [
							{
								key: '3_4',
								label: 'Pedidos en Producción',
								command: () => this.irA('pages/reportes/pedidos-produccion')
							},
							{
								key: '3_5',
								label: 'Cumplimiento FEE',
								command: () => this.irA('pages/reportes/cumplimiento-fee')
							}
						] : [])
					]
				}
			] : []),
			// Compras - solo administrador y rol Compras (13)
			...(comprasAccessRoles.includes(user.rol.idRol) ? [
				{
					key: '4',
					label: 'Compras',
					icon: 'pi pi-shopping-cart',
					items: [
						{
							key: '4_0',
							label: 'Historial de Requerimientos',
							command: () => this.irA('pages/compras/bandeja-requerimientos')
						},
						{
							key: '4_1',
							label: 'Solicitud de Requerimiento',
							command: () => this.irA('pages/compras/requerimiento-manual')
						},
						{
							key: '4_2',
							label: 'Ordenes de Compras',
							command: () => this.irA('pages/compras/ordencompra')
						}
					]
				}
			] : []),
			// Almacén - solo administrador y rol Almacén (14)
			...(almacenAccessRoles.includes(user.rol.idRol) ? [
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
				}
			] : []),
			// Investigación y Desarrollo - solo administrador y rol I+D (15)
			...(investigacionAccessRoles.includes(user.rol.idRol) ? [
				{
					key: '6',
					label: 'Investigación y Desarrollo',
					icon: 'pi pi-share-alt',
					items: [
						...(user.rol.idRol === 1 || user.rol.idRol === 15
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
						{
							key: '6_7',
							label: 'Solicitudes Preparados Magistrales',
							command: () => this.irA('pages/gestion-producto/bandeja-solicitudes-preparados-magistrales')
						}
					]
				}
			] : [])
		];

	}
	irA(ruta: string): void {
		if(ruta == "pages/atencion-cliente/bandeja-pedidos" && localStorage.getItem('usuario-magistrack-bc') != null && (JSON.parse(localStorage.getItem('usuario-magistrack-bc')!).rol.idRol == 1 || JSON.parse(localStorage.getItem('usuario-magistrack-bc')!).rol.idRol == 5)){
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
