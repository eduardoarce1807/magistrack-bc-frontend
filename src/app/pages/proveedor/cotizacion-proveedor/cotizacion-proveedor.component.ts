import {Component, ViewEncapsulation} from '@angular/core';
import {Button} from "primeng/button";
import {DialogModule} from "primeng/dialog";
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
import {CotizacionesService} from "../../../services/compras/cotizaciones.service";
import {CargaComponent} from "../../../components/carga/carga.component";
import {cotizacionModel} from "../../../model/cotizacionesModel";
import {CurrencyPipe} from "@angular/common";
import {TagModule} from "primeng/tag";

@Component({
  selector: 'app-cotizacion-proveedor',
  standalone: true,
	imports: [
		Button,
		DialogModule,
		IconFieldModule,
		InputIconModule,
		InputTextModule,
		PaginatorModule,
		PrimeTemplate,
		TableModule,
		ToastModule,
		CargaComponent,
		CurrencyPipe,
		TagModule
	],
  templateUrl: './cotizacion-proveedor.component.html',
  styleUrl: './cotizacion-proveedor.component.scss',
	providers: [MessageService],
	encapsulation: ViewEncapsulation.None,
})
export class CotizacionProveedorComponent {
	page = 1;
	pageSize = 4;
	collectionSize = 0;
	listaRequerimientos: RequeremientossaveModel[] = [];
	listaProveedores: soloproveedorModel[] = [];
	listaCotizaciones: cotizacionModel[] = [];
	listaRequerimientospaginado: RequeremientossaveModel[] = [];
	selectedprov:proveedorModel=new proveedorModel()
	items: MenuItem[]=[];
	representatives!: RequeremientosModel[];
	sumaorder:number=0
	verdetalle:boolean=false
	spinner:boolean=false
	loading: boolean = false;
	verordencompra:boolean=false
	condicionpago:string=''
	fechaentrega: Date = new Date();
	fila_select:soloproveedorModel = new soloproveedorModel()
	verobservaciones:boolean=false
	observaciones:ObsevacionesReqModel=new ObsevacionesReqModel()
	activityValues: number[] = [0, 100];
	files:File[] = [];
	cargaprov:boolean=false
	totalSize : number = 0;

	totalSizePercent : number = 0;
	constructor(private config: PrimeNGConfig,private messageService: MessageService,
				private requerimietoService:RequerimientosService, private proveedorService:ProveedorService,
				private cotizacionesService:CotizacionesService) {
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
	}
	nuevoproveedor(){
		this.fila_select = new soloproveedorModel()
	}
	cambioproveedor(){
		// this.listaMateriaPrimaxProveedor=this.selectedprov.detalle
		// this.listaMateriaPrimaSelected=[]
		// this.requerimientosave.imptotal=0
		this.spinner=true
		this.cotizacionesService.getCotizacionesxProveedor(this.selectedprov.idproveedor!).subscribe({
			next:(data)=>{
				this.spinner=false
				this.listaCotizaciones=data.data.listar
			},error:(err)=>{
				this.spinner=false
			}
		})
	}
	getTipoGanador(id_tipo_ganador: number): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' | undefined {
		switch (id_tipo_ganador) {
			case 1:
				return 'info';
			case 2:
				return 'success';
			case 3:
				return 'warning';
			default:
				return 'secondary';
		}
	}
}
