import {Component, ViewChildren, ViewEncapsulation} from '@angular/core';
import {NgbHighlight, NgbPaginationModule} from "@ng-bootstrap/ng-bootstrap";
import {AsyncPipe, CommonModule, CurrencyPipe, DatePipe, DecimalPipe} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {ObsevacionesReqModel, RequeremientosModel} from "../../../model/requerimientosModel";
import {TagModule} from "primeng/tag";
import {ButtonModule} from "primeng/button";
import {CheckboxModule} from "primeng/checkbox";
import {Table, TableModule} from "primeng/table";
import {SliderModule} from "primeng/slider";
import {DropdownModule} from "primeng/dropdown";
import {IconFieldModule} from "primeng/iconfield";
import {InputIconModule} from "primeng/inputicon";
import {MultiSelectModule} from "primeng/multiselect";
import {InputTextModule} from "primeng/inputtext";
import {SplitButtonModule} from "primeng/splitbutton";
import {MenuItem, MessageService, PrimeNGConfig} from "primeng/api";
import {DialogModule} from "primeng/dialog";
import {ToastModule} from "primeng/toast";
import {CalendarModule} from "primeng/calendar";
import {InputTextareaModule} from "primeng/inputtextarea";
import {FileUploadModule} from "primeng/fileupload";
import {BadgeModule} from "primeng/badge";


@Component({
  selector: 'app-bandeja-requerimientos',
  standalone: true,
	imports: [CommonModule, DecimalPipe, FormsModule, AsyncPipe, NgbHighlight, NgbPaginationModule, DatePipe, CurrencyPipe, TagModule, ButtonModule,
		CheckboxModule, TableModule, SliderModule, DropdownModule, IconFieldModule, InputIconModule,
		SplitButtonModule, MultiSelectModule, InputTextModule, DialogModule, ToastModule,
		CalendarModule,InputTextareaModule,FileUploadModule,BadgeModule],
  templateUrl: './bandeja-requerimientos.component.html',
  styleUrl: './bandeja-requerimientos.component.scss',
	providers: [MessageService],
	encapsulation: ViewEncapsulation.None,
})
export class BandejaRequerimientosComponent {
	page = 1;
	pageSize = 4;
	collectionSize = 0;
	listaRequerimientos: RequeremientosModel[] = [];
	listaRequerimientospaginado: RequeremientosModel[] = [];
	selectedCustomers!: RequeremientosModel[];
	items: MenuItem[]=[];
	representatives!: RequeremientosModel[];
	sumaorder:number=0
	verdetalle:boolean=false
	statuses!: any[];
	searchValue:any
	loading: boolean = true;
	verordencompra:boolean=false
	condicionpago:string=''
	fechaentrega: Date = new Date();
	fila_select:RequeremientosModel = new RequeremientosModel()
	verobservaciones:boolean=false
	observaciones:ObsevacionesReqModel=new ObsevacionesReqModel()
	activityValues: number[] = [0, 100];
	files:File[] = [];

	totalSize : number = 0;

