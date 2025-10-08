import {Component, ViewEncapsulation} from '@angular/core';
import {Button, ButtonModule} from "primeng/button";
import {CargaComponent} from "../../../components/carga/carga.component";
import {DialogModule} from "primeng/dialog";
import {IconFieldModule} from "primeng/iconfield";
import {InputIconModule} from "primeng/inputicon";
import {InputTextModule} from "primeng/inputtext";
import {PaginatorModule} from "primeng/paginator";
import {MenuItem, MessageService, PrimeNGConfig, PrimeTemplate} from "primeng/api";
import {Table, TableModule} from "primeng/table";
import {ToastModule} from "primeng/toast";
import {iterequerimientoModel, ObsevacionesReqModel, RequeremientossaveModel} from "../../../model/requerimientosModel";
import {proveedorModel, soloproveedorModel} from "../../../model/proveedoresModel";
import {MateriaprimaService} from "../../../services/inventario/materiaprima.service";
import {FabricanteModel, MateriaprimaModel, TipomateriaModel, UnidadmedModel} from "../../../model/inventarioModel";
import {MenuModule} from "primeng/menu";
import {InputTextareaModule} from "primeng/inputtextarea";
import {TagModule} from "primeng/tag";
import {BadgeModule} from "primeng/badge";
import {FileUploadEvent, FileUploadModule} from "primeng/fileupload";
import {CommonModule, CurrencyPipe, DatePipe, NgIf, registerLocaleData} from "@angular/common";
import {MostrarPdfComponent} from "../../../components/mostrar-pdf/mostrar-pdf.component";
import {kardexModel, MovimientoModel, TipomovimientoModel} from "../../../model/kardexModel";
import {KardexService} from "../../../services/inventario/kardex.service";
import {Router} from "@angular/router";
import {PanelModule} from "primeng/panel";
import Swal from "sweetalert2";
import {RequerimientosService} from "../../../services/compras/requerimientos.service";
import {ProveedorService} from "../../../services/compras/proveedor.service";
import {emailordenModel} from "../../../model/enviarEmailModel";
import {EmailService} from "../../../services/email.service";
import {paramaeModel} from "../../../model/paramaeModel";
import {ParamaeService} from "../../../services/paramae.service";
import {CalendarModule} from "primeng/calendar";
import {FuncionesService} from "../../../services/funciones.service";
import {ExcelService} from "../../../services/excel.service";
import {CheckboxModule} from "primeng/checkbox";
import localeEsPe from '@angular/common/locales/es-PE';
import {AutoCompleteModule} from "primeng/autocomplete";

