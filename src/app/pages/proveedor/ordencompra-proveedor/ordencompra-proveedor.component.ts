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
import {Table, TableModule} from "primeng/table";
import {ToastModule} from "primeng/toast";
import {ObsevacionesReqModel, RequeremientosModel, RequeremientossaveModel} from "../../../model/requerimientosModel";
import {proveedorModel, soloproveedorModel} from "../../../model/proveedoresModel";
import {RequerimientosService} from "../../../services/compras/requerimientos.service";
import {ProveedorService} from "../../../services/compras/proveedor.service";
import {OrdencompraService} from "../../../services/compras/ordencompra.service";
import {ordencompraModel} from "../../../model/ordencompraModel";
import {CurrencyPipe} from "@angular/common";

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
		CurrencyPipe
	],
  templateUrl: './ordencompra-proveedor.component.html',
  styleUrl: './ordencompra-proveedor.component.scss',
	providers: [MessageService],
	encapsulation: ViewEncapsulation.None,
})
export class OrdencompraProveedorComponent {
	page = 1;
	pageSize = 4;
	collectionSize = 0;
	listaOrdenes: ordencompraModel[] = [];
	listaProveedores: soloproveedorModel[] = [];
	selectedprov:proveedorModel=new proveedorModel()
	items: MenuItem[]=[];
	verdetalle:boolean=false
	spinner:boolean=false
	loading: boolean = false;
	verordencompra:boolean=false
	fila_select:ordencompraModel = new ordencompraModel()
	verobservaciones:boolean=false
	observaciones:ObsevacionesReqModel=new ObsevacionesReqModel()
	files:File[] = [];
	cargaprov:boolean=false
	totalSize : number = 0;

	totalSizePercent : number = 0;
	constructor(private config: PrimeNGConfig,private messageService: MessageService,
				private requerimietoService:RequerimientosService, private proveedorService:ProveedorService,
				private ordenService:OrdencompraService) {
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
	editarproveedor(registro:ordencompraModel){
		this.fila_select=registro
		this.verdetalle=true
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
				this.spinner=false
			}
		})
	}
}
