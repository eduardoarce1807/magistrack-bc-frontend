import { Component, OnInit } from '@angular/core';
import { PedidoService } from '../../../services/pedido.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
	NgbTypeaheadModule,
	NgbPaginationModule,
} from '@ng-bootstrap/ng-bootstrap';
import { PedidoAuditoriaService } from '../../../services/pedido-auditoria.service';
import { DataService } from '../../../services/data.service';
import { ProductoService } from '../../../services/producto.service';

@Component({
	selector: 'app-bandeja-pedidos-administrador',
	standalone: true,
	imports: [FormsModule, NgbTypeaheadModule, NgbPaginationModule, CommonModule],
	templateUrl: './bandeja-pedidos-administrador.component.html',
	styleUrl: './bandeja-pedidos-administrador.component.scss',
})
export class BandejaPedidosAdministradorComponent implements OnInit {
	pedidos: any[] = [];
	pedidosTable: any[] = [];
	page = 1;
	pageSize = 5;
	collectionSize = this.pedidos.length;

	lstPedidosSeleccionados: string[] = [];

	constructor(
		private pedidoService: PedidoService,
		private pedidoAuditoriaService: PedidoAuditoriaService,
		public router: Router,
		private dataService: DataService,
		private productoService: ProductoService
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

	editarFechaEstimadaEntrega(pedido: any, $event: any): void {
		//const nuevaFecha = prompt('Ingrese la nueva fecha estimada de entrega (YYYY-MM-DD):', pedido.fechaEstimadaEntrega);
		if ($event) {
			pedido.fechaEstimadaEntrega = $event.target.value;
			this.pedidoService.updatePedido(pedido).subscribe(
				() => {
					console.log('Fecha actualizada');
					this.cargarPedidos();
				},
				(error) => console.error('Error al actualizar fecha', error)
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
}
