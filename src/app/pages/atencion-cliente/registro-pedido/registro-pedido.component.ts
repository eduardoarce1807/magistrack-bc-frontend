import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, effect, EventEmitter, inject, OnDestroy, OnInit, Output, signal, TemplateRef, ViewChild } from '@angular/core';
import { ProductoService } from '../../../services/producto.service';
import Swal from 'sweetalert2';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PedidoService } from '../../../services/pedido.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DataService } from '../../../services/data.service';
import { NgbModal, NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../../services/toast.service';
import { ToastsContainer } from '../../../shared/components/toasts-container/toasts-container.component';
import { MetodoEntregaService } from '../../../services/metodo-entrega.service';
import { DireccionService } from '../../../services/direccion.service';
import { UbigeoService } from '../../../services/ubigeo.service';
import { UtilDate } from '../../../util/util-date';
import { ClienteService } from '../../../services/cliente.service';
import { CuponService } from '../../../services/cupon.service';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableModule } from 'primeng/table';
import { DocumentoService } from '../../../services/documento.service';
import { StepperModule } from 'primeng/stepper';
import { PagarPedidoComponent } from '../pagar-pedido/pagar-pedido.component';

interface PedidoRequest {
  idCliente: number;
  fechaPedido: string;
  idEstadoPedido: number;
  idTipoPago: number | null;
  observaciones: string;
  fechaEstimadaEntrega: string;
  montoTotal: number;
  idCanalVenta: number;
}

interface Producto {
  idProducto: string;
  nombre: string;
  descripcion: string;
  precio: number;
  presentacion: number;
  tipoPresentacion: TipoPresentacion;
  productoMaestro: ProductoMaestro;
}

interface ProductoMaestro {
  idProductoMaestro: string;
  nombre: string;
  descripcion: string;
}

interface TipoPresentacion {
  idTipoPresentacion: number;
  descripcion: string;
}

interface PedidoProducto {
  idProducto: string;
  nombre: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  subtotal: number;
  personalizado: boolean;
  precioPersonalizado: boolean;
  tieneDescuento: boolean;
  presentacion: number;
  tipoPresentacion: string;
}

interface PreparadoMagistral {
  idPedido: string;
  idPreparadoMagistral: string;
  nombre: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  subtotal: number;
  presentacion: number;
  tipoPresentacion: string;
  idEstadoPedido: number;
  estadoPedido: string;
  idEstadoProducto: number;
  estadoProducto: string;
  observacion: string;
  phDefinidoMin: number;
  phDefinidoMax: number;
  phCalidad: number | null;
  carOrganolepticasCalidad: string | null;
  viscosidadCalidad: string | null;
  fechaPreparacion: string | null;
  lotePreparacion: string | null;
  fechaVencimiento: string | null;
}

interface PedidoProductoRequest {
  idPedido: string;
  idProducto: string;
  cantidad: number;
  personalizado: boolean;
}

interface Direccion {
  direccion: string;
  referencia: string;
  idCliente: number;
  //idTienda: number;
  idDistrito: number; // Opcional si se necesita el ID del distrito
  idProvincia: number; // Opcional si se necesita el ID de la provincia
  idDepartamento: number; // Opcional si se necesita el ID del departamento
}

@Component({
  selector: 'app-registro-pedido',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbTooltipModule, ToastsContainer, NgbPaginationModule, TableModule, ButtonModule, IconFieldModule, InputIconModule, InputTextModule, StepperModule, PagarPedidoComponent],
  templateUrl: './registro-pedido.component.html',
  styleUrl: './registro-pedido.component.scss'
})
export class RegistroPedidoComponent implements OnInit, OnDestroy {

  @ViewChild('successTpl', { static: false }) successTpl!: TemplateRef<any>;
  @ViewChild('successTplDireccion', { static: false }) successTplDireccion!: TemplateRef<any>;
  @ViewChild('successTplNotDelivery', { static: false }) successTplNotDelivery!: TemplateRef<any>;
  toastService = inject(ToastService);

  idRol: number = 0;

  // Propiedades para el stepper
  activeStepIndex: number = 0;
  pedidoPagado: boolean = false;
  loadingPedido: boolean = true;

  // Getter para verificar si el pedido está pagado (sin logs infinitos)
  get esPedidoPagado(): boolean {
    return this.pedidoPagado;
  }

  // Método para actualizar el estado de pago
  private actualizarEstadoPago(): void {
    const estadoAnterior = this.pedidoPagado;
    this.pedidoPagado = this.pedido && this.pedido.estadoPedido && this.pedido.estadoPedido.idEstadoPedido > 1;
    
    if (estadoAnterior !== this.pedidoPagado) {
      console.log('Estado de pago actualizado:', {
        pedido: !!this.pedido,
        estadoPedido: this.pedido?.estadoPedido,
        idEstado: this.pedido?.estadoPedido?.idEstadoPedido,
        pedidoPagado: this.pedidoPagado
      });
    }

    this.changeDetectorRef.detectChanges();
  }

  // Getter para obtener el número total de pasos
  get totalPasos(): number {
    return this.esPedidoPagado ? 3 : 4;
  }

  productoSeleccionado: any;

  query = '';
  cantidad = 1;
  productosBusqueda: Producto[] = [];
  productosPedido: PedidoProducto[] = [];
  timeoutId: any;
  private updateTimeout: any;

  productosBusquedaAvanzada: Producto[] = [];
	page = 1;
	pageSize = 5;
	collectionSize = this.productosBusquedaAvanzada.length;

  idPedido: string | null = null;
  pedido: any = {estadoPedido: 0};
  private routeSubscription: Subscription | null = null;

  // Modo preparado magistral
  modoPreparadoMagistral: boolean = false;
  preparadosMagistrales: PreparadoMagistral[] = [];

  isLoading: boolean = false;
  disabledPagar: boolean = false;

  idMetodoEntregaSeleccionado = 0;
  idDireccionSeleccionada = 0;
  
  // Propiedades para nota delivery
  notaDelivery: string = '';
  notaDeliveryTimeout: any;

  nuevaDireccion : Direccion = {
    direccion: '',
    referencia: '',
    idCliente: 0,
    idDistrito: 0,
    idProvincia: 0,
    idDepartamento: 0
  };

  departamentos: any[] = [];
  provincias: any[] = [];
  distritos: any[] = [];