	totalSizePercent : number = 0;
	constructor(private config: PrimeNGConfig,private messageService: MessageService) {
		this.loading=false
		this.items = [
			{
				label: 'Ver Detalles',
				icon:'pi pi-bell',
				command: () => {
					// this.update();
					this.verdetalle=true
				}
			},
			{
				label: 'Cotizaciones',
				icon:'pi pi-flag',
				command: () => {
					this.update();
				}
			},
			{
				label: 'Orden de Compra',
				icon:'pi pi-cart-plus',
				command: () => {
					this.verordencompra=true
				}
			},{
				label: 'Conformidad',
				icon:'pi pi-check-circle',
				command: () => {
					this.update();
				}
			},{
				label: 'Observaciones',
				icon:'pi pi-key',
				command: () => {
					// this.update();
					this.verobservaciones=true
				}
			},{
				label: 'Validar Calidad',
				icon:'pi pi-lock',
				command: () => {
					this.update();
				}
			},{
				label: 'Pago',
				icon:'pi pi-money-bill',
				command: () => {
					this.update();
				}
			},
		];
		this.listaRequerimientos = [
			{
				codigo: 3001,
				fecha: new Date('2025-07-01'),
				origen: 'Laboratorio Central',
				estado: 'Pendiente',
				totalestimado: 1280.00,
				motivo: 'Formulación de crema antiacné',
				detalle: [
					{ descripcion: 'Ácido salicílico', cantidad: 1, unidad: 'kg', subtotal: 350 },
					{ descripcion: 'Glicerina vegetal', cantidad: 2, unidad: 'lt', subtotal: 280 },
					{ descripcion: 'Envases de 50ml', cantidad: 200, unidad: 'unid', subtotal: 400 }
				]
			},
			{
				codigo: 3002,
				fecha: new Date('2025-07-02'),
				origen: 'Control de Calidad',
				estado: 'Aprobado',
				totalestimado: 720.00,
				motivo: 'Análisis de lote de hidratante facial',
				detalle: [
					{ descripcion: 'Alcohol etílico 96%', cantidad: 1, unidad: 'lt', subtotal: 120 },
					{ descripcion: 'Tiras pH', cantidad: 100, unidad: 'unid', subtotal: 100 },
					{ descripcion: 'Vaselina blanca', cantidad: 2, unidad: 'kg', subtotal: 500 }
				]
			},
			{
				codigo: 3003,
				fecha: new Date('2025-07-03'),
				origen: 'Planta Piloto',
				estado: 'Pendiente',
				totalestimado: 935.00,
				motivo: 'Lote de prueba crema antiarrugas',
				detalle: [
					{ descripcion: 'Coenzima Q10', cantidad: 250, unidad: 'g', subtotal: 250 },
					{ descripcion: 'Aceite de jojoba', cantidad: 2, unidad: 'lt', subtotal: 300 },
					{ descripcion: 'Cajas plegables 100ml', cantidad: 150, unidad: 'unid', subtotal: 385 }
				]
			},
			{
				codigo: 3004,
				fecha: new Date('2025-07-03'),
				origen: 'Formulación',
				estado: 'Aprobado',
				totalestimado: 680.00,
				motivo: 'Ajuste de fórmula con nuevo emulsionante',
				detalle: [
					{ descripcion: 'Emulsionante tipo O/W', cantidad: 1, unidad: 'kg', subtotal: 320 },
					{ descripcion: 'Conservante parabeno-free', cantidad: 500, unidad: 'g', subtotal: 180 },
					{ descripcion: 'Frascos PET 200ml', cantidad: 100, unidad: 'unid', subtotal: 180 }
				]
			},
			{
				codigo: 3005,
				fecha: new Date('2025-07-04'),
				origen: 'Producción',
				estado: 'Pendiente',
				totalestimado: 1100.00,
				motivo: 'Preparación crema humectante',
				detalle: [
					{ descripcion: 'Urea', cantidad: 1, unidad: 'kg', subtotal: 300 },
					{ descripcion: 'Aceite de almendras', cantidad: 2, unidad: 'lt', subtotal: 400 },
					{ descripcion: 'Tarros 250ml', cantidad: 100, unidad: 'unid', subtotal: 400 }
				]
			},
			{
				codigo: 3006,
				fecha: new Date('2025-07-04'),
				origen: 'Almacén de Materias Primas',
				estado: 'Aprobado',
				totalestimado: 980.00,
				motivo: 'Reposición de insumos',
				detalle: [
					{ descripcion: 'Propilenglicol', cantidad: 3, unidad: 'lt', subtotal: 270 },
					{ descripcion: 'Cera lanette', cantidad: 1, unidad: 'kg', subtotal: 250 },
					{ descripcion: 'Etiquetas adhesivas', cantidad: 500, unidad: 'unid', subtotal: 460 }
				]
			},
			{
				codigo: 3007,
				fecha: new Date('2025-07-05'),
				origen: 'Sucursal Norte',
				estado: 'Pendiente',
				totalestimado: 600.00,
				motivo: 'Demanda de crema exfoliante',
				detalle: [
					{ descripcion: 'Microesferas de jojoba', cantidad: 500, unidad: 'g', subtotal: 300 },
					{ descripcion: 'Extracto de manzanilla', cantidad: 1, unidad: 'lt', subtotal: 300 }
				]
			},
			{
				codigo: 3008,
				fecha: new Date('2025-07-06'),
				origen: 'Sucursal Sur',
				estado: 'Rechazado',
				totalestimado: 540.00,
				motivo: 'Solicitud no autorizada',
				detalle: [
					{ descripcion: 'Aceite de rosa mosqueta', cantidad: 1, unidad: 'lt', subtotal: 400 },
					{ descripcion: 'Envases vidrio ámbar', cantidad: 50, unidad: 'unid', subtotal: 140 }
				]
			},
			{
				codigo: 3009,
				fecha: new Date('2025-07-06'),
				origen: 'Muestreo clínico',
				estado: 'Pendiente',
				totalestimado: 825.00,
				motivo: 'Fórmula con niacinamida',
				detalle: [
					{ descripcion: 'Niacinamida', cantidad: 250, unidad: 'g', subtotal: 200 },
					{ descripcion: 'Crema base neutra', cantidad: 5, unidad: 'kg', subtotal: 625 }
				]
			},
			{
				codigo: 3010,
				fecha: new Date('2025-07-07'),
				origen: 'Sucursal Este',
				estado: 'Aprobado',
				totalestimado: 1095.00,
				motivo: 'Lanzamiento de nuevo descripcion',
				detalle: [
					{ descripcion: 'Extracto de caléndula', cantidad: 1, unidad: 'lt', subtotal: 350 },
					{ descripcion: 'Aceite de coco', cantidad: 2, unidad: 'lt', subtotal: 400 },
					{ descripcion: 'Etiquetas color full', cantidad: 300, unidad: 'unid', subtotal: 345 }
				]
			},
			{
				codigo: 3011,
				fecha: new Date('2025-07-08'),
				origen: 'Departamento Técnico',
				estado: 'Pendiente',
				totalestimado: 710.00,
				motivo: 'Ensayo estabilidad crema nocturna',
				detalle: [
					{ descripcion: 'Vitamina E', cantidad: 250, unidad: 'g', subtotal: 250 },
					{ descripcion: 'Aceite de argán', cantidad: 1, unidad: 'lt', subtotal: 300 },
					{ descripcion: 'Envases tester', cantidad: 50, unidad: 'unid', subtotal: 160 }
				]
			},
			{
				codigo: 3012,
				fecha: new Date('2025-07-08'),
				origen: 'Distribución',
				estado: 'Pendiente',
				totalestimado: 430.00,
				motivo: 'Muestras a farmacias',
				detalle: [
					{ descripcion: 'Cajas pequeñas', cantidad: 100, unidad: 'unid', subtotal: 200 },
					{ descripcion: 'Stickers promocionales', cantidad: 500, unidad: 'unid', subtotal: 230 }
				]
			},
			{
				codigo: 3013,
				fecha: new Date('2025-07-09'),
				origen: 'Marketing',
				estado: 'Aprobado',
				totalestimado: 1340.00,
				motivo: 'Promoción en puntos de venta',
				detalle: [
					{ descripcion: 'Folletos informativos', cantidad: 1000, unidad: 'unid', subtotal: 400 },
					{ descripcion: 'Bolsas promocionales', cantidad: 500, unidad: 'unid', subtotal: 400 },
					{ descripcion: 'Displays de mostrador', cantidad: 20, unidad: 'unid', subtotal: 540 }
				]
			},
			{
				codigo: 3014,
				fecha: new Date('2025-07-09'),
				origen: 'Dirección Técnica',
				estado: 'Pendiente',
				totalestimado: 1080.00,
				motivo: 'Producción de crema con AHA',
				detalle: [
					{ descripcion: 'Ácido glicólico', cantidad: 500, unidad: 'g', subtotal: 400 },
					{ descripcion: 'Crema base emoliente', cantidad: 3, unidad: 'kg', subtotal: 480 },
					{ descripcion: 'Tarros 100ml', cantidad: 100, unidad: 'unid', subtotal: 200 }
				]
			},
			{
				codigo: 3015,
				fecha: new Date('2025-07-10'),
				origen: 'Formulación Magistral',
				estado: 'Aprobado',
				totalestimado: 965.00,
				motivo: 'Preparación de lotes personalizados',
				detalle: [
					{ descripcion: 'Extracto de té verde', cantidad: 1, unidad: 'lt', subtotal: 400 },
					{ descripcion: 'Base hipoalergénica', cantidad: 3, unidad: 'kg', subtotal: 565 }
				]
			}
		];

		this.collectionSize = this.listaRequerimientos.length

		this.refreshRequerimientos();
	}