// registrar locale antes de bootstrapApplication
registerLocaleData(localeEsPe, 'es-PE');
interface AutoCompleteCompleteEvent {
	originalEvent: Event;
	query: string;
}
@Component({
  selector: 'app-inventario-matprima',
  standalone: true,
	imports: [
		Button,
		CargaComponent,
		DialogModule,
		IconFieldModule,
		InputIconModule,
		InputTextModule,
		PaginatorModule,
		PrimeTemplate,
		TableModule,
		ToastModule,
		MenuModule,
		InputTextareaModule,
		TagModule,
		BadgeModule,
		FileUploadModule,
		NgIf,
		MostrarPdfComponent,
		CurrencyPipe,
		PanelModule,
		CalendarModule,
		ButtonModule,
		CheckboxModule,
		CommonModule,
		AutoCompleteModule
	],
  templateUrl: './inventario-matprima.component.html',
  styleUrl: './inventario-matprima.component.scss',
	providers: [MessageService,DatePipe,FuncionesService,ExcelService],
	encapsulation: ViewEncapsulation.None,
})
export class InventarioMatprimaComponent {
	page = 1;
	pageSize = 4;
	collectionSize = 0;
	listaRequerimientos: RequeremientossaveModel[] = [];
	listaProveedores: soloproveedorModel[] = [];
	selectedProveedor:soloproveedorModel[]=[]
	cargamaterias:boolean=false
	listaMaterias: MateriaprimaModel[] = [];
	clonedProducts: { [s: string]: FabricanteModel } = {};
	listaRequerimientospaginado: RequeremientossaveModel[] = [];
	items: MenuItem[]=[];
	verdetalle:boolean=false
	spinner:boolean=false
	loading: boolean = false;
	verordencompra:boolean=false
	visiblecorreo:boolean=false
	loadingfab:boolean=false
	fila_select:MateriaprimaModel = new MateriaprimaModel()
	listaFabricante:FabricanteModel[]=[]
	listaFabricantesugerencias:FabricanteModel[]=[]
	listaTipomateria:TipomateriaModel[]=[]
	verobservaciones:boolean=false
	verdardebaja:boolean=false
	veradicionar:boolean=false
	verreducir:boolean=false
	verrequerimiento:boolean=false
	check_imagen:number=1
	visible:boolean=false
	nuevofabricante:string=''
	idfabricante:number=1
	observaciones:ObsevacionesReqModel=new ObsevacionesReqModel()
	filteredData:MateriaprimaModel[]=[]
	ordencompra:string=''
	listaMateriaPrimaSelected:iterequerimientoModel[]=[]
	files:File[] = [];
	op:number=1
	totalSize : number = 0;
	listaUnidades:UnidadmedModel[]=[]
	listaTipomovimiento:TipomovimientoModel[]=[]
	listaMovimiento:MovimientoModel[]=[]
	cargatipomovimiento:boolean=false
	cargamovimiento:boolean=false
	carga:boolean=false
	subirBaja:kardexModel=new kardexModel()
	totalSizePercent : number = 0;
	tipomovimiento:string=''
	requerimientosave:RequeremientossaveModel=new RequeremientossaveModel()
	selectedprov:proveedorModel=new proveedorModel()
	cargaprov:boolean=false
	enviaremail: emailordenModel = new emailordenModel()
	valorparamae:paramaeModel=new paramaeModel()
	fechavencimiento:any=new Date()
	fabricanteselected:FabricanteModel=new FabricanteModel()
	constructor(private config: PrimeNGConfig,private messageService: MessageService,
				private materiaService: MateriaprimaService,private kardexService:KardexService,
				private route:Router,private requerimietoService:RequerimientosService,private proveedorService:ProveedorService,
				private emailService:EmailService,public router: Router,private paramaeService:ParamaeService,
				private funcionesService:FuncionesService,
				private excelService: ExcelService,
				) {
		this.loading=false

		this.refreshRequerimientos();
		// this.items = [
		// 	{
		// 		label: 'Opciones',
		// 		items: [
		// 			{
		// 				label: 'Actualizar MatPrima',
		// 				icon: 'pi pi-pencil'
		// 			},
		// 			{
		// 				label: 'Ver Kardex',
		// 				icon: 'pi pi-inbox'
		// 			}
		// 		]
		// 	}
		// ];
		this.items = [
					{
						label: 'Actualizar M.P.',
						icon: 'pi pi-pencil',
						command: () => {
							// this.router.navigate(['/installation']);
							this.editarmateriaprima(this.fila_select)
							this.cargarproveedoresasignados(this.fila_select.id_materia_prima)
						}
					},
					{
						label: 'Dar de baja',
						icon: 'pi pi-sort-numeric-down',
						command: () => {
							// this.router.navigate(['/installation']);
							this.subirBaja.cant_entrada=0
							this.subirBaja.cant_salida=0
							this.subirBaja.observaciones=''
							this.verdardebaja=true
							this.veradicionar
							this.cargartipomovimiento()
							this.cambiotipomovimento()
						}
					},
					{
						label: 'Adicionar M.P.',
						icon: 'pi pi-plus-circle',
						command: () => {
							// this.router.navigate(['/installation']);
							this.subirBaja.cant_entrada=0
							this.subirBaja.cant_salida=0
							this.subirBaja.observaciones=''
							this.veradicionar=true
							this.verdardebaja=false
						}
					},
					// {
					// 	label: 'Reducir M.P.',
					// 	icon: 'pi pi-minus-circle',
					// 	command: () => {
					// 		this.subirBaja.cant_entrada=0
					// 		this.subirBaja.cant_salida=0
					// 		this.subirBaja.observaciones=''
					// 		this.verreducir=true
					// 	}
					// },
					{
						label: 'Ver Kardex',
						icon: 'pi pi-inbox',
						command: () => {
							// this.router.navigate(['/installation']);
							this.route.navigate([`/pages/inventario/kardex-producto/${this.fila_select.id_materia_prima}`]);
						}
					}
		];
	}

