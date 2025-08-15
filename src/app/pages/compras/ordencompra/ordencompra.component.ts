import {Component, ViewEncapsulation} from '@angular/core';
import {BadgeModule} from "primeng/badge";
import {Button} from "primeng/button";
import {CalendarModule} from "primeng/calendar";
import {CargaComponent} from "../../../components/carga/carga.component";
import {CommonModule, CurrencyPipe, NgForOf, NgIf} from "@angular/common";
import {DialogModule} from "primeng/dialog";
import {DropdownModule} from "primeng/dropdown";
import {FileUploadEvent, FileUploadModule} from "primeng/fileupload";
import {FormsModule} from "@angular/forms";
import {IconFieldModule} from "primeng/iconfield";
import {InputIconModule} from "primeng/inputicon";
import {InputNumberModule} from "primeng/inputnumber";
import {InputSwitchModule} from "primeng/inputswitch";
import {InputTextModule} from "primeng/inputtext";
import {InputTextareaModule} from "primeng/inputtextarea";
import {MenuItem, MessageService, PrimeNGConfig, PrimeTemplate} from "primeng/api";
import {ProgressBarModule} from "primeng/progressbar";
import {Table, TableModule, TableRowCollapseEvent, TableRowExpandEvent} from "primeng/table";
import {TagModule} from "primeng/tag";
import {ToastModule} from "primeng/toast";
import {TooltipModule} from "primeng/tooltip";
import {
	conformidadOrden,
	Detalleconformidad,
	FacturaOrden,
	ordencompraModel,
	ValidacionOrden
} from "../../../model/ordencompraModel";
import {proveedorModel, soloproveedorModel} from "../../../model/proveedoresModel";
import {ObsevacionesReqModel} from "../../../model/requerimientosModel";
import {RequerimientosService} from "../../../services/compras/requerimientos.service";
import {ProveedorService} from "../../../services/compras/proveedor.service";
import {OrdencompraService} from "../../../services/compras/ordencompra.service";
import {ValidacionesService} from "../../../services/compras/validaciones.service";
import {PaginatorModule} from "primeng/paginator";
import {PanelModule} from "primeng/panel";
import {TipoPagoService} from "../../../services/tipo-pago.service";
import {DomSanitizer, SafeResourceUrl} from "@angular/platform-browser";
import {ConformidadService} from "../../../services/compras/conformidad.service";
import {UppercaseDirective} from "../../../directives/uppercase.directive";
import {RadioButtonModule} from "primeng/radiobutton";
import {Router, RouterLink} from "@angular/router";
import {DataService} from "../../../services/data.service";

