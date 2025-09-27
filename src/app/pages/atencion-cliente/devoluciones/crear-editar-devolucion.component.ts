import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';

import { DevolucionService } from '../../../services/devolucion.service';
import { DataService } from '../../../services/data.service';
import {
  DevolucionRequest,
  DevolucionUpdateRequest,
  DevolucionDetalle,
  DevolucionCatalogos,
  EstadoDevolucion,
  AccionDevolucion,
  MotivoDevolucion
} from '../../../model/devolucionesModel';

@Component({
  selector: 'app-crear-editar-devolucion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './crear-editar-devolucion.component.html',
  styleUrls: ['./crear-editar-devolucion.component.scss']
})
export class CrearEditarDevolucionComponent implements OnInit {
  
  devolucionForm!: FormGroup;
  catalogos?: DevolucionCatalogos;
  devolucionActual?: DevolucionDetalle;
  
  // Estados del componente
  esEdicion = false;
  cargando = false;
  cargandoCatalogos = false;
  guardando = false;
  
  // Archivo adjunto
  archivoSeleccionado?: File;
  archivoActual?: string;
  eliminarArchivoExistente = false;
  
  // ID de la devolución para edición
  idDevolucion?: string;
  
  // Información del pedido
  infoPedido: any = null;
  buscandoPedido = false;
  
  constructor(
    private fb: FormBuilder,
    private devolucionService: DevolucionService,
    private dataService: DataService,
    private router: Router,
    private route: ActivatedRoute
  ) {}
  
  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarCatalogos();
    
