import {Component, ViewEncapsulation} from '@angular/core';
import {Button} from "primeng/button";
import {CargaComponent} from "../../../components/carga/carga.component";
import {DialogModule} from "primeng/dialog";
import {DropdownModule} from "primeng/dropdown";
import {IconFieldModule} from "primeng/iconfield";
import {InputIconModule} from "primeng/inputicon";
import {InputTextModule} from "primeng/inputtext";
import {PaginatorModule} from "primeng/paginator";
import {MenuItem, MessageService, PrimeNGConfig, PrimeTemplate} from "primeng/api";
import {Table, TableModule, TableRowCollapseEvent, TableRowExpandEvent} from "primeng/table";
import {ToastModule} from "primeng/toast";
import {ObsevacionesReqModel, RequeremientosModel, RequeremientossaveModel} from "../../../model/requerimientosModel";
import {materiaxproveedorModel, proveedorModel, soloproveedorModel} from "../../../model/proveedoresModel";
import {RequerimientosService} from "../../../services/compras/requerimientos.service";
import {ProveedorService} from "../../../services/compras/proveedor.service";
import {OrdencompraService} from "../../../services/compras/ordencompra.service";
import {FacturaOrden, ordencompraModel, ValidacionOrden} from "../../../model/ordencompraModel";
import {CommonModule, CurrencyPipe, DatePipe, NgForOf, NgIf} from "@angular/common";
import {TooltipModule} from "primeng/tooltip";
import {BadgeModule} from "primeng/badge";
import {FileUploadEvent, FileUploadModule} from "primeng/fileupload";
import {InputTextareaModule} from "primeng/inputtextarea";
import {ProgressBarModule} from "primeng/progressbar";
import {FormsModule} from "@angular/forms";
import {CalendarModule} from "primeng/calendar";
import {InputSwitchModule} from "primeng/inputswitch";
import {ValidacionesService} from "../../../services/compras/validaciones.service";
import {TagModule} from "primeng/tag";
import {DomSanitizer, SafeResourceUrl} from "@angular/platform-browser";
import {FuncionesService} from "../../../services/funciones.service";


@Component({
  selector: 'app-ordencompra-proveedor',
  standalone: true,
	imports: [
		Button,
		CargaComponent,
		DialogModule,
		DropdownModule,
		IconFieldModule,
		InputIconModule,
		InputTextModule,
		PaginatorModule,
		PrimeTemplate,
		TableModule,
		ToastModule,
		CurrencyPipe,
		TooltipModule,
		BadgeModule,
		FileUploadModule,
		InputTextareaModule,
		ProgressBarModule,
		FormsModule, CommonModule, CalendarModule,InputSwitchModule,TagModule
	],
  templateUrl: './ordencompra-proveedor.component.html',
  styleUrl: './ordencompra-proveedor.component.scss',
	providers: [MessageService,DatePipe,FuncionesService],
	encapsulation: ViewEncapsulation.None,
})
export class OrdencompraProveedorComponent {
	page = 1;
	pageSize = 4;
	collectionSize = 0;
	expandedRows = {};
	fechaemision:any=new Date()
	listaOrdenes: ordencompraModel[] = [];
	listaProveedores: soloproveedorModel[] = [];
	selectedprov:proveedorModel=new proveedorModel()
	items: MenuItem[]=[];
	verdetalle:boolean=false
	verconformidad:boolean=false
	vervalidacion:boolean=false
	spinner:boolean=false
	carga:boolean=false
	loading: boolean = false;
	verordencompra:boolean=false
	fila_select:ordencompraModel = new ordencompraModel()
	verobservaciones:boolean=false
	verfactura:boolean=false
	observaciones:ObsevacionesReqModel=new ObsevacionesReqModel()
	files:File[] = [];
	cargaprov:boolean=false
	totalSize : number = 0;
	subirFactura:FacturaOrden=new FacturaOrden()
	totalSizePercent : number = 0;
	constructor(private config: PrimeNGConfig,private messageService: MessageService,
				private requerimietoService:RequerimientosService, private proveedorService:ProveedorService,
				private ordenService:OrdencompraService,private  validacionService:ValidacionesService,
				private sanitizer: DomSanitizer,private funcionesService:FuncionesService,) {
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

	}

