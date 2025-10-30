import { Component, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { PedidoService } from '../../../services/pedido.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
	NgbTypeaheadModule,
	NgbPaginationModule,
	NgbTooltipModule,
	NgbModal,
} from '@ng-bootstrap/ng-bootstrap';
import { PedidoAuditoriaService } from '../../../services/pedido-auditoria.service';
import { DataService } from '../../../services/data.service';
import { ProductoService } from '../../../services/producto.service';
import { ToastService } from '../../../services/toast.service';
import { ToastsContainer } from '../../../shared/components/toasts-container/toasts-container.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PagoPedidoService } from '../../../services/pago-pedido.service';

@Component({
	selector: 'app-bandeja-pedidos-administrador',
	standalone: true,
	imports: [FormsModule, NgbTypeaheadModule, NgbPaginationModule, NgbTooltipModule, CommonModule, ToastsContainer],
	templateUrl: './bandeja-pedidos-administrador.component.html',
	styleUrl: './bandeja-pedidos-administrador.component.scss',
})
export class BandejaPedidosAdministradorComponent implements OnInit {
	@ViewChild('successTpl', { static: false }) successTpl!: TemplateRef<any>;
	toastService = inject(ToastService);
	
	pedidos: any[] = [];
	pedidosTable: any[] = [];
	page = 1;
	pageSize = 5;
	collectionSize = this.pedidos.length;

	lstPedidosSeleccionados: string[] = [];

	// Propiedades para el modal de comprobante de pago
	pedidoSeleccionado: any = null;
	urlComprobanteValida: boolean = false;
	urlComprobanteSanitizada: SafeResourceUrl | null = null;
	loadingPDF: { [key: string]: boolean } = {};

	constructor(
		private pedidoService: PedidoService,
		private pedidoAuditoriaService: PedidoAuditoriaService,
		public router: Router,
		private dataService: DataService,
		private productoService: ProductoService,
		private modalService: NgbModal,
		private sanitizer: DomSanitizer,
		private pagoPedidoService: PagoPedidoService
	) {}

	ngOnInit(): void {
		this.cargarPedidos();
	}

	cargarPedidos(): void {
		this.pedidoService.getPedidosCompleto().subscribe(
			(pedidos) => {
				this.pedidosTable = pedidos;
				this.collectionSize = this.pedidosTable.length;
				this.refreshPedidos();
			},
			(error) => console.error('Error al cargar pedidos', error)
		);
	}

	refreshPedidos() {
		this.pedidos = this.pedidosTable
			.map((pedido, i) => ({ id: i + 1, ...pedido }))
			.slice(
				(this.page - 1) * this.pageSize,
				(this.page - 1) * this.pageSize + this.pageSize
			);
	}

	showSuccess(template: TemplateRef<any>) {
		this.toastService.show({
			template,
			classname: 'bg-success text-light',
			delay: 3000,
		});
	}

	editarFechaEstimadaEntrega(pedido: any, $event: any): void {
		//const nuevaFecha = prompt('Ingrese la nueva fecha estimada de entrega (YYYY-MM-DD):', pedido.fechaEstimadaEntrega);
		if ($event) {
			const nuevaFecha = $event.target.value;
			this.pedidoService.updateFechaEstimadaEntrega(pedido.idPedido, nuevaFecha).subscribe(
				() => {
					console.log('Fecha actualizada');
					pedido.fechaEstimadaEntrega = nuevaFecha;
					this.showSuccess(this.successTpl);
					this.cargarPedidos();
				},
				(error: any) => console.error('Error al actualizar fecha', error)
			);
		}
	}

	borrarPedido(idPedido: string): void {

		Swal.fire({
			title: '¿Estás seguro?',
			text: `¿Deseas eliminar el pedido "${idPedido}"? Esta acción no se puede deshacer.`,
			icon: 'question',
			showCancelButton: true,
			confirmButtonText: 'Sí, eliminar',
			cancelButtonText: 'Cancelar',
		}).then((result) => {
			if (result.isConfirmed) {
				this.pedidoService.deletePedido(idPedido).subscribe({
					next: (response) => {
						Swal.fire({
							icon: 'success',
							title: '¡Listo!',
							text: 'El pedido ha sido eliminado correctamente.',
							showConfirmButton: true,
						}).then(() => {
							this.cargarPedidos();
						});
					},
					error: (error) => {
						console.error('Error al eliminar el pedido', error);
						Swal.fire({
							icon: 'error',
							title: 'Oops!',
							text: 'No se pudo eliminar el pedido, inténtelo de nuevo.',
							showConfirmButton: true,
						});
					},
				});
			}
		});
	}