	ngOnInit(){
		this.loading=true
		// this.cargarproveedores()
		this.enviaremail.asunto='ORDEN DE COMPRA'
		this.enviaremail.mensaje='CONFIRMACIÓN DE LA GENERACIÓN PARA ORDEN DE COMPRA'
		this.cargarmateriaprima()
		this.cargarunidades()
		this.cargartipomovimiento()
		this.cargarstockmin()
		this.cargarfabricante()
		this.cargartipomateria()
		this.cargarproveedores()
	}
	cargarunidades(){
		this.cargamaterias=true
		this.materiaService.getUnidadmedida().subscribe({
			next:(data)=>{
				this.listaUnidades=data.data
				this.cargamaterias=false
			},error:(err)=>{
				this.cargamaterias=false
			}
		})
	}
	cargartipomovimiento(){
		this.cargatipomovimiento=true
		this.kardexService.getTipomovimiento().subscribe({
			next:(data)=>{
				this.listaTipomovimiento=data.data
				this.verdardebaja?this.tipomovimiento='S':this.tipomovimiento='E'
				this.cargatipomovimiento=false
				this.cambiotipomovimento()
			},error:(err)=>{
				this.cargatipomovimiento=false
			}
		})
	}
	cargarmateriaprima(){
		this.spinner=true
		this.materiaService.getMateriaprima().subscribe({
			next:(data)=>{
				this.listaMaterias=data.data
				this.filteredData=data.data
				this.spinner=false
			},error:(err)=>{
				this.spinner=false
			}
		})
	}
	cargarstockmin(){
		this.paramaeService.getDatosParamae('STO','MINIMO').subscribe({
			next:(data)=>{
				this.valorparamae=data.data
			},error:(err)=>{

			}
		})
		this.valorparamae
	}
	refreshRequerimientos() {
		this.listaRequerimientospaginado = this.listaRequerimientos
			.map((req, i) => ({id: i + 1, ...req}))
			.slice((this.page - 1) * this.pageSize, this.page * this.pageSize);
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
	editarmateriaprima(registro:MateriaprimaModel){
		this.fila_select=registro
		this.verdetalle=true
		this.op=2
	}
	nuevamateriaprima(){
		this.verdetalle=true
		this.selectedProveedor=[]
		this.fila_select = new MateriaprimaModel()
		this.op=1
	}
	cargarproveedores(){
		this.proveedorService.getProveedor().subscribe({
			next:(data)=>{
				this.listaProveedores=data.data
			},error:(err)=>{

			}
		})
	}
	cargarproveedoresasignados(id_materia_prima:string){
		this.selectedProveedor=[]
		this.fila_select.detalleproveedor=[]
		this.proveedorService.getProveedoresconMateria(id_materia_prima).subscribe({
			next:(data)=>{
				this.selectedProveedor=data.data
				this.fila_select.detalleproveedor=this.selectedProveedor
			},error:(err)=>{

			}
		})
	}
	// guardarproveedor(){
	// 	this.spinner=true
	// 	this.verdetalle=false
	// 	this.proveedorService.registrarProveedor(this.fila_select,this.op).subscribe({
	// 		next:(data)=>{
	// 			this.verdetalle=false
	// 			this.spinner=false
	// 			this.cargarproveedores()
	// 			this.messageService.add({ severity: 'success', summary: 'Aviso de usuario', detail: 'Se registrò con Éxito el proveedor' });
	// 		},error:(err)=>{
	// 			this.verdetalle=true
	// 			this.messageService.add({ severity: 'error', summary: 'Aviso de usuario', detail: 'Ocurriò un error al guardar' });
	// 		}
	// 	})
	// }
	guardarmateria(){
			this.spinner=true
			this.verdetalle=false
			this.fila_select.detalleproveedor=[]
			this.fila_select.detalleproveedor=this.selectedProveedor
		this.fila_select.fabricante=this.fabricanteselected.fabricante
		// console.log(this.fila_select,this.op,'antes de enviar')
		this.materiaService.registrarMateriaprima(this.fila_select,this.op).subscribe({
			next:(data)=>{
				this.spinner=false

				if(data.mensaje=='EXITO'){
					this.cargarmateriaprima()
					this.fabricanteselected	={
						id_fabricante:1,
						fabricante:'NO TIENE'
					}
					this.messageService.add({ severity: 'success', summary: 'Aviso de usuario', detail: 'Se registrò con Éxito la nueva materia prima' });
					this.verdetalle=false
				}else{
					this.verdetalle=true
					this.messageService.add({ severity: 'error', summary: 'Aviso de usuario', detail: 'Ocurriò un error al guardar' });
				}
			},error:(err)=>{
				this.spinner=false
				this.verdetalle=true
				this.messageService.add({ severity: 'error', summary: 'Aviso de usuario', detail: 'Ocurriò un error al guardar' });
			}
		})
	}
	onBasicUploadAuto(event: FileUploadEvent) {
		this.carga = false;

		const file: File = event.files[0];

		const reader = new FileReader();
		reader.onload = () => {
			const base64: string = reader.result as string;
			this.subirBaja.archivobase64=base64
			this.messageService.add({
				severity: 'info',
				summary: 'Success',
				detail: 'Archivo en Espera para GUARDAR'
			});

			const mime = file.type; // Ej: "application/pdf"
			const extension = mime.split('/')[1]; // Ej: "pdf"
			console.log(extension,'ext')
			this.subirBaja.extensiondoc=extension
		};

		reader.onerror = (err) => {
			console.error('Error al leer el archivo:', err);
			this.messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'No se pudo convertir el archivo'
			});
		};

