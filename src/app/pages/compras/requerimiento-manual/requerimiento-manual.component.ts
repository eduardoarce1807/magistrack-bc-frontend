import {Component, ViewEncapsulation} from '@angular/core';
import {BadgeModule} from "primeng/badge";
import {Button, ButtonModule} from "primeng/button";
import {CalendarModule} from "primeng/calendar";
import {AsyncPipe, CommonModule, CurrencyPipe, DatePipe, DecimalPipe, NgForOf, NgIf} from "@angular/common";
import {DialogModule} from "primeng/dialog";
import {FileUploadModule} from "primeng/fileupload";
import {IconFieldModule} from "primeng/iconfield";
import {InputIconModule} from "primeng/inputicon";
import {InputTextModule} from "primeng/inputtext";
import {InputTextareaModule} from "primeng/inputtextarea";
import {MultiSelectModule} from "primeng/multiselect";
import {MenuItem, MessageService, PrimeNGConfig, PrimeTemplate} from "primeng/api";
import {SplitButtonModule} from "primeng/splitbutton";
import {Table, TableModule} from "primeng/table";
import {ToastModule} from "primeng/toast";
import {FormsModule} from "@angular/forms";
import {NgbHighlight, NgbPaginationModule} from "@ng-bootstrap/ng-bootstrap";
import {TagModule} from "primeng/tag";
import {CheckboxModule} from "primeng/checkbox";
import {SliderModule} from "primeng/slider";
import {DropdownModule} from "primeng/dropdown";
import {ListaMateriaModel, proveedorModel} from "../../../model/proveedoresModel";
import {MateriaPrimaService} from "../../../services/materia-prima.service";
import { materiasprimasModel} from "../../../model/materiasprimasModel";
import {TooltipModule} from "primeng/tooltip";
import {PanelModule} from "primeng/panel";
import {iterequerimientoModel, RequeremientossaveModel} from "../../../model/requerimientosModel";
import {InputNumberModule} from "primeng/inputnumber";
import {RequerimientosService} from "../../../services/compras/requerimientos.service";

@Component({
  selector: 'app-requerimiento-manual',
  standalone: true,
	imports: [CommonModule, DecimalPipe, FormsModule, AsyncPipe, NgbHighlight, NgbPaginationModule, DatePipe, CurrencyPipe, TagModule, ButtonModule,
		CheckboxModule, TableModule, SliderModule, DropdownModule, IconFieldModule, InputIconModule,
		SplitButtonModule, MultiSelectModule, InputTextModule, DialogModule, ToastModule,
		CalendarModule,InputTextareaModule,FileUploadModule,BadgeModule,TooltipModule,PanelModule,InputNumberModule
	],
  templateUrl: './requerimiento-manual.component.html',
  styleUrl: './requerimiento-manual.component.scss',
	providers: [MessageService],
	encapsulation: ViewEncapsulation.None,
})
export class RequerimientoManualComponent {
	page = 1;
	pageSize = 4;
	collectionSize = 0;

	glosa:any
	listaRequerimientos: proveedorModel[] = [];
	selectedCustomers: materiasprimasModel = new materiasprimasModel();
	items: MenuItem[]=[];
	sumaorder:number=0
	verdetalle:boolean=false
	totalacumulado:number=0
	responsable:string=''
	areasolicitante:string=''
	loading: boolean = true;
	verordencompra:boolean=false
	condicionpago:string=''
	fechaentrega: Date = new Date();
	fila_select:proveedorModel = new proveedorModel()
	listaMateriaPrima:materiasprimasModel[]=[]
	listaMateriaPrimaSelected:iterequerimientoModel[]=[]

	verobservaciones:boolean=false
	activityValues: number[] = [0, 100];
	files:File[] = [];
	detalle:ListaMateriaModel[]=[]
	selectedMateria:ListaMateriaModel=new ListaMateriaModel()
	totalSize : number = 0;
	requerimientosave:RequeremientossaveModel=new RequeremientossaveModel()

