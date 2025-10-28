import {
	Component,
	inject,
	OnInit,
	TemplateRef,
	ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
	NgbTypeaheadModule,
	NgbPaginationModule,
	NgbModal,
	NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
import { PedidoService } from '../../../services/pedido.service';
import Swal from 'sweetalert2';
import { ProductoService } from '../../../services/producto.service';
import { ToastService } from '../../../services/toast.service';
import { ToastsContainer } from '../../../shared/components/toasts-container/toasts-container.component';
import { DataService } from '../../../services/data.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Interfaces para los nuevos tipos de datos
interface ProductoCalidad {
	idProductoMaestro: number;
	nombreProducto: string;
	descripcionProducto: string;
	presentacionTotal: number;
	tipoPresentacion: string;
	personalizado: boolean;
	tienePrecioPersonalizado: boolean;
	idEstadoProducto: number;
	estadoProducto: string;
	phDefinidoMin: number;
	phDefinidoMax: number;
	phCalidadPromedio: number | null;
	carOrganolepticasCalidad: string | null;
	viscosidadCalidad: string | null;
	idBulk: string | null;
	totalPresentacionBulk: number | null;
	fechaCreacionBulk: string | null;
	tipo: 'producto'; // Para identificar el tipo
}

interface PreparadoMagistralCalidad {
	idPreparadoMagistral: string;
	nombre: string;
	descripcion: string;
	totalPresentacion: number;
	tipoPresentacion: string;
	personalizado: boolean;
	precioPersonalizado: boolean;
	idEstadoProducto: number;
	estadoProducto: string;
	phDefinidoMin: number;
	phDefinidoMax: number;
	phCalidadPromedio: number | null;
	carOrganolepticasCalidad: string | null;
	viscosidadCalidad: string | null;
	idBulk: string | null;
	totalPresentacionBulk: number | null;
	fechaCreacionBulk: string | null;
	tipo: 'preparado'; // Para identificar el tipo
}

type ItemCalidad = ProductoCalidad | PreparadoMagistralCalidad;

@Component({
	selector: 'app-bandeja-calidad',
	standalone: true,
	imports: [
		FormsModule,
		NgbTypeaheadModule,
		NgbPaginationModule,
		NgbTooltipModule,
		ToastsContainer,
		CommonModule
	],
	templateUrl: './bandeja-calidad.component.html',
	styleUrl: './bandeja-calidad.component.scss',
})
export class BandejaCalidadComponent implements OnInit {
	@ViewChild('successTpl', { static: false }) successTpl!: TemplateRef<any>;
	toastService = inject(ToastService);

	productos: ItemCalidad[] = [];
	productosTable: ItemCalidad[] = [];
	page = 1;
	pageSize = 5;
	collectionSize = this.productos.length;
	lstProductosSeleccionados: ItemCalidad[] = [];
	private modalService = inject(NgbModal);

	idBulkBusqueda: string = '';
	isSearching: boolean = false;

	idPedidoNota: string | null = null;
	idProductoNota: string | null = null;
	observacionNota: string = '';

	tipoEnvio = 1;

	procedimientoData: any;

	constructor(
		private pedidoService: PedidoService,
		private productoService: ProductoService,
		private dataService: DataService,
		public router: Router,
	) {}

	ngOnInit(): void {
		this.getProductosAll();
	}

	// Funciones de utilidad para type guards
	isProducto(item: ItemCalidad): item is ProductoCalidad {
		return item.tipo === 'producto';
	}

	isPreparado(item: ItemCalidad): item is PreparadoMagistralCalidad {
		return item.tipo === 'preparado';
	}

	// Función para obtener el ID único del item
	getItemId(item: ItemCalidad): string {
		return this.isProducto(item) ? item.idProductoMaestro.toString() : item.idPreparadoMagistral;
	}

	// Función helper para obtener el nombre de un item
	getItemNombre(item: ItemCalidad): string {
		return this.isProducto(item) ? item.nombreProducto : item.nombre;
	}

	// Función helper para obtener la presentación de un item
	getItemPresentacion(item: ItemCalidad): string {
		if (this.isProducto(item)) {
			return `${item.presentacionTotal} ${item.tipoPresentacion || ''}`.trim();
		} else {
			return `${item.totalPresentacion} ${item.tipoPresentacion || ''}`.trim();
		}
	}

	// Función helper para obtener el tipo de item como string para mostrar en UI
	getItemTipo(item: ItemCalidad): string {
		return this.isProducto(item) ? 'Producto' : 'Preparado Magistral';
	}

	getProductosAll(): void {
		// Obtener el usuario loggeado
		const usuario = this.dataService.getLoggedUser();
		if (!usuario || !usuario.idUsuario) {
			console.error('Usuario no encontrado');
			return;
		}

		if(usuario.rol.idRol != 1){
			this.pedidoService.getProductosCalidad(usuario.idUsuario).subscribe(
				(productos) => {
					console.log('Productos obtenidos:', productos);
					this.productosTable = productos;
					this.collectionSize = this.productosTable.length;
					this.refreshProductos();
				},
				(error) => {
					console.error('Error al obtener productos', error);
					Swal.fire({
						icon: 'error',
						title: 'Oops!',
						text: 'No se pudieron cargar los productos, inténtelo de nuevo.',
						showConfirmButton: true,
					});
				}
			);
		}
	}

	buscarPorIdBulk(): void {
		if (!this.idBulkBusqueda.trim()) {
			Swal.fire({
				icon: 'warning',
				title: '¡Atención!',
				text: 'Por favor ingrese un ID Bulk para buscar.',
				showConfirmButton: true,
			});
			return;
		}

		this.isSearching = true;
		
		// Obtener el usuario loggeado
		const usuario = this.dataService.getLoggedUser();
		if (!usuario || !usuario.idUsuario) {
			console.error('Usuario no encontrado');
			this.isSearching = false;
			return;
		}

		this.pedidoService.getProductoCalidadByIdBulk(this.idBulkBusqueda.trim(), usuario.idUsuario).subscribe(
			(response: any) => {
				console.log('Respuesta búsqueda por idBulk:', response);
				
				// Verificar si hay error (idResultado = 0)
				if (response && response.idResultado === 0) {
					Swal.fire({
						icon: 'warning',
						title: 'Producto no encontrado',
						text: response.mensaje || 'El ID Bulk ingresado no existe en calidad.',
						showConfirmButton: true,
					});
					this.productosTable = [];
					this.refreshProductos();
				} else {
					// Detectar si es producto o preparado magistral basado en la presencia de idPreparadoMagistral
					let itemConTipo: ItemCalidad;
					
					if (response.idPreparadoMagistral) {
						// Es un preparado magistral
						itemConTipo = { ...response, tipo: 'preparado' as const } as PreparadoMagistralCalidad;
					} else {
						// Es un producto regular
						itemConTipo = { ...response, tipo: 'producto' as const } as ProductoCalidad;
					}
					
					this.productosTable = [itemConTipo];
					this.collectionSize = this.productosTable.length;
					this.refreshProductos();
				}
				this.isSearching = false;
			},
			(error: any) => {
				console.error('Error al buscar producto por idBulk', error);
				Swal.fire({
					icon: 'error',
					title: 'Error de búsqueda',
					text: 'No se pudo realizar la búsqueda, inténtelo de nuevo.',
					showConfirmButton: true,
				});
				this.isSearching = false;
			}
		);
	}

	openModalNota(item: any, content: TemplateRef<any>) {
		this.modalService.open(content, { size: 'lg' });
		this.observacionNota = item.observacion;
		this.idPedidoNota = item.idPedido;
		this.idProductoNota = item.idProducto;
	}

	openModalXL(content: TemplateRef<any>) {
		this.modalService.open(content, { size: 'xl' });
	}

	openModalLG(content: TemplateRef<any>) {
		this.modalService.open(content, { size: 'lg' });
	}

	@ViewChild('informacionCompleta', { static: true }) informacionCompleta: TemplateRef<any> | null = null;
	productoMaestroCalculo: any = null;

	// Función helper para obtener la presentación total para el modal
	getPresentacionTotal(): number {
		if (!this.productoMaestroCalculo) return 0;
		
		if (this.isProducto(this.productoMaestroCalculo)) {
			return this.productoMaestroCalculo.presentacionTotal || 0;
		} else {
			return this.productoMaestroCalculo.totalPresentacion || 0;
		}
	}
	
	getInformacionCompleta(item: ItemCalidad): void {
		if (this.isProducto(item)) {
			// Lógica para productos normales
			this.productoService.getHojaProduccion(item.idProductoMaestro.toString()).subscribe(
				(data) => {
					console.log('Información completa de producto obtenida:', data);
					if(data && data.idResultado == 1) {
						this.procedimientoData = data.value;
						this.productoMaestroCalculo = item;
						if (this.informacionCompleta) {
							this.openModalXL(this.informacionCompleta);
						}
					} else {
						Swal.fire({
							icon: 'warning',
							title: '¡Oops!',
							text: data.resultado || 'No se pudo obtener la información del producto.',
							showConfirmButton: true,
						});
					}
				},
				(error) => {
					console.error('Error al obtener la información del producto', error);
					Swal.fire({
						icon: 'warning',
						title: 'Oops!',
						text: 'Este producto no tiene información de producción disponible.',
						showConfirmButton: true,
					});
				}
			);
		} else {
			// Lógica para preparados magistrales
			this.productoService.getHojaProduccionPreparadoMagistral(item.idPreparadoMagistral).subscribe(
				(data) => {
					console.log('Información completa de preparado magistral obtenida:', data);
					if(data && data.idResultado == 1) {
						this.procedimientoData = data.value;
						this.productoMaestroCalculo = item;
						if (this.informacionCompleta) {
							this.openModalXL(this.informacionCompleta);
						}
					} else {
						Swal.fire({
							icon: 'warning',
							title: '¡Oops!',
							text: data.resultado || 'No se pudo obtener la información del preparado magistral.',
							showConfirmButton: true,
						});
					}
				},
				(error) => {
					console.error('Error al obtener la información del preparado magistral', error);
					Swal.fire({
						icon: 'warning',
						title: 'Oops!',
						text: 'Este preparado magistral no tiene información de producción disponible.',
						showConfirmButton: true,
					});
				}
			);
		}
	}

	isLoading: boolean = false;
	private updateTimeout: any;
	changeCalidadFields(item: ItemCalidad, event: Event, fieldName: string) {
		this.isLoading = true;

		clearTimeout(this.updateTimeout);
		const inputValue = (event.target as HTMLInputElement).value;

		// Validaciones específicas por campo
		if (fieldName === 'phCalidadPromedio') {
			// Validar que sea un número positivo con hasta 2 decimales
			const phRegex = /^(?:\d+|\d*\.\d{1,2})$/;
			if (inputValue && phRegex.test(inputValue) && parseFloat(inputValue) > 0) {
				item.phCalidadPromedio = parseFloat(inputValue);
			} else if (inputValue === '') {
				item.phCalidadPromedio = null;
			} else {
				Swal.fire({
					icon: 'error',
					title: 'Oops!',
					text: 'El pH de calidad debe ser un número positivo con hasta 2 decimales.',
					showConfirmButton: true,
				});
				this.isLoading = false;
				return;
			}
		} else if (fieldName === 'carOrganolepticasCalidad' || fieldName === 'viscosidadCalidad') {
			// Para campos de texto, simplemente asignar el valor o null si está vacío
			item[fieldName] = inputValue.trim() === '' ? null : inputValue.trim();
		}

		// Establece un nuevo temporizador para 1 segundo
		this.updateTimeout = setTimeout(() => {
			if (this.isProducto(item)) {
				// Lógica para productos regulares
				let productoRequest: any = {
					idProductoMaestro: item.idProductoMaestro,
					idEstadoProducto: item.idEstadoProducto,
					phCalidad: item.phCalidadPromedio,
					carOrganolepticasCalidad: item.carOrganolepticasCalidad,
					viscosidadCalidad: item.viscosidadCalidad,
					observacion: ""
				};

				this.productoService
					.updatePedidoProductoMaestro(productoRequest)
					.subscribe(
						(data: any) => {
							if (data) {
								this.showSuccess(this.successTpl);
								this.actualizarListaProductos();
								this.isLoading = false;
							}
						},
						(error) => {
							console.error(
								'Error al actualizar campos de calidad del producto',
								error
							);
							Swal.fire({
								icon: 'error',
								title: 'Oops!',
								text: 'No se pudieron actualizar los campos de calidad del producto, inténtelo de nuevo.',
								showConfirmButton: true,
							});
							this.isLoading = false;
						}
					);
			} else {
				// Lógica para preparados magistrales
				let preparadoRequest: any = {
					idPreparadoMagistral: item.idPreparadoMagistral,
					idEstadoProducto: item.idEstadoProducto,
					phCalidad: item.phCalidadPromedio,
					carOrganolepticasCalidad: item.carOrganolepticasCalidad,
					viscosidadCalidad: item.viscosidadCalidad,
					observacion: ""
				};

				this.productoService
					.updatePreparadoMagistralCalidad(preparadoRequest)
					.subscribe(
						(data: any) => {
							if (data) {
								this.showSuccess(this.successTpl);
								this.actualizarListaProductos();
								this.isLoading = false;
							}
						},
						(error) => {
							console.error(
								'Error al actualizar campos de calidad del preparado magistral',
								error
							);
							Swal.fire({
								icon: 'error',
								title: 'Oops!',
								text: 'No se pudieron actualizar los campos de calidad del preparado magistral, inténtelo de nuevo.',
								showConfirmButton: true,
							});
							this.isLoading = false;
						}
					);
			}
		}, 1000);
	}

	showStandard(template: TemplateRef<any>) {
		this.toastService.show({ template });
	}

	showSuccess(template: TemplateRef<any>) {
		this.toastService.show({
			template,
			classname: 'bg-success text-light',
			delay: 3000,
		});
	}

	showDanger(template: TemplateRef<any>) {
		this.toastService.show({
			template,
			classname: 'bg-danger text-light',
			delay: 15000,
		});
	}

	refreshProductos(): void {
		this.productos = this.productosTable
			.map((producto, i) => ({ id: i + 1, ...producto }))
			.slice(
				(this.page - 1) * this.pageSize,
				(this.page - 1) * this.pageSize + this.pageSize
			);
	}

	actualizarListaProductos(): void {
		// Si hay un idBulk en búsqueda, volver a buscar por ese idBulk
		if (this.idBulkBusqueda.trim()) {
			this.buscarPorIdBulk();
		} else {
			// Si no hay búsqueda específica, cargar todos (método original)
			this.getProductosAll();
		}
	}

	saveObservacion(): void {
		this.pedidoService
			.saveObservacionPedido({
				idPedido: this.idPedidoNota,
				idProducto: this.idProductoNota,
				observacion: this.observacionNota,
			})
			.subscribe(
				(response) => {
					Swal.fire({
						icon: 'success',
						title: '¡Listo!',
						text: 'Observación guardada correctamente.',
						showConfirmButton: true,
					});
					this.actualizarListaProductos();
					this.modalService.dismissAll();
					this.observacionNota = '';
					this.idPedidoNota = null;
					this.idProductoNota = null;
				},
				(error) => {
					console.error('Error al guardar la observación', error);
					Swal.fire({
						icon: 'error',
						title: 'Oops!',
						text: 'No se pudo guardar la observación, inténtelo de nuevo.',
						showConfirmButton: true,
					});
				}
			);
	}

	// Check si un item está seleccionado y cumple condiciones según tipoEnvio y pH
	isSeleccionado(
		item: ItemCalidad,
		phCalidad?: number | null,
		phDefinidoMin?: number | null,
		phDefinidoMax?: number | null
	): boolean {
		const itemId = this.getItemId(item);
		const seleccionado = this.lstProductosSeleccionados.some(
			(selectedItem) => this.getItemId(selectedItem) === itemId
		);

		if (!seleccionado) return false;

		// Validaciones adicionales según tipoEnvio
		if (this.tipoEnvio === 0) {
			// Regresar a producción: phCalidad nulo/vacío o fuera de rango
			if (
				phCalidad === null ||
				phCalidad === undefined ||
				isNaN(Number(phCalidad)) ||
				Number(phCalidad) < Number(phDefinidoMin) ||
				Number(phCalidad) > Number(phDefinidoMax)
			) {
				return true;
			}
			return false;
		} else if (this.tipoEnvio === 1) {
			// Enviar a envasado: phCalidad numérico y dentro de rango
			if (
				phCalidad !== null &&
				phCalidad !== undefined &&
				!isNaN(Number(phCalidad)) &&
				Number(phCalidad) >= Number(phDefinidoMin) &&
				Number(phCalidad) <= Number(phDefinidoMax)
			) {
				return true;
			}
			return false;
		}

		return seleccionado;
	}

	// Cambiar selección individual
	toggleSeleccionIndividual(
		item: ItemCalidad,
		event: Event
	) {
		let checked = (event.target as HTMLInputElement)?.checked;
		const itemId = this.getItemId(item);
		
		if (checked) {
			if (
				!this.lstProductosSeleccionados.some(
					(selectedItem) => this.getItemId(selectedItem) === itemId
				)
			) {
				// Buscar el elemento completo en productosTable
				const itemCompleto = this.productosTable.find(p => this.getItemId(p) === itemId);
				if (itemCompleto) {
					this.lstProductosSeleccionados.push(itemCompleto);
				}
			}
		} else {
			this.lstProductosSeleccionados =
				this.lstProductosSeleccionados.filter(
					(selectedItem) => this.getItemId(selectedItem) !== itemId
				);
		}
		console.log('Productos seleccionados:', this.lstProductosSeleccionados);
	}

	// Check si todos los productos en la página están seleccionados
	isTodosSeleccionadosPagina(): boolean {
		let productosFiltrados: ItemCalidad[] = [];

		if (this.tipoEnvio === 0) {
			// Regresar a producción: phCalidad nulo/vacío o fuera de rango
			productosFiltrados = this.productos.filter((p) => {
				const ph = p.phCalidadPromedio;
				const min = p.phDefinidoMin;
				const max = p.phDefinidoMax;
				return (
					ph === null ||
					ph === undefined ||
					isNaN(Number(ph)) ||
					Number(ph) < min ||
					Number(ph) > max
				);
			});
		} else if (this.tipoEnvio === 1) {
			// Enviar a envasado: phCalidad numérico y dentro de rango
			productosFiltrados = this.productos.filter((p) => {
				const ph = p.phCalidadPromedio;
				const min = p.phDefinidoMin;
				const max = p.phDefinidoMax;
				return (
					ph !== null &&
					ph !== undefined &&
					!isNaN(Number(ph)) &&
					Number(ph) >= min &&
					Number(ph) <= max
				);
			});
		}

		if (productosFiltrados.length === 0) return false;

		return productosFiltrados.every((p) =>
			this.lstProductosSeleccionados.some(
				(selectedItem) => this.getItemId(selectedItem) === this.getItemId(p)
			)
		);
	}

	// Cambiar selección masiva en la página actual
	toggleSeleccionTodosPagina(event: Event) {
		let checked = (event.target as HTMLInputElement)?.checked;

		let productosFiltrados: ItemCalidad[] = [];

		if (this.tipoEnvio === 0) {
			// Regresar a producción: phCalidad nulo/vacío o fuera de rango
			productosFiltrados = this.productos.filter((p) => {
				const ph = p.phCalidadPromedio;
				const min = p.phDefinidoMin;
				const max = p.phDefinidoMax;
				return (
					ph === null ||
					ph === undefined ||
					isNaN(Number(ph)) ||
					Number(ph) < min ||
					Number(ph) > max
				);
			});
		} else if (this.tipoEnvio === 1) {
			// Enviar a envasado: phCalidad numérico y dentro de rango
			productosFiltrados = this.productos.filter((p) => {
				const ph = p.phCalidadPromedio;
				const min = p.phDefinidoMin;
				const max = p.phDefinidoMax;
				return (
					ph !== null &&
					ph !== undefined &&
					!isNaN(Number(ph)) &&
					Number(ph) >= min &&
					Number(ph) <= max
				);
			});
		}

		const idsPagina = productosFiltrados.map((p) => this.getItemId(p));

		if (checked) {
			idsPagina.forEach((itemId) => {
				if (
					!this.lstProductosSeleccionados.some(
						(selectedItem) => this.getItemId(selectedItem) === itemId
					)
				) {
					// Buscar el elemento completo en productosTable
					const itemCompleto = this.productosTable.find(p => this.getItemId(p) === itemId);
					if (itemCompleto) {
						this.lstProductosSeleccionados.push(itemCompleto);
					}
				}
			});
		} else {
			this.lstProductosSeleccionados =
				this.lstProductosSeleccionados.filter(
					(selectedItem) =>
						!idsPagina.includes(this.getItemId(selectedItem))
				);
		}
		console.log('Productos seleccionados:', this.lstProductosSeleccionados);
	}

	enviarMasivo() {
		if (this.lstProductosSeleccionados.length === 0) {
			Swal.fire({
				icon: 'warning',
				title: '¡Atención!',
				text: 'No hay productos seleccionados para enviar.',
				showConfirmButton: true,
			});
			return;
		}
		if (this.tipoEnvio === 0) {
			this.regresarAProduccionMasivo();
		} else if (this.tipoEnvio === 1) {
			this.enviarEnvasadoMasivo();
		}
	}

	//En calidad -> En producción (atras)
	regresarAProduccionMasivo() {
		let lstProductos = '';
		for (let i = 0; i < this.lstProductosSeleccionados.length; i++) {
			const item = this.lstProductosSeleccionados[i];
			const itemId = this.getItemId(item);
			const producto = this.productosTable.find(p => this.getItemId(p) === itemId);
			const nombreProducto = producto ? this.getItemNombre(producto) : itemId;
			lstProductos += nombreProducto + '<br>';
		}

		Swal.fire({
			title: '¿Estás seguro?',
			html: `<p>¿Deseas regresar los productos seleccionados a producción?</p>
          <p>Productos seleccionados:</p>
          <div style="max-height: 200px; overflow-y: auto;">${lstProductos}</div>`,
			icon: 'question',
			showCancelButton: true,
			confirmButtonText: 'Sí, enviar',
			cancelButtonText: 'Cancelar',
		}).then((result) => {
			if (result.isConfirmed) {
				this.procesarProductosIndividualesRegresarProduccion();
			}
		});
	}

	procesarProductosIndividualesRegresarProduccion() {
		const productosSeleccionados = this.lstProductosSeleccionados.map(item => {
			return this.productosTable.find(p => this.getItemId(p) === this.getItemId(item));
		}).filter((producto): producto is ItemCalidad => producto !== undefined);

		let procesadosExitosos = 0;
		let errores = 0;
		const totalProductos = productosSeleccionados.length;

		// Procesar cada producto individualmente
		productosSeleccionados.forEach((item, index) => {
			if (this.isProducto(item)) {
				// Procesar producto regular
				if (item.idBulk) {
					const bulkData = {
						idBulk: item.idBulk,
						idProductoMaestro: item.idProductoMaestro,
						idEstadoProductoActual: 4, // En calidad
						idEstadoProductoNuevo: 3, // En producción
						idEstadoPedido: 4, // En producción
						idEstadoPedidoCliente: 3, // En producción
						idCliente: this.dataService.getLoggedUser().cliente.idCliente,
						accionRealizada: 'Producto regresado a producción',
						observacion: ''
					};

					this.productoService.updateEstadoProductoBulk(bulkData).subscribe(
						(bulkResponse) => {
							console.log(`Estado bulk actualizado correctamente para ${this.getItemNombre(item)}:`, bulkResponse);
							procesadosExitosos++;
							
							// Verificar si todos los productos han sido procesados
							if (procesadosExitosos + errores === totalProductos) {
								this.mostrarResultadoMasivo(procesadosExitosos, errores, totalProductos, 'regresados a producción');
							}
						},
						(bulkError) => {
							console.error(`Error al regresar producto ${this.getItemNombre(item)} a producción:`, bulkError);
							errores++;
							
							// Verificar si todos los productos han sido procesados
							if (procesadosExitosos + errores === totalProductos) {
								this.mostrarResultadoMasivo(procesadosExitosos, errores, totalProductos, 'regresados a producción');
							}
						}
					);
				} else {
					console.error(`Producto ${this.getItemNombre(item)} no tiene código bulk`);
					errores++;
					
					// Verificar si todos los productos han sido procesados
					if (procesadosExitosos + errores === totalProductos) {
						this.mostrarResultadoMasivo(procesadosExitosos, errores, totalProductos, 'regresados a producción');
					}
				}
			} else if (this.isPreparado(item)) {
				// Procesar preparado magistral
				if (item.idBulk) {
					const bulkData = {
						idBulkPreparadoMagistral: item.idBulk,
						idEstadoProductoActual: 4, // En calidad
						idEstadoProductoNuevo: 3, // En producción
						idEstadoPedido: 4, // En producción
						idEstadoPedidoCliente: 3, // En producción
						idCliente: this.dataService.getLoggedUser().cliente.idCliente,
						accionRealizada: 'Preparado magistral regresado a producción',
						observacion: ''
					};

					this.productoService.updateEstadoPreparadoMagistralBulk(bulkData).subscribe(
						(bulkResponse) => {
							console.log(`Estado bulk de preparado magistral actualizado correctamente para ${this.getItemNombre(item)}:`, bulkResponse);
							procesadosExitosos++;
							
							// Verificar si todos los productos han sido procesados
							if (procesadosExitosos + errores === totalProductos) {
								this.mostrarResultadoMasivo(procesadosExitosos, errores, totalProductos, 'regresados a producción');
							}
						},
						(bulkError) => {
							console.error(`Error al regresar preparado magistral ${this.getItemNombre(item)} a producción:`, bulkError);
							errores++;
							
							// Verificar si todos los productos han sido procesados
							if (procesadosExitosos + errores === totalProductos) {
								this.mostrarResultadoMasivo(procesadosExitosos, errores, totalProductos, 'regresados a producción');
							}
						}
					);
				} else {
					console.error(`Preparado magistral ${this.getItemNombre(item)} no tiene código bulk`);
					errores++;
					
					// Verificar si todos los productos han sido procesados
					if (procesadosExitosos + errores === totalProductos) {
						this.mostrarResultadoMasivo(procesadosExitosos, errores, totalProductos, 'regresados a producción');
					}
				}
			}
		});
	}

	enviarEnvasadoMasivo() {
		let lstProductos = '';
		for (let i = 0; i < this.lstProductosSeleccionados.length; i++) {
			const item = this.lstProductosSeleccionados[i];
			const itemId = this.getItemId(item);
			const producto = this.productosTable.find(p => this.getItemId(p) === itemId);
			const nombreProducto = producto ? this.getItemNombre(producto) : itemId;
			lstProductos += nombreProducto + '<br>';
		}

		Swal.fire({
			title: '¿Estás seguro?',
			html: `<p>¿Deseas enviar los productos seleccionados a envasado?</p>
          <p>Productos seleccionados:</p>
          <div style="max-height: 200px; overflow-y: auto;">${lstProductos}</div>`,
			icon: 'question',
			showCancelButton: true,
			confirmButtonText: 'Sí, enviar',
			cancelButtonText: 'Cancelar',
		}).then((result) => {
			if (result.isConfirmed) {
				this.procesarProductosIndividualesEnviarEnvasado();
			}
		});
	}

	procesarProductosIndividualesEnviarEnvasado() {
		const productosSeleccionados = this.lstProductosSeleccionados.map(item => {
			return this.productosTable.find(p => this.getItemId(p) === this.getItemId(item));
		}).filter((producto): producto is ItemCalidad => producto !== undefined);

		let procesadosExitosos = 0;
		let errores = 0;
		const totalProductos = productosSeleccionados.length;

		// Procesar cada producto individualmente
		productosSeleccionados.forEach((item, index) => {
			if (this.isProducto(item)) {
				// Procesar producto regular
				if (item.idBulk) {
					const bulkData = {
						idBulk: item.idBulk,
						idProductoMaestro: item.idProductoMaestro,
						idEstadoProductoActual: 4, // En calidad
						idEstadoProductoNuevo: 5, // En envasado
						idEstadoPedido: 6, // En envasado
						idEstadoPedidoCliente: 3, // En producción
						idCliente: this.dataService.getLoggedUser().cliente.idCliente,
						accionRealizada: 'Producto enviado a envasado',
						observacion: ''
					};

					this.productoService.updateEstadoProductoBulk(bulkData).subscribe(
						(bulkResponse) => {
							console.log(`Estado bulk actualizado correctamente para ${this.getItemNombre(item)}:`, bulkResponse);
							procesadosExitosos++;
							
							// Verificar si todos los productos han sido procesados
							if (procesadosExitosos + errores === totalProductos) {
								this.mostrarResultadoMasivo(procesadosExitosos, errores, totalProductos, 'enviados a envasado');
							}
						},
						(bulkError) => {
							console.error(`Error al enviar producto ${this.getItemNombre(item)} a envasado:`, bulkError);
							errores++;
							
							// Verificar si todos los productos han sido procesados
							if (procesadosExitosos + errores === totalProductos) {
								this.mostrarResultadoMasivo(procesadosExitosos, errores, totalProductos, 'enviados a envasado');
							}
						}
					);
				} else {
					console.error(`Producto ${this.getItemNombre(item)} no tiene código bulk`);
					errores++;
					
					// Verificar si todos los productos han sido procesados
					if (procesadosExitosos + errores === totalProductos) {
						this.mostrarResultadoMasivo(procesadosExitosos, errores, totalProductos, 'enviados a envasado');
					}
				}
			} else if (this.isPreparado(item)) {
				// Procesar preparado magistral
				if (item.idBulk) {
					const bulkData = {
						idBulkPreparadoMagistral: item.idBulk,
						idEstadoProductoActual: 4, // En calidad
						idEstadoProductoNuevo: 5, // En envasado
						idEstadoPedido: 6, // En envasado
						idEstadoPedidoCliente: 3, // En producción
						idCliente: this.dataService.getLoggedUser().cliente.idCliente,
						accionRealizada: 'Preparado magistral enviado a envasado',
						observacion: ''
					};

					this.productoService.updateEstadoPreparadoMagistralBulk(bulkData).subscribe(
						(bulkResponse) => {
							console.log(`Estado bulk de preparado magistral actualizado correctamente para ${this.getItemNombre(item)}:`, bulkResponse);
							procesadosExitosos++;
							
							// Verificar si todos los productos han sido procesados
							if (procesadosExitosos + errores === totalProductos) {
								this.mostrarResultadoMasivo(procesadosExitosos, errores, totalProductos, 'enviados a envasado');
							}
						},
						(bulkError) => {
							console.error(`Error al enviar preparado magistral ${this.getItemNombre(item)} a envasado:`, bulkError);
							errores++;
							
							// Verificar si todos los productos han sido procesados
							if (procesadosExitosos + errores === totalProductos) {
								this.mostrarResultadoMasivo(procesadosExitosos, errores, totalProductos, 'enviados a envasado');
							}
						}
					);
				} else {
					console.error(`Preparado magistral ${this.getItemNombre(item)} no tiene código bulk`);
					errores++;
					
					// Verificar si todos los productos han sido procesados
					if (procesadosExitosos + errores === totalProductos) {
						this.mostrarResultadoMasivo(procesadosExitosos, errores, totalProductos, 'enviados a envasado');
					}
				}
			}
		});
	}

	mostrarResultadoMasivo(exitosos: number, errores: number, total: number, accion: string) {
		if (errores === 0) {
			// Todos exitosos
			Swal.fire({
				icon: 'success',
				title: '¡Listo!',
				text: `Todos los productos (${exitosos}/${total}) fueron ${accion} correctamente.`,
				showConfirmButton: true,
			}).then(() => {
				this.idBulkBusqueda = ''; // Limpiar el input de búsqueda
				this.lstProductosSeleccionados = []; // Limpiar selecciones
				this.productosTable = []; // Limpiar tabla
				this.refreshProductos(); // Actualizar vista
			});
		} else if (exitosos === 0) {
			// Todos fallaron
			Swal.fire({
				icon: 'error',
				title: 'Error',
				text: `No se pudo procesar ninguno de los productos seleccionados. Por favor, inténtelo de nuevo.`,
				showConfirmButton: true,
			});
		} else {
			// Algunos exitosos, algunos fallaron
			Swal.fire({
				icon: 'warning',
				title: 'Procesamiento parcial',
				text: `Se procesaron ${exitosos} de ${total} productos. ${errores} producto(s) tuvieron errores.`,
				showConfirmButton: true,
			}).then(() => {
				// Actualizar la lista para reflejar los cambios
				this.idBulkBusqueda = ''; // Limpiar el input de búsqueda
				this.lstProductosSeleccionados = []; // Limpiar selecciones
				this.productosTable = []; // Limpiar tabla
				this.refreshProductos(); // Actualizar vista
			});
		}
	}

	regresarAProduccion(item: ItemCalidad) {
		const nombreItem = this.getItemNombre(item);

		Swal.fire({
			title: '¿Estás seguro?',
			html: `<p>¿Deseas regresar el ${this.getItemTipo(item)} <strong>${nombreItem}</strong> a producción?</p>`,
			icon: 'question',
			showCancelButton: true,
			confirmButtonText: 'Sí, regresar',
			cancelButtonText: 'Cancelar',
		}).then((result) => {
			if (result.isConfirmed) {
				if (this.isProducto(item)) {
					// Procesar producto regular
					if (item.idBulk) {
						const bulkData = {
							idBulk: item.idBulk,
							idProductoMaestro: item.idProductoMaestro,
							idEstadoProductoActual: 4, // En calidad
							idEstadoProductoNuevo: 3, // En producción
							idEstadoPedido: 4, // En producción
							idEstadoPedidoCliente: 3, // En producción
							idCliente: this.dataService.getLoggedUser().cliente.idCliente,
							accionRealizada: 'Producto regresado a producción',
							observacion: ''
						};

						this.productoService.updateEstadoProductoBulk(bulkData).subscribe(
							(bulkResponse) => {
								console.log('Estado bulk actualizado correctamente:', bulkResponse);
								Swal.fire({
									icon: 'success',
									title: '¡Listo!',
									text: 'Producto regresado a producción correctamente.',
									showConfirmButton: true,
								}).then(() => {
									this.idBulkBusqueda = ''; // Limpiar el input de búsqueda
									this.lstProductosSeleccionados = []; // Limpiar selecciones
									this.productosTable = []; // Limpiar tabla
									this.refreshProductos(); // Actualizar vista
								});
							},
							(bulkError) => {
								console.error('Error al actualizar estado bulk:', bulkError);
								Swal.fire({
									icon: 'error',
									title: 'Oops!',
									text: 'No se pudo regresar el producto a producción, inténtelo de nuevo.',
									showConfirmButton: true,
								});
							}
						);
					} else {
						Swal.fire({
							icon: 'warning',
							title: 'Atención',
							text: 'Este producto no tiene un código bulk asociado.',
							showConfirmButton: true,
						});
					}
				} else if (this.isPreparado(item)) {
					// Procesar preparado magistral
					if (item.idBulk) {
						const bulkData = {
							idBulkPreparadoMagistral: item.idBulk,
							idEstadoProductoActual: 4, // En calidad
							idEstadoProductoNuevo: 3, // En producción
							idEstadoPedido: 4, // En producción
							idEstadoPedidoCliente: 3, // En producción
							idCliente: this.dataService.getLoggedUser().cliente.idCliente,
							accionRealizada: 'Preparado magistral regresado a producción',
							observacion: ''
						};

						this.productoService.updateEstadoPreparadoMagistralBulk(bulkData).subscribe(
							(bulkResponse) => {
								console.log('Estado bulk de preparado magistral actualizado correctamente:', bulkResponse);
								Swal.fire({
									icon: 'success',
									title: '¡Listo!',
									text: 'Preparado magistral regresado a producción correctamente.',
									showConfirmButton: true,
								}).then(() => {
									this.idBulkBusqueda = ''; // Limpiar el input de búsqueda
									this.lstProductosSeleccionados = []; // Limpiar selecciones
									this.productosTable = []; // Limpiar tabla
									this.refreshProductos(); // Actualizar vista
								});
							},
							(bulkError) => {
								console.error('Error al regresar preparado magistral a producción:', bulkError);
								Swal.fire({
									icon: 'error',
									title: 'Oops!',
									text: 'No se pudo regresar el preparado magistral a producción, inténtelo de nuevo.',
									showConfirmButton: true,
								});
							}
						);
					} else {
						Swal.fire({
							icon: 'warning',
							title: 'Atención',
							text: 'Este preparado magistral no tiene un código bulk asociado.',
							showConfirmButton: true,
						});
					}
				}
			}
		});
	}

	enviarEnvasado(item: ItemCalidad) {
		const nombreItem = this.getItemNombre(item);

		Swal.fire({
			title: '¿Estás seguro?',
			html: `<p>¿Deseas enviar el ${this.getItemTipo(item)} <strong>${nombreItem}</strong> a envasado?</p>`,
			icon: 'question',
			showCancelButton: true,
			confirmButtonText: 'Sí, enviar',
			cancelButtonText: 'Cancelar',
		}).then((result) => {
			if (result.isConfirmed) {
				if (this.isProducto(item)) {
					// Procesar producto regular
					if (item.idBulk) {
						const bulkData = {
							idBulk: item.idBulk,
							idProductoMaestro: item.idProductoMaestro,
							idEstadoProductoActual: 4, // En calidad
							idEstadoProductoNuevo: 5, // En envasado
							idEstadoPedido: 6, // En envasado
							idEstadoPedidoCliente: 3, // En producción
							idCliente: this.dataService.getLoggedUser().cliente.idCliente,
							accionRealizada: 'Producto enviado a envasado',
							observacion: ''
						};

						this.productoService.updateEstadoProductoBulk(bulkData).subscribe(
							(bulkResponse) => {
								console.log('Estado bulk actualizado correctamente:', bulkResponse);
								Swal.fire({
									icon: 'success',
									title: '¡Listo!',
									text: 'Producto enviado a envasado correctamente.',
									showConfirmButton: true,
								}).then(() => {
									this.idBulkBusqueda = ''; // Limpiar el input de búsqueda
									this.lstProductosSeleccionados = []; // Limpiar selecciones
									this.productosTable = []; // Limpiar tabla
									this.refreshProductos(); // Actualizar vista
								});
							},
							(bulkError) => {
								console.error('Error al actualizar estado bulk:', bulkError);
								Swal.fire({
									icon: 'error',
									title: 'Oops!',
									text: 'No se pudo enviar el producto a envasado, inténtelo de nuevo.',
									showConfirmButton: true,
								});
							}
						);
					} else {
						Swal.fire({
							icon: 'warning',
							title: 'Atención',
							text: 'Este producto no tiene un código bulk asociado.',
							showConfirmButton: true,
						});
					}
				} else if (this.isPreparado(item)) {
					// Procesar preparado magistral
					if (item.idBulk) {
						const bulkData = {
							idBulkPreparadoMagistral: item.idBulk,
							idEstadoProductoActual: 4, // En calidad
							idEstadoProductoNuevo: 5, // En envasado
							idEstadoPedido: 6, // En envasado
							idEstadoPedidoCliente: 3, // En producción
							idCliente: this.dataService.getLoggedUser().cliente.idCliente,
							accionRealizada: 'Preparado magistral enviado a envasado',
							observacion: ''
						};

						this.productoService.updateEstadoPreparadoMagistralBulk(bulkData).subscribe(
							(bulkResponse) => {
								console.log('Estado bulk de preparado magistral actualizado correctamente:', bulkResponse);
								Swal.fire({
									icon: 'success',
									title: '¡Listo!',
									text: 'Preparado magistral enviado a envasado correctamente.',
									showConfirmButton: true,
								}).then(() => {
									this.idBulkBusqueda = ''; // Limpiar el input de búsqueda
									this.lstProductosSeleccionados = []; // Limpiar selecciones
									this.productosTable = []; // Limpiar tabla
									this.refreshProductos(); // Actualizar vista
								});
							},
							(bulkError) => {
								console.error('Error al actualizar estado bulk de preparado magistral:', bulkError);
								Swal.fire({
									icon: 'error',
									title: 'Oops!',
									text: 'No se pudo enviar el preparado magistral a envasado, inténtelo de nuevo.',
									showConfirmButton: true,
								});
							}
						);
					} else {
						Swal.fire({
							icon: 'warning',
							title: 'Atención',
							text: 'Este preparado magistral no tiene un código bulk asociado.',
							showConfirmButton: true,
						});
					}
				}
			}
		});
	}
}
