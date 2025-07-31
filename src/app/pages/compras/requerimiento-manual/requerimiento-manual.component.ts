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
import {ProveedorService} from "../../../services/compras/proveedor.service";
import {ProgressSpinnerModule} from "primeng/progressspinner";
import {CargaComponent} from "../../../components/carga/carga.component";
import {EmailService} from "../../../services/email.service";
import Swal from "sweetalert2";
import {emailordenModel} from "../../../model/enviarEmailModel";
import {Router} from "@angular/router";
import {UppercaseDirective} from "../../../directives/uppercase.directive";

@Component({
  selector: 'app-requerimiento-manual',
  standalone: true,
	imports: [CommonModule, DecimalPipe, FormsModule, AsyncPipe, NgbHighlight, NgbPaginationModule, DatePipe, CurrencyPipe, TagModule, ButtonModule,
		CheckboxModule, TableModule, SliderModule, DropdownModule, IconFieldModule, InputIconModule,
		SplitButtonModule, MultiSelectModule, InputTextModule, DialogModule, ToastModule,
		CalendarModule, InputTextareaModule, FileUploadModule, BadgeModule, TooltipModule, PanelModule, InputNumberModule, CargaComponent, UppercaseDirective
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
	listaRequerimientos: proveedorModel[] = [];
	selectedCustomers: materiasprimasModel = new materiasprimasModel();
	selectedCustomersProv:ListaMateriaModel = new ListaMateriaModel()
	listaMateriaPrimaxProveedor:ListaMateriaModel[]=[]
	items: MenuItem[]=[];
	sumaorder:number=0
	spinner:boolean=false
	selectedprov:proveedorModel=new proveedorModel()
	cargaprov:boolean=true
	loading: boolean = true;
	ordencompra:string=''
	fila_select:proveedorModel = new proveedorModel()
	listaMateriaPrima:materiasprimasModel[]=[]
	listaMateriaPrimaSelected:iterequerimientoModel[]=[]
	visiblecorreo:boolean=false
	checkautomatico:boolean=true
	mensaje:string=''
	files:File[] = [];
	enviaremail: emailordenModel = new emailordenModel()
	totalSize : number = 0;
	requerimientosave:RequeremientossaveModel=new RequeremientossaveModel()
	listaProveedores:proveedorModel[]=[]
	totalSizePercent : number = 0;
	constructor(private config: PrimeNGConfig,private messageService: MessageService,
				private materiaprimaService:MateriaPrimaService,private requerimietoService:RequerimientosService,
				private proveedorService:ProveedorService,private emailService:EmailService,public router: Router) {
		this.loading=false


		this.collectionSize = this.listaRequerimientos.length

	}

	ngOnInit(){
		this.spinner=true
		this.materiaprimaService.getMateriasPrimas().subscribe({
			next:(data)=>{
				this.listaMateriaPrima=data
				this.spinner=false
			},error:(err)=>{
				this.spinner=false
				this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un problema al lista las materias Primas' });
			}
		})
		this.cargaprov=true
		this.proveedorService.getProveedorxMateria().subscribe({
			next:(data)=>{
				this.listaProveedores=data.data.listar
				this.cargaprov=false
			},error:(err)=>{
				this.cargaprov=false
			}
		})
		this.enviaremail.asunto='ORDEN DE COMPRA'
		this.enviaremail.mensaje='CONFIRMACIÓN DE LA GENERACIÓN PARA ORDEN DE COMPRA'
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
			this.sumaorder+=e.costo_gramo
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
	onRowSelectProveedor(event: any) {
		// console.log(this.selectedCustomers)

		// this.detalle=this.selectedCustomers.detalle
		let registro : iterequerimientoModel = new iterequerimientoModel()
		registro.id_materia_prima=this.selectedCustomersProv.id_materia_prima
		registro.costo_gramo=this.selectedCustomersProv.costo_gramo
		registro.desmateriaprima=this.selectedCustomersProv.nombre

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

		let op :number=1
		this.requerimientosave.estadorequerimiento='PENDIENTE'
		this.requerimientosave.iterequerimiento=this.listaMateriaPrimaSelected
		// console.log(this.requerimientosave)
		if(this.checkautomatico){
			this.requerimientosave.idproveedor=this.selectedprov.idproveedor
			op=3
			Swal.fire({
				title: "Está seguro de guardar el REQUERIMIENTO?",
				text: "Se registrará una ORDEN DE COMPRA directa",
				icon: "warning",
				showCancelButton: true,
				confirmButtonColor: "#3085d6",
				cancelButtonColor: "#d33",
				confirmButtonText: "Si, guardar!"
			}).then((result) => {
				if (result.isConfirmed) {

					this.spinner=true
					this.requerimietoService.registrarRequerimientos(this.requerimientosave,op).subscribe({
						next:(data)=>{
							this.requerimientosave=new RequeremientossaveModel()
							this.listaMateriaPrimaSelected=[]
							this.spinner=false
							this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Se guardó el registro correctamente' });
							if(op==3){
								this.ordencompra=data.data.id_orden_compra!
								Swal.fire({
									title: "Desea Enviar el Correo?",
									text: "Escribir el asunto y detalle",
									icon: "warning",
									showCancelButton: true,
									confirmButtonColor: "#3085d6",
									cancelButtonColor: "#d33",
									confirmButtonText: "Si, enviar"
								}).then((result) => {
									if (result.isConfirmed) {
										this.visiblecorreo=true
										this.enviaremail.para=this.selectedprov.correo


									}
								});
							}

						},error:(err)=>{
							this.spinner=false
							this.messageService.add({ severity: 'error', summary: 'Eliminado', detail: 'Ocurrió un error al guardar el requerimiento' });
						}
					})
				}
			});
		}else{
			op=1

			Swal.fire({
				title: "Está seguro de guardar el REQUERIMIENTO?",
				text: "Estará en espera de COTIZACIÓN",
				icon: "warning",
				showCancelButton: true,
				confirmButtonColor: "#3085d6",
				cancelButtonColor: "#d33",
				confirmButtonText: "Si, guardar!"
			}).then((result) => {
				if (result.isConfirmed) {

					this.spinner=true
					this.requerimietoService.registrarRequerimientos(this.requerimientosave,op).subscribe({
						next:(data)=>{
							this.requerimientosave=new RequeremientossaveModel()
							this.listaMateriaPrimaSelected=[]
							this.spinner=false
							this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Se guardó el registro correctamente' });
							if(op==3){
								this.ordencompra=data.data.id_orden_compra!
								Swal.fire({
									title: "Desea Enviar el Correo?",
									text: "Escribir el asunto y detalle",
									icon: "warning",
									showCancelButton: true,
									confirmButtonColor: "#3085d6",
									cancelButtonColor: "#d33",
									confirmButtonText: "Si, enviar"
								}).then((result) => {
									if (result.isConfirmed) {
										this.visiblecorreo=true
										this.enviaremail.para=this.selectedprov.correo


									}
								});
							}

						},error:(err)=>{
							this.spinner=false
							this.messageService.add({ severity: 'error', summary: 'Eliminado', detail: 'Ocurrió un error al guardar el requerimiento' });
						}
					})
				}
			});
		}
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
	cambioproveedor(){
		if(this.selectedprov && this.selectedprov.detalle.length>0){
			this.listaMateriaPrimaxProveedor=this.selectedprov.detalle
			this.listaMateriaPrimaSelected=[]
			this.requerimientosave.imptotal=0

		}else{
			this.listaMateriaPrimaSelected=[]
			this.listaMateriaPrimaxProveedor=[]
		}
	}
	cambiocheck(){
		this.requerimientosave.imptotal=0
		this.listaMateriaPrimaSelected=[]
	}
	confirmarcorreo(){
		this.visiblecorreo=false
		this.enviaremail.idPedido=this.ordencompra
		this.spinner=true
		this.emailService.sendEmailOdenCompra(this.enviaremail).subscribe({
			next:(data)=>{
				this.spinner=false
				this.enviaremail=new emailordenModel()
				Swal.fire({
					title: "Enviado!",
					text: "Su correo fue enviado con ÉXITO",
					icon: "success"
				});
				this.router.navigate(['/pages/compras/bandeja-requerimientos']);
			},error:(err)=>{
				this.spinner=false
				this.visiblecorreo=true
				this.messageService.add({ severity: 'error', summary: 'ERROR', detail: 'Ocurrió un error al enviar el correo' });
			}
		})
	}
}
