import { Component, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { PedidoService } from '../../../services/pedido.service';
import { FormsModule } from '@angular/forms';
import {
	NgbTypeaheadModule,
	NgbPaginationModule,
} from '@ng-bootstrap/ng-bootstrap';
import {
	ModalDismissReasons,
	NgbDatepickerModule,
	NgbModal,
} from '@ng-bootstrap/ng-bootstrap';
import { PedidoAuditoriaService } from '../../../services/pedido-auditoria.service';
import Swal from 'sweetalert2';
import { DataService } from '../../../services/data.service';
import { ProductoService } from '../../../services/producto.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Define ProcedimientoProducto type with all required properties for the form
type ProcedimientoProducto = {
	producto?: string;
	elementosSeguridadPersonal?: string;
	utillaje?: string;
	controlCalidad?: string;
	tipoEnvase?: string;
	colorEtiqueta?: string;
	indicacionesPosologia?: string;
	conservacion?: string;
	reaccionesAdversas?: string;
	precaucionesContraindicaciones?: string;
	observaciones?: string;
	bibliografia?: string;
	ingredientes?: { nombre: string; cantidad: number }[];
	procedimientos?: { orden: number; descripcion: string }[];
};

@Component({
	selector: 'app-bandeja-produccion',
	standalone: true,
	imports: [CommonModule, FormsModule, NgbTypeaheadModule, NgbPaginationModule],
	templateUrl: './bandeja-produccion.component.html',
	styleUrl: './bandeja-produccion.component.scss',
})
export class BandejaProduccionComponent implements OnInit {
	productos: any[] = [];
	productosTable: any[] = [];
	page = 1;
	pageSize = 5;
	collectionSize = this.productos.length;
	lstProductosSeleccionados: any[] = [];

	private modalService = inject(NgbModal);
	closeResult = '';

	tipoEnvio = 0; // 0: En cola -> En produccion, 1: En producción -> En calidad

	// procedimientoData: ProcedimientoProducto = {
	// 	producto: 'Jabón Pre peeling de glicólico 10%',
	// 	elementosSeguridadPersonal: 'Guantes, Mascarilla, Gafas de seguridad',
	// 	utillaje: 'Vaso medidor, Espátula, Balanza de precisión, Recipiente de vidrio',
	// 	controlCalidad: 'Verificar pH (4.0-5.0), aspecto homogéneo, ausencia de partículas',
	// 	tipoEnvase: 'Envase plástico opaco de 250 ml con dispensador',
	// 	colorEtiqueta: 'Blanco con detalles azules',
	// 	indicacionesPosologia: 'Aplicar sobre la piel húmeda, masajear suavemente y enjuagar. Usar 1 vez al día antes del procedimiento de peeling.',
	// 	conservacion: 'Mantener en lugar fresco, seco y protegido de la luz directa.',
	// 	reaccionesAdversas: 'Irritación, enrojecimiento, sensación de ardor leve',
	// 	precaucionesContraindicaciones: 'No aplicar sobre piel lesionada o irritada. Evitar contacto con ojos y mucosas. No usar en menores de 12 años.',
	// 	observaciones: 'Realizar prueba de sensibilidad antes de uso. Uso exclusivo profesional.',
	// 	bibliografia: 'Manual de Formulación Cosmética 2023, Farmacopea Europea, OMS',
	// 	ingredientes: [
	// 		{ nombre: 'Ácido glicólico', cantidad: 10 },
	// 		{ nombre: 'Base syndet', cantidad: 200 },
	// 		{ nombre: 'Glicerina', cantidad: 20 },
	// 		{ nombre: 'Agua purificada', cantidad: 15 },
	// 		{ nombre: 'Conservante', cantidad: 2 },
	// 		{ nombre: 'Fragancia hipoalergénica', cantidad: 1 }
	// 	],
	// 	procedimientos: [
	// 		{ orden: 1, descripcion: 'Pesar y medir todos los ingredientes.' },
	// 		{ orden: 2, descripcion: 'Disolver el ácido glicólico en agua purificada.' },
	// 		{ orden: 3, descripcion: 'Añadir la glicerina y mezclar hasta homogeneizar.' },
	// 		{ orden: 4, descripcion: 'Incorporar la base syndet y mezclar suavemente.' },
	// 		{ orden: 5, descripcion: 'Agregar el conservante y la fragancia.' },
	// 		{ orden: 6, descripcion: 'Verificar pH y ajustar si es necesario.' },
	// 		{ orden: 7, descripcion: 'Envasar en el envase final y etiquetar.' }
	// 	]
	// }

	procedimientoData: any;

	constructor(
		private pedidoService: PedidoService,
		private pedidoAuditoriaService: PedidoAuditoriaService,
		private dataService: DataService,
		private productoService: ProductoService,
		public router: Router
	) {}

	ngOnInit(): void {
		this.getProductosAll();
	}

	getProductosAll(): void {
		this.productoService.getBandejaProduccion().subscribe(
			(productos) => {
				console.log('Productos obtenidos:', productos);
				this.productosTable = productos;
				this.collectionSize = this.productosTable.length;
				this.refreshProductos();
			},
			(error) => {
				console.error('Error al obtener productos', error);
			}
		);
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

	refreshProductos(): void {
		this.productos = this.productosTable
			.map((producto, i) => ({ id: i + 1, ...producto }))
			.slice(
				(this.page - 1) * this.pageSize,
				(this.page - 1) * this.pageSize + this.pageSize
			);
	}

	idPedidoNota: string | null = null;
	idProductoNota: string | null = null;
	openModalNota(item: any, content: TemplateRef<any>) {
		this.modalService.open(content, { size: 'lg' });
		this.observacion = item.observacion;
		this.idPedidoNota = item.idPedido;
		this.idProductoNota = item.idProducto;
	}

	openModalXL(content: TemplateRef<any>) {
		this.modalService.open(content, { size: 'xl' });
	}


	recibirProducto(item: any) {

		Swal.fire({
			icon: 'question',
			title: '¿Estás seguro?',
			text: `¿Deseas recibir el producto "${item.idProducto}" en producción?`,
			showConfirmButton: true,
			showCancelButton: true,
			cancelButtonText: 'Cancelar',
			confirmButtonText: 'Sí, recibir',
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
						accionRealizada: 'Producto recibido en producción',
						observacion: '',
					})
					.subscribe(
						(response) => {
							Swal.fire({
								icon: 'success',
								title: '¡Listo!',
								text: 'Producto recibido en producción correctamente.',
								showConfirmButton: true,
							}).then(() => {
								this.getProductosAll();
								this.lstProductosSeleccionados = [];
							});
						},
						(error) => {
							console.error('Error al recibir producto en producción', error);
							Swal.fire({
								icon: 'error',
								title: 'Oops!',
								text: 'No se pudo recibir el producto en producción, inténtelo de nuevo.',
								showConfirmButton: true,
							});
						}
					);
			}
		});
	}

	observacion = '';

	saveObservacion(): void {
		this.pedidoService
			.saveObservacionPedido({
				idPedido: this.idPedidoNota,
				idProducto: this.idProductoNota,
				observacion: this.observacion,
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
					this.observacion = '';
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

	enviarCalidad(item: any) {
		Swal.fire({
			icon: 'question',
			title: '¿Estás seguro?',
			text: `¿Deseas enviar el producto "${item.idProducto}" a calidad?`,
			showConfirmButton: true,
			showCancelButton: true,
			cancelButtonText: 'Cancelar',
			confirmButtonText: 'Sí, enviar',
		}).then((result) => {
			if (result.isConfirmed) {
				this.productoService
					.updateEstadoProducto({
						idProducto: item.idProducto,
						idPedido: item.idPedido,
						idEstadoProducto: 4, // En calidad
						idEstadoPedido: 5, // En calidad
						idEstadoPedidoCliente: 3, // En producción
						idCliente: this.dataService.getLoggedUser().cliente.idCliente,
						accionRealizada: 'Producto enviado a calidad',
						observacion: '',
					})
					.subscribe(
						(response) => {
							Swal.fire({
								icon: 'success',
								title: '¡Listo!',
								text: 'Producto enviado a calidad correctamente.',
								showConfirmButton: true,
							}).then(() => {
								this.getProductosAll();
								this.lstProductosSeleccionados = [];
							});
						},
						(error) => {
							console.error('Error al enviar producto a calidad', error);
							Swal.fire({
								icon: 'error',
								title: 'Oops!',
								text: 'No se pudo enviar el producto a calidad, inténtelo de nuevo.',
								showConfirmButton: true,
							});
						}
					);
			}
		});
	}

	isCheckboxDisabled(): boolean {
		if (!Array.isArray(this.productos)) return false;
		return (
			(this.tipoEnvio === 0 &&
				this.productos.some(
					(p) => p && p.estadoPedido === 'En producción'
				)) ||
			(this.tipoEnvio === 1 &&
				this.productos.some((p) => p && p.estadoPedido === 'En cola'))
		);
	}

	// Check si un idProducto está seleccionado
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
		// Determinar el estado a filtrar según tipoEnvio
		const estadoFiltrar =
			this.tipoEnvio === 0 ? 'En cola' : 'En producción';
		const productosPagina = this.productos.filter(
			(p) => p.estadoPedido === estadoFiltrar
		);
		if (productosPagina.length === 0) return false;
		return productosPagina.every((p) =>
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
		// Determinar el estado a filtrar según tipoEnvio
		let estadoFiltrar = this.tipoEnvio === 0 ? 'En cola' : 'En producción';
		const idsPagina = this.productos
			.filter((p) => p.estadoPedido === estadoFiltrar)
			.map((p) => ({ idProducto: p.idProducto, idPedido: p.idPedido }));
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
			this.recibirProduccionMasivo();
		} else if (this.tipoEnvio === 1) {
			this.enviarCalidadMasivo();
		}
	}

	//En cola -> En produccion
	recibirProduccionMasivo() {
		let lstProductos = '';
		for (let i = 0; i < this.lstProductosSeleccionados.length; i++) {
			lstProductos +=
				this.lstProductosSeleccionados[i].idProducto + '<br>';
		}

		Swal.fire({
			title: '¿Estás seguro?',
			html: `<p>¿Deseas recibir los productos seleccionados en producción?</p>
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
						accionRealizada: 'Productos recibidos en producción',
						observacion: '',
					})
					.subscribe(
						(response) => {
							Swal.fire({
								icon: 'success',
								title: '¡Listo!',
								text: 'Productos recibidos en producción correctamente.',
								showConfirmButton: true,
							}).then(() => {
								this.getProductosAll();
								this.lstProductosSeleccionados = [];
							});
						},
						(error) => {
							console.error(
								'Error al enviar productos a producción',
								error
							);
							Swal.fire({
								icon: 'error',
								title: 'Oops!',
								text: 'No se pudo enviar los productos a producción, inténtelo de nuevo.',
								showConfirmButton: true,
							});
						}
					);
			}
		});
	}

	enviarCalidadMasivo() {
		let lstProductos = '';
		for (let i = 0; i < this.lstProductosSeleccionados.length; i++) {
			lstProductos +=
				this.lstProductosSeleccionados[i].idProducto + '<br>';
		}

		Swal.fire({
			title: '¿Estás seguro?',
			html: `<p>¿Deseas enviar los productos seleccionados a calidad?</p>
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
						idEstadoProducto: 4, // En calidad
						idEstadoPedido: 5, // En calidad
						idEstadoPedidoCliente: 3, // En producción
						idCliente:
							this.dataService.getLoggedUser().cliente.idCliente,
						accionRealizada: 'Productos enviados a calidad',
						observacion: '',
					})
					.subscribe(
						(response) => {
							Swal.fire({
								icon: 'success',
								title: '¡Listo!',
								text: 'Productos enviados a calidad correctamente.',
								showConfirmButton: true,
							}).then(() => {
								this.getProductosAll();
								this.lstProductosSeleccionados = [];
							});
						},
						(error) => {
							console.error(
								'Error al enviar productos a calidad',
								error
							);
							Swal.fire({
								icon: 'error',
								title: 'Oops!',
								text: 'No se pudo enviar los productos a calidad, inténtelo de nuevo.',
								showConfirmButton: true,
							});
						}
					);
			}
		});
	}
}