	// Check si un pedido está seleccionado
	isSeleccionado(idPedido: string): boolean {
		return this.lstPedidosSeleccionados.includes(idPedido);
	}

	// Cambiar selección individual
	toggleSeleccionIndividual(idPedido: string, event: Event) {
		let checked = (event.target as HTMLInputElement)?.checked;
		if (checked) {
			if (!this.lstPedidosSeleccionados.includes(idPedido)) {
				this.lstPedidosSeleccionados.push(idPedido);
			}
		} else {
			this.lstPedidosSeleccionados = this.lstPedidosSeleccionados.filter(
				(id) => id !== idPedido
			);
		}
	}

	// Check si todos los pedidos en la página están seleccionados
	isTodosSeleccionadosPagina(): boolean {
		return (
			this.pedidos
				.filter((p) => p.estadoPedido?.idEstadoPedido === 2)
				.every((p) =>
					this.lstPedidosSeleccionados.includes(p.idPedido)
				) &&
			this.pedidos.filter((p) => p.estadoPedido?.idEstadoPedido === 2)
				.length > 0 &&
			this.pedidos
				.filter((p) => p.estadoPedido?.idEstadoPedido === 2)
				.every((p) =>
					this.lstPedidosSeleccionados.includes(p.idPedido)
				) &&
			this.pedidos.filter((p) => p.estadoPedido?.idEstadoPedido === 2)
				.length ===
				this.pedidos.filter((p) =>
					this.lstPedidosSeleccionados.includes(p.idPedido)
				).length
		);
	}

	// Cambiar selección masiva en la página actual
	toggleSeleccionTodosPagina(event: Event) {
		let checked = (event.target as HTMLInputElement)?.checked;
		const idsPagina = this.pedidos
			.filter((p) => p.estadoPedido?.idEstadoPedido === 2)
			.map((p) => p.idPedido);
		if (checked) {
			idsPagina.forEach((id) => {
				if (!this.lstPedidosSeleccionados.includes(id)) {
					this.lstPedidosSeleccionados.push(id);
				}
			});
		} else {
			this.lstPedidosSeleccionados = this.lstPedidosSeleccionados.filter(
				(id) => !idsPagina.includes(id)
			);
		}
	}

	enviarProduccionSingle(item: any) {
		Swal.fire({
			title: '¿Estás seguro?',
			text: `¿Deseas enviar el pedido "${item.idPedido}" a producción?`,
			icon: 'question',
			showCancelButton: true,
			confirmButtonText: 'Sí, enviar',
			cancelButtonText: 'Cancelar',
		}).then((result) => {
			if (result.isConfirmed) {
				this.pedidoService
					.updateEstadoPedido(item.idPedido, 3)
					.subscribe({
						next: (response) => {
							Swal.fire({
								icon: 'success',
								title: '¡Listo!',
								text: `El pedido "${item.idPedido}" ha sido enviado a producción.`,
								showConfirmButton: true,
							}).then(() => {
								this.pedidoService
									.updateEstadoProductoByPedido(
										item.idPedido,
										2
									)
									.subscribe();
								this.pedidoAuditoriaService
									.saveAuditoria({
										idPedido: item.idPedido,
										fecha: new Date(),
										idEstadoPedido: 3,
										accionRealizada:
											'Pedido enviado a producción (En cola)',
										idCliente:
											this.dataService.getLoggedUser()
												.cliente.idCliente,
										observacion: '',
									})
									.subscribe(() => {
										console.log('Auditoría guardada');
										this.cargarPedidos();
									});
							});
						},
						error: (error) => {
							console.error(
								'Error al enviar a producción',
								error
							);
							Swal.fire({
								icon: 'error',
								title: 'Oops!',
								text: `No se pudo enviar el pedido "${item.idPedido}" a producción, inténtelo de nuevo.`,
								showConfirmButton: true,
							});
						},
					});
			}
		});
	}

