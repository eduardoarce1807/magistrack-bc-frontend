import {Component, ViewEncapsulation} from '@angular/core';
import {Button, ButtonModule} from "primeng/button";
import {CargaComponent} from "../../../components/carga/carga.component";
import {DialogModule} from "primeng/dialog";
import {IconFieldModule} from "primeng/iconfield";
import {InputIconModule} from "primeng/inputicon";
import {InputTextModule} from "primeng/inputtext";
import {MenuItem, MessageService, PrimeNGConfig, PrimeTemplate} from "primeng/api";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {Table, TableModule} from "primeng/table";
import {ToastModule} from "primeng/toast";
import {iterequerimientoModel, ObsevacionesReqModel, RequeremientossaveModel} from "../../../model/requerimientosModel";
import {materiaxproveedorModel, proveedorModel, soloproveedorModel} from "../../../model/proveedoresModel";
import {ProveedorService} from "../../../services/compras/proveedor.service";
import {AsyncPipe, CommonModule, CurrencyPipe, DatePipe, DecimalPipe} from "@angular/common";
import {NgbHighlight, NgbPaginationModule} from "@ng-bootstrap/ng-bootstrap";
import {TagModule} from "primeng/tag";
import {CheckboxModule} from "primeng/checkbox";
import {SliderModule} from "primeng/slider";
import {DropdownModule} from "primeng/dropdown";
import {SplitButtonModule} from "primeng/splitbutton";
import {MultiSelectModule} from "primeng/multiselect";
import {CalendarModule} from "primeng/calendar";
import {InputTextareaModule} from "primeng/inputtextarea";
import {FileUploadModule} from "primeng/fileupload";
import {BadgeModule} from "primeng/badge";
import {materiasprimasModel} from "../../../model/materiasprimasModel";
import {MateriaPrimaService} from "../../../services/materia-prima.service";

@Component({
  selector: 'app-asignar-proveedor',
  standalone: true,
    imports: [

		CommonModule, DecimalPipe, FormsModule, AsyncPipe, NgbHighlight, NgbPaginationModule, DatePipe, CurrencyPipe, TagModule, ButtonModule,
		CheckboxModule, TableModule, SliderModule, DropdownModule, IconFieldModule, InputIconModule,
		SplitButtonModule, MultiSelectModule, InputTextModule, DialogModule, ToastModule,
		CalendarModule, InputTextareaModule, FileUploadModule, BadgeModule, CargaComponent
    ],
  templateUrl: './asignar-proveedor.component.html',
  styleUrl: './asignar-proveedor.component.scss',
	providers: [MessageService],
	encapsulation: ViewEncapsulation.None,
})
export class AsignarProveedorComponent {
	page = 1;
	listaMateriaPrima:materiasprimasModel[]=[]
	selectedCustomers: materiasprimasModel[]=[]
	pageSize = 4;
	collectionSize = 0;
	listaRequerimientos: RequeremientossaveModel[] = [];
	listaProveedores: proveedorModel[]=[]
	listaRequerimientospaginado: RequeremientossaveModel[] = [];
	items: MenuItem[]=[];
	verdetalle:boolean=false
	spinner:boolean=false
	loading: boolean = false;
	verordencompra:boolean=false
	fila_select:proveedorModel = new proveedorModel()
	listadomateria:materiaxproveedorModel[]=[]
	verobservaciones:boolean=false
	observaciones:ObsevacionesReqModel=new ObsevacionesReqModel()
	files:File[] = [];
	op:number=1
	constructor(private config: PrimeNGConfig,private messageService: MessageService,
				private proveedorService:ProveedorService,private materiaprimaService:MateriaPrimaService,) {
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

		this.refreshRequerimientos();
	}

	ngOnInit(){
		this.loading=true
		this.cargarproveedores()
		this.cargarmateriaprima()
	}
	cargarproveedores(){
		this.proveedorService.getProveedorxMateria().subscribe({
			next:(data)=>{
				this.listaProveedores=data.data.listar
				this.loading=false
			},error:(err)=>{
				this.loading=false
			}
		})
	}
	cargarmateriaprima(){
		this.spinner=true
		this.materiaprimaService.getMateriasPrimas().subscribe({
			next:(data)=>{
				this.listaMateriaPrima=data
				this.spinner=false
			},error:(err)=>{
				this.spinner=false
				this.messageService.add({ severity: 'danger', summary: 'Error', detail: 'Ocurrió un problema al lista las materias Primas' });
			}
		})
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
	guardarproveedor(){
		this.spinner=true
		this.verdetalle=false
		this.proveedorService.registrarProveedor(this.fila_select,this.op).subscribe({
			next:(data)=>{
				this.verdetalle=false
				this.spinner=false
				this.cargarproveedores()
				this.messageService.add({ severity: 'success', summary: 'Aviso de usuario', detail: 'Se registrò con Éxito el proveedor' });
			},error:(err)=>{
				this.verdetalle=true
				this.messageService.add({ severity: 'error', summary: 'Aviso de usuario', detail: 'Ocurriò un error al guardar' });
			}
		})
	}
	onRowSelect(event: any) {
		// console.log(this.selectedCustomers)

		// this.detalle=this.selectedCustomers.detalle
		let registro : iterequerimientoModel = new iterequerimientoModel()
		// registro.id_materia_prima=this.selectedCustomers.idMateriaPrima
		// registro.costo_gramo=this.selectedCustomers.costoGramo
		// registro.desmateriaprima=this.selectedCustomers.nombre



		// this.messageService.add({ severity: 'info', summary: 'Product Selected', detail: this.selectedCustomers.proveedor! });
	}
	onRowSelectProv(event: any,proveedor:proveedorModel) {
		// console.log(this.selectedCustomers)
		this.fila_select=proveedor
		this.selectedCustomers=[]
		proveedor.detalle.forEach(e=>{
			let registro:materiasprimasModel=new materiasprimasModel()
			registro.nombre=e.nombre
			registro.idMateriaPrima=e.id_materia_prima
			registro.costoGramo=e.costo_gramo
			this.selectedCustomers.push(registro)
		})
		// this.detalle=this.selectedCustomers.detalle
		let registro : iterequerimientoModel = new iterequerimientoModel()
		// registro.id_materia_prima=this.selectedCustomers.idMateriaPrima
		// registro.costo_gramo=this.selectedCustomers.costoGramo
		// registro.desmateriaprima=this.selectedCustomers.nombre



		// this.messageService.add({ severity: 'info', summary: 'Product Selected', detail: this.selectedCustomers.proveedor! });
	}
	actualizarmateria(){
		this.listadomateria=[]
		this.selectedCustomers.forEach(e=>{
			let registro :materiaxproveedorModel=new materiaxproveedorModel()
			registro.id_proveedor=this.fila_select.idproveedor
			registro.id_materia_prima=e.idMateriaPrima
			registro.estado="ACTIVO"
			registro.precio_prov=e.costoGramo
			this.listadomateria.push(registro)
		})
		this.spinner=true
		this.proveedorService.registrarmateriaProveedor(this.fila_select.idproveedor!,this.listadomateria).subscribe({
			next:(data)=>{
				this.cargarproveedores()
				this.spinner=false
			},error:(err)=>{
				this.spinner=false
			}
		})
	}
}
