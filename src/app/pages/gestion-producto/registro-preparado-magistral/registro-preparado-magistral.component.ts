import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StepperModule } from 'primeng/stepper';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { TipoPresentacionService } from '../../../services/tipo-presentacion.service';
import { MateriaPrimaService } from '../../../services/materia-prima.service';
import { PreparadoMagistralService } from '../../../services/preparado-magistral.service';
import { PedidoService } from '../../../services/pedido.service';
import { CanalVentaService } from '../../../services/canal-venta.service';
import { MetodoEntregaService } from '../../../services/metodo-entrega.service';
import { SolicitudPreparadoMagistralService } from '../../../services/solicitud-preparado-magistral.service';
import Swal from 'sweetalert2';

export interface PreparadoMagistral {
  idSolicitudPreparadoMagistral: number;
  nombre: string;
  descripcion: string;
  precio: number;
  presentacion: number;
  idTipoPresentacion: number;
  phDefinidoMin: number | null;
  phDefinidoMax: number | null;
  materiasPrimas: MateriaPrimaUsada[];
  procedimientos: Procedimiento[];
  elementosSeguridadPersonal: string;
  utillaje: string;
  controlCalidad: string;
  tipoEnvase: string;
  colorEtiqueta: string;
  indicacionesPosologia: string;
  conservacion: string;
  reaccionesAdversas: string;
  precaucionesContraindicaciones: string;
  observaciones: string;
  bibliografia: string;
}

export interface MateriaPrimaUsada {
  idMateriaPrima: number;
  cantidad: number;
}

export interface Procedimiento {
  orden: number;
  descripcion: string;
}

export interface PedidoData {
  idCliente: number;
  idCanalVenta: number;
  idMetodoEntrega: number;
  observaciones: string;
  fechaEstimadaEntrega: string;
  idPreparadoMagistral: string;
  cantidad: number;
  observacionPreparado: string;
}

@Component({
  selector: 'app-registro-preparado-magistral',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StepperModule,
    ButtonModule,
    DividerModule,
    TableModule
  ],
  templateUrl: './registro-preparado-magistral.component.html',
  styleUrls: ['./registro-preparado-magistral.component.scss']
})
export class RegistroPreparadoMagistralComponent implements OnInit {
  currentStep: number = 0;
  preparado: PreparadoMagistral = {} as PreparadoMagistral;
  pedidoData: PedidoData = {} as PedidoData;
  
  // Modo de operación
  modoCrear: boolean = true; // true = crear nuevo, false = actualizar existente
  idPreparadoMagistralActualizar: string = '';
  idPedidoActualizar: string = '';
  
  // Data de servicios
  tiposPresentacion: any[] = [];
  materiasPrimas: any[] = [];
  canalesVenta: any[] = [];
  metodosEntrega: any[] = [];
  
  // Estados
  isSubmitting: boolean = false;
  preparadoCreado: boolean = false;
  idPreparadoMagistralCreado: string = '';
  