    // Verificar si es edición
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.idDevolucion = params['id'];
        this.esEdicion = true;
        this.cargarDevolucion();
      }
    });
  }
  
  /**
   * Inicializar el formulario reactivo
   */
  inicializarFormulario(): void {
    this.devolucionForm = this.fb.group({
      idPedido: ['', [Validators.required]],
      idMotivoDevolucion: ['', [Validators.required]],
      idAccionDevolucion: ['', [Validators.required]],
      idEstadoDevolucion: [1], // Por defecto "Registrada"
      fechaDevolucion: [''],
      descripcion: [''],
      manifiesto: [''],
      montoDevolucion: [0, [Validators.min(0)]],
      observaciones: ['']
    });
  }
  
  /**
   * Cargar catálogos
   */
  cargarCatalogos(): void {
    this.cargandoCatalogos = true;
    this.devolucionService.obtenerCatalogos().subscribe({
      next: (catalogos) => {
        this.catalogos = catalogos;
        this.cargandoCatalogos = false;
      },
      error: (error) => {
        console.error('Error al cargar catálogos:', error);
        this.cargandoCatalogos = false;
        Swal.fire('Error', 'No se pudieron cargar los catálogos', 'error');
      }
    });
  }
  
  /**
   * Cargar devolución para edición
   */
  cargarDevolucion(): void {
    if (!this.idDevolucion) return;
    
    this.cargando = true;
    this.devolucionService.obtenerDevolucionPorId(this.idDevolucion).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.devolucionActual = response.data;
          this.poblarFormulario();
          this.archivoActual = this.devolucionActual.urlAdjunto || undefined;
          this.cargando = false;
        } else {
          Swal.fire('Error', response.mensaje || 'No se pudo cargar la devolución', 'error');
          this.volverAListado();
        }
      },
      error: (error) => {
        console.error('Error al cargar devolución:', error);
        this.cargando = false;
        Swal.fire('Error', 'No se pudo cargar la devolución', 'error');
        this.volverAListado();
      }
    });
  }
  
  /**
   * Poblar formulario con datos de la devolución
   */
  poblarFormulario(): void {
    if (!this.devolucionActual) return;
    
    this.devolucionForm.patchValue({
      idPedido: this.devolucionActual.idPedido,
      idMotivoDevolucion: this.devolucionActual.idMotivoDevolucion,
      idAccionDevolucion: this.devolucionActual.idAccionDevolucion,
      idEstadoDevolucion: this.devolucionActual.idEstadoDevolucion,
      fechaDevolucion: this.devolucionActual.fechaDevolucion ? 
        this.formatearFechaParaInput(this.devolucionActual.fechaDevolucion) : '',
      descripcion: this.devolucionActual.descripcion || '',
      manifiesto: this.devolucionActual.manifiesto || '',
      montoDevolucion: this.devolucionActual.montoDevolucion || 0,
      observaciones: this.devolucionActual.observaciones || ''
    });
    
    // Cargar información del pedido
    this.buscarPedido();
  }
  
  /**
   * Buscar información del pedido
   */
  buscarPedido(): void {
    const idPedido = this.devolucionForm.get('idPedido')?.value;
    if (!idPedido || !idPedido.trim()) {
      this.infoPedido = null;
      return;
    }

    this.buscandoPedido = true;
    this.devolucionService.buscarPedido(idPedido.trim()).subscribe({
      next: (pedido) => {
        this.infoPedido = pedido;
        this.buscandoPedido = false;
        
        // Auto-completar monto de devolución si no está establecido
        if (!this.devolucionForm.get('montoDevolucion')?.value && pedido.montoTotal) {
          this.devolucionForm.patchValue({ montoDevolucion: pedido.montoTotal });
        }
      },
      error: (error) => {
        console.error('Error al buscar pedido:', error);
        this.infoPedido = null;
        this.buscandoPedido = false;
        
        if (error.status === 404) {
          Swal.fire('Pedido no encontrado', 'El ID de pedido ingresado no existe', 'warning');
        }
      }
    });
  }
  
  /**
   * Manejar cambio de archivo
   */
  onArchivoSeleccionado(event: any): void {
    const archivo = event.target.files[0];
    if (archivo) {
      // Validar tamaño (5MB máximo)
      if (archivo.size > 5 * 1024 * 1024) {
        Swal.fire('Archivo muy grande', 'El archivo no debe superar los 5MB', 'warning');
        event.target.value = '';
        return;
      }
      
      // Validar tipo de archivo
      const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 
                              'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!tiposPermitidos.includes(archivo.type)) {
        Swal.fire('Tipo de archivo no permitido', 
                 'Solo se permiten imágenes, PDFs y documentos de Word', 'warning');
        event.target.value = '';
        return;
      }
      
      this.archivoSeleccionado = archivo;
      this.eliminarArchivoExistente = false;
    }
  }
  
  /**
   * Eliminar archivo actual
   */
  eliminarArchivo(): void {
    if (this.esEdicion && this.archivoActual) {
      this.eliminarArchivoExistente = true;
      this.archivoActual = undefined;
    }
    this.archivoSeleccionado = undefined;
    
    // Limpiar input file
    const fileInput = document.getElementById('archivo') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
  
  /**
   * Guardar devolución
   */
  guardar(): void {
    if (this.devolucionForm.valid) {
      this.guardando = true;
      
      if (this.esEdicion) {
        this.actualizarDevolucion();
      } else {
        this.crearDevolucion();
      }
    } else {
      this.marcarCamposComoTocados();
      Swal.fire('Formulario incompleto', 'Por favor complete todos los campos requeridos', 'warning');
    }
  }
  
  /**
   * Crear nueva devolución
   */
  crearDevolucion(): void {
    const usuarioData = this.dataService.getLoggedUser();
    const usuario = usuarioData?.usuario || usuarioData?.nombre || 'sistema';
    
    const devolucionRequest: DevolucionRequest = {
      ...this.devolucionForm.value,
      usuarioRegistro: usuario
    };
    
    if (this.archivoSeleccionado) {
      devolucionRequest.archivo = this.archivoSeleccionado;
    }
    
    this.devolucionService.crearDevolucion(devolucionRequest).subscribe({
      next: (response) => {
        this.guardando = false;
        if (response.success) {
          Swal.fire('¡Éxito!', 'Devolución creada correctamente', 'success').then(() => {
            this.volverAListado();
          });
        } else {
          Swal.fire('Error', response.mensaje || 'No se pudo crear la devolución', 'error');
        }
      },
      error: (error) => {
        console.error('Error al crear devolución:', error);
        this.guardando = false;
        Swal.fire('Error', 'No se pudo crear la devolución', 'error');
      }
    });
  }
  
  /**
   * Actualizar devolución
   */
  actualizarDevolucion(): void {
    if (!this.idDevolucion) return;
    
    const usuarioData = this.dataService.getLoggedUser();
    const usuario = usuarioData?.usuario || usuarioData?.nombre || 'sistema';
    
    const devolucionRequest: DevolucionUpdateRequest = {
      ...this.devolucionForm.value,
      usuarioGestion: usuario,
      eliminarArchivo: this.eliminarArchivoExistente
    };
    
    if (this.archivoSeleccionado) {
      devolucionRequest.archivo = this.archivoSeleccionado;
    }
    
    this.devolucionService.actualizarDevolucion(this.idDevolucion, devolucionRequest).subscribe({
      next: (response) => {
        this.guardando = false;
        if (response.success) {
          Swal.fire('¡Éxito!', 'Devolución actualizada correctamente', 'success').then(() => {
            this.volverAListado();
          });
        } else {
          Swal.fire('Error', response.mensaje || 'No se pudo actualizar la devolución', 'error');
        }
      },
      error: (error) => {
        console.error('Error al actualizar devolución:', error);
        this.guardando = false;
        Swal.fire('Error', 'No se pudo actualizar la devolución', 'error');
      }
    });
  }
  
  /**
   * Marcar todos los campos como tocados para mostrar errores
   */
  marcarCamposComoTocados(): void {
    Object.keys(this.devolucionForm.controls).forEach(key => {
      this.devolucionForm.get(key)?.markAsTouched();
    });
  }
  
  /**
   * Verificar si un campo tiene errores
   */
  tieneError(campo: string): boolean {
    const control = this.devolucionForm.get(campo);
    return !!(control && control.errors && (control.dirty || control.touched));
  }
  
  /**
   * Obtener mensaje de error para un campo
   */
  obtenerMensajeError(campo: string): string {
    const control = this.devolucionForm.get(campo);
    if (control?.errors) {
      if (control.errors['required']) return `${campo} es requerido`;
      if (control.errors['min']) return `El valor debe ser mayor o igual a ${control.errors['min'].min}`;
    }
    return '';
  }
  
  /**
   * Volver al listado
   */
  volverAListado(): void {
    this.router.navigate(['/pages/atencion-cliente/devoluciones']);
  }
  
  /**
   * Formatear fecha para input datetime-local
   */
  private formatearFechaParaInput(fecha: string): string {
    const date = new Date(fecha);
    return date.toISOString().slice(0, 16);
  }
  
  /**
   * Formatear fecha para mostrar
   */
  formatearFechaDisplay(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  /**
   * Formatear monto
   */
  formatearMonto(monto: number): string {
    return `S/ ${monto.toFixed(2)}`;
  }
}