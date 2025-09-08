import {Component, ViewEncapsulation} from '@angular/core';
import {BadgeModule} from "primeng/badge";
import {Button} from "primeng/button";
import {CalendarModule} from "primeng/calendar";
import {CargaComponent} from "../../../../components/carga/carga.component";
import {CommonModule, CurrencyPipe, DatePipe, NgIf, registerLocaleData} from "@angular/common";
import {DialogModule} from "primeng/dialog";
import {DropdownModule} from "primeng/dropdown";
import {FileUploadEvent, FileUploadModule} from "primeng/fileupload";
import {IconFieldModule} from "primeng/iconfield";
import {InputIconModule} from "primeng/inputicon";
import {InputTextModule} from "primeng/inputtext";
import {InputTextareaModule} from "primeng/inputtextarea";
import {MenuItem, MessageService, PrimeNGConfig, PrimeTemplate} from "primeng/api";
import {RadioButtonModule} from "primeng/radiobutton";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {Router, RouterLink} from "@angular/router";
import {Table, TableModule} from "primeng/table";
import {TagModule} from "primeng/tag";
import {ToastModule} from "primeng/toast";
import {TooltipModule} from "primeng/tooltip";
import {PaginatorModule} from "primeng/paginator";
import {ProgressBarModule} from "primeng/progressbar";
import {InputSwitchModule} from "primeng/inputswitch";
import {UppercaseDirective} from "../../../../directives/uppercase.directive";
import {
	Detalleorden,
	FacturaOrden,
	ordencompraModel,
	ordencompraPeriodo,
	RespuestaOrden
} from "../../../../model/ordencompraModel";
import {proveedorModel, soloproveedorModel} from "../../../../model/proveedoresModel";
import {ObsevacionesReqModel} from "../../../../model/requerimientosModel";
import {DomSanitizer, SafeResourceUrl} from "@angular/platform-browser";
import {ProveedorService} from "../../../../services/compras/proveedor.service";
import {OrdencompraService} from "../../../../services/compras/ordencompra.service";
import {ValidacionesService} from "../../../../services/compras/validaciones.service";
import {FuncionesService} from "../../../../services/funciones.service";
import {ReportesComponent} from "../../../../components/reportes/reportes.component";
import {DialogService} from "primeng/dynamicdialog";
import {ExcelService} from "../../../../services/excel.service";
import localeEsPe from '@angular/common/locales/es-PE';

// registrar locale antes de bootstrapApplication
registerLocaleData(localeEsPe, 'es-PE');

@Component({
  selector: 'app-orden-compra-periodo',
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
		FormsModule, CommonModule, CalendarModule, InputSwitchModule, TagModule, UppercaseDirective, RadioButtonModule, RouterLink
	],
  templateUrl: './orden-compra-periodo.component.html',
  styleUrl: './orden-compra-periodo.component.scss',
	providers: [MessageService,DatePipe,FuncionesService,DialogService,ExcelService],
	encapsulation: ViewEncapsulation.None,
})
export class OrdenCompraPeriodoComponent {
	page = 1;
	pageSize = 4;
	collectionSize = 0;
	expandedRows = {};
	fechaemision:any=new Date()
	listaOrdenes: ordencompraModel[] = [];
	listaProveedores: soloproveedorModel[] = [];
	listaEstados:any[]= [{
		codigo:1,
		descripcion:'PENDIENTE'
	},{
		codigo:2,
		descripcion:'RECIBIDO'
	},{
		codigo:1,
		descripcion:'ANULADO'
	},];
	selectedprov:proveedorModel=new proveedorModel()
	items: MenuItem[]=[];
	verdetalle:boolean=false
	spinner:boolean=false
	carga:boolean=false
	loading: boolean = false;
	verordencompra:boolean=false
	fila_select:ordencompraModel = new ordencompraModel()
	detalle_select:Detalleorden=new Detalleorden()
	ordenperiodo:ordencompraPeriodo=new ordencompraPeriodo()
	verobservaciones:boolean=false
	verfactura:boolean=false

