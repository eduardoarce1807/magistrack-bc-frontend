import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';

import { DeliveryService } from '../../../services/delivery.service';
import { UbigeoService } from '../../../services/ubigeo.service';
import { DataService } from '../../../services/data.service';
import { 
  TarifaDeliveryFormModel, 
  TarifaDelivery,
  TipoReglaDelivery,
  TIPOS_REGLA_OPTIONS,
  reglaRequiereDistrito
} from '../../../model/deliveryModel';

@Component({
  selector: 'app-crear-editar-tarifa-delivery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-editar-tarifa-delivery.component.html',
  styleUrl: './crear-editar-tarifa-delivery.component.scss'
})
export class CrearEditarTarifaDeliveryComponent implements OnInit {

  // Modelo del formulario simplificado
  tarifa = new TarifaDeliveryFormModel();
  
  // Estado del componente
  isEditMode = false;
  isDuplicateMode = false;
  cargando = false;
  guardando = false;
  
  // ID para edición
  idTarifa: number | null = null;
  
  // Opciones para dropdowns
  tiposReglaOptions = TIPOS_REGLA_OPTIONS;
  
  // Datos para ubicación en cascada (departamento → provincia → distrito)
  departamentos: any[] = [];
  provincias: any[] = [];
  distritos: any[] = [];
  cargandoDepartamentos = false;
  cargandoProvincias = false;
  cargandoDistritos = false;
  
  // Mensajes de validación
  erroresValidacion: string[] = [];
  
  // Control de reglas únicas (nueva funcionalidad)
  reglasUnicasExistentes: {[key: string]: boolean} = {};
  tarifasExistentes: TarifaDelivery[] = [];
  opcionesDisponibles = TIPOS_REGLA_OPTIONS;

  constructor(
    private deliveryService: DeliveryService,
    private ubigeoService: UbigeoService,
    private dataService: DataService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.cargarDepartamentosPermitidos();
    this.recibirReglasExistentes(); // NUEVO: Recibir información de reglas existentes
    this.verificarModoOperacion();
    this.inicializarDescripcionPorDefecto();
  }