  // Data desde la calculadora
  datosCalculadora: any = null;
  
  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private tipoPresentacionService: TipoPresentacionService,
    private materiaPrimaService: MateriaPrimaService,
    private preparadoService: PreparadoMagistralService,
    private pedidoService: PedidoService,
    private canalVentaService: CanalVentaService,
    private metodoEntregaService: MetodoEntregaService,
    private solicitudService: SolicitudPreparadoMagistralService,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeModels();
  }

  ngOnInit(): void {
    this.cargarDatos();
    this.obtenerDatosCalculadora();
  }

  initializeModels(): void {
    this.preparado = {
      idSolicitudPreparadoMagistral: 0,
      nombre: '',
      descripcion: '',
      precio: 0,
      presentacion: 0,
      idTipoPresentacion: 0,
      phDefinidoMin: null,
      phDefinidoMax: null,
      materiasPrimas: [{ idMateriaPrima: 0, cantidad: 0 }], // Inicializar con una entrada como en ingredientes
      procedimientos: [{ orden: 1, descripcion: '' }],
      elementosSeguridadPersonal: '',
      utillaje: '',
      controlCalidad: '',
      tipoEnvase: '',
      colorEtiqueta: '',
      indicacionesPosologia: '',
      conservacion: '',
      reaccionesAdversas: '',
      precaucionesContraindicaciones: '',
      observaciones: '',
      bibliografia: ''
    };

    this.pedidoData = {
      idCliente: 0,
      idCanalVenta: 1,
      idMetodoEntrega: 3,
      observaciones: '',
      fechaEstimadaEntrega: this.getFechaEntregaDefecto(),
      idPreparadoMagistral: '',
      cantidad: 1,
      observacionPreparado: ''
    };
  }

  obtenerDatosCalculadora(): void {
    // Obtener datos de query parameters primero
    this.route.queryParams.subscribe(queryParams => {
      // Detectar modo de operación
      this.modoCrear = queryParams['modo'] !== 'actualizar';
      
      if (this.modoCrear) {
        // Modo crear: datos desde calculadora
        this.preparado.idSolicitudPreparadoMagistral = parseInt(queryParams['idSolicitud']) || 0;
        this.pedidoData.idCliente = parseInt(queryParams['idCliente']) || 0;
        this.preparado.idTipoPresentacion = parseInt(queryParams['idTipoPresentacion']) || 1;
        
        // Solo obtener los datos, la carga se hará después de cargar materias primas
        if (this.preparado.idSolicitudPreparadoMagistral > 0) {
          const calculadoraData = localStorage.getItem(`calculadora_datos_${this.preparado.idSolicitudPreparadoMagistral}`);
          if (calculadoraData) {
            this.datosCalculadora = JSON.parse(calculadoraData);
          }
        }
      } else {
        // Modo actualizar: datos desde API
        this.idPedidoActualizar = queryParams['idPedido'] || '';
        this.idPreparadoMagistralActualizar = queryParams['idPreparadoMagistral'] || '';
        
        if (this.idPedidoActualizar) {
          this.cargarDatosPreparadoMagistral();
        }
      }
    });
  }

  cargarDatosDesdeCalculadora(): void {
    if (this.datosCalculadora) {
      // Cargar datos básicos
      this.preparado.nombre = ''; // Dejar el nombre vacío para que el usuario lo ingrese
      this.preparado.descripcion = this.datosCalculadora.nombrePersonalizado || this.datosCalculadora.descripcionPersonalizada || '';
      this.preparado.precio = this.datosCalculadora.precioVentaFinalRedondeado || this.datosCalculadora.precioVentaFinal || 0;
      this.preparado.presentacion = this.datosCalculadora.presentacion || 0;
      
      // Precargar materias primas desde los componentes de la calculadora
      if (this.datosCalculadora.componentes && this.datosCalculadora.componentes.length > 0) {
        this.preparado.materiasPrimas = this.datosCalculadora.componentes.map((componente: any) => ({
          idMateriaPrima: Number(componente.idMateriaPrima), // Asegurar que sea número
          cantidad: Math.round(componente.porcentaje * 100 * 100) / 100 // Convertir de decimal a porcentaje
        }));
        
        console.log('Materias primas precargadas:', this.preparado.materiasPrimas);
        console.log('Materias primas disponibles:', this.materiasPrimas);
        
        // Verificar que los IDs coincidan
        this.preparado.materiasPrimas.forEach((mp, index) => {
          const materiaPrimaExiste = this.materiasPrimas.find(m => m.idMateriaPrima === mp.idMateriaPrima);
          console.log(`Materia prima ${index}: ID=${mp.idMateriaPrima}, existe=${!!materiaPrimaExiste}, nombre=${materiaPrimaExiste?.nombre}`);
        });
      } else {
        // Si no hay componentes, inicializar con array vacío
        this.preparado.materiasPrimas = [];
      }
      
      console.log('Datos cargados desde calculadora:', this.datosCalculadora);
    }
  }

  cargarDatosPreparadoMagistral(): void {
    if (!this.idPedidoActualizar) return;

    // Paso 1: Obtener el idPreparadoMagistral desde el pedido
    this.pedidoService.getPreparadosMagistralesByIdPedido(this.idPedidoActualizar).subscribe(
      (response) => {
        if (response && response.length > 0) {
          const preparadoEnPedido = response[0]; // Tomar el primer preparado magistral
          this.idPreparadoMagistralActualizar = preparadoEnPedido.idPreparadoMagistral;
          
          console.log('ID del preparado magistral obtenido:', this.idPreparadoMagistralActualizar);
          
          // Paso 2: Obtener los datos completos del preparado magistral
          this.cargarDatosCompletos();
        }
      },
      (error) => {
        console.error('Error al obtener idPreparadoMagistral desde pedido', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo obtener la información del preparado magistral desde el pedido',
          showConfirmButton: true
        });
      }
    );
  }

  cargarDatosCompletos(): void {
    if (!this.idPreparadoMagistralActualizar) return;

    this.preparadoService.getPreparadoMagistralById(this.idPreparadoMagistralActualizar).subscribe(
      (response) => {
        console.log('Datos completos recibidos del preparado magistral:', response);
        
        // Mapear los datos del response al modelo del preparado
        this.preparado = {
          idSolicitudPreparadoMagistral: response.solicitudPreparadoMagistral?.id || 0,
          nombre: response.nombre || '',
          descripcion: response.descripcion || '',
          precio: response.precio || 0,
          presentacion: response.presentacion || 0,
          idTipoPresentacion: response.tipoPresentacion?.idTipoPresentacion || 0,
          phDefinidoMin: response.phDefinidoMin || null,
          phDefinidoMax: response.phDefinidoMax || null,
          materiasPrimas: this.mapearMateriasPrimas(response.materiasPrimas || []),
          procedimientos: response.procedimientos || [{ orden: 1, descripcion: '' }],
          elementosSeguridadPersonal: response.elementosSeguridadPersonal || '',
          utillaje: response.utillaje || '',
          controlCalidad: response.controlCalidad || '',
          tipoEnvase: response.tipoEnvase || '',
          colorEtiqueta: response.colorEtiqueta || '',
          indicacionesPosologia: response.indicacionesPosologia || '',
          conservacion: response.conservacion || '',
          reaccionesAdversas: response.reaccionesAdversas || '',
          precaucionesContraindicaciones: response.precaucionesContraindicaciones || '',
          observaciones: response.observaciones || '',
          bibliografia: response.bibliografia || ''
        };
        
        console.log('Datos del preparado magistral mapeados:', this.preparado);
      },
      (error) => {
        console.error('Error al cargar datos completos del preparado magistral', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los datos completos del preparado magistral',
          showConfirmButton: true
        });
      }
    );
  }

  mapearMateriasPrimas(materiasPrimasResponse: any[]): MateriaPrimaUsada[] {
    if (!materiasPrimasResponse || materiasPrimasResponse.length === 0) {
      return [{ idMateriaPrima: 0, cantidad: 0 }];
    }

    return materiasPrimasResponse.map(mp => ({
      idMateriaPrima: mp.materiaPrima.idMateriaPrima,
      cantidad: mp.cantidad
    }));
  }

  // Métodos trackBy para optimizar rendering
  trackByIndex(index: number, item: any): number {
    return index;
  }

  trackByMateriaPrima(index: number, item: any): number {
    return item.idMateriaPrima;
  }

  trackByCanalVenta(index: number, item: any): number {
    return item.idCanalVenta;
  }

  trackByMetodoEntrega(index: number, item: any): number {
    return item.idMetodoEntrega;
  }

  // Función para comparar valores en el select
  compareFn(a: any, b: any): boolean {
    return Number(a) === Number(b);
  }

  cargarDatos(): void {
    this.cargarTiposPresentacion();
    
    // Solo cargar datos del pedido si estamos en modo crear
    if (this.modoCrear) {
      this.cargarCanalesVenta();
      this.cargarMetodosEntrega();
    }
    
    // Cargar materias primas primero y luego cargar datos según el modo
    this.cargarMateriasPrimas();
  }

  cargarTiposPresentacion(): void {
    this.tipoPresentacionService.getTiposPresentacion().subscribe(
      (tipos) => (this.tiposPresentacion = tipos),
      (error) => console.error('Error al cargar tipos de presentación', error)
    );
  }

  cargarMateriasPrimas(): void {
    this.materiaPrimaService.getMateriasPrimas().subscribe(
      (materias) => {
        this.materiasPrimas = materias;
        console.log('Materias primas cargadas desde servicio:', this.materiasPrimas.length);
        
        // Después de cargar las materias primas, cargar datos de calculadora si existen
        if (this.datosCalculadora) {
          // Usar setTimeout para asegurar que Angular detecte los cambios
          setTimeout(() => {
            this.cargarDatosDesdeCalculadora();
            this.cdr.detectChanges(); // Forzar detección de cambios
          }, 100);
        }
      },
      (error) => console.error('Error al cargar materias primas', error)
    );
  }

  cargarCanalesVenta(): void {
    this.canalVentaService.getCanalesVenta().subscribe(
      (canales) => {
        this.canalesVenta = canales;
        console.log('Canales de venta cargados:', this.canalesVenta);
      },
      (error) => console.error('Error al cargar canales de venta', error)
    );
  }

  cargarMetodosEntrega(): void {
    this.metodoEntregaService.getMetodosEntrega().subscribe(
      (metodos) => {
        this.metodosEntrega = metodos;
        console.log('Métodos de entrega cargados:', this.metodosEntrega);
      },
      (error) => console.error('Error al cargar métodos de entrega', error)
    );
  }

  // Manejo de materias primas (similar a ingredientes)
  agregarMateriaPrima(): void {
    const sumaActual = this.preparado.materiasPrimas.reduce((acc, mp) => acc + (mp.cantidad || 0), 0);
    const cantidadRestante = 100 - sumaActual;

    if (cantidadRestante <= 0) {
      Swal.fire({
        icon: 'warning',
        title: '¡Atención!',
        text: 'Ya se completó el 100% en la suma de las cantidades de las materias primas.',
        showConfirmButton: true
      });
      return;
    }

    this.preparado.materiasPrimas.push({
      idMateriaPrima: 0,
      cantidad: cantidadRestante
    });
  }

  eliminarMateriaPrima(index: number): void {
    if (this.preparado.materiasPrimas.length > 1) {
      this.preparado.materiasPrimas.splice(index, 1);
    }
  }

  // Manejo de procedimientos
  agregarProcedimiento(): void {
    const nuevoOrden = this.preparado.procedimientos.length + 1;
    this.preparado.procedimientos.push({
      orden: nuevoOrden,
      descripcion: ''
    });
  }

  eliminarProcedimiento(index: number): void {
    if (this.preparado.procedimientos.length > 1) {
      this.preparado.procedimientos.splice(index, 1);
      this.reordenarProcedimientos();
    }
  }

  reordenarProcedimientos(): void {
    this.preparado.procedimientos.forEach((proc, index) => {
      proc.orden = index + 1;
    });
  }

  // Validaciones
  get materiasPrimasInvalidas(): boolean {
    if (!this.preparado.materiasPrimas || this.preparado.materiasPrimas.length < 1) {
      return true;
    }

    // Todas las materias primas deben tener idMateriaPrima distinto de 0 y cantidad > 0
    const algunaMateriaPrimaInvalida = this.preparado.materiasPrimas.some(
      (mp: any) => !mp.idMateriaPrima || !mp.cantidad
    );
    if (algunaMateriaPrimaInvalida) {
      return true;
    }

    // La suma de las cantidades debe ser exactamente 100
    const suma = this.preparado.materiasPrimas.reduce((acc, mp) => acc + (mp.cantidad || 0), 0);
    if (suma !== 100) {
      return true;
    }

    return false;
  }

  get materiasValidas(): boolean {
    return !this.materiasPrimasInvalidas;
  }

  get procedimientosValidos(): boolean {
    return this.preparado.procedimientos.every(proc => 
      proc.descripcion.trim() !== ''
    );
  }

  get datosBasicosValidos(): boolean {
    return !!(this.preparado.nombre && 
             this.preparado.descripcion && 
             this.preparado.phDefinidoMin !== null && 
             this.preparado.phDefinidoMax !== null &&
             this.preparado.phDefinidoMax > this.preparado.phDefinidoMin &&
             this.materiasValidas &&
             this.procedimientosValidos);
  }

  get pedidoValido(): boolean {
    // Solo validar datos del pedido en modo crear
    if (!this.modoCrear) return true;
    
    return !!(this.pedidoData.idCanalVenta &&
             this.pedidoData.idMetodoEntrega &&
             this.pedidoData.cantidad > 0 &&
             this.pedidoData.fechaEstimadaEntrega);
  }

  // Getter para determinar si se pueden mostrar ciertos tabs según el modo
  get mostrarTabPedido(): boolean {
    return false; // Ya no se usa el tab de pedido
  }

  get mostrarTabDatosAdicionales(): boolean {
    return !this.modoCrear; // Solo mostrar en modo actualizar
  }

  // Navegación entre pasos
  onStepChange(event: any): void {
    this.currentStep = event.index;
  }

  // Guardar preparado magistral (modo crear: ejecuta todo el flujo)
  guardarPreparado(nextCallback: any): void {
    if (!this.datosBasicosValidos) {
      Swal.fire({
        icon: 'warning',
        title: 'Datos incompletos',
        text: 'Por favor complete todos los campos obligatorios',
        showConfirmButton: true
      });
      return;
    }

    if (this.modoCrear) {
      this.ejecutarFlujoCompleto(nextCallback);
    } else {
      this.actualizarPreparadoMagistral(nextCallback);
    }
  }

  // Nuevo flujo completo para modo crear
  ejecutarFlujoCompleto(nextCallback: any): void {
    this.isSubmitting = true;

    // Setear campos vacíos antes de enviar
    this.preparado.elementosSeguridadPersonal = '';
    this.preparado.utillaje = '';
    this.preparado.controlCalidad = '';
    this.preparado.tipoEnvase = '';
    this.preparado.colorEtiqueta = '';
    this.preparado.indicacionesPosologia = '';
    this.preparado.conservacion = '';
    this.preparado.reaccionesAdversas = '';
    this.preparado.precaucionesContraindicaciones = '';
    this.preparado.observaciones = '';
    this.preparado.bibliografia = '';

    Swal.fire({
      title: 'Procesando solicitud...',
      text: 'Guardando preparado magistral y creando pedido',
      allowEscapeKey: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Paso 1: Crear preparado magistral
    this.preparadoService.crearPreparadoMagistral(this.preparado).subscribe(
      (responsePreparado) => {
        this.idPreparadoMagistralCreado = responsePreparado.idPreparadoMagistral;
        this.pedidoData.idPreparadoMagistral = responsePreparado.idPreparadoMagistral;
        
        // Paso 2: Crear pedido
        this.pedidoService.crearPedidoPreparadoMagistral(this.pedidoData).subscribe(
          (responsePedido: any) => {
            const idPedido = responsePedido.value; // El nuevo atributo response.value
            
            // Paso 3: Asignar pedido a solicitud
            this.solicitudService.asignarPedido(this.preparado.idSolicitudPreparadoMagistral, idPedido).subscribe(
              (responseAsignacion) => {
                this.isSubmitting = false;
                this.preparadoCreado = true;
                
                Swal.close();
                Swal.fire({
                  icon: 'success',
                  title: '¡Proceso completado!',
                  text: 'Se ha creado el preparado magistral y el pedido correctamente',
                  showConfirmButton: true
                }).then(() => {
                  nextCallback.emit();
                });
              },
              (errorAsignacion) => {
                this.isSubmitting = false;
                Swal.close();
                console.error('Error al asignar pedido a solicitud', errorAsignacion);
                Swal.fire({
                  icon: 'error',
                  title: 'Error en asignación',
                  text: 'Se creó el preparado y pedido, pero hubo un error al asignar el pedido a la solicitud',
                  showConfirmButton: true
                });
              }
            );
          },
          (errorPedido) => {
            this.isSubmitting = false;
            Swal.close();
            console.error('Error al crear pedido', errorPedido);
            Swal.fire({
              icon: 'error',
              title: 'Error al crear pedido',
              text: errorPedido.error?.mensaje || 'Ocurrió un error al crear el pedido',
              showConfirmButton: true
            });
          }
        );
      },
      (errorPreparado) => {
        this.isSubmitting = false;
        Swal.close();
        console.error('Error al guardar preparado magistral', errorPreparado);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorPreparado.error?.mensaje || 'Ocurrió un error al guardar el preparado magistral',
          showConfirmButton: true
        });
      }
    );
  }

  // Método para actualizar preparado magistral
  actualizarPreparadoMagistral(nextCallback: any): void {
    this.isSubmitting = true;

    Swal.fire({
      title: 'Actualizando preparado magistral...',
      allowEscapeKey: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.preparadoService.actualizarPreparadoMagistral(this.idPreparadoMagistralActualizar, this.preparado).subscribe(
      (response) => {
        this.isSubmitting = false;
        
        Swal.close();
        Swal.fire({
          icon: 'success',
          title: '¡Actualizado!',
          text: 'El preparado magistral se ha actualizado correctamente',
          showConfirmButton: true
        }).then(() => {
          nextCallback.emit();
        });
      },
      (error) => {
        this.isSubmitting = false;
        Swal.close();
        console.error('Error al actualizar preparado magistral', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.mensaje || 'Ocurrió un error al actualizar el preparado magistral',
          showConfirmButton: true
        });
      }
    );
  }

  // Método crearPedido eliminado - ya no se usa directamente

  // Navegación
  volverCalculadora(): void {
    if (this.hayDatosEnFormulario()) {
      Swal.fire({
        title: '¿Está seguro?',
        text: 'Hay datos sin guardar en el formulario. ¿Desea volver a la calculadora?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, volver',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.navegarACalculadora();
        }
      });
    } else {
      this.navegarACalculadora();
    }
  }

  private navegarACalculadora(): void {
    // Construir los query parameters necesarios para el modo preparado magistral
    const queryParams: any = {
      modo: 'preparado-magistral',
      idSolicitud: this.preparado.idSolicitudPreparadoMagistral,
      idCliente: this.pedidoData.idCliente,
      idTipoPresentacion: this.preparado.idTipoPresentacion
    };

    // Agregar descripción si existe
    if (this.preparado.nombre) {
      queryParams.descripcion = this.preparado.nombre;
    } else if (this.preparado.descripcion) {
      queryParams.descripcion = this.preparado.descripcion;
    }

    console.log('Navegando a calculadora con parámetros:', queryParams);

    // Navegar con los parámetros correctos
    this.router.navigate(['/pages/atencion-cliente/calculadora-maestra'], {
      queryParams: queryParams
    });
  }

  hayDatosEnFormulario(): boolean {
    return !!(this.preparado.nombre || 
             this.preparado.descripcion || 
             this.preparado.elementosSeguridadPersonal ||
             this.preparado.utillaje ||
             this.preparado.controlCalidad);
  }

  limpiarDatos(): void {
    // Solo limpiar los datos de la calculadora cuando el proceso esté completamente terminado
    if (this.preparado.idSolicitudPreparadoMagistral > 0) {
      localStorage.removeItem(`calculadora_datos_${this.preparado.idSolicitudPreparadoMagistral}`);
    }
    this.initializeModels();
  }

  limpiarDatosSoloFormulario(): void {
    // Método para limpiar solo el formulario sin afectar los datos de la calculadora
    this.initializeModels();
  }

  obtenerNombreMateriaPrima(idMateriaPrima: number): string {
    const materia = this.materiasPrimas.find(m => m.idMateriaPrima === idMateriaPrima);
    return materia ? materia.nombre : 'Materia prima no encontrada';
  }

  obtenerTipoPresentacion(idTipoPresentacion: number): string {
    const tipo = this.tiposPresentacion.find(t => t.idTipoPresentacion === idTipoPresentacion);
    return tipo ? tipo.descripcion : 'Tipo no encontrado';
  }

  // Suma total de materias primas (debe ser 100%)
  get sumaMateriasPrimas(): number {
    return this.preparado.materiasPrimas.reduce((acc, mp) => acc + (mp.cantidad || 0), 0);
  }

  // Fecha mínima para entrega (mañana)
  get fechaMinimaEntrega(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  // Fecha por defecto para entrega (7 días después de hoy)
  getFechaEntregaDefecto(): string {
    const fechaEntrega = new Date();
    fechaEntrega.setDate(fechaEntrega.getDate() + 7);
    return fechaEntrega.toISOString().split('T')[0];
  }
}
