import {Component, ViewEncapsulation} from '@angular/core';
import {KardexService} from "../../../services/inventario/kardex.service";
import {ActivatedRoute} from "@angular/router";
import {kardexModel} from "../../../model/kardexModel";
import {BadgeModule} from "primeng/badge";
import {Button} from "primeng/button";
import {CargaComponent} from "../../../components/carga/carga.component";
import {IconFieldModule} from "primeng/iconfield";
import {InputIconModule} from "primeng/inputicon";
import {InputTextModule} from "primeng/inputtext";
import {MessageService, PrimeTemplate} from "primeng/api";
import {Table, TableModule} from "primeng/table";
import {TagModule} from "primeng/tag";
import {ToastModule} from "primeng/toast";
import {TooltipModule} from "primeng/tooltip";
import {CommonModule, DatePipe, registerLocaleData} from "@angular/common";
import {SliderModule} from "primeng/slider";
import {FormsModule} from "@angular/forms";
import {DropdownModule} from "primeng/dropdown";
import {ExcelService} from "../../../services/excel.service";
import {FuncionesService} from "../../../services/funciones.service";
import localeEsPe from '@angular/common/locales/es-PE';

// registrar locale antes de bootstrapApplication
registerLocaleData(localeEsPe, 'es-PE');

@Component({
  selector: 'app-kardex-producto',
  standalone: true,
    imports: [
        BadgeModule,
        Button,
        CargaComponent,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        PrimeTemplate,
        TableModule,
        TagModule,
        ToastModule,
        TooltipModule,
        DatePipe,
        SliderModule,
        CommonModule,
        FormsModule,
        DropdownModule
    ],
  templateUrl: './kardex-producto.component.html',
  styleUrl: './kardex-producto.component.scss',
	providers: [MessageService,DatePipe,FuncionesService,ExcelService],
	encapsulation: ViewEncapsulation.None,
})
export class KardexProductoComponent {

	id_materia_prima:number=0

	activityValuesEntrada: number[] = [0, 9999];
	activityValuesSalida: number[] = [0, 9999];
	activityValuesActual: number[] = [0, 9999];
	listaKardex:kardexModel[]=[]
	tipoPresentacion:any=[{
		id_presentacion:1,
		presentacion:'Resumen'
	},{
		id_presentacion:2,
		presentacion:'Detallado'
	}]
	cambio_pres:number=1
	spinner:boolean=false
	cantidadentrada:number=0
	cantidadsalida:number=0
	stock:number=0
	constructor(private kardexService:KardexService,
				private route: ActivatedRoute,
				private excelService:ExcelService) {
	}
	ngOnInit(){
		this.spinner=true
		this.cantidadentrada=0
		this.cantidadsalida=0
		this.stock=0
		this.id_materia_prima= Number(this.route.snapshot.paramMap.get('id_materia_prima'));
		this.kardexService.getKardexMateriaPrima(this.id_materia_prima).subscribe({
			next:(data)=>{
				this.spinner=false
				this.listaKardex=data.data
				this.listaKardex.forEach(e=>{
					this.cantidadentrada+=e.cant_entrada
					this.cantidadsalida+=e.cant_salida
					this.stock+=e.cant_actual

				})

			},error:(err)=>{
				this.spinner=false
			}
		})
	}
	clear(table: Table) {
		table.clear(); // o lo que sea necesario
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

	cambiopresentacion(){

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
