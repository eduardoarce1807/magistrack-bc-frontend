import {Component, ViewChildren, ViewEncapsulation} from '@angular/core';
import {NgbHighlight, NgbPaginationModule} from "@ng-bootstrap/ng-bootstrap";
import {AsyncPipe, CommonModule, CurrencyPipe, DatePipe, DecimalPipe} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {
	iterequerimientoModel,
	ObsevacionesReqModel,
	RequeremientosModel,
	RequeremientossaveModel
} from "../../../model/requerimientosModel";
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
import {RequerimientosService} from "../../../services/compras/requerimientos.service";
import {InputNumberModule} from "primeng/inputnumber";
import {Router} from "@angular/router";
import {cotizacionModel, itecotizacionModel} from "../../../model/cotizacionesModel";
import {proveedorModel, soloproveedorModel} from "../../../model/proveedoresModel";
import {ProveedorService} from "../../../services/compras/proveedor.service";
import {CotizacionesService} from "../../../services/compras/cotizaciones.service";
import {CargaComponent} from "../../../components/carga/carga.component";
import {ReportesComponent} from "../../../components/reportes/reportes.component";
import {DialogService} from "primeng/dynamicdialog";


@Component({
  selector: 'app-bandeja-requerimientos',
  standalone: true,
	imports: [CommonModule, DecimalPipe, FormsModule, AsyncPipe, NgbHighlight, NgbPaginationModule, DatePipe, CurrencyPipe, TagModule, ButtonModule,
		CheckboxModule, TableModule, SliderModule, DropdownModule, IconFieldModule, InputIconModule,
		SplitButtonModule, MultiSelectModule, InputTextModule, DialogModule, ToastModule,
		CalendarModule, InputTextareaModule, FileUploadModule, BadgeModule, InputNumberModule, CargaComponent],
  templateUrl: './bandeja-requerimientos.component.html',
  styleUrl: './bandeja-requerimientos.component.scss',
	providers: [MessageService,DialogService ],
	encapsulation: ViewEncapsulation.None,
})
export class BandejaRequerimientosComponent {
	page = 1;
	pageSize = 4;
	collectionSize = 0;
	listaRequerimientos: RequeremientossaveModel[] = [];
	listaRequerimientospaginado: RequeremientossaveModel[] = [];
	selectedCustomers!: RequeremientosModel[];
	selectedCotizacion:cotizacionModel=new cotizacionModel()
	items: MenuItem[]=[];
	representatives!: RequeremientosModel[];
	sumaorder:number=0
	sumacoti:number=0
	verdetalle:boolean=false
	spinner:boolean=false
	loading: boolean = false;
	verordencompra:boolean=false
	vercotizacion:boolean=false
	condicionpago:string=''
	listaProveedores: soloproveedorModel[] = [];
	// selectedprov:proveedorModel=new proveedorModel()
	selectedprov:string=''
	fechaentrega: Date = new Date();
	fila_select:RequeremientossaveModel = new RequeremientossaveModel()
	verobservaciones:boolean=false
	observaciones:ObsevacionesReqModel=new ObsevacionesReqModel()
	activityValues: number[] = [0, 100];
	files:File[] = [];
	cargaprov:boolean=false

	totalSize : number = 0;

	totalSizePercent : number = 0;
	constructor(private config: PrimeNGConfig,private messageService: MessageService,
				private requerimietoService:RequerimientosService,
				private router: Router,private proveedorService:ProveedorService,
				private cotizacionService:CotizacionesService,
				public dialogService: DialogService,) {
		this.loading=false
		this.items = [
			{
				label: 'Ver Detalles',
				icon:'pi pi-bell',
				command: () => {
					// this.update();
					this.verdetalle=true
				}
			},{
				label: 'Reporte Seguimiento',
				icon:'pi pi-print',
				command: () => {
					// this.update();
					this.imprimir_seguimiento_requerimientos(this.fila_select.id_requerimiento!)
				}
			}
			// {
			// 	label: 'Cotizaciones',
			// 	icon:'pi pi-flag',
			// 	command: () => {
			// 		this.vercotizacion=true
			// 		this.sumacoti=0
			// 		this.cargaproveedores()
			// 		this.fila_select.iterequerimiento.forEach(e=>{
			// 			this.sumacoti+=e.impsubtotal
			// 		})
			// 	}
			// },
			// {
			// 	label: 'Orden de Compra',
			// 	icon:'pi pi-cart-plus',
			// 	command: () => {
			// 		this.verordencompra=true
			// 	}
			// },{
			// 	label: 'Conformidad',
			// 	icon:'pi pi-check-circle',
			// 	command: () => {
			// 		this.messageService.add({ severity: 'warn', summary: 'PENDIENTE', detail: 'Está en espera de Conformidad' });
			// 	}
			// },{
			// 	label: 'Observaciones',
			// 	icon:'pi pi-key',
			// 	command: () => {
			// 		// this.update();
			// 		this.verobservaciones=true
			// 	}
			// },{
			// 	label: 'Validar Calidad',
			// 	icon:'pi pi-lock',
			// 	command: () => {
			// 		this.messageService.add({ severity: 'warn', summary: 'PENDIENTE', detail: 'Está en espera de Validación' });
			// 	}
			// },{
			// 	label: 'Pago',
			// 	icon:'pi pi-money-bill',
			// 	command: () => {
			// 		this.update();
			// 	}
			// },
		];


		this.refreshRequerimientos();
	}

