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

	idPedidoNota: string | null = null;
	idProductoNota: string | null = null;
	observacionNota: string = '';

	tipoEnvio = 1;

	procedimientoData: any;

	constructor(
		private pedidoService: PedidoService,
		private productoService: ProductoService,
		private dataService: DataService
	) {}

	ngOnInit(): void {
		this.getProductosAll();
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

	openModalNota(item: any, content: TemplateRef<any>) {
		this.modalService.open(content, { size: 'lg' });
		this.observacionNota = item.observacion;
		this.idPedidoNota = item.idPedido;
		this.idProductoNota = item.idProducto;
	}

	openModalXL(content: TemplateRef<any>) {
		this.modalService.open(content, { size: 'xl' });
	}

	@ViewChild('procedimiento', { static: true }) procedimiento: TemplateRef<any> | null = null;
	getHojaProduccion(idProducto: string): void {
		this.productoService.getHojaProduccion(idProducto).subscribe(
			(hojaProduccion) => {
				console.log('Hoja de producción obtenida:', hojaProduccion);
				this.procedimientoData = hojaProduccion;
				if (this.procedimiento) {
					this.openModalXL(this.procedimiento);
				}
			},
			(error) => {
				console.error('Error al obtener la hoja de producción', error);
				Swal.fire({
			icon: 'error',
			title: 'Oops!',
			text: 'No se pudo obtener la hoja de producción, inténtelo de nuevo.',
			showConfirmButton: true,
			});
		}
		);
	}

	isLoading: boolean = false;
	private updateTimeout: any;
	changePhCalidad(pedidoProducto: any, event: Event) {
		this.isLoading = true;

		clearTimeout(this.updateTimeout);
		const phCalidad = (event.target as HTMLInputElement).value;

		// Validar que sea un número positivo con hasta 2 decimales
		const phRegex = /^(?:\d+|\d*\.\d{1,2})$/;
		if (phCalidad && phRegex.test(phCalidad) && parseFloat(phCalidad) > 0) {
			pedidoProducto.phCalidad = parseFloat(phCalidad);
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

		// Establece un nuevo temporizador para 1 segundo
		this.updateTimeout = setTimeout(() => {
			const phValue = parseFloat(phCalidad);
			if (!isNaN(phValue) && phValue > 0 && phRegex.test(phCalidad)) {
				pedidoProducto.phCalidad = phValue;
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
			let productoRequest: any = {
				idPedido: pedidoProducto.idPedido,
				idProducto: pedidoProducto.idProducto,
				cantidad: pedidoProducto.cantidad,
				subtotal: pedidoProducto.subtotal,
				personalizado: pedidoProducto.personalizado,
				observacion: pedidoProducto.observacion,
				idEstadoProducto: pedidoProducto.idEstadoProducto,
				phCalidad: phValue,
			};
			this.productoService
				.updatePedidoProducto(productoRequest)
				.subscribe(
					(data: any) => {
						if (data) {
							this.showSuccess(this.successTpl);
							this.getProductosAll();
							this.isLoading = false;
						}
					},
					(error) => {
						console.error(
							'Error al agregar producto al pedido',
							error
						);
						Swal.fire({
							icon: 'error',
							title: 'Oops!',
							text: 'No se pudo agregar el producto al pedido, inténtelo de nuevo.',
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
					this.getProductosAll();
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

	// Check si un idProducto está seleccionado y cumple condiciones según tipoEnvio y pH
	isSeleccionado(
		idProducto: string,
		idPedido: string,
		phCalidad?: number,
		phDefinidoMin?: number,
		phDefinidoMax?: number
	): boolean {
		const seleccionado = this.lstProductosSeleccionados.some(
			(item) =>
				item.idProducto === idProducto && item.idPedido === idPedido
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
		idProducto: string,
		idPedido: string,
		event: Event
	) {
		let checked = (event.target as HTMLInputElement)?.checked;
		if (checked) {
			if (
				!this.lstProductosSeleccionados.some(
					(item) =>
						item.idProducto === idProducto &&
						item.idPedido === idPedido
				)
			) {
				this.lstProductosSeleccionados.push({
					idProducto: idProducto,
					idPedido: idPedido,
				});
			}
		} else {
			this.lstProductosSeleccionados =
				this.lstProductosSeleccionados.filter(
					(item) =>
						item.idProducto !== idProducto ||
						item.idPedido !== idPedido
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
				const ph = p.phCalidad;
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
				const ph = p.phCalidad;
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
				(item) =>
					item.idProducto === p.idProducto &&
					item.idPedido === p.idPedido
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
				const ph = p.phCalidad;
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
				const ph = p.phCalidad;
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

		const idsPagina = productosFiltrados.map((p) => ({
			idProducto: p.idProducto,
			idPedido: p.idPedido,
		}));

		if (checked) {
			idsPagina.forEach(({ idProducto, idPedido }) => {
				if (
					!this.lstProductosSeleccionados.some(
						(item) =>
							item.idProducto === idProducto &&
							item.idPedido === idPedido
					)
				) {
					this.lstProductosSeleccionados.push({
						idProducto,
						idPedido,
					});
				}
			});
		} else {
			this.lstProductosSeleccionados =
				this.lstProductosSeleccionados.filter(
					(item) =>
						!idsPagina.some(
							(p) =>
								p.idProducto === item.idProducto &&
								p.idPedido === item.idPedido
						)
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
			lstProductos +=
				this.lstProductosSeleccionados[i].idProducto + '<br>';
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
					.updateEstadoProductoPedidoMasivo({
						idProductos: this.lstProductosSeleccionados,
						idEstadoProducto: 3, // En producción
						idEstadoPedido: 4, // En producción
						idEstadoPedidoCliente: 3, // En producción
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
								this.getProductosAll();
								this.lstProductosSeleccionados = [];
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
			lstProductos +=
				this.lstProductosSeleccionados[i].idProducto + '<br>';
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
					.updateEstadoProductoPedidoMasivo({
						idProductos: this.lstProductosSeleccionados,
						idEstadoProducto: 5, // En envasado
						idEstadoPedido: 6, // En envasado
						idEstadoPedidoCliente: 3, // En producción
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
								this.getProductosAll();
								this.lstProductosSeleccionados = [];
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
      html: `<p>¿Deseas regresar el producto <strong>${item.idProducto}</strong> a producción?</p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, regresar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.productoService
          .updateEstadoProducto({
            idProducto: item.idProducto,
            idPedido: item.idPedido,
            idEstadoProducto: 3, // En producción
            idEstadoPedido: 4, // En producción
            idEstadoPedidoCliente: 3, // En producción
            idCliente: this.dataService.getLoggedUser().cliente.idCliente,
            accionRealizada: 'Producto regresado a producción',
            observacion: '',
          })
          .subscribe(
            (response) => {
              Swal.fire({
                icon: 'success',
                title: '¡Listo!',
                text: 'Producto regresado a producción correctamente.',
                showConfirmButton: true,
              }).then(() => {
                this.getProductosAll();
                this.lstProductosSeleccionados = [];
              });
            },
            (error) => {
              console.error('Error al regresar producto a producción', error);
              Swal.fire({
                icon: 'error',
                title: 'Oops!',
                text: 'No se pudo regresar el producto a producción, inténtelo de nuevo.',
                showConfirmButton: true,
              });
            }
          );
      }
    });

	}

  enviarEnvasado(item: any) {

    Swal.fire({
      title: '¿Estás seguro?',
      html: `<p>¿Deseas enviar el producto <strong>${item.idProducto}</strong> a envasado?</p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.productoService
          .updateEstadoProducto({
            idProducto: item.idProducto,
            idPedido: item.idPedido,
            idEstadoProducto: 5, // En envasado
            idEstadoPedido: 6, // En envasado
            idEstadoPedidoCliente: 3, // En producción
            idCliente: this.dataService.getLoggedUser().cliente.idCliente,
            accionRealizada: 'Producto enviado a envasado',
            observacion: '',
          })
          .subscribe(
            (response) => {
              Swal.fire({
                icon: 'success',
                title: '¡Listo!',
                text: 'Producto enviado a envasado correctamente.',
                showConfirmButton: true,
              }).then(() => {
                this.getProductosAll();
                this.lstProductosSeleccionados = [];
              });
            },
            (error) => {
              console.error('Error al enviar producto a envasado', error);
              Swal.fire({
                icon: 'error',
                title: 'Oops!',
                text: 'No se pudo enviar el producto a envasado, inténtelo de nuevo.',
                showConfirmButton: true,
              });
            }
          );
      }
    });

		
	}
}
