import {Component, ViewEncapsulation} from '@angular/core';
import {Button} from "primeng/button";
import {CalendarModule} from "primeng/calendar";
import {CargaComponent} from "../../../../components/carga/carga.component";
import {CommonModule, CurrencyPipe, DatePipe} from "@angular/common";
import {IconFieldModule} from "primeng/iconfield";
import {InputIconModule} from "primeng/inputicon";
import {InputTextModule} from "primeng/inputtext";
import {MenuItem, MessageService, PrimeNGConfig, PrimeTemplate} from "primeng/api";
import {SliderModule} from "primeng/slider";
import {Table, TableModule} from "primeng/table";
import {TagModule} from "primeng/tag";
import {ToastModule} from "primeng/toast";
import {TooltipModule} from "primeng/tooltip";
import {kardexModel, kardexPeriodo} from "../../../../model/kardexModel";
import {Detalleorden, FacturaOrden, ordencompraModel, RespuestaOrden} from "../../../../model/ordencompraModel";
import {proveedorModel, soloproveedorModel} from "../../../../model/proveedoresModel";
import {ObsevacionesReqModel} from "../../../../model/requerimientosModel";
import {DomSanitizer, SafeResourceUrl} from "@angular/platform-browser";
import {ProveedorService} from "../../../../services/compras/proveedor.service";
import {OrdencompraService} from "../../../../services/compras/ordencompra.service";
import {ValidacionesService} from "../../../../services/compras/validaciones.service";
import {FuncionesService} from "../../../../services/funciones.service";
import {Router, RouterLink} from "@angular/router";
import {DialogService} from "primeng/dynamicdialog";
import {ExcelService} from "../../../../services/excel.service";
import {KardexService} from "../../../../services/inventario/kardex.service";
import {ReportesComponent} from "../../../../components/reportes/reportes.component";
import {DialogModule} from "primeng/dialog";
import {DropdownModule} from "primeng/dropdown";
import {PaginatorModule} from "primeng/paginator";
import {BadgeModule} from "primeng/badge";
import {FileUploadModule} from "primeng/fileupload";
import {InputTextareaModule} from "primeng/inputtextarea";
import {ProgressBarModule} from "primeng/progressbar";
import {FormsModule} from "@angular/forms";
import {InputSwitchModule} from "primeng/inputswitch";
import {UppercaseDirective} from "../../../../directives/uppercase.directive";
import {RadioButtonModule} from "primeng/radiobutton";

@Component({
  selector: 'app-reporte-valorizacion',
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
  templateUrl: './reporte-valorizacion.component.html',
  styleUrl: './reporte-valorizacion.component.scss',
	providers: [MessageService,DatePipe,FuncionesService,DialogService,ExcelService,],
	encapsulation: ViewEncapsulation.None,
})
export class ReporteValorizacionComponent {
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
	cantidadentrada:number=0
	cantidadsalida:number=0
	subtotalentrada:number=0
	subtotalsalida:number=0
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
		this.cantidadentrada=0
		this.cantidadsalida=0
		this.subtotalentrada=0
		this.subtotalsalida=0
		this.spinner=true
		this.kardexService.getKardexPeriodo(this.kardexperiodo).subscribe({
			next:(data)=>{
				this.spinner=false
				this.listaKardex=data.data
				this.listaKardex.forEach(e=>{
					this.cantidadentrada+=e.cant_entrada
					this.cantidadsalida+=e.cant_salida
					this.subtotalentrada+=e.impsubtotalentrada
					this.subtotalsalida+=e.impsubtotalsalida
				})
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
			header: "Reporte Valorización entrada/salida",
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
			"Cantidad Entrada",
			"Cantidad Salida",
			"Cantidad Actual",
			"Stock Materia",
			"Importe Unitario",
			"Observaciones",
			"Subtotalentrada",
			"Subtotalsalida"
		];

		// Campos que deben coincidir con el JSON
		campos = [
			"fecha",
			"cant_entrada",
			"cant_salida",
			"cant_actual",
			"stock_materia",
			"impunit",
			"observaciones",
			"impsubtotalentrada",
			"impsubtotalsalida"
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
			30, // observaciones
			30, // id_materia_prima
		];

		// Campos numéricos que quieres acumular/sumar
		sumarcampos = [
			0, // fecha
			0, // fecha
			1, // cant_entrada
			1, // cant_salida
			0, // cant_actual
			0, // stock_materia
			0,
			0,
			1, // impunit
			1
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
			"Valorización entrad/salida Materias Primas",
			ancho,
			subcabecera,
			"kardex_valorizacion",
			sumarcampos
		);
	}
}
