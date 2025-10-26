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
  TIPOS_FECHA_ENTREGA_OPTIONS,
  PRIORIDADES_OPTIONS 
} from '../../../model/deliveryModel';

@Component({
  selector: 'app-crear-editar-tarifa-delivery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-editar-tarifa-delivery.component.html',
  styleUrl: './crear-editar-tarifa-delivery.component.scss'
})
export class CrearEditarTarifaDeliveryComponent implements OnInit {

  // Modelo del formulario
  tarifa = new TarifaDeliveryFormModel();
  
  // Estado del componente
  isEditMode = false;
  isDuplicateMode = false;
  cargando = false;
  guardando = false;
  
  // ID para edición
  idTarifa: number | null = null;
  
  // Opciones para dropdowns
  tiposEntregaOptions = TIPOS_FECHA_ENTREGA_OPTIONS;
  prioridadesOptions = PRIORIDADES_OPTIONS;
  
  // Datos para ubicación
  departamentos: any[] = [];
  provincias: any[] = [];
  distritos: any[] = [];
  
  // Flags de carga
  cargandoProvincias = false;
  cargandoDistritos = false;
  
  // Mensajes de validación
  erroresValidacion: string[] = [];

  constructor(
    private deliveryService: DeliveryService,
    private ubigeoService: UbigeoService,
    private dataService: DataService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.cargarDepartamentos();
    this.verificarModoOperacion();
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
        this.cargarUbicacionExistente(tarifaData);
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
        this.tarifa.idTarifarioDelivery = null; // Limpiar ID para crear nuevo
        this.cargarUbicacionExistente(tarifaData);
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
   * Carga la ubicación existente (departamento, provincia, distrito)
   */
  cargarUbicacionExistente(tarifaData: TarifaDelivery): void {
    if (tarifaData.departamento?.idDepartamento) {
      this.cargarProvincias(tarifaData.departamento.idDepartamento, () => {
        if (tarifaData.provincia?.idProvincia) {
          this.cargarDistritos(tarifaData.provincia.idProvincia);
        }
      });
    }
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

  // ==================== MÉTODOS DE UBICACIÓN ====================

  /**
   * Cargar departamentos
   */
  cargarDepartamentos(): void {
    this.ubigeoService.getDepartamentos().subscribe({
      next: (departamentos: any[]) => {
        this.departamentos = departamentos;
      },
      error: (error: any) => {
        console.error('Error al cargar departamentos:', error);
        Swal.fire('Error', 'No se pudieron cargar los departamentos', 'error');
      }
    });
  }

  /**
   * Manejar cambio de departamento
   */
  onDepartamentoChange(): void {
    this.tarifa.idProvincia = null;
    this.tarifa.idDistrito = null;
    this.provincias = [];
    this.distritos = [];

    if (this.tarifa.idDepartamento) {
      this.cargarProvincias(this.tarifa.idDepartamento);
    }
  }

  /**
   * Cargar provincias por departamento
   */
  cargarProvincias(idDepartamento: number, callback?: () => void): void {
    this.cargandoProvincias = true;
    
    this.ubigeoService.getProvincias(idDepartamento).subscribe({
      next: (provincias: any[]) => {
        this.provincias = provincias;
        this.cargandoProvincias = false;
        if (callback) callback();
      },
      error: (error: any) => {
        console.error('Error al cargar provincias:', error);
        this.cargandoProvincias = false;
      }
    });
  }

  /**
   * Manejar cambio de provincia
   */
  onProvinciaChange(): void {
    this.tarifa.idDistrito = null;
    this.distritos = [];

    if (this.tarifa.idProvincia) {
      this.cargarDistritos(this.tarifa.idProvincia);
    }
  }

  /**
   * Cargar distritos por provincia
   */
  cargarDistritos(idProvincia: number): void {
    this.cargandoDistritos = true;
    
    this.ubigeoService.getDistritos(idProvincia).subscribe({
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
   * Verifica si el formulario ha cambiado
   */
  formularioHaCambiado(): boolean {
    // Implementar lógica para detectar cambios
    // Por simplicidad, retornamos true si hay datos en el formulario
    return this.tarifa.precio > 0 || 
           this.tarifa.descripcionCondicion.trim().length > 0 ||
           this.tarifa.idDepartamento !== null;
  }

  /**
   * Obtiene mensaje de error del backend
   */
  obtenerMensajeError(error: any): string {
    if (error.error?.mensaje) {
      return error.error.mensaje;
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
   * Validar rango de montos
   */
  validarRangoMontos(): void {
    if (this.tarifa.montoMinimoPedido && this.tarifa.montoMaximoPedido) {
      if (this.tarifa.montoMinimoPedido >= this.tarifa.montoMaximoPedido) {
        Swal.fire('Error de validación', 'El monto mínimo debe ser menor al monto máximo', 'warning');
      }
    }
  }

  /**
   * Generar descripción automática basada en los campos
   */
  generarDescripcionAutomatica(): void {
    if (!this.tarifa.descripcionCondicion.trim()) {
      let descripcion = 'Tarifa ';
      
      // Agregar tipo de entrega
      const tipoEntrega = this.tiposEntregaOptions.find(t => t.value === this.tarifa.tipoFechaEntrega);
      if (tipoEntrega) {
        descripcion += tipoEntrega.label.toLowerCase();
      }
      
      // Agregar ubicación
      const departamento = this.departamentos.find(d => d.idDepartamento === this.tarifa.idDepartamento);
      if (departamento) {
        descripcion += ` para ${departamento.nombre}`;
        
        const provincia = this.provincias.find(p => p.idProvincia === this.tarifa.idProvincia);
        if (provincia) {
          descripcion += `, ${provincia.nombre}`;
        }
      } else {
        descripcion += ' nacional';
      }
      
      this.tarifa.descripcionCondicion = descripcion;
    }
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
        this.provincias = [];
        this.distritos = [];
        this.limpiarErrores();
        Swal.fire('¡Reseteado!', 'El formulario ha sido limpiado', 'success');
      }
    });
  }
}