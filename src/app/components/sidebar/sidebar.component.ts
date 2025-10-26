import {Component, ViewEncapsulation, OnInit, AfterViewInit, ChangeDetectorRef, ViewChild, ChangeDetectionStrategy} from '@angular/core';
import {Router, NavigationEnd} from "@angular/router";
import {DataService} from "../../services/data.service";
import {ScrollPanelModule} from "primeng/scrollpanel";
import {ButtonModule} from "primeng/button";
import {PanelMenuModule} from "primeng/panelmenu";
import {MenuItem} from "primeng/api";
import {PanelMenu} from "primeng/panelmenu";
import {filter} from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [ScrollPanelModule,ButtonModule,PanelMenuModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
	encapsulation: ViewEncapsulation.None,
})
export class SidebarComponent implements OnInit, AfterViewInit {
	items: MenuItem[]=[];
	private currentActiveUrl: string = '';
	
	@ViewChild('panelMenu') panelMenuRef!: PanelMenu;
	
	constructor(private router: Router, public dataService: DataService, private cdr: ChangeDetectorRef) {

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
					icon: 'pi pi-exclamation-triangle',
					command: () => this.irA('pages/atencion-cliente/quejas-reclamos')
				},
				{
					key: '0_1',
					label: 'Solicitud Preparado Magistral',
					icon: 'pi pi-file-plus',
					command: () => this.irA('pages/atencion-cliente/solicitud-preparado-magistral')
				},
				{
					key: '0_2',
					label: 'Mi Perfil',
					icon: 'pi pi-user',
					command: () => this.irA('pages/perfil')
				}
			] : []),
			// Rol 11 (Atención al Cliente) solo tiene acceso a quejas/reclamos, perfil y gestor de anuncios
			...(user.rol.idRol === 11 ? [
				{
					key: '0_0',
					label: 'Quejas y Reclamos',
					icon: 'pi pi-exclamation-triangle',
					command: () => this.irA('pages/atencion-cliente/quejas-reclamos')
				},
				{
					key: '0_2',
					label: 'Mi Perfil',
					icon: 'pi pi-user',
					command: () => this.irA('pages/perfil')
				},
				{
					key: '0_5',
					label: 'Gestor de Anuncios',
					icon: 'pi pi-megaphone',
					command: () => this.irA('pages/gestor-anuncios')
				}
			] : []),
			// Administrador (rol 1) también tiene acceso al Gestor de Anuncios
			...(user.rol.idRol === 1 ? [
				{
					key: '0_6',
					label: 'Gestor de Anuncios',
					icon: 'pi pi-megaphone',
					command: () => this.irA('pages/gestor-anuncios')
				}
			] : []),
			...(atencionClienteAccessRoles.includes(user.rol.idRol) || user.rol.idRol === 11 || user.rol.idRol === 12 ? [
				{
					key: '0_3',
					label: 'Gestión de Devoluciones',
					icon: 'pi pi-replay',
					command: () => this.irA('pages/atencion-cliente/devoluciones')
				},
				{
					key: '0_4',
					label: 'Bandeja de Pedidos Histórico',
					icon: 'pi pi-history',
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
					icon: 'pi pi-user-plus',
					command: () => this.irA('pages/atencion-cliente/registro-cliente')
				},
				{
					key: '1_1',
					label: 'Mantenimiento de Cliente',
					icon: 'pi pi-user-edit',
					command: () => this.irA('pages/atencion-cliente/mantenimiento-clientes')
				},
				{
					key: '1_2',
					label: 'Catálogo de Precios',
					icon: 'pi pi-tag',
					command: () => this.irA('pages/gestion-producto/catalogo-precios')
				},
				{
					key: '1_3',
					label: 'Registro de Cupón',
					icon: 'pi pi-ticket',
					command: () => this.irA('pages/gestion-producto/registro-cupon')
				},
				{
					key: '1_4',
					label: 'Listado de Cupones',
					icon: 'pi pi-list',
					command: () => this.irA('pages/gestion-producto/listado-cupones')
				},
				{
					key: '1_5',
					label: 'Venta rápida',
					icon: 'pi pi-bolt',
					command: () => this.irA('venta-rapida/productos-venta-rapida')
				}
			] : []),
			...([1,2,3,4,5].includes(user.rol.idRol) ? [
				{
					key: '1_6',
					label: 'Registro de Pedido',
					icon: 'pi pi-plus-circle',
					command: () => this.irA('pages/atencion-cliente/registro-pedido')
				},
				{
					key: '1_7',
					label: 'Bandeja de Pedidos',
					icon: 'pi pi-inbox',
					command: () => this.irA('pages/atencion-cliente/bandeja-pedidos')
				}
			] : []),
			...([1, 5].includes(user.rol.idRol) ? [
				{
					key: '1_8',
					label: 'Bandeja de Personalización',
					icon: 'pi pi-palette',
					command: () => this.irA('pages/atencion-cliente/bandeja-personalizacion')
				},
				// Reportes de Ventas & Pedidos
				{
					key: '1_9',
					label: 'Consulta de Ventas',
					icon: 'pi pi-search',
					command: () => this.irA('pages/reportes/consulta-ventas')
				},
				{
					key: '1_10',
					label: 'Ventas por Producto',
					icon: 'pi pi-box',
					command: () => this.irA('pages/reportes/ventas-productos')
				},
				{
					key: '1_11',
					label: 'Ventas por Cliente',
					icon: 'pi pi-users',
					command: () => this.irA('pages/reportes/ventas-clientes')
				},
				{
					key: '1_12',
					label: 'Ventas por Tipo Cliente',
					icon: 'pi pi-sitemap',
					command: () => this.irA('pages/reportes/ventas-roles')
				},
				{
					key: '1_13',
					label: 'Ventas por Canal',
					icon: 'pi pi-share-alt',
					command: () => this.irA('pages/reportes/ventas-canales')
				},
				{
					key: '1_14',
					label: 'Top N',
					icon: 'pi pi-star',
					command: () => this.irA('pages/reportes/top-n')
				},
				{
					key: '1_15',
					label: 'Reporte de Ventas',
					icon: 'pi pi-chart-bar',
					command: () => this.irA('pages/atencion-cliente/reporte-ventas')
				}
			] : [])
		];

		// Logística - Despacho, Seguimiento entregas, Devoluciones físicas, Facturación/pagos
		// Rol Logística (12) tiene acceso a despacho y visualizador de pagos
		const logisticaItems = [
			...(logisticaAccessRoles.includes(user.rol.idRol) ? [
				{
					key: '2_0',
					label: 'Bandeja de despacho',
					icon: 'pi pi-send',
					command: () => this.irA('pages/produccion/bandeja-despacho')
				},
				{
					key: '2_1',
					label: 'Reporte de Despacho',
					icon: 'pi pi-chart-line',
					command: () => this.irA('pages/reportes/reporte-despacho')
				},
				{
					key: '2_2',
					label: 'Mantenedor Tarifas Delivery',
					icon: 'pi pi-truck',
					command: () => this.irA('pages/reportes/mantenedor-delivery')
				}
			] : []),
			// Administrador, ventas y logística pueden ver visualizador de pagos
			...([1, 5, 12].includes(user.rol.idRol) ? [
				{
					key: '2_3',
					label: 'Visualizador de pagos',
					icon: 'pi pi-credit-card',
					command: () => this.irA('pages/atencion-cliente/visualizador-pagos')
				}
			] : [])
		];

		this.items = [
			...(atencionClienteItems.length > 0 ? [{
				key: '0',
				label: 'ATENCIÓN AL CLIENTE',
				icon: 'pi pi-users',
				items: atencionClienteItems
			}] : []),
			...(ventasPedidosItems.length > 0 ? [{
				key: '1',
				label: 'VENTAS & PEDIDOS',
				icon: 'pi pi-shopping-bag',
				items: ventasPedidosItems
			}] : []),
			...(logisticaItems.length > 0 ? [{
				key: '2',
				label: 'LOGÍSTICA',
				icon: 'pi pi-truck',
				items: logisticaItems
			}] : []),
			...(user.rol.idRol === 1 || user.rol.idRol === 5 || user.rol.idRol === 6 || user.rol.idRol === 7 || user.rol.idRol === 8 || user.rol.idRol === 9 ? [
				{
					key: '3',
					label: 'PRODUCCIÓN',
					icon: 'bi bi-flask',
					items: [
						...([1, 6].includes(user.rol.idRol) ? [
							{
								key: '3_0',
								label: 'Bandeja de producción',
								icon: 'bi bi-flask-florence',
								command: () => this.irA('pages/produccion/bandeja-produccion')
							}
						] : []),
						...([1, 7].includes(user.rol.idRol) ? [
							{
								key: '3_1',
								label: 'Bandeja de calidad',
								icon: 'pi pi-verified',
								command: () => this.irA('pages/produccion/bandeja-calidad')
							}
						] : []),
						...([1, 8].includes(user.rol.idRol) ? [
							{
								key: '3_2',
								label: 'Bandeja de envasado',
								icon: 'bi bi-measuring-cup',
								command: () => this.irA('pages/produccion/bandeja-envasado')
							}
						] : []),
						...([1, 9].includes(user.rol.idRol) ? [
							{
								key: '3_3',
								label: 'Bandeja de etiquetado',
								icon: 'pi pi-tags',
								command: () => this.irA('pages/produccion/bandeja-etiquetado')
							}
						] : []),
						// Gestor de Bulks - Solo para administrador (rol 1)
						...(user.rol.idRol === 1 ? [
							{
								key: '3_4',
								label: 'Gestor de Bulks',
								icon: 'bi bi-bag',
								command: () => this.irA('pages/produccion/gestor-bulks')
							}
						] : []),
						// Reportes de Producción
						...(atencionClienteAccessRoles.includes(user.rol.idRol) ? [
							{
								key: '3_5',
								label: 'Pedidos en Producción',
								icon: 'pi pi-list-check',
								command: () => this.irA('pages/reportes/pedidos-produccion')
							},
							{
								key: '3_6',
								label: 'Cumplimiento FEE',
								icon: 'pi pi-calendar',
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
					label: 'COMPRAS',
					icon: 'pi pi-shopping-cart',
					items: [
						{
							key: '4_0',
							label: 'Historial de Requerimientos',
							icon: 'pi pi-history',
							command: () => this.irA('pages/compras/bandeja-requerimientos')
						},
						{
							key: '4_1',
							label: 'Solicitud de Requerimiento',
							icon: 'pi pi-file-plus',
							command: () => this.irA('pages/compras/requerimiento-manual')
						},
						{
							key: '4_2',
							label: 'Ordenes de Compras',
							icon: 'pi pi-shopping-bag',
							command: () => this.irA('pages/compras/ordencompra')
						}
					]
				}
			] : []),
			// Almacén - solo administrador y rol Almacén (14)
			...(almacenAccessRoles.includes(user.rol.idRol) ? [
				{
					key: '5',
					label: 'ALMACÉN',
					icon: 'pi pi-folder-open',
					items: [
						{
							key: '5_0',
							label: 'Listado de Materias Primas',
							icon: 'pi pi-list',
							command: () => this.irA('pages/inventario/inventario-matprima')
						},
						{
							key: '5_1',
							label: 'kardex x Mat.Prima',
							icon: 'pi pi-chart-line',
							command: () => this.irA('pages/inventario/kardex-producto/0')
						}
					]
				}
			] : []),
			// Investigación y Desarrollo - solo administrador y rol I+D (15)
			...(investigacionAccessRoles.includes(user.rol.idRol) ? [
				{
					key: '6',
					label: 'INVESTIGACIÓN Y DESARROLLO',
					icon: 'pi pi-share-alt',
					items: [
						...(user.rol.idRol === 1 || user.rol.idRol === 15
							? [
								{
									key: '6_0',
									label: 'Registro de Producto',
									icon: 'pi pi-plus-circle',
									command: () => this.irA('pages/gestion-producto/registro-producto')
								},
								{
									key: '6_1',
									label: 'Mantenimiento de Producto',
									icon: 'pi pi-cog',
									command: () => this.irA('pages/gestion-producto/mantenimiento-producto')
								}
							]
							: []),
						{
							key: '6_2',
							label: 'Mantenimiento Proveedor',
							icon: 'pi pi-building',
							command: () => this.irA('pages/proveedor/mantenimiento-proveedor')
						},
						{
							key: '6_3',
							label: 'Asignar Materia Prima x Proveedor',
							icon: 'pi pi-link',
							command: () => this.irA('pages/proveedor/asignar-proveedor')
						},
						{
							key: '6_4',
							label: 'Calculadora Maestra',
							icon: 'pi pi-calculator',
							command: () => this.irA('pages/atencion-cliente/calculadora-maestra')
						},
						{
							key: '6_5',
							label: 'Calculadora de Productos',
							icon: 'pi pi-calculator',
							command: () => this.irA('pages/atencion-cliente/calculadora-productos')
						},
						{
							key: '6_6',
							label: 'Calculadora de Cápsulas/Óvulos',
							icon: 'pi pi-calculator',
							command: () => this.irA('pages/atencion-cliente/calculadora-capsulas')
						},
						{
							key: '6_7',
							label: 'Solicitudes Preparados Magistrales',
							icon: 'pi pi-inbox',
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

	ngOnInit() {
		// Suscribirse a los cambios de ruta para actualizar el menú activo
		this.router.events.pipe(
			filter(event => event instanceof NavigationEnd)
		).subscribe((event) => {
			const navigationEndEvent = event as NavigationEnd;
			setTimeout(() => {
				this.updateActiveMenuItems(navigationEndEvent.url);
			}, 100); // Pequeño delay para asegurar que la navegación se complete
		});

		// Verificación adicional cada 500ms para detectar cambios dinámicos
		setInterval(() => {
			if (this.router.url && this.currentActiveUrl !== this.router.url) {
				this.updateActiveMenuItems(this.router.url);
			}
		}, 500);
	}
	
	ngAfterViewInit() {
		// Inicialización del acordeón DESPUÉS de que la vista esté completamente renderizada
		setTimeout(() => {
			this.initializeAccordionState();
		}, 100);
	}

	private updateActiveMenuItems(currentUrl: string) {
		// Evitar procesamiento innecesario si la URL no ha cambiado
		if (this.currentActiveUrl === currentUrl) {
			return;
		}
		
		// Solo actualizar si no es la carga inicial
		if (this.currentActiveUrl !== '') {
			this.currentActiveUrl = currentUrl;
			
			// Limpiar todos los states activos primero
			this.clearActiveStates(this.items);
			
			// Expandir el módulo correcto y marcar el item activo
			this.expandModuleForActiveRoute(this.items, currentUrl);
			
			// Asegurar que el item activo esté marcado
			this.setActiveMenuItem(this.items, currentUrl);
		} else {
			// Es la carga inicial, solo marcar la URL actual
			this.currentActiveUrl = currentUrl;
		}
	}

	private clearActiveStates(items: MenuItem[]) {
		items.forEach(item => {
			if (item.styleClass) {
				item.styleClass = item.styleClass
					.replace(/\s*p-highlight\s*/g, '')
					.replace(/\s*p-focus\s*/g, '')
					.replace(/\s*active-menu-item\s*/g, '')
					.trim();
				// Si queda vacía, ponerla como undefined
				if (!item.styleClass) {
					item.styleClass = undefined;
				}
			}
			if (item.items) {
				this.clearActiveStates(item.items);
			}
		});
	}

	private setActiveMenuItem(items: MenuItem[], currentUrl: string): boolean {
		for (let item of items) {
			if (item.command) {
				// Extraer la ruta del comando del item
				const routeCommand = this.extractRouteFromCommand(item.command);
				if (routeCommand && this.isRouteMatch(currentUrl, routeCommand)) {
					// Marcar como activo con highlight y clase personalizada para negrita
					const oldClass = item.styleClass || '';
					item.styleClass = oldClass.trim() + ' p-highlight active-menu-item';
					return true;
				}
			}
			
			if (item.items) {
				const foundInSubItems = this.setActiveMenuItem(item.items, currentUrl);
				if (foundInSubItems) {
					// Si se encontró en subitems, asegurar que el padre esté expandido
					if (!item.expanded) {
						item.expanded = true;
					}
					return true;
				}
			}
		}
		return false;
	}

	private extractRouteFromCommand(command: Function): string | null {
		// Convertir la función a string y extraer la ruta
		const commandStr = command.toString();
		const match = commandStr.match(/this\.irA\(['"`]([^'"`]+)['"`]\)/);
		return match ? match[1] : null;
	}

	private isRouteMatch(currentUrl: string, routeCommand: string): boolean {
		// Normalizar URLs removiendo barras iniciales y finales
		const normalizedCurrentUrl = currentUrl.replace(/^\/+|\/+$/g, '');
		const normalizedRouteCommand = routeCommand.replace(/^\/+|\/+$/g, '');
		
		// Verificar coincidencia exacta o si la URL actual contiene la ruta del comando
		return normalizedCurrentUrl === normalizedRouteCommand || 
			   normalizedCurrentUrl.startsWith(normalizedRouteCommand + '/') ||
			   normalizedCurrentUrl.includes(normalizedRouteCommand);
	}

	private forceVisualUpdate(): void {
		// Forzar una actualización visual del menú aplicando las clases nuevamente
		const currentUrl = this.router.url;
		
		// Verificar y re-aplicar estilos activos
		this.verifyActiveStyles(this.items, currentUrl);
		
		// Verificar el estado de expansión
		this.verifyExpansionState(currentUrl);
		
		// Forzar detección de cambios de Angular
		this.cdr.detectChanges();
		
		// Forzar re-render del componente PrimeNG recreando el array de items
		setTimeout(() => {
			this.items = [...this.items];
			this.cdr.detectChanges();
		}, 50);
	}

	private verifyExpansionState(currentUrl: string): void {
		this.items.forEach(item => {
			if (item.items && !item.expanded) {
				// Verificar si debería estar expandido
				const shouldBeExpanded = this.hasActiveSubmenu(item.items, currentUrl);
				if (shouldBeExpanded) {
					item.expanded = true;
					// Forzar detección de cambios
					this.cdr.detectChanges();
				}
			}
		});
	}

	private verifyActiveStyles(items: MenuItem[], currentUrl: string): void {
		items.forEach(item => {
			if (item.command) {
				const routeCommand = this.extractRouteFromCommand(item.command);
				if (routeCommand && this.isRouteMatch(currentUrl, routeCommand)) {
					// Asegurar que las clases estén aplicadas
					if (!item.styleClass?.includes('active-menu-item')) {
						item.styleClass = (item.styleClass || '').trim() + ' p-highlight active-menu-item';
					}
				}
			}
			if (item.items) {
				this.verifyActiveStyles(item.items, currentUrl);
			}
		});
	}

	private initializeAccordionState(): void {
		// Obtener la URL actual
		const currentUrl = this.router.url;
		
		// Contraer todos los módulos por defecto
		this.items.forEach(item => {
			item.expanded = false;
		});
		
		// Limpiar todos los estados activos primero
		this.clearActiveStates(this.items);
		
		// Buscar y expandir el módulo que contiene la ruta activa
		// Este método YA marca el submenú activo internamente
		const moduleExpanded = this.expandModuleForActiveRoute(this.items, currentUrl);
		
		// Si no se expandió ningún módulo, hacer un segundo intento más directo
		if (!moduleExpanded) {
			this.forceExpandCorrectModule(currentUrl);
			// Marcar el elemento activo manualmente
			this.setActiveMenuItem(this.items, currentUrl);
		}
		
		// Forzar detección de cambios una sola vez al final
		this.cdr.detectChanges();
		
		// Forzar detección de cambios DESPUÉS de toda la inicialización
		setTimeout(() => {
			this.cdr.detectChanges();
		}, 100);
	}



	private forceExpandCorrectModule(currentUrl: string): void {
		// Método más directo para expandir el módulo correcto
		this.items.forEach(module => {
			if (module.items) {
				let shouldExpand = false;
				
				module.items.forEach(submenu => {
					if (submenu.command) {
						const routeCommand = this.extractRouteFromCommand(submenu.command);
						if (routeCommand && this.isRouteMatch(currentUrl, routeCommand)) {
							shouldExpand = true;
						}
					}
				});
				
				if (shouldExpand) {
					module.expanded = true;
					// Forzar detección de cambios
					this.cdr.detectChanges();
				}
			}
		});
	}

	private expandModuleForActiveRoute(items: MenuItem[], currentUrl: string): boolean {
		for (let item of items) {
			if (item.items) {
				// Verificar si algún submenú coincide con la ruta actual
				const hasActiveSubmenu = this.hasActiveSubmenu(item.items, currentUrl);
				if (hasActiveSubmenu) {
					// Expandir este módulo
					item.expanded = true;
					// También marcar el submenú activo dentro de este módulo
					this.markActiveSubmenu(item.items, currentUrl);
					
					// Forzar detección de cambios y expansión visual
					this.cdr.detectChanges();
					
					// Forzar expansión usando el PanelMenu directamente
					setTimeout(() => {
						if (this.panelMenuRef) {
							// Reasignar el modelo para forzar la actualización
							const tempModel = [...this.items];
							this.items = [];
							this.cdr.detectChanges();
							this.items = tempModel;
							this.cdr.detectChanges();
						}
					}, 50);
					
					return true;
				}
			}
		}
		return false;
	}

	private hasActiveSubmenu(submenuItems: MenuItem[], currentUrl: string): boolean {
		for (let submenu of submenuItems) {
			if (submenu.command) {
				const routeCommand = this.extractRouteFromCommand(submenu.command);
				if (routeCommand && this.isRouteMatch(currentUrl, routeCommand)) {
					return true;
				}
			}
			// Verificar recursivamente si hay subniveles
			if (submenu.items && this.hasActiveSubmenu(submenu.items, currentUrl)) {
				return true;
			}
		}
		return false;
	}

	private markActiveSubmenu(submenuItems: MenuItem[], currentUrl: string): boolean {
		for (let submenu of submenuItems) {
			if (submenu.command) {
				const routeCommand = this.extractRouteFromCommand(submenu.command);
				if (routeCommand && this.isRouteMatch(currentUrl, routeCommand)) {
					// Marcar como activo con highlight y clase personalizada para negrita
					submenu.styleClass = (submenu.styleClass || '').trim() + ' p-highlight active-menu-item';
					return true;
				}
			}
			// Verificar recursivamente si hay subniveles
			if (submenu.items && this.markActiveSubmenu(submenu.items, currentUrl)) {
				return true;
			}
		}
		return false;
	}
}
