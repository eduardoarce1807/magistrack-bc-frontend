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
} from '@ng-bootstrap/ng-bootstrap';
import JsBarcode from 'jsbarcode';
import Swal from 'sweetalert2';
import { DataService } from '../../../services/data.service';
import { PedidoService } from '../../../services/pedido.service';
import { ProductoService } from '../../../services/producto.service';
import { PedidoAuditoriaService } from '../../../services/pedido-auditoria.service';
import { Router } from '@angular/router';

interface ClienteSeleccionado {
	metodoEntrega: string;
	direccion: string;
	distrito: string;
	provincia: string;
	departamento: string;
}

@Component({
	selector: 'app-bandeja-despacho',
	standalone: true,
	imports: [FormsModule, NgbTypeaheadModule, NgbPaginationModule],
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
	idProductoNota: string | null = null;
	observacionNota: string = '';

	tipoEnvio = 0;

	constructor(
		private pedidoService: PedidoService,
		private productoService: ProductoService,
		private dataService: DataService,
		private pedidoAuditoriaService: PedidoAuditoriaService,
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
		this.observacionNota = item.observacion;
		this.idPedidoNota = item.idPedido;
		this.idProductoNota = item.idProducto;
	}

	openModalXL(content: TemplateRef<any>) {
		this.modalService.open(content, { size: 'xl' });
	}

	clienteSeleccionado: ClienteSeleccionado = {
		metodoEntrega: '',
		direccion: '',
		distrito: '',
		provincia: '',
		departamento: '',
	};
	openModalDatosCliente(content: TemplateRef<any>, item: any) {
		this.pedidoService.getPedidoById(item.idPedido).subscribe((pedido) => {
			console.log('Pedido obtenido:', pedido);
			this.clienteSeleccionado.metodoEntrega =
				pedido.metodoEntrega.descripcion;
			this.clienteSeleccionado.direccion = pedido.direccion.direccion;
			this.clienteSeleccionado.distrito = pedido.direccion.distrito;
			this.clienteSeleccionado.provincia = pedido.direccion.provincia;
			this.clienteSeleccionado.departamento =
				pedido.direccion.departamento;
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
					this.getPedidosAll();
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
}