	enviarProduccionMasivo() {
		let lstPedidos = '';
		for (let i = 0; i < this.lstPedidosSeleccionados.length; i++) {
			lstPedidos += this.lstPedidosSeleccionados[i] + '<br>';
		}

		Swal.fire({
			title: '¿Estás seguro?',
			html: `<p>¿Deseas enviar los pedidos seleccionados a producción?</p>
      <p>Pedidos seleccionados:</p>
      <div style="max-height: 200px; overflow-y: auto;">${lstPedidos}</div>`,
			icon: 'question',
			showCancelButton: true,
			confirmButtonText: 'Sí, enviar',
			cancelButtonText: 'Cancelar',
		}).then((result) => {
			if (result.isConfirmed) {
				let json = {
					idPedidos: this.lstPedidosSeleccionados,
					idEstadoPedido: 3,
					idEstadoProducto: 2,
					idCliente:
						this.dataService.getLoggedUser().cliente.idCliente,
					accionRealizada: 'Pedido enviado a producción',
					observacion: '',
				};
				this.pedidoService.updateEstadoPedidoMasivo(json).subscribe({
					next: (response) => {
						if (response && response.idResultado == 1) {
							Swal.fire({
								icon: 'success',
								title: '¡Listo!',
								text: 'Los pedidos han sido enviados a producción correctamente.',
								showConfirmButton: true,
							}).then(() => {
								this.cargarPedidos();
								this.lstPedidosSeleccionados = []; // Limpiar selección
							});
						} else {
							Swal.fire({
								icon: 'error',
								title: 'Oops!',
								text: 'No se pudieron enviar los pedidos a producción, inténtelo de nuevo.',
								showConfirmButton: true,
							});
						}
					},
					error: (error) => {
						console.error('Error al enviar a producción', error);
						Swal.fire({
							icon: 'error',
							title: 'Oops!',
							text: 'No se pudieron enviar los pedidos a producción, inténtelo de nuevo.',
							showConfirmButton: true,
						});
					},
				});
			}
		});
	}

	// Métodos para manejo del comprobante de pago
	tieneComprobantePago(item: any): boolean {
		return !!(
			item &&
			item.pagoPedido &&
			item.pagoPedido.urlArchivo &&
			item.pagoPedido.urlArchivo.trim() !== ''
		);
	}

	verComprobantePago(item: any, content: TemplateRef<any>) {
		if (!this.tieneComprobantePago(item)) {
			Swal.fire({
				icon: 'warning',
				title: 'Sin comprobante',
				text: 'Este pedido no tiene un comprobante de pago disponible.',
				showConfirmButton: true,
			});
			return;
		}

		this.pedidoSeleccionado = item;
		this.urlComprobanteValida = false;
		this.urlComprobanteSanitizada = null;

		// Validar y procesar la URL
		const urlArchivo = item.pagoPedido.urlArchivo;
		
		try {
			// Verificar si es una URL válida
			const url = new URL(urlArchivo);
			
			// Verificar si es de Google Drive y convertir a URL de vista previa
			if (this.esUrlDrive(urlArchivo)) {
				const urlVistaPrevia = this.convertirAUrlVistaPreviaDrive(urlArchivo);
				if (urlVistaPrevia) {
					this.urlComprobanteSanitizada = this.sanitizer.bypassSecurityTrustResourceUrl(urlVistaPrevia);
					this.urlComprobanteValida = true;
				}
			} else {
				// Para otras URLs, intentar mostrar directamente
				this.urlComprobanteSanitizada = this.sanitizer.bypassSecurityTrustResourceUrl(urlArchivo);
				this.urlComprobanteValida = true;
			}
		} catch (error) {
			console.error('URL inválida:', error);
			this.urlComprobanteValida = false;
		}

		// Abrir modal
		this.modalService.open(content, { size: 'xl', centered: true });
	}

	private esUrlDrive(url: string): boolean {
		return url.includes('drive.google.com') || url.includes('docs.google.com');
	}

