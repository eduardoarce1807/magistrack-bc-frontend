import {
	Component,
	inject,
	OnInit,
	TemplateRef,
	ViewChild,
	ChangeDetectorRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
	NgbTypeaheadModule,
	NgbPaginationModule,
	NgbModal,
	NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
import JsBarcode from 'jsbarcode';
import Swal from 'sweetalert2';
import { DataService } from '../../../services/data.service';
import { PedidoService } from '../../../services/pedido.service';
import { ProductoService } from '../../../services/producto.service';
import { PedidoAuditoriaService } from '../../../services/pedido-auditoria.service';
import { Router } from '@angular/router';
import { DocumentoService } from '../../../services/documento.service';
import { DireccionService } from '../../../services/direccion.service';
import { UbigeoService } from '../../../services/ubigeo.service';
import { CommonModule } from '@angular/common';

interface ClienteSeleccionado {
	metodoEntrega: string;
	direccion: string | null;
	distrito: string | null;
	provincia: string | null;
	departamento: string | null;
	tipoPedido: string | null;
	tieneDelivery: boolean;
	nombres: string;
	apellidos: string;
	correo: string;
	telefono: string;
}

@Component({
	selector: 'app-bandeja-despacho',
	standalone: true,
	imports: [FormsModule, NgbTypeaheadModule, NgbPaginationModule, NgbTooltipModule, CommonModule],
	templateUrl: './bandeja-despacho.component.html',
	styleUrl: './bandeja-despacho.component.scss',
})
export class BandejaDespachoComponent implements OnInit {
	pedidos: any[] = [];
	pedidosTable: any[] = [];
	page = 1;
	pageSize = 5;
	collectionSize = this.pedidos.length;
	lstPedidosSeleccionados: any[] = [];
	private modalService = inject(NgbModal);

	idPedidoNota: string | null = null;
	observacionNota: string = '';

	tipoEnvio = 0;
	loadingPDF: { [key: string]: boolean } = {};

	constructor(
		private pedidoService: PedidoService,
		private productoService: ProductoService,
		private dataService: DataService,
		private pedidoAuditoriaService: PedidoAuditoriaService,
		private documentoService: DocumentoService,
		private direccionService: DireccionService,
		private ubigeoService: UbigeoService,
		private cdr: ChangeDetectorRef,
    public router: Router
	) {}

	ngOnInit(): void {
		this.getPedidosAll();
	}

	getPedidosAll(): void {
		this.pedidoService.getPedidosDespacho().subscribe(
			(pedidos) => {
				console.log('Pedidos obtenidos:', pedidos);
				this.pedidosTable = pedidos;
				this.collectionSize = this.pedidosTable.length;
				this.refreshPedidos();
			},
			(error) => {
				console.error('Error al obtener pedidos', error);
				Swal.fire({
					icon: 'error',
					title: 'Oops!',
					text: 'No se pudieron cargar los pedidos, inténtelo de nuevo.',
					showConfirmButton: true,
				});
			}
		);
	}

	openModalNota(item: any, content: TemplateRef<any>) {
		this.modalService.open(content, { size: 'lg' });
		this.observacionNota = item.observaciones || '';
		this.idPedidoNota = item.idPedido;
	}

	openModalXL(content: TemplateRef<any>) {
		this.modalService.open(content, { size: 'xl' });
	}

	clienteSeleccionado: ClienteSeleccionado = {
		metodoEntrega: '',
		direccion: null,
		distrito: null,
		provincia: null,
		departamento: null,
		tipoPedido: null,
		tieneDelivery: false,
		nombres: '',
		apellidos: '',
		correo: '',
		telefono: '',
	};
	openModalDatosCliente(content: TemplateRef<any>, item: any) {
		this.pedidoService.getPedidoById(item.idPedido).subscribe({
			next: (pedido) => {
				console.log('Pedido obtenido:', pedido);
				
				// Datos del cliente
				this.clienteSeleccionado.nombres = pedido.cliente?.nombres || 'No especificado';
				this.clienteSeleccionado.apellidos = pedido.cliente?.apellidos || 'No especificado';
				this.clienteSeleccionado.correo = pedido.cliente?.correo || 'No especificado';
				this.clienteSeleccionado.telefono = pedido.cliente?.telefono || 'No especificado';
				
				// Datos básicos que siempre deberían estar
				this.clienteSeleccionado.metodoEntrega = pedido.metodoEntrega?.descripcion || 'No especificado';
				this.clienteSeleccionado.tipoPedido = pedido.tipoPedido || 'PRODUCTO';
				
				// Verificar si hay dirección y datos relacionados
				if (pedido.direccion) {
					this.clienteSeleccionado.direccion = pedido.direccion.direccion || 'No especificada';
					this.clienteSeleccionado.distrito = pedido.direccion.distrito?.nombre || 'No especificado';
					this.clienteSeleccionado.provincia = pedido.direccion.provincia?.nombre || 'No especificado';
					this.clienteSeleccionado.departamento = pedido.direccion.departamento?.nombre || 'No especificado';
					this.clienteSeleccionado.tieneDelivery = true;
				} else {
					// Si no hay dirección (ej: recojo en tienda, entrega directa)
					this.clienteSeleccionado.direccion = null;
					this.clienteSeleccionado.distrito = null;
					this.clienteSeleccionado.provincia = null;
					this.clienteSeleccionado.departamento = null;
					this.clienteSeleccionado.tieneDelivery = false;
				}
				
				this.modalService.open(content, { backdrop: 'static' });
			},
			error: (error) => {
				console.error('Error al obtener datos del pedido:', error);
				Swal.fire({
					icon: 'error',
					title: 'Error',
					text: 'No se pudieron obtener los datos del pedido.',
					showConfirmButton: true,
				});
			}
		});
	}

	documentoSeleccionado: any = {};
	openModalComprobante(content: TemplateRef<any>, item: any) {
		this.pedidoService.getPedidoById(item.idPedido).subscribe((pedido) => {
			console.log('Pedido obtenido:', pedido);
			
			// Validar si el pedido tiene documento registrado
			if (!pedido.documento) {
				Swal.fire({
					icon: 'warning',
					title: '¡Atención!',
					text: 'El pedido seleccionado no tiene un tipo de comprobante registrado.',
					showConfirmButton: true,
				});
				return;
			}
			
			// Validar si el comprobante ya fue generado
			if (pedido.documento.urlPdf && pedido.documento.urlPdf !== null) {
				Swal.fire({
					icon: 'info',
					title: 'Comprobante ya generado',
					text: 'El comprobante para este pedido ya fue generado.',
					showCancelButton: true,
					confirmButtonText: 'Descargar PDF',
					cancelButtonText: 'Cerrar',
				}).then((result) => {
					if (result.isConfirmed) {
						// Abrir el PDF en una nueva ventana para descarga
						window.open(pedido.documento.urlPdf, '_blank');
					}
				});
				return;
			}
			
			this.documentoSeleccionado.idPedido = pedido.idPedido;
			this.documentoSeleccionado.nombreCliente = pedido.documento.tipoComprobante == "03" ? pedido.documento.nombreCliente : null;
			this.documentoSeleccionado.razonSocial = pedido.documento.tipoComprobante == "01" ? pedido.documento.razonSocialCliente : null;
			this.documentoSeleccionado.numeroDocumentoCliente = pedido.documento.numeroDocumentoCliente;
			this.documentoSeleccionado.tipoComprobante = pedido.documento.tipoComprobante;
			this.documentoSeleccionado.tipoDocumentoCliente = pedido.documento.tipoDocumentoCliente;
			this.documentoSeleccionado.celular = pedido.cliente.telefono;
			this.modalService.open(content, { backdrop: 'static' });
		});
	}

	refreshPedidos(): void {
		this.pedidos = this.pedidosTable
			.map((pedido, i) => ({ id: i + 1, ...pedido }))
			.slice(
				(this.page - 1) * this.pageSize,
				(this.page - 1) * this.pageSize + this.pageSize
			);
	}

	saveObservacion(): void {
		this.pedidoService
			.updateObservacionPedido(this.idPedidoNota!, this.observacionNota)
			.subscribe(
				(response) => {
					Swal.fire({
						icon: 'success',
						title: '¡Listo!',
						text: 'Observación guardada correctamente.',
						showConfirmButton: true,
					});
					this.getPedidosAll();
					this.modalService.dismissAll();
					this.observacionNota = '';
					this.idPedidoNota = null;
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

	// Check si un idPedido está seleccionado
	isSeleccionado(idPedido: string): boolean {
		return this.lstPedidosSeleccionados.some(
			(item) => item === idPedido
		);
	}

	// Cambiar selección individual de pedido
	toggleSeleccionIndividual(idPedido: string, event: Event) {
		const checked = (event.target as HTMLInputElement)?.checked;
		if (checked) {
			if (
				!this.lstPedidosSeleccionados.some(
					(item) => item === idPedido
				)
			) {
				this.lstPedidosSeleccionados.push(idPedido);
			}
		} else {
			this.lstPedidosSeleccionados = this.lstPedidosSeleccionados.filter(
				(item) => item !== idPedido
			);
		}
		console.log('Pedidos seleccionados:', this.lstPedidosSeleccionados);
	}

  // Check si todos los pedidos habilitados (estadoPedido.idEstadoPedido === 9) en la página están seleccionados
  isTodosSeleccionadosPagina(): boolean {
    // Filtrar solo los pedidos habilitados en la página actual
    const pedidosHabilitados = this.pedidos.filter(
      (p) => p.estadoPedido?.idEstadoPedido === 9
    );
    if (pedidosHabilitados.length === 0) return false;
    return pedidosHabilitados.every((p) =>
      this.lstPedidosSeleccionados.some((item) => item === p.idPedido)
    );
  }

	// Cambiar selección masiva de pedidos en la página actual
  toggleSeleccionTodosPagina(event: Event) {
    const checked = (event.target as HTMLInputElement)?.checked;
    // Solo considerar pedidos habilitados (estadoPedido.idEstadoPedido === 9)
    const idsPagina = this.pedidos
      .filter((p) => p.estadoPedido?.idEstadoPedido === 9)
      .map((p) => p.idPedido);

    if (checked) {
      idsPagina.forEach((idPedido) => {
        if (!this.lstPedidosSeleccionados.some((item) => item === idPedido)) {
          this.lstPedidosSeleccionados.push(idPedido);
        }
      });
    } else {
      this.lstPedidosSeleccionados = this.lstPedidosSeleccionados.filter(
        (item) => !idsPagina.some((p) => p === item)
      );
    }
    console.log('Pedidos seleccionados:', this.lstPedidosSeleccionados);
  }

	entregaMasivo() {
		if (this.lstPedidosSeleccionados.length === 0) {
			Swal.fire({
				icon: 'warning',
				title: '¡Atención!',
				text: 'No hay productos seleccionados para confirmar la entrega.',
				showConfirmButton: true,
			});
			return;
		}
		if (this.tipoEnvio === 0) {
			this.confirmarEntregaMasivo();
		}
	}

	confirmarEntrega(item: any) {
		Swal.fire({
			title: '¿Estás seguro?',
			text: `¿Deseas confirmar la entrega del pedido "${item.idPedido}"?`,
			icon: 'question',
			showCancelButton: true,
			confirmButtonText: 'Sí, confirmar',
			cancelButtonText: 'Cancelar',
		}).then((result) => {
			if (result.isConfirmed) {
				this.pedidoService
					.updateEstadoPedido(item.idPedido, 10) // Entregado
					.subscribe({
						next: (response) => {
							Swal.fire({
								icon: 'success',
								title: '¡Listo!',
								text: `El pedido "${item.idPedido}" ha sido entregado.`,
								showConfirmButton: true,
							}).then(() => {
								this.pedidoService
									.updateEstadoProductoByPedido(
										item.idPedido,
										9 // Entregado
									)
									.subscribe();
								this.pedidoService.updateEstadoClientePedido(item.idPedido, 5 // Entregado
								).subscribe();
								this.pedidoAuditoriaService
									.saveAuditoria({
										idPedido: item.idPedido,
										fecha: new Date(),
										idEstadoPedido: 10,
										accionRealizada: 'Pedido entregado',
										idCliente:
											this.dataService.getLoggedUser()
												.cliente.idCliente,
										observacion: '',
									})
									.subscribe(() => {
										console.log('Auditoría guardada');
										this.getPedidosAll();
									});
							});
						},
						error: (error) => {
							console.error(
								'Error al confirmar entrega del pedido',
								error
							);
							Swal.fire({
								icon: 'error',
								title: 'Oops!',
								text: `No se pudo confirmar la entrega del pedido "${item.idPedido}", inténtelo de nuevo.`,
								showConfirmButton: true,
							});
						},
					});
			}
		});
	}

	confirmarEntregaMasivo() {
		let lstPedidos = '';
		for (let i = 0; i < this.lstPedidosSeleccionados.length; i++) {
			lstPedidos += this.lstPedidosSeleccionados[i] + '<br>';
		}

		Swal.fire({
			title: '¿Estás seguro?',
			html: `<p>¿Deseas confirmar la entrega de los pedidos seleccionados?</p>
        <p>Pedidos seleccionados:</p>
        <div style="max-height: 200px; overflow-y: auto;">${lstPedidos}</div>`,
			icon: 'question',
			showCancelButton: true,
			confirmButtonText: 'Sí, confirmar',
			cancelButtonText: 'Cancelar',
		}).then((result) => {
			if (result.isConfirmed) {
				let json = {
					idPedidos: this.lstPedidosSeleccionados,
					idEstadoPedido: 10, // Entregado
					idEstadoProducto: 9, // Entregado
					idCliente:
						this.dataService.getLoggedUser().cliente.idCliente,
					accionRealizada: 'Pedido entregado',
					observacion: '',
				};
				this.pedidoService.updateEstadoPedidoMasivo(json).subscribe({
					next: (response) => {
						if (response && response.idResultado == 1) {
							Swal.fire({
								icon: 'success',
								title: '¡Listo!',
								text: 'Los pedidos han sido entregados correctamente.',
								showConfirmButton: true,
							}).then(() => {
								this.getPedidosAll();
								this.lstPedidosSeleccionados = []; // Limpiar selección
							});
						} else {
							Swal.fire({
								icon: 'error',
								title: 'Oops!',
								text: 'No se pudieron entregar los pedidos, inténtelo de nuevo.',
								showConfirmButton: true,
							});
						}
					},
					error: (error) => {
						console.error(
							'Error al confirmar entrega del pedido',
							error
						);
						Swal.fire({
							icon: 'error',
							title: 'Oops!',
							text: 'No se pudieron confirmar la entrega del pedido, inténtelo de nuevo.',
							showConfirmButton: true,
						});
					},
				});
			}
		});
	}

	// Variables para guía de remisión
	guiaRemisionData: any = {
		tipoDocumentoCliente: '1', // Inicializar con DNI por defecto
		nombreCliente: '',
		razonSocialCliente: ''
	};
	loadingGuiaRemision: { [key: string]: boolean } = {};
	pedidoActual: any = null; // Para almacenar los datos del pedido actual
	
	// Variables para dropdowns de ubicación
	departamentos: any[] = [];
	provinciasPartida: any[] = [];
	provinciasllegada: any[] = [];
	distritosPartida: any[] = [];
	distritosLlegada: any[] = [];
	loadingDirecciones: boolean = false;

	loadingComprobante: boolean = false;
	generarComprobante(idPedido: string ) {
		this.loadingComprobante = true;

		if(this.documentoSeleccionado.tipoComprobante === '01') {
			this.documentoService.generarFactura(idPedido).subscribe({
				next: (data) => {
					this.loadingComprobante = false;
					if(data && data.idResultado && data.idResultado === 1) {
						this.modalService.dismissAll();
						Swal.fire({
							icon: 'success',
							title: '¡Listo!',
							text: data.resultado || 'Comprobante generado correctamente.',
							showConfirmButton: true,
							showCancelButton: true,
							showDenyButton: true,
							confirmButtonText: 'Enviar por WhatsApp',
							denyButtonText: 'Descargar',
							cancelButtonText: 'Cerrar',
						}).then((result) => {
							if (result.isConfirmed) {
								let urlWpp = `https://wa.me/51${this.documentoSeleccionado.celular}?text=Hola, aquí está tu ${this.documentoSeleccionado.tipoComprobante === '01' ? 'Factura' : 'Boleta'}:%0A${data.value}%0ABELLACURET`;
								window.open(urlWpp, '_blank');
							} else if (result.isDenied) {
								window.open(data.value, '_blank');
							}
						});
					}else{
						Swal.fire({
							icon: 'error',
							title: 'Oops!',
							text: data.resultado || 'No se pudo generar el comprobante, inténtelo de nuevo.',
							showConfirmButton: true,
						});
					}
				},
				error: (error) => {
					this.loadingComprobante = false;
					console.error('Error al generar comprobante', error);
					Swal.fire({
						icon: 'error',
						title: 'Oops!',
						text: `No se pudo generar el comprobante, inténtelo de nuevo.`,
						showConfirmButton: true,
					});
				},
			});
		}else if(this.documentoSeleccionado.tipoComprobante === '03') {
			this.documentoService.generarBoleta(idPedido).subscribe({
				next: (data) => {
					this.loadingComprobante = false;
					if(data && data.idResultado && data.idResultado === 1) {
						this.modalService.dismissAll();
						Swal.fire({
							icon: 'success',
							title: '¡Listo!',
							text: data.resultado || 'Comprobante generado correctamente.',
							showConfirmButton: true,
							showCancelButton: true,
							showDenyButton: true,
							confirmButtonText: 'Enviar por WhatsApp',
							denyButtonText: 'Descargar PDF',
							cancelButtonText: 'Cerrar',
						}).then((result) => {
							if (result.isConfirmed) {
								let urlWpp = `https://wa.me/51${this.documentoSeleccionado.celular}?text=Hola, aquí está tu ${this.documentoSeleccionado.tipoComprobante === '01' ? 'Factura' : 'Boleta'}:%0A${data.value}%0ABELLACURET`;
								window.open(urlWpp, '_blank');
							} else if (result.isDenied) {
								window.open(data.value, '_blank');
							}
						});
					}else{
						Swal.fire({
							icon: 'error',
							title: 'Oops!',
							text: data.resultado || 'No se pudo generar el comprobante, inténtelo de nuevo.',
							showConfirmButton: true,
						});
					}
				},
				error: (error) => {
					this.loadingComprobante = false;
					console.error('Error al generar comprobante', error);
					Swal.fire({
						icon: 'error',
						title: 'Oops!',
						text: `No se pudo generar el comprobante, inténtelo de nuevo.`,
						showConfirmButton: true,
					});
				},
			});
		}
	}

	imprimirHojaPedido(idPedido: string): void {
		// Activar estado de carga
		this.loadingPDF[idPedido] = true;
		
		// Primero obtener los datos del pedido para verificar el tipoPedido
		this.pedidoService.getPedidoById(idPedido).subscribe({
			next: (pedido) => {
				console.log('Datos del pedido:', pedido);
				
				// Verificar que los datos del pedido existan
				if (!pedido) {
					throw new Error('No se pudieron obtener los datos del pedido');
				}
				
				// Determinar qué request hacer según el tipoPedido
				let productosRequest;
				if (pedido.tipoPedido === 'PREPARADO_MAGISTRAL') {
					// Para preparados magistrales
					productosRequest = this.pedidoService.getPreparadosMagistralesByIdPedido(idPedido);
				} else {
					// Para productos regulares (tipoPedido === 'PRODUCTO' o cualquier otro valor)
					productosRequest = this.pedidoService.getProductosByPedidoId(idPedido);
				}
				
				// Ejecutar el request correspondiente
				productosRequest.subscribe({
					next: (items) => {
						console.log('Items del pedido:', items);
						
						// Verificar que los items existan
						if (!items) {
							throw new Error('No se pudieron obtener los items del pedido');
						}
						
						// Generar el HTML del PDF
						const htmlContent = this.generarHTMLHojaPedido(pedido, items);
						
						// Crear una ventana para imprimir
						const printWindow = window.open('', '_blank', 'width=800,height=600');
						if (printWindow) {
							printWindow.document.write(htmlContent);
							printWindow.document.close();
							printWindow.focus();
							setTimeout(() => {
								printWindow.print();
								printWindow.close();
								// Desactivar estado de carga después de que se abre la ventana de impresión
								this.loadingPDF[idPedido] = false;
							}, 500);
						} else {
							// Si no se pudo abrir la ventana, desactivar estado de carga
							this.loadingPDF[idPedido] = false;
						}
					},
					error: (error) => {
						console.error('Error al obtener items del pedido:', error);
						// Desactivar estado de carga en caso de error
						this.loadingPDF[idPedido] = false;
						Swal.fire({
							icon: 'error',
							title: 'Error',
							text: 'No se pudieron obtener los items del pedido para generar la hoja.',
							showConfirmButton: true,
						});
					}
				});
			},
			error: (error) => {
				console.error('Error al obtener datos del pedido:', error);
				// Desactivar estado de carga en caso de error
				this.loadingPDF[idPedido] = false;
				Swal.fire({
					icon: 'error',
					title: 'Error',
					text: 'No se pudieron obtener los datos del pedido para generar la hoja.',
					showConfirmButton: true,
				});
			}
		});
	}

	onlyNumbers(event: Event): void {
		const input = event.target as HTMLInputElement;
		input.value = input.value.replace(/[^0-9]/g, '');
		this.documentoSeleccionado.celular = input.value;
	}

	// Métodos para Guía de Remisión
	openModalGuiaRemision(content: TemplateRef<any>, item: any) {
		// Prevenir múltiples clicks mientras se procesa
		if (this.loadingGuiaRemision[item.idPedido]) {
			return;
		}
		
		// Activar loading para deshabilitar el botón
		this.loadingGuiaRemision[item.idPedido] = true;
		
		this.pedidoService.getPedidoById(item.idPedido).subscribe({
			next: (pedido) => {
				console.log('Pedido obtenido para guía:', pedido);
				
				// Almacenar el pedido actual para uso posterior
				this.pedidoActual = pedido;
				
				// Verificar si el método de entrega es Delivery (idMetodoEntrega = 2)
				if (!pedido.metodoEntrega || pedido.metodoEntrega.idMetodoEntrega !== 2) {
					// Restablecer loading antes de mostrar la alerta
					this.loadingGuiaRemision[item.idPedido] = false;
					
					Swal.fire({
						icon: 'warning',
						title: 'Método de entrega no válido',
						text: 'La guía de remisión solo puede generarse para pedidos con método de entrega "Delivery".',
						showConfirmButton: true,
					});
					return;
				}
				
				// Verificar si la guía de remisión ya fue generada
				if (pedido.guiaRemision && pedido.guiaRemision !== null && pedido.guiaRemision.urlPdf && pedido.guiaRemision.urlPdf !== null) {
					// Restablecer loading antes de mostrar la alerta
					this.loadingGuiaRemision[item.idPedido] = false;
					
					Swal.fire({
						icon: 'info',
						title: 'Guía de remisión ya generada',
						text: 'La guía de remisión para este pedido ya fue generada.',
						showCancelButton: true,
						confirmButtonText: 'Descargar PDF',
						cancelButtonText: 'Cerrar',
					}).then((result) => {
						if (result.isConfirmed) {
							// Abrir el PDF en una nueva ventana para descarga
							window.open(pedido.guiaRemision.urlPdf, '_blank');
						}
					});
					return;
				}
				
				// Verificar si es cliente genérico (idCliente = 15)
				const esClienteGenerico = pedido.cliente?.idCliente === 15;
				console.log('Es cliente genérico:', esClienteGenerico, 'Cliente ID:', pedido.cliente?.idCliente);
				console.log('Documento del pedido:', pedido.documento);

				// Obtener datos del cliente según si es genérico o no
				let tipoDocumentoCliente: string;
				let numeroDocumentoCliente: string;
				let nombreClienteInicial = '';
				let razonSocialClienteInicial = '';

				if (esClienteGenerico && pedido.documento) {
					// Cliente genérico: usar datos del documento
					tipoDocumentoCliente = String(pedido.documento.tipoDocumentoCliente || '1');
					numeroDocumentoCliente = pedido.documento.numeroDocumentoCliente || '';
					
					if (tipoDocumentoCliente === '1') {
						// DNI: usar nombreCliente del documento
						nombreClienteInicial = pedido.documento.nombreCliente || '';
					} else if (tipoDocumentoCliente === '6') {
						// RUC: usar razonSocialCliente del documento
						razonSocialClienteInicial = pedido.documento.razonSocialCliente || '';
					}
					
					console.log('Datos desde documento:', {
						tipo: tipoDocumentoCliente,
						numero: numeroDocumentoCliente,
						nombre: nombreClienteInicial,
						razonSocial: razonSocialClienteInicial
					});
				} else {
					// Cliente normal: usar datos del cliente
					tipoDocumentoCliente = String(pedido.cliente?.tipoDocumento?.idTipoDocumento || '1');
					numeroDocumentoCliente = pedido.cliente?.numeroDocumento || '';
					
					const nombreCompleto = (pedido.cliente?.nombres || '').trim() + ' ' + (pedido.cliente?.apellidos || '').trim();
					
					if (tipoDocumentoCliente === '1') {
						nombreClienteInicial = nombreCompleto.trim();
					} else if (tipoDocumentoCliente === '6') {
						razonSocialClienteInicial = nombreCompleto.trim();
					}
					
					console.log('Datos desde cliente normal:', {
						tipo: tipoDocumentoCliente,
						numero: numeroDocumentoCliente,
						nombre: nombreClienteInicial,
						razonSocial: razonSocialClienteInicial
					});
				}

				// Inicializar datos básicos
				this.guiaRemisionData = {
					idPedido: pedido.idPedido,
					tipoDocumentoCliente: tipoDocumentoCliente,
					numeroDocumentoCliente: numeroDocumentoCliente,
					nombreCliente: nombreClienteInicial,
					razonSocialCliente: razonSocialClienteInicial,
					direccionCliente: pedido.direccion?.direccion || '',
					pesoBruto: 1.0,
					unidadMedidaPeso: 'KGM',
					numeroBultos: 1,
					fechaTraslado: new Date().toISOString().split('T')[0], // Fecha actual en formato YYYY-MM-DD
					puntoPartidaDireccion: '',
					ubigeoPartida: '',
					puntoLlegadaDireccion: pedido.direccion?.direccion || '',
					ubigeoLlegada: '',
					motivoTraslado: 'VENTA',
					tipoTransporte: '',
					trasladoVehiculoMenores: false,
					// Campos para transporte privado
					conductorTipoDocumento: '1',
					conductorNumeroDocumento: '',
					conductorNombres: '',
					conductorApellidos: '',
					conductorNumeroLicencia: '',
					vehiculoPlaca: '',
					// Campos para transporte público
					transportistaTipoDocumento: '6',
					transportistaNumeroDocumento: '',
					transportistaRazonSocial: ''
				};

				console.log('Datos inicializados de guía de remisión:', {
					tipoDocumento: this.guiaRemisionData.tipoDocumentoCliente,
					numeroDocumento: this.guiaRemisionData.numeroDocumentoCliente,
					nombreCliente: this.guiaRemisionData.nombreCliente,
					razonSocial: this.guiaRemisionData.razonSocialCliente
				});
				
				// Forzar detección de cambios para actualizar la vista
				this.cdr.detectChanges();
				
				// Cargar departamentos y direcciones por defecto
				this.loadDepartamentos();
				this.loadDireccionPartida();
				this.loadDireccionLlegada(pedido.direccion);
				
				// Restablecer loading después de cargar datos, antes de abrir modal
				this.loadingGuiaRemision[item.idPedido] = false;
				
				// Usar setTimeout para asegurar que los datos estén listos antes de abrir el modal
				setTimeout(() => {
					console.log('Abriendo modal con datos:', this.guiaRemisionData);
					const modalRef = this.modalService.open(content, { 
						backdrop: 'static',
						keyboard: false,
						size: 'xl'
					});
					
					// Manejar cierre del modal para restablecer estado
					modalRef.result.then(
						(result: any) => {
							// Modal cerrado con resultado
							console.log('Modal cerrado con resultado:', result);
						},
						(dismissed: any) => {
							// Modal dismissed/cancelado
							console.log('Modal cerrado/cancelado:', dismissed);
							this.loadingGuiaRemision[item.idPedido] = false;
						}
					);
				}, 100);
			},
			error: (error) => {
				// Restablecer loading en caso de error
				this.loadingGuiaRemision[item.idPedido] = false;
				console.error('Error al obtener datos del pedido:', error);
				Swal.fire({
					icon: 'error',
					title: 'Error',
					text: 'No se pudieron obtener los datos del pedido.',
					showConfirmButton: true,
				});
			}
		});
	}

	onTipoTransporteChange() {
		// Limpiar campos cuando cambia el tipo de transporte
		if (this.guiaRemisionData.tipoTransporte === 'TRANSPORTE_PRIVADO') {
			// Limpiar campos de transporte público
			this.guiaRemisionData.transportistaTipoDocumento = '6';
			this.guiaRemisionData.transportistaNumeroDocumento = '';
			this.guiaRemisionData.transportistaRazonSocial = '';
		} else if (this.guiaRemisionData.tipoTransporte === 'TRANSPORTE_PUBLICO') {
			// Limpiar campos de transporte privado
			this.guiaRemisionData.conductorTipoDocumento = '1';
			this.guiaRemisionData.conductorNumeroDocumento = '';
			this.guiaRemisionData.conductorNombres = '';
			this.guiaRemisionData.conductorApellidos = '';
			this.guiaRemisionData.conductorNumeroLicencia = '';
			this.guiaRemisionData.vehiculoPlaca = '';
		}
	}

	onTipoDocumentoClienteChange(tipoDocumento: string, pedido?: any) {
		console.log('Cambiando tipo documento a:', tipoDocumento, 'Pedido:', pedido);
		
		// Limpiar campos del cliente y número de documento
		this.guiaRemisionData.nombreCliente = '';
		this.guiaRemisionData.razonSocialCliente = '';
		this.guiaRemisionData.numeroDocumentoCliente = '';
		
		// Si hay datos del pedido disponibles, precargar según el tipo de documento
		if (pedido && pedido.cliente) {
			const esClienteGenerico = pedido.cliente.idCliente === 15;
			
			if (esClienteGenerico && pedido.documento) {
				// Cliente genérico: verificar si el tipo coincide con el documento original
				const tipoDocumentoOriginal = String(pedido.documento.tipoDocumentoCliente || '');
				
				console.log('Cliente genérico - Tipo seleccionado:', tipoDocumento, 'Tipo original del documento:', tipoDocumentoOriginal);
				
				if (tipoDocumento === tipoDocumentoOriginal) {
					// Coincide con el tipo original: restaurar datos del documento
					this.guiaRemisionData.numeroDocumentoCliente = pedido.documento.numeroDocumentoCliente || '';
					
					if (tipoDocumento === '1') {
						// DNI - usar nombreCliente del documento
						this.guiaRemisionData.nombreCliente = pedido.documento.nombreCliente || '';
						console.log('Restaurando datos de DNI desde documento:', {
							numero: this.guiaRemisionData.numeroDocumentoCliente,
							nombre: this.guiaRemisionData.nombreCliente
						});
					} else if (tipoDocumento === '6') {
						// RUC - usar razonSocialCliente del documento
						this.guiaRemisionData.razonSocialCliente = pedido.documento.razonSocialCliente || '';
						console.log('Restaurando datos de RUC desde documento:', {
							numero: this.guiaRemisionData.numeroDocumentoCliente,
							razonSocial: this.guiaRemisionData.razonSocialCliente
						});
					}
				} else {
					// No coincide con el tipo original: dejar campos vacíos para edición manual
					console.log('Tipo de documento diferente al original - campos limpiados para edición manual');
				}
			} else {
				// Cliente normal: siempre usar datos del cliente
				this.guiaRemisionData.numeroDocumentoCliente = pedido.cliente?.numeroDocumento || '';
				const nombreCompleto = (pedido.cliente.nombres || '').trim() + ' ' + (pedido.cliente.apellidos || '').trim();
				
				if (tipoDocumento === '1') {
					// DNI - precargar nombre del cliente
					this.guiaRemisionData.nombreCliente = nombreCompleto.trim();
					console.log('Precargando datos de DNI desde cliente normal:', {
						numero: this.guiaRemisionData.numeroDocumentoCliente,
						nombre: this.guiaRemisionData.nombreCliente
					});
				} else if (tipoDocumento === '6') {
					// RUC - precargar razón social
					this.guiaRemisionData.razonSocialCliente = nombreCompleto.trim();
					console.log('Precargando datos de RUC desde cliente normal:', {
						numero: this.guiaRemisionData.numeroDocumentoCliente,
						razonSocial: this.guiaRemisionData.razonSocialCliente
					});
				}
			}
		}
		
		// Forzar detección de cambios
		this.cdr.detectChanges();
	}

	generarGuiaRemision() {
		const idPedido = this.guiaRemisionData.idPedido;
		
		// Deshabilitar el botón inmediatamente para evitar múltiples requests
		if (this.loadingGuiaRemision[idPedido]) {
			return; // Si ya está procesando, no hacer nada
		}
		
		this.loadingGuiaRemision[idPedido] = true;

		// Crear el payload según el tipo de transporte
		let payload = {
			idPedido: this.guiaRemisionData.idPedido,
			tipoDocumentoCliente: this.guiaRemisionData.tipoDocumentoCliente,
			numeroDocumentoCliente: this.guiaRemisionData.numeroDocumentoCliente,
			direccionCliente: this.guiaRemisionData.direccionCliente,
			pesoBruto: this.guiaRemisionData.pesoBruto,
			unidadMedidaPeso: this.guiaRemisionData.unidadMedidaPeso,
			numeroBultos: this.guiaRemisionData.numeroBultos,
			fechaTraslado: this.guiaRemisionData.fechaTraslado,
			puntoPartidaDireccion: this.guiaRemisionData.puntoPartidaDireccion,
			ubigeoPartida: this.guiaRemisionData.ubigeoPartida,
			puntoLlegadaDireccion: this.guiaRemisionData.puntoLlegadaDireccion,
			ubigeoLlegada: this.guiaRemisionData.ubigeoLlegada,
			motivoTraslado: this.guiaRemisionData.motivoTraslado,
			tipoTransporte: this.guiaRemisionData.tipoTransporte,
			trasladoVehiculoMenores: this.guiaRemisionData.trasladoVehiculoMenores
		} as any;

		// Agregar nombre del cliente o razón social según el tipo de documento
		if (this.guiaRemisionData.tipoDocumentoCliente === '1') {
			// DNI - enviar nombreCliente
			payload.nombreCliente = this.guiaRemisionData.nombreCliente;
		} else if (this.guiaRemisionData.tipoDocumentoCliente === '6') {
			// RUC - enviar razonSocialCliente
			payload.razonSocialCliente = this.guiaRemisionData.razonSocialCliente;
		}

		// Agregar campos específicos según el tipo de transporte
		if (this.guiaRemisionData.tipoTransporte === 'TRANSPORTE_PRIVADO') {
			payload = {
				...payload,
				conductorTipoDocumento: this.guiaRemisionData.conductorTipoDocumento,
				conductorNumeroDocumento: this.guiaRemisionData.conductorNumeroDocumento,
				conductorNombres: this.guiaRemisionData.conductorNombres,
				conductorApellidos: this.guiaRemisionData.conductorApellidos,
				conductorNumeroLicencia: this.guiaRemisionData.conductorNumeroLicencia,
				vehiculoPlaca: this.guiaRemisionData.vehiculoPlaca
			};
		} else if (this.guiaRemisionData.tipoTransporte === 'TRANSPORTE_PUBLICO') {
			payload = {
				...payload,
				transportistaNumeroDocumento: this.guiaRemisionData.transportistaNumeroDocumento,
				transportistaRazonSocial: this.guiaRemisionData.transportistaRazonSocial,
				transportistaTipoDocumento: this.guiaRemisionData.transportistaTipoDocumento
			};
		}

		console.log('Payload para guía de remisión:', payload);

		// Hacer el request para crear la guía de remisión
		this.documentoService.crearGuiaRemision(payload).subscribe({
			next: (response: any) => {
				console.log('Respuesta crear guía:', response);
				
				if (response && response.idResultado === 1) {
					// Si se creó correctamente, generar el PDF
					// No restablecer loadingGuiaRemision aquí, se hará en generarPDFGuiaRemision
					this.generarPDFGuiaRemision(this.guiaRemisionData.idPedido);
				} else {
					// Error en la creación - restablecer loading
					this.loadingGuiaRemision[idPedido] = false;
					Swal.fire({
						icon: 'error',
						title: 'Error',
						text: response?.resultado || 'No se pudo crear la guía de remisión.',
						showConfirmButton: true,
					});
				}
			},
			error: (error: any) => {
				this.loadingGuiaRemision[idPedido] = false;
				console.error('Error al crear guía de remisión:', error);
				Swal.fire({
					icon: 'error',
					title: 'Error',
					text: 'No se pudo crear la guía de remisión. Inténtelo de nuevo.',
					showConfirmButton: true,
				});
			}
		});
	}

	private generarPDFGuiaRemision(idPedido: string) {
		this.documentoService.generarPDFGuiaRemision(idPedido).subscribe({
			next: (response: any) => {
				console.log('Respuesta PDF guía:', response);
				// Restablecer el estado de loading
				this.loadingGuiaRemision[idPedido] = false;
				
				if (response && response.idResultado === 1 && response.value) {
					this.modalService.dismissAll();
					
					Swal.fire({
						icon: 'success',
						title: '¡Éxito!',
						text: response.resultado || 'Guía de remisión generada correctamente.',
						showConfirmButton: true,
						showCancelButton: true,
						confirmButtonText: 'Ver/Descargar PDF',
						cancelButtonText: 'Cerrar',
					}).then((result: any) => {
						if (result.isConfirmed) {
							// Abrir el PDF en una nueva ventana
							window.open(response.value, '_blank');
						}
					});
				} else {
					Swal.fire({
						icon: 'error',
						title: 'Error',
						text: response?.resultado || 'No se pudo generar el PDF de la guía de remisión.',
						showConfirmButton: true,
					});
				}
			},
			error: (error: any) => {
				// Restablecer el estado de loading en caso de error
				this.loadingGuiaRemision[idPedido] = false;
				console.error('Error al generar PDF guía:', error);
				Swal.fire({
					icon: 'error',
					title: 'Error',
					text: 'No se pudo generar el PDF de la guía de remisión.',
					showConfirmButton: true,
				});
			}
		});
	}

	// Funciones para manejar los dropdowns de ubicación
	loadDepartamentos() {
		this.loadingDirecciones = true;
		this.ubigeoService.getDepartamentos().subscribe({
			next: (departamentos: any) => {
				this.departamentos = departamentos || [];
				this.loadingDirecciones = false;
			},
			error: (error: any) => {
				console.error('Error al cargar departamentos:', error);
				this.loadingDirecciones = false;
			}
		});
	}

	onDepartamentoPartidaChange(idDepartamento: string) {
		if (!idDepartamento) {
			this.provinciasPartida = [];
			this.distritosPartida = [];
			this.guiaRemisionData.partidaProvincia = '';
			this.guiaRemisionData.partidaDistrito = '';
			this.guiaRemisionData.ubigeoPartida = '';
			return;
		}

		this.ubigeoService.getProvincias(parseInt(idDepartamento)).subscribe({
			next: (provincias: any) => {
				this.provinciasPartida = provincias || [];
				this.distritosPartida = [];
				this.guiaRemisionData.partidaProvincia = '';
				this.guiaRemisionData.partidaDistrito = '';
				this.guiaRemisionData.ubigeoPartida = '';
			},
			error: (error: any) => {
				console.error('Error al cargar provincias:', error);
			}
		});
	}

	onProvinciaPartidaChange(idProvincia: string) {
		if (!idProvincia) {
			this.distritosPartida = [];
			this.guiaRemisionData.partidaDistrito = '';
			this.guiaRemisionData.ubigeoPartida = '';
			return;
		}

		this.ubigeoService.getDistritos(parseInt(idProvincia)).subscribe({
			next: (distritos: any) => {
				this.distritosPartida = distritos || [];
				this.guiaRemisionData.partidaDistrito = '';
				this.guiaRemisionData.ubigeoPartida = '';
			},
			error: (error: any) => {
				console.error('Error al cargar distritos:', error);
			}
		});
	}

	onDistritoPartidaChange(idDistrito: string) {
		if (!idDistrito) {
			this.guiaRemisionData.ubigeoPartida = '';
			return;
		}

		// Buscar el distrito seleccionado para obtener su ubigeo
		const distrito = this.distritosPartida.find(d => d.idDistrito === parseInt(idDistrito));
		if (distrito) {
			this.guiaRemisionData.ubigeoPartida = distrito.ubigeo;
		}
	}

	onDepartamentoLlegadaChange(idDepartamento: string) {
		if (!idDepartamento) {
			this.provinciasllegada = [];
			this.distritosLlegada = [];
			this.guiaRemisionData.llegadaProvincia = '';
			this.guiaRemisionData.llegadaDistrito = '';
			this.guiaRemisionData.ubigeoLlegada = '';
			return;
		}

		this.ubigeoService.getProvincias(parseInt(idDepartamento)).subscribe({
			next: (provincias: any) => {
				this.provinciasllegada = provincias || [];
				this.distritosLlegada = [];
				this.guiaRemisionData.llegadaProvincia = '';
				this.guiaRemisionData.llegadaDistrito = '';
				this.guiaRemisionData.ubigeoLlegada = '';
			},
			error: (error: any) => {
				console.error('Error al cargar provincias:', error);
			}
		});
	}

	onProvinciaLlegadaChange(idProvincia: string) {
		if (!idProvincia) {
			this.distritosLlegada = [];
			this.guiaRemisionData.llegadaDistrito = '';
			this.guiaRemisionData.ubigeoLlegada = '';
			return;
		}

		this.ubigeoService.getDistritos(parseInt(idProvincia)).subscribe({
			next: (distritos: any) => {
				this.distritosLlegada = distritos || [];
				this.guiaRemisionData.llegadaDistrito = '';
				this.guiaRemisionData.ubigeoLlegada = '';
			},
			error: (error: any) => {
				console.error('Error al cargar distritos:', error);
			}
		});
	}

	onDistritoLlegadaChange(idDistrito: string) {
		if (!idDistrito) {
			this.guiaRemisionData.ubigeoLlegada = '';
			return;
		}

		// Buscar el distrito seleccionado para obtener su ubigeo
		const distrito = this.distritosLlegada.find(d => d.idDistrito === parseInt(idDistrito));
		if (distrito) {
			this.guiaRemisionData.ubigeoLlegada = distrito.ubigeo;
		}
	}

	loadDireccionPartida() {
		// Cargar dirección ID 9 como punto de partida por defecto
		this.direccionService.getDireccionById(9).subscribe({
			next: (direccion) => {
				if (direccion) {
					// Primero asignar la dirección
					this.guiaRemisionData.puntoPartidaDireccion = direccion.direccion || '';
					
					// Cargar provincias y distritos correspondientes en cascada
					if (direccion.departamento?.idDepartamento) {
						this.onDepartamentoPartidaChange(direccion.departamento.idDepartamento.toString());
						
						// Esperar a que se carguen las provincias antes de continuar
						setTimeout(() => {
							if (direccion.provincia?.idProvincia) {
								this.onProvinciaPartidaChange(direccion.provincia.idProvincia.toString());
								
								// Esperar más tiempo para que se carguen los distritos antes de asignar valores
								setTimeout(() => {
									// Ahora sí asignar todos los valores después de que estén cargados los dropdowns
									this.guiaRemisionData.partidaDepartamento = direccion.departamento?.idDepartamento?.toString() || '';
									this.guiaRemisionData.partidaProvincia = direccion.provincia?.idProvincia?.toString() || '';
									this.guiaRemisionData.partidaDistrito = direccion.distrito?.idDistrito?.toString() || '';
									this.guiaRemisionData.ubigeoPartida = direccion.distrito?.ubigeoSunat || '';
									
									// Log para debug
									console.log('Valores asignados:', {
										departamento: this.guiaRemisionData.partidaDepartamento,
										provincia: this.guiaRemisionData.partidaProvincia,
										distrito: this.guiaRemisionData.partidaDistrito,
										ubigeo: this.guiaRemisionData.ubigeoPartida
									});
								}, 1000); // Aumentado a 1 segundo
							}
						}, 800); // Aumentado a 800ms
					}
				}
			},
			error: (error: any) => {
				console.error('Error al cargar dirección de partida:', error);
			}
		});
	}

	loadDireccionLlegada(direccion: any) {
		if (direccion) {
			// Primero asignar la dirección de llegada
			this.guiaRemisionData.puntoLlegadaDireccion = direccion.direccion || '';
			
			// Cargar provincias y distritos correspondientes en cascada para llegada
			if (direccion.departamento?.idDepartamento) {
				this.onDepartamentoLlegadaChange(direccion.departamento.idDepartamento.toString());
				
				// Esperar a que se carguen las provincias antes de continuar
				setTimeout(() => {
					if (direccion.provincia?.idProvincia) {
						this.onProvinciaLlegadaChange(direccion.provincia.idProvincia.toString());
						
						// Esperar más tiempo para que se carguen los distritos antes de asignar valores
						setTimeout(() => {
							// Ahora sí asignar todos los valores después de que estén cargados los dropdowns
							this.guiaRemisionData.llegadaDepartamento = direccion.departamento?.idDepartamento?.toString() || '';
							this.guiaRemisionData.llegadaProvincia = direccion.provincia?.idProvincia?.toString() || '';
							this.guiaRemisionData.llegadaDistrito = direccion.distrito?.idDistrito?.toString() || '';
							this.guiaRemisionData.ubigeoLlegada = direccion.distrito?.ubigeoSunat || '';
							
							// Log para debug
							console.log('Valores llegada asignados:', {
								departamento: this.guiaRemisionData.llegadaDepartamento,
								provincia: this.guiaRemisionData.llegadaProvincia,
								distrito: this.guiaRemisionData.llegadaDistrito,
								ubigeo: this.guiaRemisionData.ubigeoLlegada
							});
						}, 1200); // Un poco más de tiempo para evitar conflictos con partida
					}
				}, 1000);
			}
		}
	}

	private generarHTMLHojaPedido(pedido: any, items: any[]): string {
		const fechaPedido = new Date(pedido.fechaPedido).toLocaleDateString('es-PE');
		const esPreparadoMagistral = pedido.tipoPedido === 'PREPARADO_MAGISTRAL';
		
		let itemsHTML = '';
		items.forEach(item => {
			if (esPreparadoMagistral) {
				// Para preparados magistrales
				const precioTotal = item.precio * item.cantidad;
				itemsHTML += `
					<tr>
						<td style="padding: 8px; border: 1px solid #ddd;">${item.nombre} x ${item.cantidad}</td>
						<td style="padding: 8px; border: 1px solid #ddd;">${item.presentacion} ${item.tipoPresentacion}</td>
						<td style="padding: 8px; border: 1px solid #ddd; text-align: right;">S/ ${precioTotal.toFixed(2)}</td>
					</tr>
				`;
			} else {
				// Para productos regulares
				const precioTotal = item.precio * item.cantidad;
				itemsHTML += `
					<tr>
						<td style="padding: 8px; border: 1px solid #ddd;">${item.nombre} x ${item.cantidad}</td>
						<td style="padding: 8px; border: 1px solid #ddd;">${item.presentacion} ${item.tipoPresentacion}</td>
						<td style="padding: 8px; border: 1px solid #ddd; text-align: right;">S/ ${precioTotal.toFixed(2)}</td>
					</tr>
				`;
			}
		});

		const tipoItemTexto = esPreparadoMagistral ? 'PREPARADOS MAGISTRALES' : 'PRODUCTOS';

		return `
			<html>
				<head>
					<title>Hoja de Pedido - ${pedido.idPedido}</title>
					<style>
						body { 
							font-family: Arial, sans-serif; 
							margin: 20px; 
							font-size: 12px;
						}
						.header {
							text-align: center;
							margin-bottom: 20px;
							border-bottom: 2px solid #333;
							padding-bottom: 10px;
						}
						.section {
							margin-bottom: 15px;
						}
						.section-title {
							font-weight: bold;
							margin-bottom: 5px;
							color: #333;
						}
						table {
							width: 100%;
							border-collapse: collapse;
							margin-top: 10px;
						}
						th {
							background-color: #f5f5f5;
							padding: 8px;
							border: 1px solid #ddd;
							font-weight: bold;
						}
						td {
							padding: 8px;
							border: 1px solid #ddd;
						}
						.total {
							font-weight: bold;
							font-size: 14px;
							text-align: right;
							margin-top: 10px;
						}
						.tipo-pedido {
							background-color: ${esPreparadoMagistral ? '#e3f2fd' : '#f3e5f5'};
							padding: 5px 10px;
							border-radius: 5px;
							display: inline-block;
							font-weight: bold;
							color: ${esPreparadoMagistral ? '#1976d2' : '#7b1fa2'};
						}
						@media print {
							body { margin: 0; }
						}
					</style>
				</head>
				<body>
					<div class="header">
						<h1>HOJA DE PEDIDO</h1>
						<h2>${pedido.idPedido}</h2>
						<div class="tipo-pedido">${pedido.tipoPedido || 'PRODUCTO'}</div>
					</div>

					<div class="section">
						<div class="section-title">Cliente:</div>
						${pedido.cliente?.nombres || ''} ${pedido.cliente?.apellidos || ''}
					</div>

					<div class="section">
						<div class="section-title">DNI:</div>
						${pedido.cliente?.numeroDocumento || 'No especificado'}
					</div>

					<div class="section">
						<div class="section-title">Correo:</div>
						${pedido.cliente?.correo || 'No especificado'}
					</div>

					<div class="section">
						<div class="section-title">Número de pedido:</div>
						${pedido.idPedido}
					</div>

					<div class="section">
						<div class="section-title">Fecha:</div>
						${fechaPedido}
					</div>

					<div class="section">
						<div class="section-title">Total:</div>
						S/ ${pedido.montoTotal.toFixed(2)}
					</div>

					<div class="section">
						<div class="section-title">Método de pago:</div>
						${pedido.tipoPago?.descripcion || 'No especificado'}
					</div>

					<div class="section">
						<div class="section-title">Método de entrega:</div>
						${pedido.metodoEntrega?.descripcion || 'No especificado'}
					</div>

					<div class="section">
						<div class="section-title">Dirección:</div>
						${pedido.direccion?.direccion || 'No especificada'} - ${pedido.direccion?.distrito?.nombre || ''} - ${pedido.direccion?.provincia?.nombre || ''} - ${pedido.direccion?.departamento?.nombre || ''}
					</div>

					<div class="section">
						<div class="section-title">DETALLES DEL PEDIDO - ${tipoItemTexto}</div>
						<table>
							<thead>
								<tr>
									<th>${esPreparadoMagistral ? 'Preparado Magistral' : 'Producto'}</th>
									<th>Presentación</th>
									<th>Precio</th>
								</tr>
							</thead>
							<tbody>
								${itemsHTML}
							</tbody>
						</table>
					</div>

					<div class="total">
						TOTAL: S/ ${pedido.montoTotal.toFixed(2)}
					</div>
				</body>
			</html>
		`;
	}
}
