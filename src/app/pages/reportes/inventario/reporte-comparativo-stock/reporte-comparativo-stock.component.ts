import {Component, ViewEncapsulation} from '@angular/core';
import {Button} from "primeng/button";
import {CalendarModule} from "primeng/calendar";
import {CargaComponent} from "../../../../components/carga/carga.component";
import {CommonModule, CurrencyPipe, DatePipe} from "@angular/common";
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
	RespuestaOrden
} from "../../../../model/ordencompraModel";
import {proveedorModel, soloproveedorModel} from "../../../../model/proveedoresModel";
import {ObsevacionesReqModel} from "../../../../model/requerimientosModel";
import {DomSanitizer, SafeResourceUrl} from "@angular/platform-browser";
import {ProveedorService} from "../../../../services/compras/proveedor.service";
import {OrdencompraService} from "../../../../services/compras/ordencompra.service";
import {ValidacionesService} from "../../../../services/compras/validaciones.service";
import {ReportesComponent} from "../../../../components/reportes/reportes.component";
import {TipomateriaModel} from "../../../../model/inventarioModel";
import {kardexModel, movimientoKardexTipo} from "../../../../model/kardexModel";
import {MateriaprimaService} from "../../../../services/inventario/materiaprima.service";
import {KardexService} from "../../../../services/inventario/kardex.service";

@Component({
  selector: 'app-reporte-comparativo-stock',
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
  templateUrl: './reporte-comparativo-stock.component.html',
  styleUrl: './reporte-comparativo-stock.component.scss',
	providers: [MessageService,DatePipe,FuncionesService,DialogService,ExcelService],
	encapsulation: ViewEncapsulation.None,
})
export class ReporteComparativoStockComponent {
	page = 1;
	pageSize = 4;
	collectionSize = 0;
	expandedRows = {};
	fechaemision:any=new Date()
	listaKardex: kardexModel[] = [];
	listaProveedores: soloproveedorModel[] = [];
	selectedtipomateria:TipomateriaModel=new TipomateriaModel()
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
	listaTipomateria:TipomateriaModel[]=[]
	items: MenuItem[]=[];
	verdetalle:boolean=false
	spinner:boolean=false
	carga:boolean=false
	loading: boolean = false;
	verordencompra:boolean=false
	fila_select:ordencompraModel = new ordencompraModel()
	detalle_select:Detalleorden=new Detalleorden()
	ordenperiodo:movimientoKardexTipo=new movimientoKardexTipo()
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
				private materiaService: MateriaprimaService,private  validacionService:ValidacionesService,
				private sanitizer: DomSanitizer,private funcionesService:FuncionesService,
				private router:Router,public dialogService: DialogService,private excelService: ExcelService,
				private kardexService:KardexService) {
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
		this.cargartipomateria()
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
		this.ordenperiodo.idproveedor=this.selectedprov.idproveedor
		this.spinner=true
		this.kardexService.getKardextipoMateriaProveedor(this.selectedtipomateria.id_tipomateria,this.selectedprov.idproveedor!).subscribe({
			next:(data)=>{

				this.listaKardex=data.data
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


	imprimir_materiaprima() {
		let json = {
			data: {
				idproveedor:this.selectedprov.idproveedor,
				tipomateria:this.selectedtipomateria.id_tipomateria
			},
			tipo_proceso: "listado-materia",
			tipo_reporte: "listado-materia",
		};
		this.dialogService.open(ReportesComponent, {
			header: "Reporte Materia Prima por Proveedor - "+this.selectedprov.descripcion,
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
			"Materia Prima / Envase",
			"Stock actual",
			"Umbral Mínimo",
			"Porcentaje",
			"Estado",
			"Proveedor"
		];

		// Define fields (deben coincidir con los nombres del JSON)
		campos = [
			"nombre",
			"stock_materia",
			"umbral_min",
			"porcentaje",
			"estado",
			"descripcion"
		];

		// Column widths
		ancho = [
			50, // nombre
			30, // stock
			20, // umbral
			20, // porcentaje
			40, // estado
			50, // proveedor
		];

		// Campos que se deben sumar (1 si es numérico acumulable)
		sumarcampos = [
			0, // nombre
			0, // stock
			1, // umbral
			0, // porcentaje
			0,  // estado,
			0  // proveedor
		];

		// Subcabecera con datos adicionales
		subcabecera = [
			"# Items: " + (this.listaKardex?.length || 0)
		];

		// Agregar columna inicial vacía
		cabecera.unshift("");
		campos.unshift("");

		// Llamar a servicio Excel
		this.excelService.downloadExcel(
			this.listaKardex, // viene del API
			cabecera,
			campos,
			"Listado orden de Compras -"+this.selectedprov.descripcion,
			ancho,
			subcabecera,
			"orden-compra",
			sumarcampos
		);
	}
	cargartipomateria(){
		this.materiaService.getTipoMateriaprima().subscribe({
			next:(data)=>{
				this.listaTipomateria=data.data
				this.loading=false
			},error:(err)=>{
				this.loading=false
			}
		})
	}
	getSeverity(estado: string | null | undefined): "success" | "info" | "warning" | "danger" | "secondary" | "contrast" | undefined {
		if (!estado) return undefined;

		switch (estado.toUpperCase()) {
			case 'GENERAR REQUERIMIENTO': return 'danger';
			case 'REQUIERE REPOSICIÓN': return 'warning';
			case 'STOCK SUFICIENTE': return 'success';
			default: return 'secondary';         // Gray (fallback)
		}
	}
}