	ngOnInit(){
		this.cargarrequerimientos()
	}
	cargarrequerimientos(){
		this.loading=true
		this.requerimietoService.getRequerimientos().subscribe({
			next:(data)=>{
				this.listaRequerimientos=data.data.listar
				this.loading=false
			},error:(err)=>{
				this.loading=false
			}
		})
	}
	refreshRequerimientos() {
		this.listaRequerimientospaginado = this.listaRequerimientos
			.map((req, i) => ({id: i + 1, ...req}))
			.slice((this.page - 1) * this.pageSize, this.page * this.pageSize);
	}
	getEstadoLabel(estado: string | null | undefined): string {
		if (!estado) return '';
		switch (estado.toUpperCase()) {
			case 'PENDIENTE': return 'Por Cotizar';
			case 'COTIZADO': return 'Cotizado';
			case 'APROBADO': return 'Aprobado';
			case 'RECHAZADO': return 'Rechazado';
			default: return estado;
		}
	}
	// public getSeverity(status: string): string {
	// 	switch (status) {
	// 		case 'unqualified':
	// 			return 'danger';
	//
	// 		case 'qualified':
	// 			return 'success';
	//
	// 		case 'COTIZADO':
	// 			return 'info';
	//
	// 		case 'PENDIENTE':
	// 			return 'warning';
	//
	// 		default :
	// 			return 'contrast';
	// 	}
	// }
	getSeverity(estado: string | null | undefined): "success" | "info" | "warning" | "danger" | "secondary" | "contrast" | undefined {
		if (!estado) return undefined;

		switch (estado.toUpperCase()) {
			case 'PENDIENTE': return 'warning';  // Yellow/orange
			case 'COTIZADO': return 'info';      // Blue
			case 'ORDEN COMPRA': return 'success';   // Green
			case 'FACTURA ENVIADA': return 'danger';   // Red
			case 'VALIDACION MP': return 'contrast';
			default: return 'secondary';         // Gray (fallback)
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
		this.fila_select.iterequerimiento.forEach(e=>{
			this.sumaorder+=e.impsubtotal
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
	cambiocosto(registro:iterequerimientoModel){
		registro.impsubtotal=registro.costo_gramo*registro.cantidad_requerida
		this.fila_select.iterequerimiento.forEach(e=>{
			this.sumacoti+=e.impsubtotal
		})
	}

	irARequerimientoManual() {
		// Puedes hacer lógica previa aquí
		this.router.navigate(['/pages/compras/requerimiento-manual']);
	}
	guardarcotizacion(){
		this.selectedCotizacion=new cotizacionModel()
		this.selectedCotizacion.idproveedor=this.selectedprov
		this.selectedCotizacion.impigv=0
		this.selectedCotizacion.imptotal=this.fila_select.imptotal
		this.selectedCotizacion.responsable=this.fila_select.responsable
		this.selectedCotizacion.itecotizacion
		this.fila_select.iterequerimiento.forEach(e=>{
			let registro:itecotizacionModel=new itecotizacionModel()
			registro.impsubtotal=e.impsubtotal
			registro.cantidad=e.cantidad_requerida
			registro.cantidad_cotizada=e.cantidad_requerida
			registro.id_requerimiento=this.fila_select.id_requerimiento
			registro.id_materia_prima=e.id_materia_prima
			registro.diasentrega=e.diasentrega
			registro.condicion_adicional=e.condicion_adicional
			this.selectedCotizacion.itecotizacion.push(registro)
		})
		this.spinner=true
		this.vercotizacion=false
		this.cotizacionService.registrarCotizacion(this.selectedCotizacion,1).subscribe({
			next:(data)=>{
				this.spinner=false
				this.vercotizacion=false
				this.cargarrequerimientos()
				this.messageService.add({ severity: 'success', summary: 'ÉXITO', detail: 'El registro se guardó satisfactoriamente' });

			},error:(err)=>{
				this.spinner=false
				this.vercotizacion=true
				this.messageService.add({ severity: 'error', summary: 'ERROR', detail: 'Ocurrió un error al momento de guardar' });

			}
		})
	}
	cargaproveedores(){
		this.cargaprov=true
		this.proveedorService.getProveedor().subscribe({
			next:(data)=>{
				this.listaProveedores=data.data
				this.cargaprov=false
				this.fila_select.idproveedor?this.selectedprov=this.fila_select.idproveedor:null
			},error:(err)=>{
				this.cargaprov=false
			}
		})
	}
	imprimir_requerimientos() {
		let json = {
			data: {
			},
			tipo_proceso: "1",
			tipo_reporte: "listado",
		};
		this.dialogService.open(ReportesComponent, {
			header: "Reporte Requerimientos",
			width: "80%",
			height: "97%",
			contentStyle: { overflow: "auto" },
			baseZIndex: 99999,
			maximizable: true,
			data: json,
		});
	}
	imprimir_seguimiento_requerimientos(id_requerimiento:string) {
		let json = {
			data: {
				id_requerimiento:id_requerimiento
			},
			tipo_proceso: "2",
			tipo_reporte: "seguimiento",
		};
		this.dialogService.open(ReportesComponent, {
			header: "Reporte Seguimiento del requerimiento",
			width: "80%",
			height: "97%",
			contentStyle: { overflow: "auto" },
			baseZIndex: 99999,
			maximizable: true,
			data: json,
		});
	}
}
