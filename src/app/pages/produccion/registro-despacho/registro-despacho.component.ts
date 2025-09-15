import {
	Component,
	inject,
	OnInit,
	TemplateRef,
	ViewChild,
} from '@angular/core';
import {
	NgbModal,
	NgbPaginationModule,
	NgbTypeaheadModule,
} from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { DataService } from '../../../services/data.service';
import { PedidoService } from '../../../services/pedido.service';
import { ProductoService } from '../../../services/producto.service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-registro-despacho',
	standalone: true,
	imports: [FormsModule, NgbTypeaheadModule, NgbPaginationModule],
	templateUrl: './registro-despacho.component.html',
	styleUrl: './registro-despacho.component.scss',
})
export class RegistroDespachoComponent implements OnInit {
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

	tipoEnvio = 0;

	codigoProductoValidar = '';

	idPedido: string | null = null;
	tipoPedidoActual: string = ''; // Para almacenar el tipo de pedido actual

	private routeSubscription: Subscription | null = null;

	constructor(
		private pedidoService: PedidoService,
		private productoService: ProductoService,
		private dataService: DataService,
		private route: ActivatedRoute,
		public router: Router
	) {}

	ngOnInit(): void {
		this.routeSubscription = this.route.paramMap.subscribe((params) => {
			this.idPedido = params.get('idPedido');
			if (this.idPedido) {
				this.cargarDatosPedido(this.idPedido);
			}
		});
	}

	// Método para cargar datos según el tipo de pedido (dual-mode support)
	cargarDatosPedido(idPedido: string): void {
		this.pedidoService.getPedidoById(idPedido).subscribe({
			next: (pedido) => {
				console.log('Datos del pedido obtenidos:', pedido);
				this.tipoPedidoActual = pedido.tipoPedido; // Almacenar el tipo de pedido
				// Verificar el tipo de pedido para determinar qué endpoint usar
				if (pedido.tipoPedido === 'PREPARADO_MAGISTRAL') {
					// Para preparados magistrales
					this.getPreparadosMagistralesDespacho(idPedido);
				} else {
					// Para productos regulares (tipoPedido === 'PRODUCTO' o cualquier otro valor)
					this.getProductosAll(idPedido);
				}
			},
			error: (error) => {
				console.error('Error al obtener datos del pedido:', error);
				Swal.fire({
					icon: 'error',
					title: 'Error',
					text: 'No se pudieron cargar los datos del pedido.',
					showConfirmButton: true,
				});
			}
		});
	}

	getPreparadosMagistralesDespacho(idPedido: string): void {
		this.pedidoService.getPreparadosMagistralesByIdPedido(idPedido).subscribe(
			(preparados) => {
				console.log('Preparados magistrales obtenidos:', preparados);
				// Formatear items para compatibilidad con la interfaz existente
				this.productosTable = preparados.map(item => this.formatearItem(item));
				this.collectionSize = this.productosTable.length;
				this.refreshProductos();
			},
			(error) => {
				console.error('Error al obtener preparados magistrales', error);
				Swal.fire({
					icon: 'error',
					title: 'Oops!',
					text: 'No se pudieron cargar los preparados magistrales, inténtelo de nuevo.',
					showConfirmButton: true,
				});
			}
		);
	}

	// Helper para formatear items y asegurar compatibilidad entre respuestas
	formatearItem(item: any): any {
		return {
			...item,
			// Mapear campos de preparados magistrales a estructura esperada por la interfaz
			idProducto: item.idPreparadoMagistral, // Usar idPreparadoMagistral como idProducto
			nombreProducto: item.nombre, // Usar el campo nombre directamente
			descripcion: item.descripcion,
			presentacion: item.presentacion,
			tipoPresentacion: item.tipoPresentacion,
			precio: item.precio,
			cantidad: item.cantidad,
			subtotal: item.subtotal,
			idEstadoProducto: item.idEstadoProducto,
			estadoProducto: item.estadoProducto,
			idEstadoPedido: item.idEstadoPedido,
			estadoPedido: item.estadoPedido,
			observacion: item.observacion,
			tipoItem: 'PREPARADO_MAGISTRAL' // Identificador para preparados magistrales
		};
	}

