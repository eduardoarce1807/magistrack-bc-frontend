import {Component, ViewEncapsulation} from '@angular/core';
import {Button} from "primeng/button";
import {CalendarModule} from "primeng/calendar";
import {CargaComponent} from "../../../../components/carga/carga.component";
import {CommonModule, CurrencyPipe, DatePipe, registerLocaleData} from "@angular/common";
import {DropdownModule} from "primeng/dropdown";
import {IconFieldModule} from "primeng/iconfield";
import {InputIconModule} from "primeng/inputicon";
import {InputTextModule} from "primeng/inputtext";
import {MenuItem, MessageService, PrimeNGConfig, PrimeTemplate} from "primeng/api";
import {Table, TableModule} from "primeng/table";
import {TagModule} from "primeng/tag";
import {ToastModule} from "primeng/toast";
import {TooltipModule} from "primeng/tooltip";
import {DialogModule} from "primeng/dialog";
import {PaginatorModule} from "primeng/paginator";
import {BadgeModule} from "primeng/badge";
import {FileUploadModule} from "primeng/fileupload";
import {InputTextareaModule} from "primeng/inputtextarea";
import {ProgressBarModule} from "primeng/progressbar";
import {FormsModule} from "@angular/forms";
import {InputSwitchModule} from "primeng/inputswitch";
import {UppercaseDirective} from "../../../../directives/uppercase.directive";
import {RadioButtonModule} from "primeng/radiobutton";
import {Router, RouterLink} from "@angular/router";
import {FuncionesService} from "../../../../services/funciones.service";
import {DialogService} from "primeng/dynamicdialog";
import {ExcelService} from "../../../../services/excel.service";
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
import {ReportesComponent} from "../../../../components/reportes/reportes.component";
import {KardexService} from "../../../../services/inventario/kardex.service";
import {kardexModel, kardexPeriodo} from "../../../../model/kardexModel";
import {SliderModule} from "primeng/slider";
import localeEsPe from '@angular/common/locales/es-PE';

// registrar locale antes de bootstrapApplication
registerLocaleData(localeEsPe, 'es-PE');

@Component({
  selector: 'app-reporte-entradas-salidas',
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
		FormsModule, CommonModule, CalendarModule, InputSwitchModule, TagModule, UppercaseDirective, RadioButtonModule, RouterLink, SliderModule
	],
  templateUrl: './reporte-entradas-salidas.component.html',
  styleUrl: './reporte-entradas-salidas.component.scss',
	providers: [MessageService,DatePipe,FuncionesService,DialogService,ExcelService,],
	encapsulation: ViewEncapsulation.None,
})
export class ReporteEntradasSalidasComponent {
	page = 1;
	pageSize = 4;
	collectionSize = 0;
	expandedRows = {};
	fechaemision:any=new Date()
	listaKardex:kardexModel[]=[]
	listaOrdenes: ordencompraModel[] = [];
	listaProveedores: soloproveedorModel[] = [];
	activityValuesEntrada: number[] = [0, 9999];
	activityValuesSalida: number[] = [0, 9999];
	activityValuesActual: number[] = [0, 9999];
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
	kardexperiodo:kardexPeriodo=new kardexPeriodo()
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
				private router:Router,public dialogService: DialogService,private excelService: ExcelService,
				private kardexService:KardexService) {
		this.loading=false

	}

	ngOnInit(){
		this.cargaprov=true
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
		this.kardexperiodo.fechainicial=this.funcionesService.convetir_de_date_a_string_fecha(this.fechainicial)
		this.kardexperiodo.fechafinal=this.funcionesService.convetir_de_date_a_string_fecha(this.fechafinal)
		console.log(this.kardexperiodo,"envio kardex")
		this.spinner=true
		this.kardexService.getKardexPeriodo(this.kardexperiodo).subscribe({
			next:(data)=>{
				this.spinner=false
				this.listaKardex=data.data
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
				kardex:this.kardexperiodo
			},
			tipo_proceso: "listado-kardex",
			tipo_reporte: "listado-kardex",
		};
		this.dialogService.open(ReportesComponent, {
			header: "Reporte Kardex por Periodo",
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

		// Encabezados visibles en el Excel
		cabecera = [
			"Fecha",
			"Documento",
			"Cantidad Entrada",
			"Cantidad Salida",
			"Cantidad Actual",
			"Stock Materia",
			"Importe Unitario",
			"Observaciones",
			"ID Materia Prima",
			"ID Movimiento",
			"Archivo Base64",
			"Path Kardex",
			"Extensión Doc",
			"Movimiento",
			"ID Tipo Movimiento",
			"Ficha Técnica",
			"Fecha Vencimiento",
			"Pureza",
			"Lote",
			"Peso Bruto",
			"Peso Neto"
		];

		// Campos que deben coincidir con el JSON
		campos = [
			"fecha",
			"documento",
			"cant_entrada",
			"cant_salida",
			"cant_actual",
			"stock_materia",
			"impunit",
			"observaciones",
			"id_materia_prima",
			"id_movimiento",
			"archivobase64",
			"path_kardex",
			"extensiondoc",
			"movimiento",
			"id_tipomovimiento",
			"ficha_tecnica",
			"fecha_vencimiento",
			"pureza",
			"lote",
			"peso_bruto",
			"peso_neto"
		];

		// Anchos de columnas (puedes ajustarlos)
		ancho = [
			20, // fecha
			25, // documento
			20, // cant_entrada
			20, // cant_salida
			20, // cant_actual
			20, // stock_materia
			20, // impunit
			40, // observaciones
			20, // id_materia_prima
			20, // id_movimiento
			40, // archivobase64
			40, // path_kardex
			20, // extensiondoc
			20, // movimiento
			25, // id_tipomovimiento
			30, // ficha_tecnica
			20, // fecha_vencimiento
			20, // pureza
			20, // lote
			20, // peso_bruto
			20  // peso_neto
		];

		// Campos numéricos que quieres acumular/sumar
		sumarcampos = [
			0, // fecha
			0, // documento
			1, // cant_entrada
			1, // cant_salida
			1, // cant_actual
			1, // stock_materia
			1, // impunit
			0, // observaciones
			0, // id_materia_prima
			0, // id_movimiento
			0, // archivobase64
			0, // path_kardex
			0, // extensiondoc
			0, // movimiento
			0, // id_tipomovimiento
			0, // ficha_tecnica
			0, // fecha_vencimiento
			1, // pureza
			0, // lote
			1, // peso_bruto
			1  // peso_neto
		];

		// Subcabecera opcional
		subcabecera = [
			"# Items: " + (this.listaKardex?.length || 0)
		];

		// Agregar columna inicial vacía si tu servicio Excel lo requiere
		cabecera.unshift("");
		campos.unshift("");

		// Llamada al servicio de Excel
		this.excelService.downloadExcel(
			this.listaKardex, // los datos que vienen del API con ese JSON
			cabecera,
			campos,
			"Kardex Materias Primas",
			ancho,
			subcabecera,
			"kardex_materias_primas",
			sumarcampos
		);
	}
}