@Component({
  selector: 'app-ordencompra',
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
		FormsModule, CommonModule, CalendarModule, InputSwitchModule, TagModule, PanelModule, UppercaseDirective, RadioButtonModule, RouterLink
	],
  templateUrl: './ordencompra.component.html',
  styleUrl: './ordencompra.component.scss',
	providers: [MessageService],
	encapsulation: ViewEncapsulation.None,
})
export class OrdencompraComponent {
	page = 1;
	pageSize = 4;
	collectionSize = 0;
	expandedRows = {};
	listaOrdenes: ordencompraModel[] = [];
	listaProveedores: soloproveedorModel[] = [];
	selectedprov:proveedorModel=new proveedorModel()
	items: MenuItem[]=[];
	verdetalle:boolean=false
	verconformidad:boolean=false
	vervalidacion:boolean=false
	spinner:boolean=false
	loading: boolean = false;
	verordencompra:boolean=false
	fila_select:ordencompraModel = new ordencompraModel()
	verobservaciones:boolean=false
	carga:boolean=false
	observaciones:ObsevacionesReqModel=new ObsevacionesReqModel()
	conformidadRequest:conformidadOrden=new conformidadOrden()
	files:File[] = [];
	cargaprov:boolean=false
	totalSize : number = 0;
	op:number=0
	sumaconformidad:number=0
	checked_parametro1:boolean=false
	checked_parametro2:boolean=false
	checked_parametro3:boolean=false
	radio_ordercompra:string="2"
	listadovalidacion:ValidacionOrden[]=[]
	lstTiposPago:any[]=[]
	totalSizePercent : number = 0;
	subirFactura:FacturaOrden=new FacturaOrden()
	valorswitch:number=0
	user:any
	fechavencimiento:any=new Date()
	constructor(private config: PrimeNGConfig,private messageService: MessageService,
				private requerimietoService:RequerimientosService, private proveedorService:ProveedorService,
				private ordenService:OrdencompraService,private  validacionService:ValidacionesService,
				private tipoPagoService: TipoPagoService,private sanitizer: DomSanitizer,private conformidadService:ConformidadService,
				private router:Router,public dataService: DataService) {
		this.loading=false
		this.user = this.dataService.getLoggedUser();
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
		this.getTiposPago()
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
	editarproveedor(registro:ordencompraModel){
		this.fila_select=registro
		this.verdetalle=true
	}
	cargarFactura(registro:ordencompraModel){
		this.fila_select=registro
		this.verobservaciones=true
	}
	nuevoproveedor(){
		this.fila_select = new ordencompraModel()
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
	onRowExpand(event: TableRowExpandEvent) {
		this.messageService.add({ severity: 'info', summary: 'Product Expanded', detail: event.data.name, life: 3000 });
	}

	onRowCollapse(event: TableRowCollapseEvent) {
		this.messageService.add({ severity: 'success', summary: 'Product Collapsed', detail: event.data.name, life: 3000 });
	}
	guardarvalidacion(){
		this.listadovalidacion=[]
		this.fila_select.detalleorden.forEach(e=>{
			let registro :ValidacionOrden=new ValidacionOrden()
			registro.id_orden_compra=this.fila_select.id_orden_compra
			registro.cumple=e.switchcumple?1:0
			registro.observaciones=e.observaciones
			registro.ph=e.ph
			registro.item=e.item
			this.listadovalidacion.push(registro)
		})
		this.spinner=true
		this.vervalidacion=false
		this.validacionService.registrarvalidaciomProveedor(this.listadovalidacion).subscribe({
			next:(data)=>{
				this.cambioproveedor()
				this.vervalidacion=false
				// this.spinner=false
			},error:(err)=>{
				this.spinner=false
				this.vervalidacion=true
			}
		})
	}
	getCumpleCount(detalle: any[] | undefined): number {
		return detalle?.filter(d => d.cumple === 1).length ?? 0;
	}
	getObservacionesCount(detalle: any[] | undefined): number {
		return detalle?.filter(d => d.path_respuesta).length ?? 0;
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
			case 'CONF. Y PAGADO':
				return 'secondary';
			default:
				return 'secondary';
		}
	}
	getTiposPago() {
		this.tipoPagoService.getTiposPago().subscribe( (data: any) => {
			if(data){
				this.lstTiposPago = data;
			}
		})
	}
	onBasicUploadAuto(event: FileUploadEvent) {
		this.carga = false;

		const file: File = event.files[0]; // Tomamos el primer archivo

		const reader = new FileReader();
		reader.onload = () => {
			const base64: string = reader.result as string;
			this.conformidadRequest.archivobase64=base64
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
			this.conformidadRequest.extensiondoc=extension
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
	guardarconformidad(){
		this.verconformidad=false
		this.spinner=true
		this.conformidadRequest.id_orden_compra=this.fila_select.id_orden_compra
		this.conformidadRequest.imppagado=this.fila_select.imppagado
		this.conformidadRequest.parametro_conf1=this.checked_parametro1?1:0
		this.conformidadRequest.parametro_conf2=this.checked_parametro2?1:0
		this.conformidadRequest.parametro_conf3=this.checked_parametro3?1:0
		this.conformidadRequest.path_pago=''
		this.conformidadRequest.cantidad_conf_total=this.sumaconformidad
		this.conformidadRequest.id_tipo_pago=this.fila_select.metodo_pago
		this.conformidadRequest.obsconformidad=this.fila_select.obsconformidad
		this.conformidadRequest.nrooperacion=this.fila_select.nrooperacion
		this.conformidadRequest.detalleconformidad=[]
		this.fila_select.detalleorden.forEach(e=>{
			let registro:Detalleconformidad=new Detalleconformidad()
			registro.id_orden_compra=this.fila_select.id_orden_compra
			registro.cantidad_conf_total=e.cant_total_conf
			registro.item=e.item
			registro.id_materia_prima_conf=e.id_materia_prima
			this.conformidadRequest.detalleconformidad.push(registro)
		})
		this.valorswitch>2?this.op=1:this.op=2
		// console.log(this.conformidadRequest,"envio")
		this.conformidadService.registrarConformidad(this.op,this.conformidadRequest).subscribe({
			next:(data)=>{
				console.log(data)
				if(data.mensaje=='EXITO'){
					this.messageService.add({ severity: 'success', summary: 'EXITO', detail: 'Se guardó exitosamente' });
					this.verconformidad=false
					this.spinner=false
					this.conformidadRequest=new conformidadOrden()
					this.cambioproveedor()
				}else{
					this.spinner=false
					this.verconformidad=true
					this.messageService.add({ severity: 'error', summary: 'ERROR', detail: 'ocurrió un problema al momento de guardar' });
				}
			},error:(err)=>{
				this.verconformidad=true
				this.spinner=false
				this.messageService.add({ severity: 'error', summary: 'ERROR', detail: 'ocurrió un problema al momento de guardar' });

			}
		})
	}
	cambiocantidad(){
		this.sumaconformidad=0
		this.fila_select.detalleorden.forEach(e=>{
			this.sumaconformidad+=e.cant_total_conf?e.cant_total_conf:0
		})
	}
	cambiocheck(){
		this.valorswitch=0
		this.valorswitch+=this.checked_parametro1?1:0
		this.valorswitch+=this.checked_parametro2?1:0
		this.valorswitch+=this.checked_parametro3?1:0
	}
	visualizarconf(registro:ordencompraModel){
		this.verconformidad=true;
		this.fila_select=registro;
		this.checked_parametro1=this.fila_select.parametro_conf1 == 1
		this.checked_parametro2=this.fila_select.parametro_conf2 == 2
		this.checked_parametro3=this.fila_select.parametro_conf3 == 3
		this.fila_select.imppagado=this.fila_select.imptotalfact
		this.cambiocantidad()
	}
	cambio_oc() {
		if (this.radio_ordercompra == "1") {
			// this.router.navigate(['../compras/ordencompra']);
		} else if (this.radio_ordercompra == "2") {
			// this.router.navigate(['../proveedor/ordencompra-proveedor']);
		}
	}
}