	getProductosAll(idPedido: string): void {
		this.pedidoService.getProductosDespachoPorIdPedido(idPedido).subscribe(
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

	openModal(content: TemplateRef<any>) {
		//this.modalService.dismissAll(); // Cierra cualquier modal abierto antes de abrir uno nuevo
		this.modalService.open(content, {
			backdrop: 'static',
			keyboard: false,
		});
	}

	idPedidoValidar: string = '';
	idProductoValidar: string = '';
	openModalValidar(content: TemplateRef<any>, item: any) {
		this.modalService.dismissAll(); // Cierra cualquier modal abierto antes de abrir uno nuevo
		this.modalService.open(content, {
			backdrop: 'static',
			keyboard: false,
		});
		this.idPedidoValidar = item.idPedido;
		this.idProductoValidar = item.idProducto;
	}

	openModalXL(content: TemplateRef<any>) {
		this.modalService.open(content, { size: 'xl' });
	}

	idProductoValidado: string = '';
	nombreProductoValidado: string = '';
	descripcionProductoValidado: string = '';
	presentacionProductoValidado: string = '';

	@ViewChild('datosProductoValidar', { static: true })
	datosProductoValidar!: TemplateRef<any>;

  @ViewChild('validarProductosModal', { static: true })
  validarProductosModal!: TemplateRef<any>;

  openModalValidarProductos() {
    if (this.lstProductosSeleccionados.length === 0) {
      Swal.fire({
        title: '¡Oops!',
        text: 'No hay productos seleccionados para validar.',
        icon: 'warning',
      });
      return;
    }
    
    this.modalService.dismissAll(); // Cierra cualquier modal abierto antes de abrir uno nuevo
    this.modalService.open(this.validarProductosModal, {
      backdrop: 'static',
      keyboard: false
    });
  }

  isAllProductosSeleccionadosValidated = false;
  confirmarValidacion() {
    if (!this.idProductoValidado) {
      Swal.fire({
        icon: 'warning',
        title: '¡Atención!',
        text: 'Por favor, seleccione un producto para validar.',
        showConfirmButton: true,
      });
      return;
    }

    const index = this.lstProductosSeleccionados.findIndex(
      (item) => item.idProducto === this.idProductoValidado
    );
    if (index !== -1) {
      this.lstProductosSeleccionados[index].isValidado = true;
    }
    if (
      this.lstProductosSeleccionados.every((item) => item.isValidado)
    ) {
      this.isAllProductosSeleccionadosValidated = true;
    }

  }

  resetearValidaciones() {
    // Resetear todas las validaciones individuales
    this.lstProductosSeleccionados.forEach(item => {
      item.isValidado = false;
    });
    
    // Resetear el estado de validación completa
    this.isAllProductosSeleccionadosValidated = false;
    
    // Limpiar los datos del producto validado
    this.idProductoValidado = '';
    this.nombreProductoValidado = '';
    this.descripcionProductoValidado = '';
    this.presentacionProductoValidado = '';
    
    console.log('Validaciones reseteadas');
  }

	validarProducto() {
		if (!this.codigoProductoValidar) {
			Swal.fire({
				icon: 'warning',
				title: '¡Atención!',
				text: 'Por favor, ingrese un código de producto válido.',
				showConfirmButton: true,
			});
			return;
		}
		this.codigoProductoValidar = this.codigoProductoValidar.trim();

		// Verificar si es un pedido de preparados magistrales o productos regulares
		if (this.tipoPedidoActual === 'PREPARADO_MAGISTRAL') {
			// Validar preparado magistral
			this.validarPreparadoMagistral();
		} else {
			// Validar producto regular
			this.validarProductoRegular();
		}
	}

	validarProductoRegular() {
		this.productoService
			.getProductoById(this.codigoProductoValidar)
			.subscribe(
				(producto) => {
					if (producto) {
						this.idProductoValidado = producto.idProducto;
						this.nombreProductoValidado = producto.productoMaestro.nombre;
						this.descripcionProductoValidado = producto.productoMaestro.descripcion;
						this.presentacionProductoValidado =
							producto.presentacion + ' ' + producto.tipoPresentacion.descripcion;

            const productoSeleccionado = this.lstProductosSeleccionados.find(
              (item) => item.idProducto === this.idProductoValidado
            );
            if (!productoSeleccionado) {
              Swal.fire({
                icon: 'warning',
                title: '¡Atención!',
                text: `El código ingresado no corresponde a ningún producto seleccionado. Por favor, verifique el código.`,
                showConfirmButton: true,
              });
              return;
            }
            this.codigoProductoValidar = '';
						this.openModal(this.datosProductoValidar);
					} else {
						Swal.fire({
							icon: 'error',
							title: 'Producto no encontrado',
							text: 'No se encontró ningún producto con ese código.',
							showConfirmButton: true,
						});
					}
				},
				(error) => {
					console.error('Error al buscar el producto', error);
					Swal.fire({
						icon: 'error',
						title: 'Oops!',
						text: 'No se pudo buscar el producto, inténtelo de nuevo.',
						showConfirmButton: true,
					});
				}
			);
	}

	validarPreparadoMagistral() {
		// Llamar al endpoint para obtener el preparado magistral
		this.pedidoService.getPreparadoMagistralById(this.codigoProductoValidar)
			.subscribe(
				(preparado) => {
					if (preparado) {
						this.idProductoValidado = preparado.idPreparadoMagistral;
						this.nombreProductoValidado = preparado.nombre;
						this.descripcionProductoValidado = preparado.descripcion;
						this.presentacionProductoValidado = 
							preparado.presentacion + ' ' + preparado.tipoPresentacion.descripcion;

						const preparadoSeleccionado = this.lstProductosSeleccionados.find(
							(item) => item.idProducto === this.idProductoValidado
						);
						if (!preparadoSeleccionado) {
							Swal.fire({
								icon: 'warning',
								title: '¡Atención!',
								text: `El código ingresado no corresponde a ningún preparado magistral seleccionado. Por favor, verifique el código.`,
								showConfirmButton: true,
							});
							return;
						}
						this.codigoProductoValidar = '';
						this.openModal(this.datosProductoValidar);
					} else {
						Swal.fire({
							icon: 'error',
							title: 'Preparado magistral no encontrado',
							text: 'No se encontró ningún preparado magistral con ese código.',
							showConfirmButton: true,
						});
					}
				},
				(error) => {
					console.error('Error al buscar el preparado magistral', error);
					Swal.fire({
						icon: 'error',
						title: 'Oops!',
						text: 'No se pudo buscar el preparado magistral, inténtelo de nuevo.',
						showConfirmButton: true,
					});
				}
			);
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
					this.cargarDatosPedido(this.idPedido!);
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
	isSeleccionado(idProducto: string, idPedido: string): boolean {
		return this.lstProductosSeleccionados.some(
			(item) =>
				item.idProducto === idProducto && item.idPedido === idPedido
		);
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
          isValidado: false, // Agregar campo isValidado
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

	// Check si todos los productos en la página están seleccionados (solo por idProducto y idPedido)
  isTodosSeleccionadosPagina(): boolean {
    if (this.productos.length === 0) return false;
    // Solo considerar productos que tengan idEstadoProducto == 7 (igual que toggleSeleccionTodosPagina)
    const productosFiltrados = this.productos.filter((p) => p.idEstadoProducto === 7);
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
    const checked = (event.target as HTMLInputElement)?.checked;

    // Selecciona/deselecciona productos de la página actual que SÓLO tengan idEstadoProducto == 7
    const idsPagina = this.productos
      .filter((p) => p.idEstadoProducto === 7)
      .map((p) => ({
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
            isValidado: false, // Agregar campo isValidado
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
				text: 'No hay productos seleccionados para validar.',
				showConfirmButton: true,
			});
			return;
		}
		if (this.tipoEnvio === 0) {
			this.validarProductosMasivo();
		}
	}

	validarProductosMasivo() {
		let lstProductos = '';
		for (let i = 0; i < this.lstProductosSeleccionados.length; i++) {
			lstProductos +=
				this.lstProductosSeleccionados[i].idProducto + '<br>';
		}

    this.modalService.dismissAll(); // Cierra cualquier modal abierto antes de validar

		const tituloConfirmacion = this.tipoPedidoActual === 'PREPARADO_MAGISTRAL' 
			? '¿Deseas validar los siguientes preparados magistrales en despacho?'
			: '¿Deseas validar los siguientes productos en despacho?';

		Swal.fire({
			title: '¿Estás seguro?',
			html: `<p>${tituloConfirmacion}</p>
          <p>Productos seleccionados:</p>
          <div style="max-height: 200px; overflow-y: auto;">${lstProductos}</div>`,
			icon: 'question',
			showCancelButton: true,
			confirmButtonText: 'Sí, validar',
			cancelButtonText: 'Cancelar',
		}).then((result) => {
			if (result.isConfirmed) {
				if (this.tipoPedidoActual === 'PREPARADO_MAGISTRAL') {
					this.validarPreparadosMagistralesMasivo();
				} else {
					this.validarProductosRegularesMasivo();
				}
			}
		});
	}

	validarProductosRegularesMasivo() {
		this.productoService
			.updateEstadoProductoPedidoMasivo({
				idProductos: this.lstProductosSeleccionados,
				idEstadoProducto: 8, // Validado
				idEstadoPedido: 9, // Validado
				idEstadoPedidoCliente: 4, // En despacho
				idCliente:
					this.dataService.getLoggedUser().cliente.idCliente,
				accionRealizada: 'Productos validados en despacho',
				observacion: '',
			})
			.subscribe(
				(response) => {
					Swal.fire({
						icon: 'success',
						title: '¡Listo!',
						text: 'Productos validados correctamente.',
						showConfirmButton: true,
					}).then(() => {
						this.cargarDatosPedido(this.idPedido!);
						this.lstProductosSeleccionados = [];
						this.resetearValidaciones(); // Resetear validaciones después del éxito
						this.modalService.dismissAll(); // Cerrar el modal
					});
				},
				(error) => {
					console.error(
						'Error al validar productos en despacho',
						error
					);
					Swal.fire({
						icon: 'error',
						title: 'Oops!',
						text: 'No se pudo validar los productos en despacho, inténtelo de nuevo.',
						showConfirmButton: true,
					});
				}
			);
	}

	validarPreparadosMagistralesMasivo() {
		// Formatear los datos para el endpoint de preparados magistrales
		const idPreparadosMagistrales = this.lstProductosSeleccionados.map(item => ({
			idPedido: item.idPedido,
			idPreparadoMagistral: item.idProducto // El idProducto contiene el idPreparadoMagistral
		}));

		this.productoService
			.updateEstadoPreparadoMagistralMasivo({
				idPreparadosMagistrales: idPreparadosMagistrales,
				idEstadoProducto: 8, // Validado
				idEstadoPedido: 9, // Validado
				idEstadoPedidoCliente: 4, // En despacho
				idCliente:
					this.dataService.getLoggedUser().cliente.idCliente,
				accionRealizada: 'Preparados magistrales validados en despacho',
				observacion: '',
			})
			.subscribe(
				(response) => {
					Swal.fire({
						icon: 'success',
						title: '¡Listo!',
						text: 'Preparados magistrales validados correctamente.',
						showConfirmButton: true,
					}).then(() => {
						this.cargarDatosPedido(this.idPedido!);
						this.lstProductosSeleccionados = [];
					});
				},
				(error) => {
					console.error(
						'Error al validar preparados magistrales en despacho',
						error
					);
					Swal.fire({
						icon: 'error',
						title: 'Oops!',
						text: 'No se pudo validar los preparados magistrales en despacho, inténtelo de nuevo.',
						showConfirmButton: true,
					});
				}
			);
	}

	enviarDespacho(item: any) {
		this.modalService.dismissAll(); // Cierra cualquier modal abierto antes de enviar

		const esPreparadoMagistral = item.tipoItem === 'PREPARADO_MAGISTRAL';
		const tipoElemento = esPreparadoMagistral ? 'preparado magistral' : 'producto';

		Swal.fire({
			title: '¿Estás seguro?',
			html: `<p>¿Deseas enviar el ${tipoElemento} <strong>${item.idProducto}</strong> a despacho?</p>`,
			icon: 'question',
			showCancelButton: true,
			confirmButtonText: 'Sí, enviar',
			cancelButtonText: 'Cancelar',
		}).then((result) => {
			if (result.isConfirmed) {
				if (esPreparadoMagistral) {
					this.enviarPreparadoMagistralDespacho(item);
				} else {
					this.enviarProductoRegularDespacho(item);
				}
			}
		});
	}

	enviarProductoRegularDespacho(item: any) {
		this.productoService
			.updateEstadoProducto({
				idProducto: item.idProducto,
				idPedido: item.idPedido,
				idEstadoProducto: 7, // En despacho
				idEstadoPedido: 8, // En despacho
				idEstadoPedidoCliente: 4, // En despacho
				idCliente:
					this.dataService.getLoggedUser().cliente.idCliente,
				accionRealizada: 'Producto enviado a despacho',
				observacion: '',
			})
			.subscribe(
				(response) => {
					Swal.fire({
						icon: 'success',
						title: '¡Listo!',
						text: 'Producto enviado a despacho correctamente.',
						showConfirmButton: true,
					}).then(() => {
						this.cargarDatosPedido(this.idPedido!);
						this.lstProductosSeleccionados = [];
					});
				},
				(error) => {
					console.error(
						'Error al enviar producto a despacho',
						error
					);
					Swal.fire({
						icon: 'error',
						title: 'Oops!',
						text: 'No se pudo enviar el producto a despacho, inténtelo de nuevo.',
						showConfirmButton: true,
					});
				}
			);
	}

	enviarPreparadoMagistralDespacho(item: any) {
		this.productoService
			.updateEstadoPreparadoMagistralSingle({
				idPedido: item.idPedido,
				idPreparadoMagistral: item.idProducto, // El idProducto contiene el idPreparadoMagistral
				idEstadoProducto: 7, // En despacho
				idEstadoPedido: 8, // En despacho
				idEstadoPedidoCliente: 4, // En despacho
				idCliente:
					this.dataService.getLoggedUser().cliente.idCliente,
				accionRealizada: 'Preparado magistral enviado a despacho',
				observacion: '',
			})
			.subscribe(
				(response) => {
					Swal.fire({
						icon: 'success',
						title: '¡Listo!',
						text: 'Preparado magistral enviado a despacho correctamente.',
						showConfirmButton: true,
					}).then(() => {
						this.cargarDatosPedido(this.idPedido!);
						this.lstProductosSeleccionados = [];
					});
				},
				(error) => {
					console.error(
						'Error al enviar preparado magistral a despacho',
						error
					);
					Swal.fire({
						icon: 'error',
						title: 'Oops!',
						text: 'No se pudo enviar el preparado magistral a despacho, inténtelo de nuevo.',
						showConfirmButton: true,
					});
				}
			);
	}
}