	ngOnInit(){
		this.cargaprov=true
		this.proveedorService.getProveedor().subscribe({
			next:(data)=>{
				this.listaProveedores=data.data
				this.cargaprov=false
			},error:(err)=>{
				this.cargaprov=false
			}
		})
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
	cargarFactura(registro:ordencompraModel){
		this.fila_select=registro
		this.fila_select.imptotalfact=this.fila_select.imptotal
		this.verfactura=true
	}
	cargarObservaciones(registro:ordencompraModel){
		this.fila_select=registro
		this.fila_select.imptotalfact=this.fila_select.imptotal
		this.verobservaciones=true
	}
	cambioproveedor(){
		// this.listaMateriaPrimaxProveedor=this.selectedprov.detalle
		// this.listaMateriaPrimaSelected=[]
		// this.requerimientosave.imptotal=0
		this.spinner=true
		this.ordenService.getOrdenesxProveedor(this.selectedprov.idproveedor!).subscribe({
			next:(data)=>{

				this.listaOrdenes=data.data.listar
				this.listaOrdenes.forEach(e=>{
					e.detalleorden.forEach(l=>{
						l.switchcumple=l.cumple==1?true:false
					})
				})
				this.spinner=false
			}
		})
	}
	expandAll() {
		this.expandedRows = this.listaOrdenes.reduce((acc: { [key: string]: boolean }, p) => {
			acc[p.id_orden_compra] = true;
			return acc;
		}, {});
	}

	collapseAll() {
		this.expandedRows = {};
	}
	getCumpleCount(detalle: any[] | undefined): number {
		return detalle?.filter(d => d.cumple === 1).length ?? 0;
	}
	getEstadoOrden(estadoord: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' | undefined {
		switch (estadoord) {
			case 'ATENDIDO':
				return 'info';
			case 'VALIDADO':
				return 'success';
			case 'OBSERVADO':
				return 'danger';
			case 'PENDIENTE':
				return 'warning';
			default:
				return 'secondary';
		}
	}

	guardarfactura(){
		this.verfactura=false
		this.spinner=true
		this.subirFactura.fechaemisionfact=this.funcionesService.convetir_de_fecha_y_hora_a_string(this.fechaemision);
		this.subirFactura.imptotalfact=this.fila_select.imptotalfact
		this.subirFactura.nrofactura=this.fila_select.nrofactura
		this.subirFactura.path_factura=null
		console.log(this.subirFactura)
		this.ordenService.registrarFacturaOrdencompra(this.fila_select.id_orden_compra,this.subirFactura).subscribe({
			next:(data)=>{
				this.spinner=false
				if(data.mensaje=='EXITO'){

					this.subirFactura=new FacturaOrden()
					this.messageService.add({
						severity: 'success',
						summary: 'ÈXITO',
						detail: 'Se subió la observación y el archivo con éxito'
					});
					this.cambioproveedor()
				}else{

					this.messageService.add({
						severity: 'error',
						summary: 'ERROR',
						detail: 'Ocurrió un problema al momento de guardar'
					});
					this.verfactura=true
				}
			},error:(err)=>{
				this.spinner=false
				this.verfactura=true
				this.messageService.add({
					severity: 'error',
					summary: 'ERROR',
					detail: 'Ocurrió un problema al momento de guardar'
				});
			}
		})
	}
	// onBasicUploadAuto(event: FileUploadEvent) {
	// 	this.spinner=false
	// 	this.messageService.add({ severity: 'info', summary: 'Success', detail: 'File Uploaded with Auto Mode' });
	// 	console.log(event)
	// }
	onBasicUploadAuto(event: FileUploadEvent) {
		this.carga = false;

		const file: File = event.files[0]; // Tomamos el primer archivo

		const reader = new FileReader();
		reader.onload = () => {
			const base64: string = reader.result as string;
			this.subirFactura.archivobase64=base64
			this.messageService.add({
				severity: 'info',
				summary: 'Success',
				detail: 'Archivo en Espera para GUARDAR'
			});

			// Aquí puedes guardar el base64 para enviarlo al backend
			// this.archivoBase64 = base64;

			// Si necesitas extraer el tipo (pdf, jpeg, etc.):
			const mime = file.type; // Ej: "application/pdf"
			const extension = mime.split('/')[1]; // Ej: "pdf"
			console.log(extension,'ext')
			// this.extensionArchivo = extension;

			// console.log('Extensión:', extension);
			this.subirFactura.extensiondoc=extension
		};

		reader.onerror = (err) => {
			console.error('Error al leer el archivo:', err);
			this.messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'No se pudo convertir el archivo'
			});
		};

		reader.readAsDataURL(file);
	}

	sanitizarPdf(base64: string): SafeResourceUrl {
		return this.sanitizer.bypassSecurityTrustResourceUrl(base64);
	}
}