  /**
   * Recibe información de reglas existentes del router state
   */
  recibirReglasExistentes(): void {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.reglasUnicasExistentes = navigation.extras.state['reglasExistentes'] || {};
      this.tarifasExistentes = navigation.extras.state['tarifasExistentes'] || [];
      this.actualizarOpcionesDisponibles();
    }
  }

  /**
   * Actualiza las opciones disponibles según las reglas existentes
   */
  actualizarOpcionesDisponibles(): void {
    if (!this.isEditMode) {
      // En modo creación, filtrar opciones únicas que ya existen
      this.opcionesDisponibles = TIPOS_REGLA_OPTIONS.filter(opcion => {
        if (!opcion.esUnico) {
          return true; // DISTRITO_ESPECIFICO siempre disponible
        }
        // Reglas únicas solo disponibles si no existen
        return !this.reglasUnicasExistentes[opcion.value];
      });
    } else {
      // En modo edición, todas las opciones están disponibles
      this.opcionesDisponibles = TIPOS_REGLA_OPTIONS;
    }
  }

  /**
   * Inicializa la descripción por defecto para tarifas nuevas
   */
  inicializarDescripcionPorDefecto(): void {
    if (!this.isEditMode && !this.isDuplicateMode) {
      this.tarifa.descripcion = this.getDescripcionRegla(this.tarifa.tipoRegla);
    }
  }

  /**
   * Verifica el modo de operación basado en la ruta
   */
  verificarModoOperacion(): void {
    this.route.params.subscribe(params => {
      const path = this.route.snapshot.routeConfig?.path;
      
      if (path?.includes('editar') && params['id']) {
        this.isEditMode = true;
        this.isDuplicateMode = false;
        this.idTarifa = +params['id'];
        this.cargarTarifaParaEditar();
      } else if (path?.includes('duplicar') && params['id']) {
        this.isEditMode = false;
        this.isDuplicateMode = true;
        this.idTarifa = +params['id'];
        this.cargarTarifaParaDuplicar();
      } else {
        this.isEditMode = false;
        this.isDuplicateMode = false;
        this.tarifa.reset();
      }
    });
  }

  /**
   * Carga una tarifa para editar
   */
  cargarTarifaParaEditar(): void {
    if (!this.idTarifa) return;
    
    this.cargando = true;
    this.deliveryService.obtenerTarifaPorId(this.idTarifa).subscribe({
      next: (tarifaData: TarifaDelivery) => {
        this.tarifa.fromTarifa(tarifaData);
        
        // Si la tarifa tiene ubicación definida, cargar las provincias y distritos manteniendo la selección
        if (this.tarifa.idDepartamento) {
          this.cargarProvinciasPorDepartamento(this.tarifa.idDepartamento, true);
        }
        
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error al cargar tarifa:', error);
        Swal.fire('Error', 'No se pudo cargar la tarifa para editar', 'error');
        this.volverAlListado();
      }
    });
  }

  /**
   * Carga una tarifa para duplicar
   */
  cargarTarifaParaDuplicar(): void {
    if (!this.idTarifa) return;
    
    this.cargando = true;
    this.deliveryService.obtenerTarifaPorId(this.idTarifa).subscribe({
      next: (tarifaData: TarifaDelivery) => {
        this.tarifa.fromTarifa(tarifaData);
        this.tarifa.id = null; // Limpiar ID para crear nuevo
        
        // Si la tarifa tiene ubicación definida, cargar las provincias y distritos manteniendo la selección
        if (this.tarifa.idDepartamento) {
          this.cargarProvinciasPorDepartamento(this.tarifa.idDepartamento, true);
        }
        
        this.cargando = false;
        
        Swal.fire({
          icon: 'info',
          title: 'Duplicando tarifa',
          text: 'Se han cargado los datos de la tarifa existente. Modifique los campos necesarios y guarde para crear la nueva tarifa.',
          confirmButtonText: 'Entendido'
        });
      },
      error: (error: any) => {
        console.error('Error al cargar tarifa para duplicar:', error);
        Swal.fire('Error', 'No se pudo cargar la tarifa para duplicar', 'error');
        this.volverAlListado();
      }
    });
  }

  /**
   * Guarda la tarifa (crear o actualizar)
   */
  guardarTarifa(form: NgForm): void {
    if (!form.valid) {
      Swal.fire('Error', 'Por favor complete todos los campos requeridos', 'error');
      return;
    }

    // Validar datos de la tarifa
    const errores = this.deliveryService.validarTarifa(this.tarifa.toCreateRequest());
    if (errores.length > 0) {
      this.erroresValidacion = errores;
      Swal.fire('Errores de validación', errores.join('\n'), 'error');
      return;
    }

    this.guardando = true;
    const request = this.tarifa.toCreateRequest();

    if (this.isEditMode && this.idTarifa) {
      // Actualizar tarifa existente
      this.deliveryService.actualizarTarifa(this.idTarifa, request).subscribe({
        next: (response: TarifaDelivery) => {
          Swal.fire('¡Éxito!', 'Tarifa actualizada correctamente', 'success');
          this.volverAlListado();
        },
        error: (error: any) => {
          console.error('Error al actualizar tarifa:', error);
          Swal.fire('Error', this.obtenerMensajeError(error), 'error');
          this.guardando = false;
        }
      });
    } else {
      // Crear nueva tarifa
      this.deliveryService.crearTarifa(request).subscribe({
        next: (response: TarifaDelivery) => {
          const mensaje = this.isDuplicateMode ? 'Tarifa duplicada correctamente' : 'Tarifa creada correctamente';
          Swal.fire('¡Éxito!', mensaje, 'success');
          this.volverAlListado();
        },
        error: (error: any) => {
          console.error('Error al crear tarifa:', error);
          Swal.fire('Error', this.obtenerMensajeError(error), 'error');
          this.guardando = false;
        }
      });
    }
  }

  /**
   * Volver al listado de tarifas
   */
  volverAlListado(): void {
    this.router.navigate(['/pages/reportes/mantenedor-delivery']);
  }

  /**
   * Cancelar operación
   */
  cancelar(): void {
    if (this.formularioHaCambiado()) {
      Swal.fire({
        title: '¿Confirmar cancelación?',
        text: 'Se perderán los cambios no guardados',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'Continuar editando'
      }).then((result) => {
        if (result.isConfirmed) {
          this.volverAlListado();
        }
      });
    } else {
      this.volverAlListado();
    }
  }

  // ==================== MÉTODOS DE VALIDACIÓN Y UI ====================

  /**
   * Manejo del cambio de tipo de regla
   */
  onTipoReglaChange(): void {
    // Limpiar ubicación si no es necesario
    if (!this.requiereDistrito()) {
      this.tarifa.resetUbicacion();
      this.provincias = [];
      this.distritos = [];
    }
    
    // Establecer precio automáticamente para reglas de envío gratis
    if (this.tarifa.esEnvioGratis()) {
      this.tarifa.precio = 0;
      
      // Configurar monto mínimo por defecto si no está establecido
      if (!this.tarifa.montoMinimoAplicacion) {
        if (this.tarifa.tipoRegla === TipoReglaDelivery.ENVIO_GRATIS_NACIONAL) {
          this.tarifa.montoMinimoAplicacion = 500; // Valor por defecto
        } else if (this.tarifa.tipoRegla === TipoReglaDelivery.ENVIO_GRATIS_LIMA) {
          this.tarifa.montoMinimoAplicacion = 350; // Valor por defecto
        }
      }
    }

    // Actualizar descripción por defecto si está vacía o es la descripción anterior
    this.actualizarDescripcionPorDefecto();
    
    this.limpiarErrores();
  }

  /**
   * Actualiza la descripción por defecto cuando cambia la regla
   */
  actualizarDescripcionPorDefecto(): void {
    const nuevaDescripcion = this.getDescripcionRegla(this.tarifa.tipoRegla);
    
    // Solo actualizar si no hay descripción personalizada o si es una descripción automática previa
    if (!this.tarifa.descripcion || this.esDescripcionAutomatica(this.tarifa.descripcion)) {
      this.tarifa.descripcion = nuevaDescripcion;
    }
  }

  /**
   * Verifica si una descripción es una de las automáticas
   */
  esDescripcionAutomatica(descripcion: string): boolean {
    return this.tiposReglaOptions.some(opcion => opcion.descripcion === descripcion);
  }

  /**
   * Verificar si la regla actual requiere distrito
   */
  requiereDistrito(): boolean {
    return this.tarifa.requiereDistrito();
  }

  /**
   * Verificar si es una regla de envío gratis
   */
  esEnvioGratis(): boolean {
    return this.tarifa.esEnvioGratis();
  }

  // ==================== MÉTODOS DE UBICACIÓN EN CASCADA ====================

  /**
   * Cargar departamentos permitidos: solo Lima (15) y Callao (7)
   */
  cargarDepartamentosPermitidos(): void {
    this.cargandoDepartamentos = true;
    
    this.deliveryService.getDepartamentosPermitidos().subscribe({
      next: (departamentos: any[]) => {
        this.departamentos = departamentos;
        this.cargandoDepartamentos = false;
      },
      error: (error: any) => {
        console.error('Error al cargar departamentos:', error);
        this.cargandoDepartamentos = false;
      }
    });
  }

  /**
   * Manejo del cambio de departamento
   */
  onDepartamentoChange(): void {
    if (!this.tarifa.idDepartamento) {
      this.tarifa.resetProvinciaYDistrito();
      this.provincias = [];
      this.distritos = [];
      return;
    }

    this.cargarProvinciasPorDepartamento(this.tarifa.idDepartamento);
  }

  /**
   * Cargar provincias por departamento
   */
  cargarProvinciasPorDepartamento(idDepartamento: number, mantenerSeleccion: boolean = false): void {
    this.cargandoProvincias = true;
    
    if (!mantenerSeleccion) {
      this.tarifa.resetProvinciaYDistrito();
    }
    
    this.provincias = [];
    this.distritos = [];

    this.deliveryService.getProvinciasPorDepartamento(idDepartamento).subscribe({
      next: (provincias: any[]) => {
        this.provincias = provincias;
        this.cargandoProvincias = false;
        
        // Si estamos manteniendo la selección y hay una provincia seleccionada, cargar sus distritos
        if (mantenerSeleccion && this.tarifa.idProvincia) {
          this.cargarDistritosPorProvincia(this.tarifa.idProvincia, true);
        }
      },
      error: (error: any) => {
        console.error('Error al cargar provincias:', error);
        this.cargandoProvincias = false;
      }
    });
  }

  /**
   * Manejo del cambio de provincia
   */
  onProvinciaChange(): void {
    if (!this.tarifa.idProvincia) {
      this.tarifa.resetDistrito();
      this.distritos = [];
      return;
    }

    this.cargarDistritosPorProvincia(this.tarifa.idProvincia);
  }

  /**
   * Cargar distritos por provincia
   */
  cargarDistritosPorProvincia(idProvincia: number, mantenerSeleccion: boolean = false): void {
    this.cargandoDistritos = true;
    
    if (!mantenerSeleccion) {
      this.tarifa.resetDistrito();
    }
    
    this.distritos = [];

    this.deliveryService.getDistritosPorProvincia(idProvincia).subscribe({
      next: (distritos: any[]) => {
        this.distritos = distritos;
        this.cargandoDistritos = false;
      },
      error: (error: any) => {
        console.error('Error al cargar distritos:', error);
        this.cargandoDistritos = false;
      }
    });
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Obtiene el título de la página
   */
  getTituloPagina(): string {
    if (this.isEditMode) {
      return 'Editar Tarifa de Delivery';
    } else if (this.isDuplicateMode) {
      return 'Duplicar Tarifa de Delivery';
    } else {
      return 'Nueva Tarifa de Delivery';
    }
  }

  /**
   * Obtiene el texto del botón guardar
   */
  getTextoBotonGuardar(): string {
    if (this.guardando) {
      return this.isEditMode ? 'Actualizando...' : 'Guardando...';
    }
    return this.isEditMode ? 'Actualizar Tarifa' : 'Guardar Tarifa';
  }

  /**
   * Verifica si la regla actual requiere monto mínimo configurable
   */
  requiereMontoMinimo(): boolean {
    return this.tarifa.requiereMontoMinimo();
  }

  /**
   * Verifica si el formulario ha cambiado
   */
  formularioHaCambiado(): boolean {
    return this.tarifa.precio > 0 || 
           this.tarifa.montoMinimoAplicacion !== null ||
           this.tarifa.tipoRegla !== TipoReglaDelivery.DISTRITO_ESPECIFICO ||
           this.tarifa.idDepartamento !== null ||
           this.tarifa.idProvincia !== null ||
           this.tarifa.idDistrito !== null ||
           this.tarifa.descripcion.length > 0;
  }

  /**
   * Obtiene mensaje de error del backend
   */
  obtenerMensajeError(error: any): string {
    if (error.error?.message) {
      return error.error.message;
    } else if (error.message) {
      return error.message;
    } else {
      return 'Error desconocido al procesar la solicitud';
    }
  }

  /**
   * Limpiar errores de validación
   */
  limpiarErrores(): void {
    this.erroresValidacion = [];
  }

  /**
   * Verifica si el usuario tiene permisos
   */
  tienePermisos(): boolean {
    const usuario = this.dataService.getLoggedUser();
    if (!usuario) return false;
    
    // Solo administradores y logística pueden crear/editar (roles 1 y 12)
    return [1, 12].includes(usuario.rol?.idRol);
  }

  /**
   * Resetear formulario
   */
  resetearFormulario(): void {
    Swal.fire({
      title: '¿Confirmar reset?',
      text: 'Se perderán todos los datos ingresados',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, resetear',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.tarifa.reset();
        this.limpiarErrores();
        Swal.fire('¡Reseteado!', 'El formulario ha sido limpiado', 'success');
      }
    });
  }

  /**
   * Obtener descripción de la regla
   */
  getDescripcionRegla(tipoRegla: TipoReglaDelivery | string): string {
    const opcion = this.tiposReglaOptions.find(o => o.value === tipoRegla);
    return opcion?.descripcion || '';
  }

  /**
   * Obtener nombre del distrito seleccionado
   */
  getNombreDistrito(): string {
    if (!this.tarifa.idDistrito) return '';
    const distrito = this.distritos.find(d => d.idDistrito === this.tarifa.idDistrito);
    return distrito?.nombre || '';
  }

  /**
   * Obtener nombre del departamento seleccionado
   */
  getNombreDepartamento(): string {
    if (!this.tarifa.idDepartamento) return '';
    const departamento = this.departamentos.find(d => d.idDepartamento === this.tarifa.idDepartamento);
    return departamento?.nombre || '';
  }

  /**
   * Obtener nombre de la provincia seleccionada
   */
  getNombreProvincia(): string {
    if (!this.tarifa.idProvincia) return '';
    const provincia = this.provincias.find(p => p.idProvincia === this.tarifa.idProvincia);
    return provincia?.nombre || '';
  }
}