		reader.readAsDataURL(file);
	}
	// sanitizarPdf(base64: string): SafeResourceUrl {
	// 	return this.sanitizer.bypassSecurityTrustResourceUrl(base64);
	// }
	// sanitizarPdf(base64: string): SafeResourceUrl {
	// 	const byteCharacters = atob(base64);
	// 	const byteNumbers = new Array(byteCharacters.length);
	// 	for (let i = 0; i < byteCharacters.length; i++) {
	// 		byteNumbers[i] = byteCharacters.charCodeAt(i);
	// 	}
	// 	const byteArray = new Uint8Array(byteNumbers);
	// 	const blob = new Blob([byteArray], { type: 'application/pdf' });
	//
	// 	const url = URL.createObjectURL(blob);
	// 	return this.sanitizer.bypassSecurityTrustResourceUrl(url);
	// }
	// abrirPdf(base64: string) {
	// 	const byteCharacters = atob(base64);
	// 	const byteNumbers = new Array(byteCharacters.length);
	// 	for (let i = 0; i < byteCharacters.length; i++) {
	// 		byteNumbers[i] = byteCharacters.charCodeAt(i);
	// 	}
	// 	const byteArray = new Uint8Array(byteNumbers);
	// 	const blob = new Blob([byteArray], { type: 'application/pdf' });
	// 	const url = URL.createObjectURL(blob);
	// 	window.open(url);
	// }
	guardarbaja(){
		this.subirBaja.documento=this.fila_select.id_materia_prima
		this.subirBaja.impunit=this.fila_select.costo_gramo
		this.subirBaja.id_materia_prima=this.fila_select.id_materia_prima
		this.subirBaja.path_kardex=''
		// console.log(this.subirBaja)
		this.spinner=true
		this.verdardebaja?this.check_imagen=1:this.check_imagen=0
		this.subirBaja.id_movimiento=this.veradicionar?2:this.verreducir?3:1
		this.subirBaja.fecha_vencimiento=this.funcionesService.convetir_de_date_a_string_fecha(this.fechavencimiento)
		this.verdardebaja=false
		this.veradicionar=false
		this.verreducir=false
		this.kardexService.registrarKardex(this.subirBaja,1,this.check_imagen).subscribe({
			next:(data)=>{
				this.spinner=false
				if(data.mensaje=='EXITO'){
					this.subirBaja=new kardexModel()
					this.cargarmateriaprima()
					this.messageService.add({ severity: 'success', summary: 'Aviso de usuario', detail: 'Se registrò con Éxito la baja de la materia' });
					this.verdardebaja=false
					this.veradicionar=false
				}else{
					this.verdardebaja=true
					this.messageService.add({ severity: 'error', summary: 'Aviso de usuario', detail: 'Ocurriò un error al guardar' });
				}
			},error:(err)=>{
				this.spinner=false
				this.verdardebaja=true
				this.veradicionar=false
			}
		})
	}
	cambiotipomovimento(){
		this.cargamovimiento=true
		this.kardexService.getMovimiento(this.tipomovimiento).subscribe({
			next:(data)=>{
				this.cargamovimiento=false
				this.listaMovimiento=data.data
				this.verdardebaja?this.subirBaja.id_movimiento=1:this.subirBaja.id_movimiento=2
			},
			error:(err)=>{
				this.cargamovimiento=false

			}
		})
	}
	generarrequerimiento(){
		this.requerimientosave=new RequeremientossaveModel()
		this.requerimientosave.glosa='REQUERIMIENTO AUTOMÁTICO'
		this.requerimientosave.areasolicitante='INVENTARIO'
		this.requerimientosave.responsable='PERSONAL DE INTENTARIADO'
		this.listaMateriaPrimaSelected=[]
		this.verrequerimiento=true
		let registro:iterequerimientoModel=new iterequerimientoModel()
		registro.id_materia_prima=this.fila_select.id_materia_prima
		registro.desmateriaprima=this.fila_select.nombre
		registro.impigv=0
		this.loading=false

		this.listaMateriaPrimaSelected.push(registro)
		// console.log(this.fila_select,this.listaMateriaPrimaSelected,'listado')
		this.cargaprov=true
		this.proveedorService.getProveedoresconMateria(registro.id_materia_prima).subscribe({
			next:(data)=>{
				this.listaProveedores=data.data
				this.cargaprov=false
			},error:(err)=>{
				this.cargaprov=false
			}
		})
	}
	guardarRequermiento(){
		let op :number=1
		this.requerimientosave.estadorequerimiento='PENDIENTE'
		this.requerimientosave.idproveedor=this.selectedprov.idproveedor
		this.requerimientosave.iterequerimiento=this.listaMateriaPrimaSelected
		this.verrequerimiento=false
		// console.log(this.requerimientosave)
		// 	this.requerimientosave.idproveedor=this.selectedprov.idproveedor
			op=4
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
							if(op==4){
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
										this.cargarmateriaprima()

									}else{
										this.cargarmateriaprima()
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
	cambiocantidad(registro:iterequerimientoModel){
		registro.impsubtotal = parseFloat(
			(registro.cantidad_requerida * registro.costo_gramo).toFixed(2)
		);

		this.requerimientosave.imptotal = this.listaMateriaPrimaSelected
			.reduce((sum, e) => sum + e.impsubtotal, 0);
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
	cargarfila(customer: MateriaprimaModel) {
		this.fila_select = { ...customer };
	}
	cargarfabricante(){
		this.materiaService.getFabricanteMateriaprima().subscribe({
			next:(data)=>{
				this.listaFabricante=data.data
				this.fabricanteselected	={
					id_fabricante:1,
					fabricante:'NO TIENE'
				}
				this.loading=false
				this.loadingfab=false
			},error:(err)=>{
				this.loading=false
				this.loadingfab=false
			}
		})
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

	download() {
		let cabecera: any[] = [];
		let campos: any[] = [];
		let ancho: any[] = [];
		let subcabecera: any[] = [];
		let sumarcampos: any[] = [];

		// Define headers
		cabecera = [
			"ID Materia Prima",
			"Nombre",
			"Costo por gramo",
			"Stock actual",
			"Stock referencia",
			"Umbral mínimo",
			"Abreviado",
			"Observaciones",
			"ID Unidad de Medida",
			"Estado",
			"ID Requerimiento Stock",
			"Estado Requerimiento"
		];

		// Define fields (deben coincidir con los nombres del JSON)
		campos = [
			"id_materia_prima",
			"nombre",
			"costo_gramo",
			"stock_materia",
			"stock_referencia",
			"umbral_min",
			"abreviado",
			"observaciones",
			"id_unimed",
			"estado",
			"id_requerimiento_stock",
			"estadorequerimiento"
		];

		// Column widths
		ancho = [
			20, // id_materia_prima
			40, // nombre
			20, // costo_gramo
			20, // stock_materia
			25, // stock_referencia
			20, // umbral_min
			20, // abreviado
			50, // observaciones
			20, // id_unimed
			20, // estado
			30, // id_requerimiento_stock
			30  // estadorequerimiento
		];

		// Campos que se deben sumar (1 si es numérico acumulable)
		sumarcampos = [
			0, // id_materia_prima
			0, // nombre
			1, // costo_gramo
			1, // stock_materia
			1, // stock_referencia
			1, // umbral_min
			0, // abreviado
			0, // observaciones
			0, // id_unimed
			0, // estado
			0, // id_requerimiento_stock
			0  // estadorequerimiento
		];

		// Subcabecera con datos adicionales
		subcabecera = [
			"# Items: " + (this.filteredData?.length || 0)
		];

		// Agregar columna inicial vacía
		cabecera.unshift("");
		campos.unshift("");

		// Llamar a servicio Excel
		this.excelService.downloadExcel(
			this.filteredData, // viene del API
			cabecera,
			campos,
			"Listado Materias Primas",
			ancho,
			subcabecera,
			"materias_primas",
			sumarcampos
		);
	}
	cambioprov(proveedor:soloproveedorModel){
		console.log(this.selectedProveedor,proveedor,'proveedor')
	}
	search(event: AutoCompleteCompleteEvent) {
		const query = event.query.toUpperCase();
		this.listaFabricantesugerencias = this.listaFabricante.filter(p =>
			p.fabricante?.toUpperCase().includes(query)
		);
	}
	guardarfabricante(op:number){
		this.loadingfab=true
		let fabricante:FabricanteModel=new FabricanteModel()
		fabricante.fabricante=this.nuevofabricante
		fabricante.id_fabricante=this.idfabricante
		this.materiaService.registrarFabricante(fabricante,op).subscribe({
			next:(data)=>{
				this.cargarfabricante()
				this.nuevofabricante=''

				this.messageService.add({ severity: 'success', summary: 'ÉXITO', detail: 'Se creó el Fabricante correctamente' });
			},error:(err)=>{
				this.loadingfab=false
				this.messageService.add({ severity: 'error', summary: 'ERROR', detail: 'Surgió un problema al guardar' });
			}
		})
	}
	onRowEditInit(fabricante: FabricanteModel) {
		this.clonedProducts[fabricante.id_fabricante as number] = { ...fabricante };
	}

	onRowEditSave(fabricante: FabricanteModel) {
		this.nuevofabricante=fabricante.fabricante
		this.idfabricante=fabricante.id_fabricante
		this.guardarfabricante(2)
	}

	onRowEditCancel(fabricante: FabricanteModel, index: number) {
		this.listaFabricante[index] = this.clonedProducts[fabricante.id_fabricante as number];
		// delete this.clonedProducts[FabricanteModel.id as number];
	}
}