	fechainicial:Date=new Date()
	fechafinal:Date=new Date()

	radio_ordercompra:string="1"
	observaciones:ObsevacionesReqModel=new ObsevacionesReqModel()
	files:File[] = [];
	cargaprov:boolean=false
	totalSize : number = 0;
	subirFactura:FacturaOrden=new FacturaOrden()
	subirRespuesta:RespuestaOrden=new RespuestaOrden()
	totalSizePercent : number = 0;
	sanitizedPdfUrl: SafeResourceUrl | null = null;
	constructor(private config: PrimeNGConfig,private messageService: MessageService,
				private proveedorService:ProveedorService,
				private ordenService:OrdencompraService,private  validacionService:ValidacionesService,
				private sanitizer: DomSanitizer,private funcionesService:FuncionesService,
				private router:Router,public dialogService: DialogService,private excelService: ExcelService,) {
		this.loading=false

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


	cambioproveedorperiodo(){
		// this.listaMateriaPrimaxProveedor=this.selectedprov.detalle
		// this.listaMateriaPrimaSelected=[]
		// this.requerimientosave.imptotal=0
		this.ordenperiodo.idproveedor=this.selectedprov.idproveedor
		this.ordenperiodo.fechainicial=this.funcionesService.convetir_de_date_a_string_fecha(this.fechainicial)
		this.ordenperiodo.fechafinal=this.funcionesService.convetir_de_date_a_string_fecha(this.fechafinal)
		this.spinner=true
		this.ordenService.getOrdenesxProveedorperiodo(this.ordenperiodo).subscribe({
			next:(data)=>{

				this.listaOrdenes=data.data
				// this.listaOrdenes.forEach(e=>{
				// 	e.detalleorden.forEach(l=>{
				// 		l.switchcumple=l.cumple==1?true:false
				// 	})
				// })
				this.spinner=false
			},error:(err)=>{
				this.spinner=false
			}
		})
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


	imprimir_ordencompra() {
		let json = {
			data: {
				ordencompra:this.ordenperiodo
			},
			tipo_proceso: "listado-compra",
			tipo_reporte: "listado-compra",
		};
		this.dialogService.open(ReportesComponent, {
			header: "Reporte Orden de compra por Periodo - "+this.selectedprov.descripcion,
			width: "80%",
			height: "97%",
			contentStyle: { overflow: "auto" },
			baseZIndex: 99999,
			maximizable: true,
			data: json,
		});
	}
	download() {
		let cabecera: any[] = [];
		let campos: any[] = [];
		let ancho: any[] = [];
		let subcabecera: any[] = [];
		let sumarcampos: any[] = [];

		// Define headers
		cabecera = [
			"ID Orden Compra",
			"Fecha de Emisión",
			"Importe Total",
			"Estado",
			"Responsable"
		];

		// Define fields (deben coincidir con los nombres del JSON)
		campos = [
			"id_orden_compra",
			"fechaemision",
			"imptotal",
			"estadoord",
			"responsable"
		];

		// Column widths
		ancho = [
			20, // id_materia_prima
			40, // fechaemision
			20, // imptotal
			30, // estadoord
			30, // responsable
		];

		// Campos que se deben sumar (1 si es numérico acumulable)
		sumarcampos = [
			0, // id_materia_prima
			0, // nombre
			0, // costo_gramo
			1, // id_requerimiento_stock
			0  // estadorequerimiento
		];

		// Subcabecera con datos adicionales
		subcabecera = [
			"# Items: " + (this.listaOrdenes?.length || 0)
		];

		// Agregar columna inicial vacía
		cabecera.unshift("");
		campos.unshift("");

		// Llamar a servicio Excel
		this.excelService.downloadExcel(
			this.listaOrdenes, // viene del API
			cabecera,
			campos,
			"Listado orden de Compras -"+this.selectedprov.descripcion,
			ancho,
			subcabecera,
			"orden-compra",
			sumarcampos
		);
	}
}
