import { Component, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { PedidoService } from '../../../services/pedido.service';
import { FormsModule } from '@angular/forms';
import {
	NgbTypeaheadModule,
	NgbPaginationModule,
	NgbTooltipModule,
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
import { KardexService } from '../../../services/inventario/kardex.service';
import { kardexModel } from '../../../model/kardexModel';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import JsBarcode from 'jsbarcode';

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
	imports: [CommonModule, FormsModule, NgbTypeaheadModule, NgbPaginationModule, NgbTooltipModule],
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
		private kardexService: KardexService,
		public router: Router
	) {}

	ngOnInit(): void {
		this.getProductosAll();
	}

	// Métodos para impresión de código de barras
	@ViewChild('codigoBarraIndividual', { static: true }) codigoBarraIndividual: TemplateRef<any> | null = null;
	@ViewChild('codigoBarraMasivo', { static: true }) codigoBarraMasivo: TemplateRef<any> | null = null;
	itemCodigoBarras: any = null;
	productosCodigoBarrasMasivo: any[] = [];

	openModalCodigoBarraIndividual(item: any) {
		if (!item.idBulk) {
			Swal.fire({
				icon: 'warning',
				title: '¡Atención!',
				text: 'Este producto no tiene un código bulk asignado.',
				showConfirmButton: true,
			});
			return;
		}
		this.itemCodigoBarras = item;
		if (this.codigoBarraIndividual) {
			this.modalService.open(this.codigoBarraIndividual, { size: 'lg' });
			setTimeout(() => {
				this.initBarcodeIndividual();
			}, 100);
		}
	}

	initBarcodeIndividual(): void {
		if (this.itemCodigoBarras && this.itemCodigoBarras.idBulk) {
			JsBarcode('#barcode-individual', this.itemCodigoBarras.idBulk, {
				width: 2,
				height: 100,
				displayValue: true,
				fontSize: 16
			});
		}
	}

	openModalCodigoBarraMasivo(productos: any[]) {
		this.productosCodigoBarrasMasivo = productos;
		if (this.codigoBarraMasivo) {
			this.modalService.open(this.codigoBarraMasivo, { size: 'xl' });
			setTimeout(() => {
				this.initBarcodesMasivos();
			}, 100);
		}
	}

	initBarcodesMasivos(): void {
		this.productosCodigoBarrasMasivo.forEach((producto, index) => {
			if (producto && producto.idBulk) {
				JsBarcode(`#barcode-masivo-${index}`, producto.idBulk, {
					width: 2,
					height: 100,
					displayValue: true,
					fontSize: 16
				});
			}
		});
	}

	imprimirCodigoBarraIndividual(divId: string): void {
		const printContents = document.getElementById(divId)?.innerHTML;
		if (!printContents) {
			Swal.fire({
				icon: 'error',
				title: 'Oops!',
				text: 'No se encontró el contenido para imprimir.',
				showConfirmButton: true,
			});
			return;
		}
		const printWindow = window.open('', '', 'height=600,width=800');
		if (printWindow) {
			printWindow.document.write('<html><head><title>Código de Barras</title>');
			printWindow.document.write('<style>body{margin:0;padding:20px;text-align:center;} @media print { body { -webkit-print-color-adjust: exact; } }</style>');
			printWindow.document.write('</head><body>');
			printWindow.document.write(printContents);
			printWindow.document.write('</body></html>');
			printWindow.document.close();
			printWindow.focus();
			setTimeout(() => {
				printWindow.print();
				printWindow.close();
			}, 500);
		}
	}

	imprimirCodigoBarraMasivo(divId: string): void {
		const printContents = document.getElementById(divId)?.innerHTML;
		if (!printContents) {
			Swal.fire({
				icon: 'error',
				title: 'Oops!',
				text: 'No se encontró el contenido para imprimir.',
				showConfirmButton: true,
			});
			return;
		}
		const printWindow = window.open('', '', 'height=800,width=1000');
		if (printWindow) {
			printWindow.document.write('<html><head><title>Códigos de Barras - Impresión Masiva</title>');
			printWindow.document.write('<style>body{margin:0;padding:20px;} @media print { body { -webkit-print-color-adjust: exact; } .mb-4 { page-break-inside: avoid; margin-bottom: 1rem; } }</style>');
			printWindow.document.write('</head><body>');
			printWindow.document.write(printContents);
			printWindow.document.write('</body></html>');
			printWindow.document.close();
			printWindow.focus();
			setTimeout(() => {
				printWindow.print();
				printWindow.close();
			}, 500);
		}
	}

	mostrarOpcionesCodigoBarrasMasivo(idsProductoMaestro: string[]): void {
		// Buscar los productos actualizados con sus nuevos estados y fechaCreacionBulk más reciente
		const productosRecibidos = this.productosTable.filter(p => 
			idsProductoMaestro.includes(p.idProductoMaestro) && 
			p.idEstadoProducto === 3 && 
			p.fechaCreacionBulk
		);
		
		// Para cada idProductoMaestro, obtener solo el más reciente según fechaCreacionBulk
		const productosUnicos: any[] = [];
		idsProductoMaestro.forEach(idProductoMaestro => {
			const productosDelMismo = productosRecibidos.filter(p => p.idProductoMaestro === idProductoMaestro);
			if (productosDelMismo.length > 0) {
				// Ordenar por fechaCreacionBulk descendente y tomar el más reciente
				const productoMasReciente = productosDelMismo.sort((a, b) => 
					new Date(b.fechaCreacionBulk).getTime() - new Date(a.fechaCreacionBulk).getTime()
				)[0];
				productosUnicos.push(productoMasReciente);
			}
		});
		
		const productosConBulk = productosUnicos.filter(p => p.idBulk);
		
		if (productosConBulk.length === 0) {
			Swal.fire({
				icon: 'info',
				title: 'Información',
				text: 'Los productos recibidos no tienen códigos bulk asignados para imprimir.',
				showConfirmButton: true,
			});
			return;
		}

		// Si hay productos con bulk, preguntar si quiere imprimir códigos de barras
		let productosHtml = '';
		productosConBulk.forEach(p => {
			productosHtml += `<li>${p.nombreProducto} (Bulk: ${p.idBulk})</li>`;
		});

		Swal.fire({
			title: '¿Imprimir Códigos de Barras?',
			html: `<p>Los siguientes productos han sido recibidos en producción y tienen códigos bulk disponibles:</p>
				   <ul style="text-align: left; margin: 10px 0;">${productosHtml}</ul>
				   <p>¿Deseas imprimir todos los códigos de barras en una sola hoja?</p>`,
			icon: 'question',
			showCancelButton: true,
			confirmButtonText: 'Sí, imprimir todos',
			cancelButtonText: 'No, después',
			allowOutsideClick: false
		}).then((result) => {
			if (result.isConfirmed) {
				// Abrir el modal masivo con todos los productos
				this.openModalCodigoBarraMasivo(productosConBulk);
			}
		});
	}

	imprimirCodigosBarrasSecuencial(productos: any[], indice: number): void {
		if (indice >= productos.length) return;

		const producto = productos[indice];
		this.itemCodigoBarras = producto;
		
		if (this.codigoBarraIndividual) {
			const modalRef = this.modalService.open(this.codigoBarraIndividual, { size: 'lg' });
			setTimeout(() => {
				this.initBarcodeIndividual();
			}, 100);
			
			// Si hay más productos, preguntar si quiere continuar
			if (indice < productos.length - 1) {
				modalRef.result.then(() => {
					// Modal cerrado, preguntar si quiere continuar con el siguiente
					this.preguntarSiguienteCodigoBarras(productos, indice + 1);
				}).catch(() => {
					// Modal cancelado, preguntar si quiere continuar
					this.preguntarSiguienteCodigoBarras(productos, indice + 1);
				});
			}
		}
	}

	preguntarSiguienteCodigoBarras(productos: any[], indice: number): void {
		if (indice >= productos.length) return;

		Swal.fire({
			title: 'Siguiente código de barras',
			text: `¿Deseas imprimir el código de barras del siguiente producto: ${productos[indice].nombreProducto}?`,
			icon: 'question',
			showCancelButton: true,
			confirmButtonText: 'Sí, continuar',
			cancelButtonText: 'No, terminar'
		}).then((result) => {
			if (result.isConfirmed) {
				this.imprimirCodigosBarrasSecuencial(productos, indice);
			}
		});
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

	openModalLG(content: TemplateRef<any>) {
		this.modalService.open(content, { size: 'lg' });
	}


	recibirProducto(item: any) {
		console.log(item);
		Swal.fire({
			icon: 'question',
			title: '¿Estás seguro?',
			text: `¿Deseas recibir el producto "${item.nombreProducto}" en producción?`,
			showConfirmButton: true,
			showCancelButton: true,
			cancelButtonText: 'Cancelar',
			confirmButtonText: 'Sí, recibir',
		}).then((result) => {
			if (result.isConfirmed) {
				this.productoService
					.updateEstadoProductoMaestro({
						idProductoMaestro: item.idProductoMaestro,
						idEstadoProductoActual: 2, // En cola
						idEstadoProductoNuevo: 3, // En producción
						idEstadoPedidoNuevo: 4, // En producción
						idEstadoPedidoClienteNuevo: 3, // En producción
						idCliente: this.dataService.getLoggedUser().cliente.idCliente,
						accionRealizada: 'Producto recibido en producción',
						observacion: ''
					})
					.subscribe(
						(response) => {
							// After the product state is updated successfully, get production sheet and update kardex
							this.procesarHojaProduccionYKardex(item);
							
							Swal.fire({
								icon: 'success',
								title: '¡Listo!',
								text: 'Producto recibido en producción correctamente.',
								showConfirmButton: true,
							}).then(() => {
								this.getProductosAll();
								this.lstProductosSeleccionados = [];
								// Después de actualizar la lista, abrir automáticamente el modal de código de barras
								setTimeout(() => {
									// Buscar el producto con la fechaCreacionBulk más reciente
									const productosConBulk = this.productosTable.filter(p => 
										p.idProductoMaestro === item.idProductoMaestro && 
										p.idEstadoProducto === 3 && 
										p.fechaCreacionBulk
									);
										
									if (productosConBulk.length > 0) {
										// Ordenar por fechaCreacionBulk descendente y tomar el más reciente
										const productoMasReciente = productosConBulk.sort((a, b) => 
											new Date(b.fechaCreacionBulk).getTime() - new Date(a.fechaCreacionBulk).getTime()
										)[0];
											
										this.openModalCodigoBarraIndividual(productoMasReciente);
									} else {
										// Si no se encuentra producto con fechaCreacionBulk, buscar por idProductoMaestro como fallback
										const productoActualizado = this.productosTable.find(p => 
											p.idProductoMaestro === item.idProductoMaestro && p.idEstadoProducto === 3
										);
										if (productoActualizado) {
											this.openModalCodigoBarraIndividual(productoActualizado);
										}
									}
								}, 500); // Delay para asegurar que la lista se haya actualizado
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

	procesarHojaProduccionYKardex(item: any) {
		// Get production sheet for the product
		this.productoService.getHojaProduccion(item.idProductoMaestro).subscribe(
			(hojaProduccionResponse) => {
				console.log('Hoja de producción obtenida:', hojaProduccionResponse);
				
				if (hojaProduccionResponse && hojaProduccionResponse.idResultado === 1 && hojaProduccionResponse.value) {
					const hojaProduccion = hojaProduccionResponse.value;
					
					// Process each ingredient and create kardex entries
					if (hojaProduccion.ingredientes && hojaProduccion.ingredientes.length > 0) {
						hojaProduccion.ingredientes.forEach((ingrediente: any) => {
							this.crearEntradaKardex(item, ingrediente);
						});
					}
				} else {
					console.error('Error: No se pudo obtener la hoja de producción', hojaProduccionResponse);
				}
			},
			(error) => {
				console.error('Error al obtener la hoja de producción:', error);
			}
		);
	}

	crearEntradaKardex(item: any, ingrediente: any) {
		// Calculate the quantity based on the formula: item.presentacionTotal * (ingrediente.cantidad / 100)
		const cantidadSalida = item.presentacionTotal * (ingrediente.cantidad / 100);
		
		// Get current date in YYYY-MM-DD format
		const fechaActual = new Date().toISOString().split('T')[0];
		
		// Create kardex model object
		const kardexData = new kardexModel();
		kardexData.fecha = fechaActual;
		kardexData.documento = `MP${ingrediente.materiaPrima.idMateriaPrima}`;
		kardexData.cant_entrada = 0;
		kardexData.cant_salida = cantidadSalida;
		kardexData.impunit = ingrediente.materiaPrima.costoGramo;
		kardexData.id_materia_prima = ingrediente.materiaPrima.idMateriaPrima;
		kardexData.observaciones = '';
		kardexData.id_movimiento = 1;
		kardexData.archivobase64 = '';
		kardexData.path_kardex = '';
		kardexData.extensiondoc = '';
		kardexData.ficha_tecnica = '';
		kardexData.fecha_vencimiento = fechaActual;
		kardexData.pureza = 0;
		kardexData.lote = '';
		kardexData.peso_bruto = 0;
		kardexData.peso_neto = 0;

		// Make the API call to register the kardex entry
		this.kardexService.registrarKardex(kardexData, 1, 1).subscribe(
			(kardexResponse) => {
				console.log(`Kardex registrado para materia prima ${ingrediente.materiaPrima.nombre}:`, kardexResponse);
			},
			(kardexError) => {
				console.error(`Error al registrar kardex para materia prima ${ingrediente.materiaPrima.nombre}:`, kardexError);
			}
		);
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
			text: `¿Deseas enviar el producto "${item.nombreProducto}" a calidad?`,
			showConfirmButton: true,
			showCancelButton: true,
			cancelButtonText: 'Cancelar',
			confirmButtonText: 'Sí, enviar',
		}).then((result) => {
			if (result.isConfirmed) {
				this.productoService
					.updateEstadoProductoMaestro({
						idProductoMaestro: item.idProductoMaestro,
						idEstadoProductoActual: 3, // En producción
						idEstadoProductoNuevo: 4, // En calidad
						idEstadoPedidoNuevo: 5, // En calidad
						idEstadoPedidoClienteNuevo: 3, // En producción
						idCliente: this.dataService.getLoggedUser().cliente.idCliente,
						accionRealizada: 'Producto enviado a calidad',
						observacion: ''
					})
					.subscribe(
						(response) => {
							// Llamada adicional al endpoint de estado-producto-bulk
							if (item.idBulk) {
								const bulkData = {
									idBulk: item.idBulk,
									idProductoMaestro: item.idProductoMaestro,
									idEstadoProductoActual: 3, // En producción
									idEstadoProductoNuevo: 4, // En calidad
									idEstadoPedido: 5, // En calidad
									idEstadoPedidoCliente: 3, // En producción
									idCliente: this.dataService.getLoggedUser().cliente.idCliente,
									accionRealizada: 'Producto enviado a calidad',
									observacion: ''
								};

								this.productoService.updateEstadoProductoBulk(bulkData).subscribe(
									(bulkResponse) => {
										console.log('Estado bulk actualizado correctamente:', bulkResponse);
									},
									(bulkError) => {
										console.error('Error al actualizar estado bulk:', bulkError);
										// No mostramos error al usuario ya que la operación principal fue exitosa
									}
								);
							}

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

	// Check si un idProductoMaestro está seleccionado
	isSeleccionado(idProductoMaestro: string): boolean {
		return this.lstProductosSeleccionados.some(
			(item) => item.idProductoMaestro === idProductoMaestro
		);
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
		// Determinar el estado a filtrar según tipoEnvio
		const estadoFiltrar =
			this.tipoEnvio === 0 ? 2 : 3;
		const productosPagina = this.productos.filter(
			(p) => p.idEstadoProducto === estadoFiltrar
		);
		if (productosPagina.length === 0) return false;
		return productosPagina.every((p) =>
			this.lstProductosSeleccionados.some(
				(item) => item.idProductoMaestro === p.idProductoMaestro
			)
		);
	}

	// Cambiar selección masiva en la página actual
	toggleSeleccionTodosPagina(event: Event) {
		let checked = (event.target as HTMLInputElement)?.checked;
		// Determinar el estado a filtrar según tipoEnvio
		let estadoFiltrar = this.tipoEnvio === 0 ? 2 : 3;
		const idsPagina = this.productos
			.filter((p) => p.idEstadoProducto === estadoFiltrar)
			.map((p) => p.idProductoMaestro);
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
			this.recibirProduccionMasivo();
		} else if (this.tipoEnvio === 1) {
			this.enviarCalidadMasivo();
		}
	}

	//En cola -> En produccion
	recibirProduccionMasivo() {
		let lstProductos = '';
		for (let i = 0; i < this.lstProductosSeleccionados.length; i++) {
			const idProductoMaestro = this.lstProductosSeleccionados[i].idProductoMaestro;
			const producto = this.productosTable.find(p => p.idProductoMaestro === idProductoMaestro);
			const nombreProducto = producto ? producto.nombreProducto : idProductoMaestro;
			lstProductos += nombreProducto + '<br>';
		}

		Swal.fire({
			title: '¿Estás seguro?',
			html: `<p>¿Deseas recibir los productos seleccionados en producción?</p>
					<p>Productos seleccionados:</p>
					<div style="max-height: 200px; overflow-y: auto;">${lstProductos}</div>`,
			icon: 'question',
			showCancelButton: true,
			confirmButtonText: 'Sí, recibir',
			cancelButtonText: 'Cancelar',
		}).then((result) => {
			if (result.isConfirmed) {
				this.procesarProductosIndividualesRecibir();
			}
		});
	}

	procesarProductosIndividualesRecibir() {
		const productosSeleccionados = this.lstProductosSeleccionados.map(item => {
			return this.productosTable.find(p => p.idProductoMaestro === item.idProductoMaestro);
		}).filter(producto => producto !== undefined);

		let procesadosExitosos = 0;
		let errores = 0;
		const totalProductos = productosSeleccionados.length;

		// Función recursiva para procesar productos de forma secuencial
		const procesarProductoSecuencial = (index: number) => {
			if (index >= productosSeleccionados.length) {
				// Todos los productos han sido procesados
				this.mostrarResultadoMasivo(procesadosExitosos, errores, totalProductos, 'recibidos');
				return;
			}

			const item = productosSeleccionados[index];
			console.log(`Procesando producto ${index + 1}/${totalProductos}: ${item.nombreProducto}`);
			
			this.productoService
				.updateEstadoProductoMaestro({
					idProductoMaestro: item.idProductoMaestro,
					idEstadoProductoActual: 2, // En cola
					idEstadoProductoNuevo: 3, // En producción
					idEstadoPedidoNuevo: 4, // En producción
					idEstadoPedidoClienteNuevo: 3, // En producción
					idCliente: this.dataService.getLoggedUser().cliente.idCliente,
					accionRealizada: 'Producto recibido en producción',
					observacion: ''
				})
				.subscribe(
					(response) => {
						// Procesar hoja de producción y kardex para cada producto
						this.procesarHojaProduccionYKardex(item);
						procesadosExitosos++;
						console.log(`Producto ${index + 1}/${totalProductos} procesado exitosamente: ${item.nombreProducto}`);
						
						// IMPORTANTE: Solo continuar con el siguiente después de que este request haya terminado completamente
						procesarProductoSecuencial(index + 1);
					},
					(error) => {
						console.error(`Error al recibir producto ${item.nombreProducto}:`, error);
						errores++;
						
						// IMPORTANTE: Continuar con el siguiente producto incluso si este falló, pero solo después del error
						procesarProductoSecuencial(index + 1);
					}
				);
		};

		// Iniciar el procesamiento secuencial
		procesarProductoSecuencial(0);
	}

	enviarCalidadMasivo() {
		let lstProductos = '';
		for (let i = 0; i < this.lstProductosSeleccionados.length; i++) {
			const idProductoMaestro = this.lstProductosSeleccionados[i].idProductoMaestro;
			const producto = this.productosTable.find(p => p.idProductoMaestro === idProductoMaestro);
			const nombreProducto = producto ? producto.nombreProducto : idProductoMaestro;
			lstProductos += nombreProducto + '<br>';
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
				this.procesarProductosIndividualesEnviarCalidad();
			}
		});
	}

	procesarProductosIndividualesEnviarCalidad() {
		const productosSeleccionados = this.lstProductosSeleccionados.map(item => {
			return this.productosTable.find(p => p.idProductoMaestro === item.idProductoMaestro);
		}).filter(producto => producto !== undefined);

		let procesadosExitosos = 0;
		let errores = 0;
		const totalProductos = productosSeleccionados.length;

		// Función recursiva para procesar productos de forma secuencial
		const procesarProductoSecuencial = (index: number) => {
			if (index >= productosSeleccionados.length) {
				// Todos los productos han sido procesados
				this.mostrarResultadoMasivo(procesadosExitosos, errores, totalProductos, 'enviados a calidad');
				return;
			}

			const item = productosSeleccionados[index];
			console.log(`Procesando producto ${index + 1}/${totalProductos}: ${item.nombreProducto}`);
			
			this.productoService
				.updateEstadoProductoMaestro({
					idProductoMaestro: item.idProductoMaestro,
					idEstadoProductoActual: 3, // En producción
					idEstadoProductoNuevo: 4, // En calidad
					idEstadoPedidoNuevo: 5, // En calidad
					idEstadoPedidoClienteNuevo: 3, // En producción
					idCliente: this.dataService.getLoggedUser().cliente.idCliente,
					accionRealizada: 'Producto enviado a calidad',
					observacion: ''
				})
				.subscribe(
					(response) => {
						// Llamada adicional al endpoint de estado-producto-bulk si tiene idBulk
						if (item.idBulk) {
							const bulkData = {
								idBulk: item.idBulk,
								idProductoMaestro: item.idProductoMaestro,
								idEstadoProductoActual: 3, // En producción
								idEstadoProductoNuevo: 4, // En calidad
								idEstadoPedido: 5, // En calidad
								idEstadoPedidoCliente: 3, // En producción
								idCliente: this.dataService.getLoggedUser().cliente.idCliente,
								accionRealizada: 'Producto enviado a calidad',
								observacion: ''
							};

							this.productoService.updateEstadoProductoBulk(bulkData).subscribe(
								(bulkResponse) => {
									console.log(`Estado bulk actualizado correctamente para ${item.nombreProducto}:`, bulkResponse);
									// IMPORTANTE: Solo continuar después de que el bulk request también termine
									procesadosExitosos++;
									console.log(`Producto ${index + 1}/${totalProductos} enviado a calidad exitosamente: ${item.nombreProducto}`);
									procesarProductoSecuencial(index + 1);
								},
								(bulkError) => {
									console.error(`Error al actualizar estado bulk para ${item.nombreProducto}:`, bulkError);
									// Aunque falle el bulk, consideramos el producto como procesado exitoso
									procesadosExitosos++;
									console.log(`Producto ${index + 1}/${totalProductos} enviado a calidad exitosamente: ${item.nombreProducto} (con error en bulk)`);
									procesarProductoSecuencial(index + 1);
								}
							);
						} else {
							// Si no tiene idBulk, continuar inmediatamente
							procesadosExitosos++;
							console.log(`Producto ${index + 1}/${totalProductos} enviado a calidad exitosamente: ${item.nombreProducto}`);
							// IMPORTANTE: Solo continuar después de que este request haya terminado completamente
							procesarProductoSecuencial(index + 1);
						}
					},
					(error) => {
						console.error(`Error al enviar producto ${item.nombreProducto} a calidad:`, error);
						errores++;
						
						// IMPORTANTE: Continuar con el siguiente producto incluso si este falló, pero solo después del error
						procesarProductoSecuencial(index + 1);
					}
				);
		};

		// Iniciar el procesamiento secuencial
		procesarProductoSecuencial(0);
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
				// Guardar los IDs de los productos procesados antes de limpiar la selección
				const productosRecibidos = this.lstProductosSeleccionados.map(item => item.idProductoMaestro);
				this.getProductosAll();
				this.lstProductosSeleccionados = [];
				
				// Si la acción fue recibir productos, mostrar opciones para imprimir códigos de barras
				if (accion === 'recibidos') {
					setTimeout(() => {
						this.mostrarOpcionesCodigoBarrasMasivo(productosRecibidos);
					}, 500);
				}
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
				this.getProductosAll();
				this.lstProductosSeleccionados = [];
			});
		}
	}
}