	totalSizePercent : number = 0;
	constructor(private config: PrimeNGConfig,private messageService: MessageService,
				private materiaprimaService:MateriaPrimaService,private requerimietoService:RequerimientosService) {
		this.loading=false
		// this.listaRequerimientos = [
		// 	{
		// 		codigo: 1,
		// 		proveedor: 'Distribuidora Química Andina',
		// 		detalle: [
		// 			{ codigo: 'MAT001', descripcion: 'Aceite de coco refinado', unidad: 'lt', subtotal: 150.00 },
		// 			{ codigo: 'MAT002', descripcion: 'Lanolina anhidra', unidad: 'kg', subtotal: 280.00 },
		// 			{ codigo: 'MAT003', descripcion: 'Vitamina C pura', unidad: 'kg', subtotal: 320.00 },
		// 			{ codigo: 'MAT004', descripcion: 'Envases de 50ml PET', unidad: 'unid', subtotal: 90.00 }
		// 		]
		// 	},
		// 	{
		// 		codigo: 2,
		// 		proveedor: 'Insumos Farmacéuticos S.A.',
		// 		detalle: [
		// 			{ codigo: 'MAT005', descripcion: 'Glicerina bidestilada', unidad: 'lt', subtotal: 120.00 },
		// 			{ codigo: 'MAT006', descripcion: 'Ácido hialurónico', unidad: 'kg', subtotal: 450.00 },
		// 			{ codigo: 'MAT007', descripcion: 'Extracto de aloe vera', unidad: 'lt', subtotal: 180.00 }
		// 		]
		// 	},
		// 	{
		// 		codigo: 3,
		// 		proveedor: 'Laboratorios Naturales del Sur',
		// 		detalle: [
		// 			{ codigo: 'MAT008', descripcion: 'Aceite de jojoba', unidad: 'lt', subtotal: 210.00 },
		// 			{ codigo: 'MAT009', descripcion: 'Cera de abejas pura', unidad: 'kg', subtotal: 250.00 },
		// 			{ codigo: 'MAT010', descripcion: 'Fragancia de lavanda', unidad: 'ml', subtotal: 75.00 },
		// 			{ codigo: 'MAT011', descripcion: 'Frascos de vidrio ámbar 100ml', unidad: 'unid', subtotal: 110.00 }
		// 		]
		// 	},
		// 	{
		// 		codigo: 4,
		// 		proveedor: 'Global Químicos Perú',
		// 		detalle: [
		// 			{ codigo: 'MAT012', descripcion: 'Alcohol etílico 96%', unidad: 'lt', subtotal: 95.00 },
		// 			{ codigo: 'MAT013', descripcion: 'Propilenglicol', unidad: 'lt', subtotal: 130.00 },
		// 			{ codigo: 'MAT014', descripcion: 'Colorante cosmético rojo', unidad: 'gr', subtotal: 50.00 }
		// 		]
		// 	},
		// 	{
		// 		codigo: 5,
		// 		proveedor: 'Bioinsumos del Pacífico',
		// 		detalle: [
		// 			{ codigo: 'MAT015', descripcion: 'Manteca de karité', unidad: 'kg', subtotal: 270.00 },
		// 			{ codigo: 'MAT016', descripcion: 'Aceite esencial de eucalipto', unidad: 'ml', subtotal: 90.00 },
		// 			{ codigo: 'MAT017', descripcion: 'Vitamina E natural', unidad: 'ml', subtotal: 130.00 },
		// 			{ codigo: 'MAT018', descripcion: 'Envases airless 30ml', unidad: 'unid', subtotal: 140.00 }
		// 		]
		// 	}
		// ];

		this.collectionSize = this.listaRequerimientos.length

	}

	ngOnInit(){
		this.loading=true
		this.materiaprimaService.getMateriasPrimas().subscribe({
			next:(data)=>{
				this.listaMateriaPrima=data
				this.loading=false
			},error:(err)=>{
				this.loading=false
				this.messageService.add({ severity: 'danger', summary: 'Error', detail: 'Ocurrió un problema al lista las materias Primas' });
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
	cargarRequerimiento(){

	}
	onRowSelect(event: any) {
		// console.log(this.selectedCustomers)

		// this.detalle=this.selectedCustomers.detalle
		let registro : iterequerimientoModel = new iterequerimientoModel()
		registro.id_materia_prima=this.selectedCustomers.idMateriaPrima
		registro.costo_gramo=this.selectedCustomers.costoGramo
		registro.desmateriaprima=this.selectedCustomers.nombre

		let existe = this.listaMateriaPrimaSelected.find(
			x => x.id_materia_prima === registro.id_materia_prima
		);

		if (!existe) {
			this.listaMateriaPrimaSelected.push(registro);
		} else {
			// Opcional: mostrar mensaje si ya existe
			this.messageService.add({ severity: 'warn', summary: 'Duplicado', detail: 'Ya fue agregado' });
		}


		// this.messageService.add({ severity: 'info', summary: 'Product Selected', detail: this.selectedCustomers.proveedor! });
	}

	guardarRequermiento(){
		this.requerimientosave.estadorequerimiento='PENDIENTE'
		this.requerimientosave.iterequerimiento=this.listaMateriaPrimaSelected
		// console.log(this.requerimientosave)
		this.requerimietoService.registrarRequerimientos(this.requerimientosave,1).subscribe({
			next:(data)=>{
				this.requerimientosave=new RequeremientossaveModel()
				this.listaMateriaPrimaSelected=[]
				this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Se guardó el registro correctamente' });
			},error:(err)=>{
				this.messageService.add({ severity: 'error', summary: 'Eliminado', detail: 'Ocurrió un error al guardar el requerimiento' });
			}
		})
	}
	eliminarRegistro(registro:iterequerimientoModel){
		this.listaMateriaPrimaSelected = this.listaMateriaPrimaSelected.filter(
			x => x.id_materia_prima !== registro.id_materia_prima
		);
		this.messageService.add({ severity: 'error', summary: 'Eliminado', detail: 'Materia Prima Eliminada' });
	}
	cambiocantidad(registro:iterequerimientoModel){
		registro.impsubtotal = parseFloat(
			(registro.cantidad_requerida * registro.costo_gramo).toFixed(2)
		);

		this.requerimientosave.imptotal = this.listaMateriaPrimaSelected
			.reduce((sum, e) => sum + e.impsubtotal, 0);
	}
}
