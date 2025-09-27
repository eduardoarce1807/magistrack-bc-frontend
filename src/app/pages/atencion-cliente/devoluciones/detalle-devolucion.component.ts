import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';

import { DevolucionService } from '../../../services/devolucion.service';
import { DataService } from '../../../services/data.service';
import {
  DevolucionDetalle,
  DevolucionCatalogos,
  EstadoUpdateRequest
} from '../../../model/devolucionesModel';

@Component({
  selector: 'app-detalle-devolucion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './detalle-devolucion.component.html',
  styleUrls: ['./detalle-devolucion.component.scss']
})
export class DetalleDevolucionComponent implements OnInit {
  
  devolucion?: DevolucionDetalle;
  catalogos?: DevolucionCatalogos;
  idDevolucion!: string;
  
  // Estados del componente
  cargando = false;
  cargandoCatalogos = false;
  cambiandoEstado = false;
  
  // Cambio de estado
  nuevoEstadoId?: number;
  observacionesCambio = '';
  mostrarFormularioCambioEstado = false;
  
  constructor(
    private devolucionService: DevolucionService,
    private dataService: DataService,
    private router: Router,
    private route: ActivatedRoute
  ) {}
  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.idDevolucion = params['id'];
        this.cargarDevolucion();
        this.cargarCatalogos();
      } else {
        this.volverAListado();
      }
    });
  }
  
  /**
   * Cargar devolución
   */
  cargarDevolucion(): void {
    this.cargando = true;
    this.devolucionService.obtenerDevolucionPorId(this.idDevolucion).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.devolucion = response.data;
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
      }
    });
  }
  
  /**
   * Mostrar formulario de cambio de estado
   */
  mostrarCambioEstado(): void {
    this.mostrarFormularioCambioEstado = true;
    this.nuevoEstadoId = this.devolucion?.idEstadoDevolucion;
    this.observacionesCambio = '';
  }
  
  /**
   * Cancelar cambio de estado
   */
  cancelarCambioEstado(): void {
    this.mostrarFormularioCambioEstado = false;
    this.nuevoEstadoId = undefined;
    this.observacionesCambio = '';
  }
  
  /**
   * Confirmar cambio de estado
   */
  confirmarCambioEstado(): void {
    if (!this.nuevoEstadoId || !this.devolucion) return;
    
    const estadoActual = this.devolucion.idEstadoDevolucion;
    if (this.nuevoEstadoId === estadoActual) {
      this.cancelarCambioEstado();
      return;
    }
    
    const nuevoEstado = this.catalogos?.estados.find(e => e.idEstadoDevolucion === this.nuevoEstadoId);
    if (!nuevoEstado) return;
    
    Swal.fire({
      title: '¿Cambiar estado?',
      text: `¿Está seguro de cambiar el estado a "${nuevoEstado.descripcion}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.cambiarEstado();
      }
    });
  }
  
  /**
   * Cambiar estado de la devolución
   */
  cambiarEstado(): void {
    if (!this.nuevoEstadoId || !this.devolucion) return;
    
    this.cambiandoEstado = true;
    const usuarioData = this.dataService.getLoggedUser();
    const usuario = usuarioData?.usuario || usuarioData?.nombre || 'sistema';
    
    const estadoRequest: EstadoUpdateRequest = {
      idEstadoDevolucion: this.nuevoEstadoId,
      usuarioGestion: usuario,
      observaciones: this.observacionesCambio || undefined
    };
    
    this.devolucionService.cambiarEstado(this.idDevolucion, estadoRequest).subscribe({
      next: (response) => {
        this.cambiandoEstado = false;
        if (response.success) {
          Swal.fire('¡Éxito!', 'Estado cambiado correctamente', 'success');
          this.cancelarCambioEstado();
          this.cargarDevolucion(); // Recargar para obtener datos actualizados
        } else {
          Swal.fire('Error', response.mensaje || 'No se pudo cambiar el estado', 'error');
        }
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
        this.cambiandoEstado = false;
        Swal.fire('Error', 'No se pudo cambiar el estado', 'error');
      }
    });
  }
  
  /**
   * Editar devolución
   */
  editarDevolucion(): void {
    this.router.navigate(['/pages/atencion-cliente/devoluciones/editar', this.idDevolucion]);
  }
  
  /**
   * Eliminar devolución
   */
  eliminarDevolucion(): void {
    if (!this.devolucion) return;
    
    Swal.fire({
      title: '¿Eliminar devolución?',
      text: `¿Está seguro de eliminar la devolución ${this.devolucion.idDevolucion}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      confirmButtonColor: '#dc3545'
    }).then((result) => {
      if (result.isConfirmed) {
        const usuarioData = this.dataService.getLoggedUser();
        const usuario = usuarioData?.usuario || usuarioData?.nombre || 'sistema';
        
        this.devolucionService.eliminarDevolucion(this.idDevolucion, usuario).subscribe({
          next: (response) => {
            if (response.success) {
              Swal.fire('¡Eliminada!', 'La devolución ha sido eliminada', 'success').then(() => {
                this.volverAListado();
              });
            } else {
              Swal.fire('Error', response.mensaje || 'No se pudo eliminar la devolución', 'error');
            }
          },
          error: (error) => {
            console.error('Error al eliminar devolución:', error);
            Swal.fire('Error', 'No se pudo eliminar la devolución', 'error');
          }
        });
      }
    });
  }
  
  /**
   * Volver al listado
   */
  volverAListado(): void {
    this.router.navigate(['/pages/atencion-cliente/devoluciones']);
  }
  
  /**
   * Formatear fecha para mostrar
   */
  formatearFechaDisplay(fecha: string | null): string {
    if (!fecha) return 'No definida';
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
  
  /**
   * Obtener icono para el estado
   */
  obtenerIconoEstado(estado: string): string {
    switch (estado.toLowerCase()) {
      case 'registrada': return 'bi bi-plus-circle';
      case 'en proceso': return 'bi bi-clock';
      case 'completada': return 'bi bi-check-circle';
      case 'cancelada': return 'bi bi-x-circle';
      default: return 'bi bi-circle';
    }
  }
  
  /**
   * Verificar si se puede editar la devolución
   */
  puedeEditar(): boolean {
    return this.devolucion?.estadoDevolucion !== 'Completada' && 
           this.devolucion?.estadoDevolucion !== 'Cancelada';
  }
  
  /**
   * Verificar si se puede eliminar la devolución
   */
  puedeEliminar(): boolean {
    return this.devolucion?.estadoDevolucion === 'Registrada';
  }
  
  /**
   * Verificar si se puede cambiar el estado
   */
  puedeCambiarEstado(): boolean {
    return this.devolucion?.estadoDevolucion !== 'Completada' && 
           this.devolucion?.estadoDevolucion !== 'Cancelada';
  }
  
  /**
   * Abrir archivo adjunto
   */
  abrirArchivo(): void {
    if (this.devolucion?.urlAdjunto) {
      window.open(this.devolucion.urlAdjunto, '_blank');
    }
  }
}