	private convertirAUrlVistaPreviaDrive(url: string): string | null {
		try {
			// Extraer el ID del archivo de diferentes formatos de URL de Drive
			let fileId: string | null = null;
			
			// Formato: https://drive.google.com/file/d/FILE_ID/view
			const matchView = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
			if (matchView) {
				fileId = matchView[1];
			}
			
			// Formato: https://drive.google.com/open?id=FILE_ID
			const matchOpen = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
			if (matchOpen) {
				fileId = matchOpen[1];
			}
			
			// Si se encontró el ID, crear URL de vista previa
			if (fileId) {
				return `https://drive.google.com/file/d/${fileId}/preview`;
			}
			
			return null;
		} catch (error) {
			console.error('Error al convertir URL de Drive:', error);
			return null;
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
						
						// Verificar que los items existan y que haya al menos uno
						if (!items || items.length === 0) {
							this.loadingPDF[idPedido] = false;
							Swal.fire({
								icon: 'warning',
								title: 'Pedido sin productos',
								text: 'Este pedido no tiene productos seleccionados. No se puede generar la hoja de pedido.',
								showConfirmButton: true,
							});
							return;
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

		// Obtener el costo de delivery desde la nueva estructura o la antigua para compatibilidad
		const costoDelivery = this.obtenerCostoDelivery(pedido);
		
		// Calcular subtotal (total menos delivery si aplica)
		const subtotal = pedido.aplicaDelivery ? (pedido.montoTotal - costoDelivery) : pedido.montoTotal;
		
		// Agregar fila de subtotal de productos
		itemsHTML += `
			<tr>
				<td colspan="2" style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">Subtotal Productos:</td>
				<td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">S/ ${subtotal.toFixed(2)}</td>
			</tr>
		`;
		
		// Agregar fila de delivery si aplica
		if (pedido.aplicaDelivery && costoDelivery > 0) {
			itemsHTML += `
				<tr>
					<td colspan="2" style="padding: 8px; border: 1px solid #ddd; text-align: right;">Costo de Delivery:</td>
					<td style="padding: 8px; border: 1px solid #ddd; text-align: right;">S/ ${costoDelivery.toFixed(2)}</td>
				</tr>
			`;
		}
		
		// Agregar fila de total final
		itemsHTML += `
			<tr style="background-color: #e3f2fd;">
				<td colspan="2" style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold; font-size: 14px;">TOTAL PEDIDO:</td>
				<td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold; font-size: 14px;">S/ ${pedido.montoTotal.toFixed(2)}</td>
			</tr>
		`;

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

					${pedido.aplicaDelivery ? `
					<div class="section">
						<div class="section-title">Información de Delivery:</div>
						<div style="margin-left: 15px;">
							<strong>Costo:</strong> S/ ${this.obtenerCostoDelivery(pedido).toFixed(2)}<br>
							<strong>Método de cálculo:</strong> ${pedido.metodoCalculoDelivery || 'No especificado'}<br>
							${this.obtenerDescripcionTarifaDelivery(pedido) ? `<strong>Tarifa aplicada:</strong> ${this.obtenerDescripcionTarifaDelivery(pedido)}<br>` : ''}
							${pedido.notaDelivery ? `<strong>Nota:</strong> ${pedido.notaDelivery}<br>` : ''}
						</div>
					</div>
					` : ''}

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

	completarPagoParcial(pedido: any): void {
		// Calcular el monto faltante (diferencia entre el total y el primer pago parcial)
		const montoPagado = pedido.pagoPedido?.montoPago || 0;
		const montoFaltante = pedido.montoTotal - montoPagado;
		
		Swal.fire({
			title: 'Completar Pago Parcial',
			html: `
				<p>¿Deseas completar el pago parcial del pedido <strong>${pedido.idPedido}</strong>?</p>
				<div class="mt-3">
					<p><strong>Cliente:</strong> ${pedido.cliente.nombres} ${pedido.cliente.apellidos}</p>
					<p><strong>Monto Total:</strong> S/ ${pedido.montoTotal.toFixed(2)}</p>
					<p><strong>Monto ya pagado:</strong> S/ ${montoPagado.toFixed(2)}</p>
					<p><strong>Monto a completar:</strong> <span class="text-danger fw-bold">S/ ${montoFaltante.toFixed(2)}</span></p>
				</div>
			`,
			icon: 'question',
			showCancelButton: true,
			confirmButtonText: 'Sí, completar pago',
			cancelButtonText: 'Cancelar',
			confirmButtonColor: '#28a745',
			cancelButtonColor: '#6c757d'
		}).then((result) => {
			if (result.isConfirmed) {
				// Mostrar loading
				Swal.fire({
					title: 'Procesando...',
					text: 'Completando el pago parcial',
					allowOutsideClick: false,
					didOpen: () => {
						Swal.showLoading();
					}
				});

				this.pagoPedidoService.completarPagoParcial(pedido.idPedido, montoFaltante).subscribe({
					next: (response) => {
						if (response.success) {
							Swal.fire({
								icon: 'success',
								title: '¡Pago Completado!',
								html: `
									<p>El pago parcial ha sido completado exitosamente.</p>
									<div class="mt-3">
										<p><strong>Pedido:</strong> ${pedido.idPedido}</p>
										<p><strong>Monto Total:</strong> S/ ${response.montoTotal.toFixed(2)}</p>
										<p><strong>Monto Pagado:</strong> S/ ${response.montoPagado.toFixed(2)}</p>
										<p><strong>Estado:</strong> <span class="text-success fw-bold">Pago Completo</span></p>
									</div>
								`,
								showConfirmButton: true,
								confirmButtonText: 'Aceptar'
							}).then(() => {
								// Recargar la lista de pedidos
								this.cargarPedidos();
							});
						} else {
							Swal.fire({
								icon: 'error',
								title: 'Error',
								text: response.message || 'No se pudo completar el pago parcial',
								showConfirmButton: true
							});
						}
					},
					error: (error) => {
						console.error('Error al completar pago parcial:', error);
						let errorMessage = 'No se pudo completar el pago parcial. Inténtelo de nuevo.';
						
						if (error.error && error.error.message) {
							errorMessage = error.error.message;
						}

						Swal.fire({
							icon: 'error',
							title: 'Error',
							html: `
								<p>${errorMessage}</p>
								${error.error && error.error.montoRequerido ? `
									<div class="mt-3">
										<p><strong>Monto requerido:</strong> S/ ${error.error.montoRequerido.toFixed(2)}</p>
										<p><strong>Monto restante:</strong> S/ ${error.error.montoRestante.toFixed(2)}</p>
									</div>
								` : ''}
							`,
							showConfirmButton: true
						});
					}
				});
			}
		});
	}

	/**
	 * Obtiene el costo de delivery desde la nueva estructura o la antigua para compatibilidad
	 */
	private obtenerCostoDelivery(pedido: any): number {
		// Primero intentar obtener desde la nueva estructura tarifaDelivery
		if (pedido.tarifaDelivery?.precio) {
			return pedido.tarifaDelivery.precio;
		}
		
		// Fallback a la estructura antigua costoDelivery
		return pedido.costoDelivery || 0;
	}

	/**
	 * Obtiene la descripción de la tarifa de delivery aplicada
	 */
	private obtenerDescripcionTarifaDelivery(pedido: any): string {
		// Primero intentar obtener desde la nueva estructura tarifaDelivery
		if (pedido.tarifaDelivery) {
			if (pedido.tarifaDelivery.tipoReglaDescripcion) {
				return pedido.tarifaDelivery.tipoReglaDescripcion;
			}
			if (pedido.tarifaDelivery.descripcion) {
				return pedido.tarifaDelivery.descripcion;
			}
			if (pedido.tarifaDelivery.ubicacionCompleta) {
				return `${pedido.tarifaDelivery.tipoRegla || 'Regla'}: ${pedido.tarifaDelivery.ubicacionCompleta}`;
			}
		}
		
		// Fallback a la estructura antigua tarifarioDelivery
		if (pedido.tarifarioDelivery?.descripcionCondicion) {
			return pedido.tarifarioDelivery.descripcionCondicion;
		}
		
		return 'Tarifa estándar';
	}
}