  codigoCupon: string = '';
  dniCliente: string = '';
  nombreCompletoCliente: string = '';

  rucCliente = '';
  razonSocialCliente = '';

  private modalService = inject(NgbModal);

  searchFocused = false;

  tipoComprobante = 0;

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.idPedido = params.get('idPedido');
      if (this.idPedido) {
        this.loadingPedido = true;
        this.getUbigeoData();
        this.getMetodosEntrega();
        this.getPedidoById(this.idPedido);
        // cargarProductosByIdPedido se ejecutará después de getPedidoById
      }else{
        this.loadingPedido = false; // No hay pedido que cargar

        if(this.dataService.getLoggedUser().rol.idRol === 1 || this.dataService.getLoggedUser().rol.idRol === 5) {
          this.getClientes();
        }else{
          Swal.fire({
          icon: 'question',
          title: '¿Está seguro?',
          text: 'Confirme que desea crear un nuevo pedido.',
          showConfirmButton: true,
          confirmButtonText: 'Sí, crear pedido',
          showCancelButton: true,
          cancelButtonText: 'Cancelar',
          allowEscapeKey: false,
          allowOutsideClick: false
        }).then((result) => {
          if (result.isConfirmed) {
            this.crearPedidoCliente();
          }else{
            this.goBandejaPedidos();
          }
          console.log('ID del Pedido:', this.idPedido);
        });
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    this.toastService.clear();
  }

  constructor(private productoService: ProductoService,
    private pedidoService: PedidoService,
    private route: ActivatedRoute,
    public router: Router,
    private dataService: DataService,
    private metodoEntregaService: MetodoEntregaService,
    private direccionService: DireccionService,
    private ubigeoService: UbigeoService,
    private clienteService: ClienteService,
    private cuponService: CuponService,
    private documentoService: DocumentoService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.idRol = this.dataService.getLoggedUser().rol.idRol;
    console.log('ID del Rol:', this.idRol);
  }

  getUbigeoData() {
    this.ubigeoService.getDepartamentos().subscribe(
      (data: any) => {
        this.departamentos = data;
      }
    );
  }

  onDepartamentoChange(idDepartamento: number) {

    this.ubigeoService.getProvincias(idDepartamento).subscribe(
      (data: any) => {
        this.provincias = data;
        this.distritos = [];
        this.nuevaDireccion.idProvincia = 0;
        this.nuevaDireccion.idDistrito = 0;
      }
    );
  }

  onProvinciaChange(idProvincia: number) {

    this.ubigeoService.getDistritos(idProvincia).subscribe(
      (data: any) => {
        this.distritos = data;
        this.nuevaDireccion.idDistrito = 0;
      }
    );
  }

  goBandejaPedidos() {
    if(this.dataService.getLoggedUser().rol.idRol === 1 || this.dataService.getLoggedUser().rol.idRol === 5) {
      this.router.navigate(['/pages/atencion-cliente/bandeja-pedidos-administrador']);
    } else {
      this.router.navigate(['/pages/atencion-cliente/bandeja-pedidos']);
    }
  }

  openModal(content: TemplateRef<any>) {
    this.modalService.dismissAll(); // Cierra cualquier modal abierto antes de abrir uno nuevo
    this.modalService.open(content, {backdrop: 'static', keyboard: false});
  }

  esClienteGenerico = true;
  listaClientes: any[] = [];
  clienteSeleccionado: number | null = null;
  getClientes(){
    var lstRolesExcluidos = [1,6,7,8,9,10];
    this.clienteService.getClientesMenosRoles(lstRolesExcluidos).subscribe(
      (clientes) => {
        this.listaClientes = clientes;
        console.log('Clientes:', clientes);
        this.openModalRegistroPedidoAdmin();
      },
      (error) => {
        console.error('Error al obtener clientes', error);
      }
    );
  }

  @ViewChild('registroPedidoAdmin', { static: true }) registroPedidoAdmin: TemplateRef<any> | null = null;
  openModalRegistroPedidoAdmin() {
    this.modalService.dismissAll(); // Cierra cualquier modal abierto antes de abrir uno nuevo
    this.modalService.open(this.registroPedidoAdmin, {backdrop: 'static', keyboard: false, size: 'lg', centered: true});
  }

  crearPedidoCliente(){
    // Obtener la fecha y hora actual en la zona horaria de Perú (UTC-5)
    const nowPeru = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }));

    const fechaPedido = UtilDate.toPeruIsoString(nowPeru);

    // Calcular la fecha estimada de entrega (7 días después) en la zona horaria de Perú
    const fechaEstimadaEntregaDate = new Date(nowPeru.getTime() + 7 * 24 * 60 * 60 * 1000);
    const fechaEstimadaEntrega = UtilDate.toPeruIsoString(fechaEstimadaEntregaDate);

    let request: PedidoRequest = {
      idCliente: this.dataService.getLoggedUser().cliente.idCliente, // Asignar el ID del cliente logueado
      fechaPedido: fechaPedido.slice(0, 19),
      idEstadoPedido: 1,
      idTipoPago: null,
      observaciones: '',
      fechaEstimadaEntrega: fechaEstimadaEntrega.slice(0, 19),
      montoTotal: 0,
      idCanalVenta: 1
    };
    console.log('Request para crear pedido:', request);
    this.pedidoService.createPedido(request).subscribe((data: any) => {
      if(data){
        this.router.navigate(['/pages/atencion-cliente/registro-pedido', data.idPedido]);
      }
    }, error => {
      console.error('Error al crear pedido', error);
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: 'No se pudo crear el pedido, inténtelo de nuevo.',
        showConfirmButton: true
      });
    });
  }

  crearPedidoAdmin(){
    // Obtener la fecha y hora actual en la zona horaria de Perú (UTC-5)
    const nowPeru = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }));

    const fechaPedido = UtilDate.toPeruIsoString(nowPeru);

    // Calcular la fecha estimada de entrega (7 días después) en la zona horaria de Perú
    const fechaEstimadaEntregaDate = new Date(nowPeru.getTime() + 7 * 24 * 60 * 60 * 1000);
    const fechaEstimadaEntrega = UtilDate.toPeruIsoString(fechaEstimadaEntregaDate);

    let request: PedidoRequest = {
      idCliente: this.esClienteGenerico ? 15 : this.clienteSeleccionado!, // Asignar el ID del cliente seleccionado
      fechaPedido: fechaPedido.slice(0, 19),
      idEstadoPedido: 1,
      idTipoPago: null,
      observaciones: '',
      fechaEstimadaEntrega: fechaEstimadaEntrega.slice(0, 19),
      montoTotal: 0,
      idCanalVenta: 1
    };
    console.log('Request para crear pedido:', request);
    this.pedidoService.createPedido(request).subscribe((data: any) => {
      if(data){
        this.modalService.dismissAll(); // Cierra el modal después de crear el pedido
        this.router.navigate(['/pages/atencion-cliente/registro-pedido', data.idPedido]);
      }
    }, error => {
      console.error('Error al crear pedido', error);
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: 'No se pudo crear el pedido, inténtelo de nuevo.',
        showConfirmButton: true
      });
    });
  }

  openModalBusquedaAvanzada(content: TemplateRef<any>) {
    this.modalService.dismissAll(); // Cierra cualquier modal abierto antes de abrir uno nuevo
    this.getProductosBusquedaAvanzada(content); // Cargar productos para la búsqueda avanzada
  }

  crearDireccion() {
    if (this.nuevaDireccion.direccion && this.nuevaDireccion.idDistrito > 0 && this.nuevaDireccion.idProvincia > 0 && this.nuevaDireccion.idDepartamento > 0) {
      this.nuevaDireccion.idCliente = this.pedido.cliente.idCliente; // Asignar el ID del cliente al crear la dirección
      //console.log('Nueva dirección:', this.nuevaDireccion);
      
      this.direccionService.createDireccion(this.nuevaDireccion).subscribe(
        (response) => {
          this.modalService.dismissAll(); // Cierra el modal después de crear la dirección
          Swal.fire({
            icon: 'success',
            title: '¡Listo!',
            text: 'La dirección ha sido creada correctamente.',
            showConfirmButton: true
          });
          this.getDireccionesByClienteId(this.pedido.cliente.idCliente, true);
          this.nuevaDireccion = {
            direccion: '',
            referencia: '',
            idCliente: 0,
            idDistrito: 0,
            idProvincia: 0,
            idDepartamento: 0
          };
        },
        (error) => {
          console.error('Error al crear dirección', error);
          Swal.fire({
            icon: 'error',
            title: 'Oops!',
            text: 'No se pudo crear la dirección, inténtelo de nuevo.',
            showConfirmButton: true
          });
        }
      );
    }
  }

  onMetodoEntregaChange(firstRequest: boolean = false) {
    console.log('Método de entrega seleccionado:', this.idMetodoEntregaSeleccionado);
    this.idDireccionSeleccionada = 0; // Reiniciar la dirección seleccionada
    this.lstDirecciones = []; // Limpiar las direcciones
    
    // Limpiar nota delivery si no es delivery
    if (this.idMetodoEntregaSeleccionado !== 2) {
      this.notaDelivery = '';
      if (this.notaDeliveryTimeout) {
        clearTimeout(this.notaDeliveryTimeout);
        this.notaDeliveryTimeout = null;
      }
    }
    
    if (this.idMetodoEntregaSeleccionado === 1) { // Si es "Recojo en tienda"
      this.getDireccionesByTiendaId(1, firstRequest);
    }
    if (this.idMetodoEntregaSeleccionado === 2) { // Si es "Delivery"
      this.getDireccionesByClienteId(this.pedido.cliente.idCliente, firstRequest);
    }
    if(this.idMetodoEntregaSeleccionado === 3) { // Entrega directa
      this.idDireccionSeleccionada = 0; // Seleccionar la primera dirección por defecto
      if(!firstRequest){
        this.guardarEntrega();
      }
      this.disabledPagar = false;
      this.lstDirecciones = []; // Limpiar las direcciones
    }

  }

  lstMetodosEntrega: any[] = [];
  getMetodosEntrega() {
    this.metodoEntregaService.getMetodosEntrega().subscribe(
      (metodos) => {
        this.lstMetodosEntrega = metodos;
        console.log('Métodos de entrega:', metodos);
        //this.onMetodoEntregaChange();
      },
      (error) => {
        console.error('Error al obtener métodos de entrega', error);
      }
    );
  }

  lstDirecciones: any[] = [];
  getDireccionesByClienteId(idCliente: number, firstRequest: boolean = false) {
    this.direccionService.getDireccionesByClienteId(idCliente).subscribe(
      (direcciones) => {
        this.lstDirecciones = direcciones;
        this.idDireccionSeleccionada = this.lstDirecciones[0]?.idDireccion || 0; // Seleccionar la primera dirección por defecto
        console.log('Direcciones del cliente:', direcciones);
        if (!firstRequest) {
          this.guardarEntrega(); // Llamar al método de entrega después de obtener las direcciones
        }
      },
      (error) => {
        console.error('Error al obtener direcciones del cliente', error);
      }
    );
  }

  getDireccionesByTiendaId(idTienda: number, firstRequest: boolean = false) {
    this.direccionService.getDireccionesByTiendaId(idTienda).subscribe(
      (direcciones) => {
        this.lstDirecciones = direcciones;
        this.idDireccionSeleccionada = this.lstDirecciones[0]?.idDireccion || 0; // Seleccionar la primera dirección por defecto
        console.log('Direcciones de la tienda:', direcciones);
        if (!firstRequest) {
          this.guardarEntrega(); // Llamar al método de entrega después de obtener las direcciones
        }
      },
      (error) => {
        console.error('Error al obtener direcciones de la tienda', error);
      }
    );
  }

  guardarEntrega(){
    this.pedidoService.updateDireccionPedido({
      idPedido: this.idPedido,
      idMetodoEntrega: this.idMetodoEntregaSeleccionado,
      idDireccion: this.idDireccionSeleccionada
    }).subscribe(
      (response) => {
        this.showSuccess(this.successTplDireccion);
        // Verificar si hay productos o preparados magistrales en el pedido
        const tieneItems = this.modoPreparadoMagistral ? 
          this.preparadosMagistrales.length > 0 : 
          this.productosPedido.length > 0;
        
        if(tieneItems) {
          this.disabledPagar = false; // Habilitar el botón de pagar si hay items en el pedido
        }
      },
      (error) => {
        console.error('Error al actualizar la dirección de entrega', error);
      }
    );
  }


  getPedidoById(idPedido: string): void {
    this.loadingPedido = true;
    this.pedidoService.getPedidoById(idPedido).subscribe(
      (pedido) => {
        if(pedido) {
          this.pedido = pedido;
          
          // Actualizar el estado de pago
          this.actualizarEstadoPago();
          
          console.log('=== DEBUG PEDIDO PAGADO ===');
          console.log('Estado del pedido:', pedido.estadoPedido);
          console.log('ID Estado:', pedido.estadoPedido?.idEstadoPedido);
          console.log('Pedido pagado:', this.pedidoPagado);
          console.log('========================');
          
          // Activar modo preparado magistral si corresponde
          this.modoPreparadoMagistral = pedido.tipoPedido === "PREPARADO_MAGISTRAL";
          console.log('Modo preparado magistral:', this.modoPreparadoMagistral);
          
          this.notaDelivery = pedido.notaDelivery || '';
          this.codigoCupon = pedido.cupon ? pedido.cupon.codigo : '';

          if(pedido.cupon){
            this.cuponValidado = true;
            this.textoCupon = "Cupón válido.";
          }

          if(pedido.metodoEntrega && pedido.metodoEntrega.idMetodoEntrega && pedido.metodoEntrega.idMetodoEntrega > 0
            && pedido.direccion && pedido.direccion.idDireccion && pedido.direccion.idDireccion > 0
          ) {
            this.idMetodoEntregaSeleccionado = pedido.metodoEntrega.idMetodoEntrega || 0;
            this.idDireccionSeleccionada = pedido.direccion ? pedido.direccion.idDireccion : 0; // Asignar la dirección del pedido
            this.onMetodoEntregaChange(true);
          }else{
            this.idMetodoEntregaSeleccionado = pedido.metodoEntrega ? pedido.metodoEntrega.idMetodoEntrega || 0 : 0;
            this.disabledPagar = true; // Deshabilitar el botón de pagar si no hay método de entrega o dirección
          }

          //validar datos de comprobante
          if(this.pedido.documento){
            console.log('Datos del documento:', this.pedido.documento);
            this.tipoComprobante = this.pedido.documento.tipoComprobante === "03" ? 1 :
                        this.pedido.documento.tipoComprobante === "01" ? 2 : 0;
            this.dniCliente = this.tipoComprobante == 1 ? this.pedido.documento.numeroDocumentoCliente : '';
            this.nombreCompletoCliente = this.tipoComprobante == 1 ? this.pedido.documento.nombreCliente : '';
            this.rucCliente = this.tipoComprobante == 2 ? this.pedido.documento.numeroDocumentoCliente : '';
            this.razonSocialCliente = this.tipoComprobante == 2 ? this.pedido.documento.razonSocialCliente : '';
          }

          // Cargar productos después de obtener los datos del pedido
          this.cargarProductosByIdPedido(idPedido);
          
          // Finalizar el loading una vez que se han cargado los datos
          this.loadingPedido = false;
        }
        console.log('Pedido:', pedido);
      },
      (error) => {
        console.error('Error al cargar el pedido', error);
        this.loadingPedido = false;
      }
    );
  }

  getProductosBusquedaAvanzada(content: TemplateRef<any>) {

    let idCliente = this.dataService.getLoggedUser().rol.idRol == 1 || this.dataService.getLoggedUser().rol.idRol == 5 ? this.pedido.cliente.idCliente : this.dataService.getLoggedUser().cliente.idCliente;

    this.productoService.getCatalogoProductosByCliente(idCliente).subscribe((data: any) => {
      this.productosBusquedaAvanzada = data;
      this.collectionSize = data.length;
      this.modalService.open(content, {backdrop: 'static', keyboard: false, size: 'xl'});
    },
    (error) => {
      console.error('Error al obtener productos', error);
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: 'No se pudo obtener la lista de productos, inténtelo de nuevo.',
        showConfirmButton: true
      });
    });
  }

  filterByLetter(letter: string) {
    const lowerLetter = letter.trim().toLowerCase()

    // Filtrar la lista completa
    const filtered = this.productosBusquedaAvanzada.filter(p =>
      p.productoMaestro.nombre.toLowerCase().startsWith(lowerLetter)
    )

    // Reiniciar paginación
    this.page = 1
    this.collectionSize = filtered.length;

    this.productosBusquedaAvanzada = filtered;
  }

  searchValue = "";
  clear(table: Table) {
    table.clear();
    this.searchValue = "";
  }

  // Filtro personalizado mejorado para búsqueda inteligente
  filtrarTabla(table: Table, searchValue: string): void {
    if (!searchValue || searchValue.trim() === '') {
      table.clear();
      return;
    }

    // Convertir el valor de búsqueda a minúsculas, normalizar acentos y dividir en palabras
    const palabrasBusqueda = this.normalizarTexto(searchValue).trim().split(/\s+/);
    
    // Filtrar los datos
    const datosFiltrados = this.productosBusquedaAvanzada.filter(item => {
      // Crear una cadena de texto con todos los campos buscables
      const textoBuscable = [
        item.idProducto?.toString() || '',
        item.productoMaestro?.nombre || '',
        item.productoMaestro?.descripcion || '',
        item.presentacion?.toString() || '',
        item.tipoPresentacion?.descripcion || ''
      ].join(' ');

      // Normalizar el texto buscable
      const textoBuscableNormalizado = this.normalizarTexto(textoBuscable);

      // Verificar que todas las palabras de búsqueda estén presentes en el texto
      return palabrasBusqueda.every(palabra => 
        textoBuscableNormalizado.includes(palabra)
      );
    });

    // Aplicar el filtro a la tabla
    table.filteredValue = datosFiltrados;
  }

  // Método auxiliar para normalizar texto (quitar acentos y convertir a minúsculas)
  private normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD') // Descompone los caracteres acentuados
      .replace(/[\u0300-\u036f]/g, '') // Elimina los diacríticos (acentos, tildes, etc.)
      .replace(/[^\w\s]/g, ' ') // Reemplaza caracteres especiales con espacios
      .replace(/\s+/g, ' '); // Reemplaza múltiples espacios con uno solo
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value.trim();
    
    // Limpiamos el timeout anterior
    clearTimeout(this.timeoutId);

    // Iniciamos un nuevo timeout para esperar 1 segundo
    this.timeoutId = setTimeout(() => {
      if (value) {
        this.productoService.getBuscarProductos(this.dataService.getLoggedUser().cliente.idCliente, value).subscribe((data: any) => {
          this.productosBusqueda = data;
        },
        (error) => {
          console.error('Error al buscar productos', error);
          Swal.fire({
            icon: 'error',
            title: 'Oops!',
            text: 'No se pudo buscar los productos, inténtelo de nuevo.',
            showConfirmButton: true
          });
        });
      } else {
        this.productosBusqueda = [];
      }
    }, 1000);
  }

  buscarProducto(){
    if (this.query) {

      let idCliente = this.dataService.getLoggedUser().rol.idRol == 1 || this.dataService.getLoggedUser().rol.idRol == 5 ? this.pedido.cliente.idCliente : this.dataService.getLoggedUser().cliente.idCliente;

      this.productoService.getBuscarProductos(idCliente, this.query).subscribe((data: any) => {
        this.productosBusqueda = data;
        this.searchFocused = true;
      },
      (error) => {
        console.error('Error al buscar productos', error);
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: 'No se pudo buscar los productos, inténtelo de nuevo.',
          showConfirmButton: true
        });
      });
    } else {
      this.productosBusqueda = [];
    }
  }

  cargarProductosByIdPedido(idPedido: string) {
    // Validar si el pedido es de tipo "PREPARADO_MAGISTRAL"
    if (this.modoPreparadoMagistral) {
      // Usar endpoint específico para preparados magistrales
      this.pedidoService.getPreparadosMagistralesByIdPedido(idPedido).subscribe((data: PreparadoMagistral[]) => {
        this.preparadosMagistrales = data;
        this.productosPedido = []; // Limpiar productos regulares
        this.totalPedido = 0; // Reiniciar el total del pedido
        this.preparadosMagistrales.forEach((preparado: PreparadoMagistral) => {
          this.totalPedido += preparado.subtotal;
        });
        // Para preparados magistrales, no aplica la validación de personalizado
        this.disabledPagar = false;
      },
      (error) => {
        console.error('Error al obtener preparados magistrales del pedido', error);
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: 'No se pudo obtener los preparados magistrales del pedido "'+this.idPedido+'", inténtelo de nuevo.',
          showConfirmButton: true
        });
      });
    } else {
      // Usar endpoint normal para productos regulares
      this.pedidoService.getProductosByIdPedido(idPedido).subscribe((data: PedidoProducto[]) => {
        this.productosPedido = data;
        this.preparadosMagistrales = []; // Limpiar preparados magistrales
        this.totalPedido = 0; // Reiniciar el total del pedido
        this.productosPedido.forEach((producto: PedidoProducto) => {
          this.totalPedido += producto.subtotal;
        });
        let checkPersonalizado = this.productosPedido.some((producto: PedidoProducto) => producto.personalizado && !producto.precioPersonalizado);
        if(checkPersonalizado){
          this.disabledPagar = true;
        }
      },
      (error) => {
        console.error('Error al obtener productos del pedido', error);
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: 'No se pudo obtener los productos del pedido "'+this.idPedido+'", inténtelo de nuevo.',
          showConfirmButton: true
        });
      });
    }
  }


  errorCupon = false;
  textoErrorCupon = "";
  textoCupon = "";
  cuponValidado = false;
  validarCodigoCupon() {
    if (this.codigoCupon.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Oops!',
        text: 'Por favor, ingrese un código de cupón válido.',
        showConfirmButton: true
      });
      return;
    }

    this.cuponService.validarCupon(this.codigoCupon.trim()).subscribe(
      (response: any) => {
        if (response.valid) {
          
          this.cuponService.obtenerCuponPorCodigoDetallado(this.codigoCupon.trim()).subscribe(
            (response: any) => {
              if (response) {
                console.log('Cupón válido:', response);

                  if(response.montoMinimo && response.montoMinimo > 0 && this.totalPedido < response.montoMinimo) {
                    this.errorCupon = true;
                    this.textoErrorCupon = `El cupón requiere un monto mínimo de S/${response.montoMinimo} para ser aplicado.`;
                    return;
                  }

                  // Verificar si el cupón es aplicable a cualquier cliente o a clientes específicos
                  const esParaTodosLosClientes = !response.clientes || response.clientes.length === 0;
                  let clienteValido = false;

                  if (esParaTodosLosClientes) {
                    clienteValido = true; // Cupón válido para todos los clientes
                  } else {
                    // Verificar si el cliente actual está en la lista de clientes del cupón
                    clienteValido = response.clientes.some((cliente: any) => cliente.idCliente === this.pedido.cliente.idCliente);
                  }

                  if (clienteValido) {
                    // CLIENTE VÁLIDO - Verificar productos
                    const esParaTodosLosProductos = !response.productos || response.productos.length === 0 || 
                      (response.productos.length === 1 && response.productos[0].idProducto === "-1");
                    let productoValido = false;

                    if (esParaTodosLosProductos) {
                      productoValido = true; // Cupón válido para todos los productos
                    } else {
                      // Verificar si algún producto del pedido está en la lista de productos del cupón
                      const productosCupon = response.productos.map((p: any) => p.idProducto);
                      if (this.modoPreparadoMagistral) {
                        // Para preparados magistrales, usar idPreparadoMagistral
                        productoValido = this.preparadosMagistrales.some((prep: any) =>
                          productosCupon.includes(prep.idPreparadoMagistral)
                        );
                      } else {
                        // Para productos regulares, usar idProducto
                        productoValido = this.productosPedido.some((prod: any) =>
                          productosCupon.includes(prod.idProducto)
                        );
                      }
                    }

                    if (productoValido) {
                      this.errorCupon = false;
                      this.textoErrorCupon = '';
                      this.cuponValidado = true;
                      this.textoCupon = "Cupón válido.";

                      this.pedido.cupon = response; // Asignar el cupón al pedido

                      //ACTUALIZAR PRODUCTO DEL PEDIDO CON DESCUENTO
                      let cuponRequest = {
                        idPedido: this.idPedido!,
                        codigoCupon: this.codigoCupon.trim()
                      }
                      this.pedidoService.aplicarCuponPedido(cuponRequest).subscribe((data: any) => {
                        if (data && data.idResultado && data.idResultado > 0) {
                          Swal.fire({
                            icon: 'success',
                            title: '¡Listo!',
                            text: data.mensaje,
                            showConfirmButton: true
                          });
                          this.cargarProductosByIdPedido(this.idPedido!);
                        }else{
                          Swal.fire({
                            icon: 'error',
                            title: 'Oops!',
                            text: data.mensaje,
                            showConfirmButton: true
                          });
                        }
                      },
                      (error) => {
                        console.error('Error al aplicar cupón', error);
                        Swal.fire({
                          icon: 'error',
                          title: 'Oops!',
                          text: 'No se pudo aplicar el cupón, inténtelo de nuevo.',
                          showConfirmButton: true
                        });
                      });
                    } else {
                      this.errorCupon = true;
                      this.textoErrorCupon = 'El cupón no es válido para los productos del pedido.';
                    }

                  }else{
                    this.errorCupon = true;
                    this.textoErrorCupon = 'El cupón no es válido para este cliente.';
                  }

                // Swal.fire({
                //   icon: 'success',
                //   title: '¡Éxito!',
                //   text: 'El código de cupón ha sido aplicado correctamente.',
                //   showConfirmButton: true
                // });
                // this.cargarProductosByIdPedido(this.idPedido!); // Recargar los productos del pedido para reflejar el descuento
              } else {
                Swal.fire({
                  icon: 'error',
                  title: 'Oops!',
                  text: response.message || 'El código de cupón no es válido o ya ha sido utilizado.',
                  showConfirmButton: true
                });
              }
            },
            (error) => {
              console.error('Error al validar el código de cupón', error);
              Swal.fire({
                icon: 'error',
                title: 'Oops!',
                text: 'No se pudo validar el código de cupón, inténtelo de nuevo.',
                showConfirmButton: true
              });
            }
          );

        }else{
          this.errorCupon = true;
          this.textoErrorCupon = response.resultado;
        }
      },
      (error) => {
        console.error('Error al validar el cupón', error);
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: 'No se pudo validar el cupón, inténtelo de nuevo.',
          showConfirmButton: true
        });
      }
    );
    
  }

  quitarCupon() {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas quitar el cupón aplicado al pedido?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, quitar cupón',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Crear request para quitar cupón
        let quitarCuponRequest = {
          idPedido: this.idPedido!
        };

        this.pedidoService.quitarCuponPedido(quitarCuponRequest).subscribe(
          (data: any) => {
            if (data && data.idResultado && data.idResultado > 0) {
              // Restablecer todas las variables relacionadas al cupón
              this.errorCupon = false;
              this.textoErrorCupon = '';
              this.cuponValidado = false;
              this.textoCupon = '';
              this.codigoCupon = '';
              this.pedido.cupon = null;

              Swal.fire({
                icon: 'success',
                title: '¡Listo!',
                text: data.mensaje || 'El cupón ha sido quitado correctamente.',
                showConfirmButton: true
              });

              // Recargar productos para reflejar los cambios (quitar descuentos)
              this.cargarProductosByIdPedido(this.idPedido!);
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Oops!',
                text: data.mensaje || 'No se pudo quitar el cupón.',
                showConfirmButton: true
              });
            }
          },
          (error: any) => {
            console.error('Error al quitar cupón', error);
            Swal.fire({
              icon: 'error',
              title: 'Oops!',
              text: 'No se pudo quitar el cupón, inténtelo de nuevo.',
              showConfirmButton: true
            });
          }
        );
      }
    });
  }

  totalPedido = 0;
  agregarProducto() {

    if (!this.productoSeleccionado || !this.productoSeleccionado.idProducto) {
      Swal.fire({
        icon: 'warning',
        title: 'Oops!',
        text: 'Por favor, seleccione un producto antes de agregarlo al pedido.',
        showConfirmButton: true
      });
      return;
    }

    const productoExistente = this.productosPedido.some(p => p.idProducto === this.productoSeleccionado.idProducto);
    if (productoExistente) {
      Swal.fire({
        icon: 'warning',
        title: 'Oops!',
        text: 'El producto seleccinado ya se encuentra agregado al pedido.',
        showConfirmButton: true
      });
    } else {
      let productoRequest: PedidoProductoRequest = {
        idPedido: this.idPedido!,
        idProducto: this.productoSeleccionado.idProducto,
        cantidad: this.cantidad,
        personalizado: false
      };
      this.pedidoService.saveProductoForPedido(productoRequest).subscribe((data: any) => {
          if(data){
            Swal.fire({
              icon: 'success',
              title: '¡Listo!',
              text: 'El producto ha sido agregado correctamente.',
              showConfirmButton: true
            });
            this.query = '';
            this.cantidad = 1;
            this.cargarProductosByIdPedido(this.idPedido!);
          }
        },
        (error) => {
          console.error('Error al agregar producto al pedido', error);
          Swal.fire({
            icon: 'error',
            title: 'Oops!',
            text: 'No se pudo agregar el producto al pedido, inténtelo de nuevo.',
            showConfirmButton: true
          });
        });
    }

    
  }

  changeCantidad(producto: PedidoProducto, event: Event) {

    this.isLoading = true;

    clearTimeout(this.updateTimeout);
    const cantidad = (event.target as HTMLInputElement).value;
    if (cantidad) {
      const cantidadNumber = parseInt(cantidad, 10);
      if (!isNaN(cantidadNumber) && cantidadNumber > 0) {
        producto.cantidad = cantidadNumber;
        if(producto.tieneDescuento){
          producto.subtotal = (producto.precio - ((this.pedido.cupon.descuento / 100) * producto.precio)) * producto.cantidad;
        } else {
          producto.subtotal = producto.precio * producto.cantidad;
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: 'La cantidad debe ser un número positivo.',
          showConfirmButton: true
        });
      }
    } else {
      producto.cantidad = 1;
      producto.subtotal = producto.precio * producto.cantidad;
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: 'La cantidad no puede estar vacía.',
        showConfirmButton: true
      });
    }
      
    // Establece un nuevo temporizador para 1 segundo
    this.updateTimeout = setTimeout(() => {
      const cantidadNumber = parseInt(cantidad, 10);
      if (!isNaN(cantidadNumber) && cantidadNumber > 0) {
        producto.cantidad = cantidadNumber;
        if(producto.tieneDescuento){
          producto.subtotal = (producto.precio - ((this.pedido.cupon.descuento / 100) * producto.precio)) * producto.cantidad;
        } else {
          producto.subtotal = producto.precio * producto.cantidad;
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: 'La cantidad debe ser un número positivo.',
          showConfirmButton: true
        });
      }
      let productoRequest: PedidoProductoRequest = {
        idPedido: this.idPedido!,
        idProducto: producto.idProducto,
        cantidad: cantidadNumber,
        personalizado: producto.personalizado
      };
      this.pedidoService.saveProductoForPedido(productoRequest).subscribe((data: any) => {
        if(data){
          this.showSuccess(this.successTpl);
          this.cargarProductosByIdPedido(this.idPedido!);
          this.isLoading = false;
        }
      },
      (error) => {
        console.error('Error al agregar producto al pedido', error);
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: 'No se pudo agregar el producto al pedido, inténtelo de nuevo.',
          showConfirmButton: true
        });
      });
    }, 1000);
    
    
  }

  changeCantidadPreparado(preparado: PreparadoMagistral, event: Event) {
    this.isLoading = true;

    clearTimeout(this.updateTimeout);
    const cantidad = (event.target as HTMLInputElement).value;
    if (cantidad) {
      const cantidadNumber = parseInt(cantidad, 10);
      if (!isNaN(cantidadNumber) && cantidadNumber > 0) {
        preparado.cantidad = cantidadNumber;
        preparado.subtotal = preparado.precio * preparado.cantidad;
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: 'La cantidad debe ser un número positivo.',
          showConfirmButton: true
        });
      }
    } else {
      preparado.cantidad = 1;
      preparado.subtotal = preparado.precio * preparado.cantidad;
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: 'La cantidad no puede estar vacía.',
        showConfirmButton: true
      });
    }

    // Establece un nuevo temporizador para 1 segundo
    this.updateTimeout = setTimeout(() => {
      const cantidadNumber = parseInt(cantidad, 10);
      if (!isNaN(cantidadNumber) && cantidadNumber > 0) {
        preparado.cantidad = cantidadNumber;
        preparado.subtotal = preparado.precio * preparado.cantidad;
      }

      // Implementar endpoint para actualizar cantidad de preparado magistral
      const cantidadRequest = {
        idPedido: this.idPedido!,
        idPreparadoMagistral: preparado.idPreparadoMagistral,
        cantidad: cantidadNumber
      };

      this.pedidoService.updateCantidadPreparadoMagistral(cantidadRequest).subscribe(
        (response: any) => {
          if (response) {
            console.log('Cantidad de preparado magistral actualizada:', response);
            this.showSuccess(this.successTpl);
            this.cargarProductosByIdPedido(this.idPedido!);
            this.isLoading = false;
          }
        },
        (error: any) => {
          console.error('Error al actualizar cantidad de preparado magistral', error);
          this.isLoading = false;
          Swal.fire({
            icon: 'error',
            title: 'Oops!',
            text: 'No se pudo actualizar la cantidad del preparado magistral, inténtelo de nuevo.',
            showConfirmButton: true
          });
        }
      );
    }, 1000);
  }

  selectProducto(producto: Producto, busquedaAvanzada: boolean = false) {
    this.query = producto.productoMaestro.nombre + " - " + producto.presentacion + " " + producto.tipoPresentacion.descripcion;
    this.productosBusqueda = [];
    this.productoSeleccionado = producto;

    if( busquedaAvanzada ) {
      this.agregarProducto();
      this.modalService.dismissAll(); // Cierra el modal de búsqueda avanzada
    }
  }

  eliminarProducto(producto: PedidoProducto) {
    Swal.fire({
      title: '¿Estás seguro?',
      html: "¿Deseas eliminar el producto '<b>" + producto.nombre + "</b>' del pedido?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.pedidoService.deleteProductoDePedido(this.idPedido!, producto.idProducto).subscribe(
          {
            next: (response) => {
              Swal.fire({
                icon: 'success',
                title: '¡Listo!',
                text: 'El producto ha sido eliminado correctamente.',
                showConfirmButton: true
              });
              this.cargarProductosByIdPedido(this.idPedido!);
              if(this.codigoCupon && this.codigoCupon.trim() !== '') {
                this.validarCodigoCupon();
              }
            },
            error: (error) => {
              console.error('Error al eliminar producto del pedido', error);
              Swal.fire({
                icon: 'error',
                title: 'Oops!',
                text: 'No se pudo eliminar el producto del pedido, inténtelo de nuevo.',
                showConfirmButton: true
              });
            }
          });
      }
    })
  }

  eliminarPreparado(preparado: PreparadoMagistral) {
    Swal.fire({
      title: '¿Estás seguro?',
      html: "¿Deseas eliminar el preparado magistral '<b>" + preparado.nombre + "</b>' del pedido?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        // TODO: Implementar endpoint específico para eliminar preparados magistrales
        // Por ahora, usar el endpoint genérico (puede necesitar ajustes en el backend)
        this.pedidoService.deleteProductoDePedido(this.idPedido!, preparado.idPreparadoMagistral).subscribe(
          {
            next: (response) => {
              Swal.fire({
                icon: 'success',
                title: '¡Listo!',
                text: 'El preparado magistral ha sido eliminado correctamente.',
                showConfirmButton: true
              });
              this.cargarProductosByIdPedido(this.idPedido!);
              if(this.codigoCupon && this.codigoCupon.trim() !== '') {
                this.validarCodigoCupon();
              }
            },
            error: (error) => {
              console.error('Error al eliminar preparado magistral del pedido', error);
              Swal.fire({
                icon: 'error',
                title: 'Oops!',
                text: 'No se pudo eliminar el preparado magistral del pedido, inténtelo de nuevo.',
                showConfirmButton: true
              });
            }
          });
      }
    })
  }

  showStandard(template: TemplateRef<any>) {
		this.toastService.show({ template });
	}

	showSuccess(template: TemplateRef<any>) {
		this.toastService.show({ template, classname: 'bg-success text-light', delay: 3000 });
	}

	showDanger(template: TemplateRef<any>) {
		this.toastService.show({ template, classname: 'bg-danger text-light', delay: 3000 });
	}

  onSearchBlur() {
    setTimeout(() => {
      this.searchFocused = false;
    }, 200);
  }

  isValidDni(dni: string): boolean {
    return /^\d{8}$/.test(dni);
  }

  isValidRuc(ruc: string): boolean {
    return /^\d{11}$/.test(ruc);
  }

  onDniKeyup() {
    if (typeof this.dniCliente === 'string') {
      this.dniCliente = this.dniCliente.replace(/[^0-9]/g, '').slice(0, 8);
    }
  }

  onRucKeyup() {
    if (this.rucCliente) {
      this.rucCliente = this.rucCliente.replace(/[^0-9]/g, '').slice(0, 11);
    }
  }

  changeTipoComprobante() {
    if (this.tipoComprobante === 2) { // Factura
      if (this.pedido.cliente.tipoDocumento.idTipoDocumento === 2) {
        this.rucCliente = this.pedido.cliente.ruc || '';
        this.razonSocialCliente = this.pedido.cliente.razonSocial || '';
        this.dniCliente = '';
        this.nombreCompletoCliente = '';
      } else {
        this.rucCliente = '';
        this.razonSocialCliente = '';
        this.dniCliente = '';
        this.nombreCompletoCliente = '';
      }
    } else if (this.tipoComprobante === 1) { // Boleta
      if (this.pedido.cliente.tipoDocumento.idTipoDocumento === 1) {
        this.rucCliente = '';
        this.razonSocialCliente = '';
        this.dniCliente = this.pedido.cliente.numeroDocumento || '';
        this.nombreCompletoCliente = (this.pedido.cliente.nombres || '') + " " + (this.pedido.cliente.apellidos || '');
      } else {
        this.rucCliente = '';
        this.razonSocialCliente = '';
        this.dniCliente = '';
        this.nombreCompletoCliente = '';
      }
    }
  }

  guardarDatosCliente() {
    if (this.tipoComprobante === 2) { // Factura
      if (!this.isValidRuc(this.rucCliente)) {
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: 'El RUC debe tener 11 dígitos.',
          showConfirmButton: true
        });
        return;
      }
      if (this.razonSocialCliente.trim() === '') {
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: 'La razón social no puede estar vacía.',
          showConfirmButton: true
        });
        return;
      }
    } else if (this.tipoComprobante === 1) { // Boleta
      if (!this.isValidDni(this.dniCliente)) {
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: 'El DNI debe tener 8 dígitos.',
          showConfirmButton: true
        });
        return;
      }
      if (this.nombreCompletoCliente.trim() === '') {
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: 'El nombre completo no puede estar vacío.',
          showConfirmButton: true
        });
        return;
      }
    }

    //Falta validar si el cliente ya tiene un documento creado, y luego selecciona SIN COMPROBANTE

    const tipoComprobanteStr = this.tipoComprobante === 1 ? "03" : this.tipoComprobante === 2 ? "01" : "";
    this.documentoService.crearDocumento({
      idPedido: this.idPedido!,
      tipoComprobante: tipoComprobanteStr,
      tipoDocumentoCliente: this.tipoComprobante === 2 ? '6' : '1',
      numeroDocumentoCliente: this.tipoComprobante === 2 ? this.rucCliente : this.tipoComprobante === 1 ? this.dniCliente : null,
      razonSocialCliente: this.tipoComprobante === 2 ? this.razonSocialCliente : null,
      nombreCliente: this.tipoComprobante === 1 ? this.nombreCompletoCliente : null,
      direccionCliente: ""
    }).subscribe(
      (data) => {
        if(data && data.idResultado && data.idResultado > 0) {
          //Actualizar el pedido con el documento creado
          this.getPedidoById(this.idPedido!);
          Swal.fire({
            icon: 'success',
            title: '¡Listo!',
            text: "Información para el comprobante actualizada correctamente.",
            showConfirmButton: true
          });
        }else{
          Swal.fire({
            icon: 'error',
            title: 'Oops!',
            text: data.resultado,
            showConfirmButton: true
          });
        }
      },
      (error) => {
        console.error('Error al actualizar datos del cliente', error);
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: 'No se pudo actualizar los datos del cliente, inténtelo de nuevo.',
          showConfirmButton: true
        });
      }
    );
  }

  // Método para manejar cambios en el textarea de nota delivery
  onNotaDeliveryChange() {
    // Limpiar el timeout anterior si existe
    if (this.notaDeliveryTimeout) {
      clearTimeout(this.notaDeliveryTimeout);
    }

    // Configurar un nuevo timeout de 2 segundos
    this.notaDeliveryTimeout = setTimeout(() => {
      if (this.notaDelivery.trim() !== '' && this.idPedido) {
        this.actualizarNotaDelivery();
      }
    }, 2000);
  }

  // Método para actualizar la nota de delivery en el backend
  private actualizarNotaDelivery() {
    const notaRequest = {
      idPedido: this.idPedido,
      notaDelivery: this.notaDelivery.trim()
    };

    console.log('Guardando nota de delivery:', notaRequest);
    
    this.pedidoService.actualizarNotaDelivery(notaRequest).subscribe(
      (response: any) => {
        if (response && response.idResultado && response.idResultado > 0) {
          console.log('Nota de delivery actualizada correctamente');
          this.showSuccess(this.successTplNotDelivery);
        } else {
          console.error('Error al actualizar nota de delivery:', response?.resultado);
        }
      },
      (error: any) => {
        console.error('Error al actualizar nota de delivery:', error);
      }
    );
  }

  // Método para retroceder en el stepper
  prevStep() {
    if (this.activeStepIndex > 0) {
      this.activeStepIndex--;
    }
  }

  // Método para avanzar en el stepper
  nextStep() {
    const maxSteps = this.totalPasos - 1; // Convertir a índice base 0
    console.log('nextStep - activeStepIndex:', this.activeStepIndex, 'maxSteps:', maxSteps, 'totalPasos:', this.totalPasos, 'esPedidoPagado:', this.esPedidoPagado);
    if (this.activeStepIndex < maxSteps) {
      this.activeStepIndex++;
    }
  }

  // Método para verificar si se puede avanzar al siguiente paso
  canAdvanceToNextStep(): boolean {
    switch (this.activeStepIndex) {
      case 0: // Paso 1: Productos
        return this.productosPedido.length > 0;
      case 1: // Paso 2: Cliente
        return !!this.clienteSeleccionado || this.esClienteGenerico;
      case 2: // Paso 3: Entrega
        if (this.esPedidoPagado) {
          return false; // Si está pagado, el paso 3 es el último
        }
        return this.lstMetodosEntrega.length > 0 && !!this.idMetodoEntregaSeleccionado;
      case 3: // Paso 4: Pago (solo si no está pagado)
        return false; // El último paso no necesita avanzar
      default:
        return false;
    }
  }

  // Método para aceptar términos y condiciones
  aceptarTerminos() {
    this.modalService.dismissAll();
    console.log('Términos y condiciones aceptados');
  }

}
