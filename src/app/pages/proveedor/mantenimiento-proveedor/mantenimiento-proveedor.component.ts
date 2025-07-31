import {Component, ViewEncapsulation} from '@angular/core';
import {BadgeModule} from "primeng/badge";
import {Button, ButtonModule} from "primeng/button";
import {CalendarModule} from "primeng/calendar";
import {AsyncPipe, CommonModule, CurrencyPipe, DatePipe, DecimalPipe} from "@angular/common";
import {DialogModule} from "primeng/dialog";
import {FileUploadModule} from "primeng/fileupload";
import {IconFieldModule} from "primeng/iconfield";
import {InputIconModule} from "primeng/inputicon";
import {InputTextModule} from "primeng/inputtext";
import {InputTextareaModule} from "primeng/inputtextarea";
import {MultiSelectModule} from "primeng/multiselect";
import {MenuItem, MessageService, PrimeNGConfig} from "primeng/api";
import {FormsModule} from "@angular/forms";
import {SplitButtonModule} from "primeng/splitbutton";
import {Table, TableModule} from "primeng/table";
import {TagModule} from "primeng/tag";
import {ToastModule} from "primeng/toast";
import { soloproveedorModel} from "../../../model/proveedoresModel";
import {
	ObsevacionesReqModel,
	RequeremientosModel,
	RequeremientossaveModel
} from "../../../model/requerimientosModel";
import {NgbHighlight, NgbPaginationModule} from "@ng-bootstrap/ng-bootstrap";
import {CheckboxModule} from "primeng/checkbox";
import {SliderModule} from "primeng/slider";
import {DropdownModule} from "primeng/dropdown";
import {ProveedorService} from "../../../services/compras/proveedor.service";
import {CargaComponent} from "../../../components/carga/carga.component";
import {UppercaseDirective} from "../../../directives/uppercase.directive";

@Component({
  selector: 'app-mantenimiento-proveedor',
  standalone: true,
	imports: [
		CommonModule, DecimalPipe, FormsModule, AsyncPipe, NgbHighlight, NgbPaginationModule, DatePipe, CurrencyPipe, TagModule, ButtonModule,
		CheckboxModule, TableModule, SliderModule, DropdownModule, IconFieldModule, InputIconModule,
		SplitButtonModule, MultiSelectModule, InputTextModule, DialogModule, ToastModule,
		CalendarModule, InputTextareaModule, FileUploadModule, BadgeModule, CargaComponent, UppercaseDirective
	],
  templateUrl: './mantenimiento-proveedor.component.html',
  styleUrl: './mantenimiento-proveedor.component.scss',
	providers: [MessageService],
	encapsulation: ViewEncapsulation.None,
})
export class MantenimientoProveedorComponent {
	page = 1;
	pageSize = 4;
	collectionSize = 0;
	listaRequerimientos: RequeremientossaveModel[] = [];
	listaProveedores: soloproveedorModel[] = [];
	listaRequerimientospaginado: RequeremientossaveModel[] = [];
	items: MenuItem[]=[];
	verdetalle:boolean=false
	spinner:boolean=false
	loading: boolean = false;
	verordencompra:boolean=false
	fila_select:soloproveedorModel = new soloproveedorModel()
	verobservaciones:boolean=false
	observaciones:ObsevacionesReqModel=new ObsevacionesReqModel()
	files:File[] = [];
	op:number=1
	totalSize : number = 0;

	totalSizePercent : number = 0;
	constructor(private config: PrimeNGConfig,private messageService: MessageService,
				private proveedorService:ProveedorService) {
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
	}
	cargarproveedores(){
		this.proveedorService.getProveedor().subscribe({
			next:(data)=>{
				this.listaProveedores=data.data
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
	editarproveedor(registro:soloproveedorModel){
		this.fila_select=registro
		this.verdetalle=true
		this.op=2
	}
	nuevoproveedor(){
		this.verdetalle=true
		this.fila_select = new soloproveedorModel()
		this.op=1
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
}