	refreshRequerimientos() {
		this.listaRequerimientospaginado = this.listaRequerimientos
			.map((req, i) => ({id: i + 1, ...req}))
			.slice((this.page - 1) * this.pageSize, this.page * this.pageSize);
	}

	getSeverity(status: string): string {
		switch (status) {
			case 'unqualified':
				return 'danger';

			case 'qualified':
				return 'success';

			case 'new':
				return 'info';

			case 'negotiation':
				return 'warning';


			default :
				return '';
		}
	}
	clear(table: Table) {
		table.clear(); // o lo que sea necesario
	}
	save(severity: string) {
		this.messageService.add({ severity: severity, summary: 'Success', detail: 'Data Saved' });
	}

	update() {
		this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Data Updated' });
	}

	delete() {
		this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Data Deleted' });
	}

	calcularSuma(customer:any){
		this.sumaorder=0
		this.fila_select=customer
		this.fila_select.detalle.forEach(e=>{
			this.sumaorder+=e.subtotal
		})

	}
	choose(event:any, callback:any) {
		callback();
	}

	onRemoveTemplatingFile(event:any, file:any, removeFileCallback:any, index:any) {
		removeFileCallback(event, index);
		this.totalSize -= parseInt(this.formatSize(file.size));
		this.totalSizePercent = this.totalSize / 10;
	}

	onClearTemplatingUpload(clear:any) {
		clear();
		this.totalSize = 0;
		this.totalSizePercent = 0;
	}

	onTemplatedUpload() {
		this.messageService.add({ severity: 'info', summary: 'Success', detail: 'File Uploaded', life: 3000 });
	}

	onSelectedFiles(event:any) {
		this.files = event.currentFiles;
		this.files.forEach((file) => {
			this.totalSize += parseInt(this.formatSize(file.size));
		});
		this.totalSizePercent = this.totalSize / 10;
	}

	uploadEvent(callback:any) {
		callback();
	}

	formatSize(bytes:any) {
		let k = 1024;
		let dm = 3;
		let sizes = this.config.translation.fileSizeTypes;
		sizes=['Bytes', 'KB', 'MB', 'GB', 'TB'];
		if (bytes === 0) {
			return `0 ${sizes[0]}`;
		}

		const i = Math.floor(Math.log(bytes) / Math.log(k));
		const formattedSize = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));

		return `${formattedSize} ${sizes[i]}`;
	}
}
