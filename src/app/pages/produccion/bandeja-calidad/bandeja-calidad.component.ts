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

	productos: any[] = [];
	productosTable: any[] = [];
	page = 1;
	pageSize = 5;
	collectionSize = this.productos.length;
	lstProductosSeleccionados: any[] = [];
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
		// Ya no se cargan automáticamente los productos
		// this.getProductosAll();
	}

	getProductosAll(): void {
		this.pedidoService.getProductosCalidad().subscribe(
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
		this.pedidoService.getProductoCalidadByIdBulk(this.idBulkBusqueda.trim()).subscribe(
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
					// Si no hay idResultado ni mensaje, es un producto válido
					// Como retorna un objeto único, lo convertimos en array
					this.productosTable = [response];
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
	
	getInformacionCompleta(productoMaestro: any): void {
		this.productoService.getHojaProduccion(productoMaestro.idProductoMaestro).subscribe(
			(data) => {
				console.log('Información completa obtenida:', data);
				if(data && data.idResultado == 1) {
					this.procedimientoData = data.value;
					this.productoMaestroCalculo = productoMaestro;
					if (this.informacionCompleta) {
						this.openModalXL(this.informacionCompleta);
					}
				}else{
					Swal.fire({
						icon: 'warning',
						title: '¡Oops!',
						text: data.resultado,
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
	}

	isLoading: boolean = false;
	private updateTimeout: any;
	changeCalidadFields(pedidoProducto: any, event: Event, fieldName: string) {
		this.isLoading = true;

		clearTimeout(this.updateTimeout);
		const inputValue = (event.target as HTMLInputElement).value;

		// Validaciones específicas por campo
		if (fieldName === 'phCalidadPromedio') {
			// Validar que sea un número positivo con hasta 2 decimales
			const phRegex = /^(?:\d+|\d*\.\d{1,2})$/;
			if (inputValue && phRegex.test(inputValue) && parseFloat(inputValue) > 0) {
				pedidoProducto.phCalidadPromedio = parseFloat(inputValue);
			} else if (inputValue === '') {
				pedidoProducto.phCalidadPromedio = null;
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
			pedidoProducto[fieldName] = inputValue.trim() === '' ? null : inputValue.trim();
		}

		// Establece un nuevo temporizador para 1 segundo
		this.updateTimeout = setTimeout(() => {
			let productoRequest: any = {
				idProductoMaestro: pedidoProducto.idProductoMaestro,
				idEstadoProducto: pedidoProducto.idEstadoProducto,
				phCalidad: pedidoProducto.phCalidadPromedio,
				carOrganolepticasCalidad: pedidoProducto.carOrganolepticasCalidad,
				viscosidadCalidad: pedidoProducto.viscosidadCalidad,
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
							'Error al actualizar campos de calidad',
							error
						);
						Swal.fire({
							icon: 'error',
							title: 'Oops!',
							text: 'No se pudieron actualizar los campos de calidad, inténtelo de nuevo.',
							showConfirmButton: true,
						});
						this.isLoading = false;
					}
				);
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

	// Check si un idProductoMaestro está seleccionado y cumple condiciones según tipoEnvio y pH
	isSeleccionado(
		idProductoMaestro: string,
		phCalidad?: number,
		phDefinidoMin?: number,
		phDefinidoMax?: number
	): boolean {
		const seleccionado = this.lstProductosSeleccionados.some(
			(item) => item.idProductoMaestro === idProductoMaestro
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
		idProductoMaestro: string,
		event: Event
	) {
		let checked = (event.target as HTMLInputElement)?.checked;
		if (checked) {
			if (
				!this.lstProductosSeleccionados.some(
					(item) => item.idProductoMaestro === idProductoMaestro
				)
			) {
				this.lstProductosSeleccionados.push({
					idProductoMaestro: idProductoMaestro,
				});
			}
		} else {
			this.lstProductosSeleccionados =
				this.lstProductosSeleccionados.filter(
					(item) => item.idProductoMaestro !== idProductoMaestro
				);
		}
		console.log('Productos seleccionados:', this.lstProductosSeleccionados);
	}

	// Check si todos los productos en la página están seleccionados
	isTodosSeleccionadosPagina(): boolean {
		let productosFiltrados: any[] = [];

		if (this.tipoEnvio === 0) {
			// Regresar a producción: phCalidad nulo/vacío o fuera de rango
			productosFiltrados = this.productos.filter((p) => {
				const ph = p.phCalidadPromedio;
				const min = p.phDefinidoMin;
				const max = p.phDefinidoMax;
				return (
					ph === null ||
					ph === undefined ||
					ph === '' ||
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
					ph !== '' &&
					!isNaN(Number(ph)) &&
					Number(ph) >= min &&
					Number(ph) <= max
				);
			});
		}

		if (productosFiltrados.length === 0) return false;

		return productosFiltrados.every((p) =>
			this.lstProductosSeleccionados.some(
				(item) => item.idProductoMaestro === p.idProductoMaestro
			)
		);
	}

	// Cambiar selección masiva en la página actual
	toggleSeleccionTodosPagina(event: Event) {
		let checked = (event.target as HTMLInputElement)?.checked;

		let productosFiltrados: any[] = [];

		if (this.tipoEnvio === 0) {
			// Regresar a producción: phCalidad nulo/vacío o fuera de rango
			productosFiltrados = this.productos.filter((p) => {
				const ph = p.phCalidadPromedio;
				const min = p.phDefinidoMin;
				const max = p.phDefinidoMax;
				return (
					ph === null ||
					ph === undefined ||
					ph === '' ||
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
					ph !== '' &&
					!isNaN(Number(ph)) &&
					Number(ph) >= min &&
					Number(ph) <= max
				);
			});
		}

		const idsPagina = productosFiltrados.map((p) => p.idProductoMaestro);

		if (checked) {
			idsPagina.forEach((idProductoMaestro) => {
				if (
					!this.lstProductosSeleccionados.some(
						(item) => item.idProductoMaestro === idProductoMaestro
					)
				) {
					this.lstProductosSeleccionados.push({
						idProductoMaestro,
					});
				}
			});
		} else {
			this.lstProductosSeleccionados =
				this.lstProductosSeleccionados.filter(
					(item) =>
						!idsPagina.includes(item.idProductoMaestro)
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
			const idProductoMaestro = this.lstProductosSeleccionados[i].idProductoMaestro;
			const producto = this.productosTable.find(p => p.idProductoMaestro === idProductoMaestro);
			const nombreProducto = producto ? producto.nombreProducto : idProductoMaestro;
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
				this.productoService
					.updateEstadoProductoPedidoMasivoMaestro({
						idProductoMaestroList: this.lstProductosSeleccionados.map(
							(item) => item.idProductoMaestro
						),
						idEstadoProductoActual: 4, // En calidad
						idEstadoProductoNuevo: 3, // En producción
						idEstadoPedidoNuevo: 4, // En producción
						idEstadoPedidoClienteNuevo: 3, // En producción
						idCliente:
							this.dataService.getLoggedUser().cliente.idCliente,
						accionRealizada: 'Productos regresados a producción',
						observacion: '',
					})
					.subscribe(
						(response) => {
							Swal.fire({
								icon: 'success',
								title: '¡Listo!',
								text: 'Productos retornados a producción correctamente.',
								showConfirmButton: true,
							}).then(() => {
								this.idBulkBusqueda = ''; // Limpiar el input de búsqueda
								this.lstProductosSeleccionados = []; // Limpiar selecciones
								this.productosTable = []; // Limpiar tabla
								this.refreshProductos(); // Actualizar vista
							});
						},
						(error) => {
							console.error(
								'Error al retornar productos a producción',
								error
							);
							Swal.fire({
								icon: 'error',
								title: 'Oops!',
								text: 'No se pudo retornar los productos a producción, inténtelo de nuevo.',
								showConfirmButton: true,
							});
						}
					);
			}
		});
	}

	enviarEnvasadoMasivo() {
		let lstProductos = '';
		for (let i = 0; i < this.lstProductosSeleccionados.length; i++) {
			const idProductoMaestro = this.lstProductosSeleccionados[i].idProductoMaestro;
			const producto = this.productosTable.find(p => p.idProductoMaestro === idProductoMaestro);
			const nombreProducto = producto ? producto.nombreProducto : idProductoMaestro;
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
				this.productoService
					.updateEstadoProductoPedidoMasivoMaestro({
						idProductoMaestroList: this.lstProductosSeleccionados.map(
							(item) => item.idProductoMaestro
						),
						idEstadoProductoActual: 4, // En calidad
						idEstadoProductoNuevo: 5, // En envasado
						idEstadoPedidoNuevo: 6, // En envasado
						idEstadoPedidoClienteNuevo: 3, // En producción
						idCliente:
							this.dataService.getLoggedUser().cliente.idCliente,
						accionRealizada: 'Productos enviados a envasado',
						observacion: '',
					})
					.subscribe(
						(response) => {
							Swal.fire({
								icon: 'success',
								title: '¡Listo!',
								text: 'Productos enviados a envasado correctamente.',
								showConfirmButton: true,
							}).then(() => {
								this.idBulkBusqueda = ''; // Limpiar el input de búsqueda
								this.lstProductosSeleccionados = []; // Limpiar selecciones
								this.productosTable = []; // Limpiar tabla
								this.refreshProductos(); // Actualizar vista
							});
						},
						(error) => {
							console.error(
								'Error al enviar productos a envasado',
								error
							);
							Swal.fire({
								icon: 'error',
								title: 'Oops!',
								text: 'No se pudo enviar los productos a envasado, inténtelo de nuevo.',
								showConfirmButton: true,
							});
						}
					);
			}
		});
	}

	regresarAProduccion(item: any) {

    Swal.fire({
      title: '¿Estás seguro?',
      html: `<p>¿Deseas regresar el producto <strong>${item.nombreProducto}</strong> a producción?</p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, regresar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
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
      }
    });

	}

  	enviarEnvasado(item: any) {

    Swal.fire({
      title: '¿Estás seguro?',
      html: `<p>¿Deseas enviar el producto <strong>${item.nombreProducto}</strong> a envasado?</p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
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
      }
    });

		
	}
}
