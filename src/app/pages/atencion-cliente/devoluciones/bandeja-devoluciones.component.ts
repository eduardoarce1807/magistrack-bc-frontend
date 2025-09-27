import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule } from 'primeng/paginator';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';

import Swal from 'sweetalert2';

import { DevolucionService } from '../../../services/devolucion.service';
import { DataService } from '../../../services/data.service';
import {
  DevolucionListado,
  DevolucionFiltros,
  DevolucionCatalogos,
  EstadoDevolucion,
  AccionDevolucion
} from '../../../model/devolucionesModel';

@Component({
  selector: 'app-bandeja-devoluciones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    CalendarModule,
    TagModule,
    TooltipModule,
    PaginatorModule,
    CardModule,
    ToolbarModule,
    BadgeModule,
    DividerModule
  ],
  templateUrl: './bandeja-devoluciones.component.html',
  styleUrls: ['./bandeja-devoluciones.component.scss']
})
export class BandejaDevolucionesComponent implements OnInit {
  
  // Datos principales
  devoluciones: DevolucionListado[] = [];
  catalogos?: DevolucionCatalogos;
  
  // Configuración de paginación
  totalElementos = 0;
  totalPaginas = 0;
  paginaActual = 0;
  elementosPorPagina = 10;
  esUltimaPagina = true;
  esPrimeraPagina = true;
  
  // Filtros
  filtros: DevolucionFiltros = {
    page: 0,
    size: 10,
    sort: 'fechaRegistro',
    direction: 'DESC'
  };
  
  // Variables para los filtros del formulario
  fechaInicio?: Date;
  fechaFin?: Date;
  query = '';
  estadoSeleccionado: number | null = null; // null = "Todos"
  accionSeleccionada: number | null = null; // null = "Todos"
  
  // Estados de la vista
  cargando = false;
  cargandoCatalogos = false;
  
  // Opciones de paginación
  opcionesPaginacion = [10, 25, 50, 100];
  
  constructor(
    private devolucionService: DevolucionService,
    private dataService: DataService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarDevoluciones();
  }
  
  /**
   * Cargar catálogos (estados, acciones, motivos y estadísticas)
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
   * Cargar listado de devoluciones
   */
  cargarDevoluciones(): void {
    this.cargando = true;
    
    // Preparar filtros
    const filtrosRequest: DevolucionFiltros = { ...this.filtros };
    
    if (this.fechaInicio) {
      filtrosRequest.fechaInicio = this.formatearFecha(this.fechaInicio);
    }
    if (this.fechaFin) {
      filtrosRequest.fechaFin = this.formatearFecha(this.fechaFin);
    }
    if (this.query.trim()) {
      filtrosRequest.query = this.query.trim();
    }
    if (this.estadoSeleccionado !== null) {
      filtrosRequest.idEstadoDevolucion = this.estadoSeleccionado;
    }
    if (this.accionSeleccionada !== null) {
      filtrosRequest.idAccionDevolucion = this.accionSeleccionada;
    }
    
    this.devolucionService.obtenerDevoluciones(filtrosRequest).subscribe({
      next: (response) => {
        this.devoluciones = response.devoluciones;
        this.totalElementos = response.totalElementos;
        this.totalPaginas = response.totalPaginas;
        this.paginaActual = response.paginaActual;
        this.elementosPorPagina = response.elementosPorPagina;
        this.esUltimaPagina = response.esUltimaPagina;
        this.esPrimeraPagina = response.esPrimeraPagina;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar devoluciones:', error);
        this.cargando = false;
        Swal.fire('Error', 'No se pudieron cargar las devoluciones', 'error');
      }
    });
  }
  
  /**
   * Aplicar filtros de búsqueda
   */
  aplicarFiltros(): void {
    this.filtros.page = 0;
    this.cargarDevoluciones();
  }
  
  /**
   * Limpiar todos los filtros
   */
  limpiarFiltros(): void {
    this.fechaInicio = undefined;
    this.fechaFin = undefined;
    this.query = '';
    this.estadoSeleccionado = null;
    this.accionSeleccionada = null;
    this.filtros = {
      page: 0,
      size: this.elementosPorPagina,
      sort: 'fechaRegistro',
      direction: 'DESC'
    };
    this.cargarDevoluciones();
  }
  
  /**
   * Cambiar página
   */
  cambiarPagina(evento: { page: number }): void {
    this.filtros.page = evento.page - 1;
    this.cargarDevoluciones();
  }
  
  /**
   * Cambiar tamaño de página
   */
  cambiarTamanoPagina(): void {
    this.filtros.size = this.elementosPorPagina;
    this.filtros.page = 0;
    this.cargarDevoluciones();
  }
  
  /**
   * Cambiar ordenamiento
   */
  cambiarOrdenamiento(campo: string): void {
    if (this.filtros.sort === campo) {
      this.filtros.direction = this.filtros.direction === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.filtros.sort = campo;
      this.filtros.direction = 'DESC';
    }
    this.cargarDevoluciones();
  }
  
  /**
   * Ir a crear nueva devolución
   */
  crearDevolucion(): void {
    this.router.navigate(['/pages/atencion-cliente/devoluciones/crear']);
  }
  
  /**
   * Ver detalle de devolución
   */
  verDetalle(idDevolucion: string): void {
    this.router.navigate(['/pages/atencion-cliente/devoluciones/detalle', idDevolucion]);
  }
  
  /**
   * Editar devolución
   */
  editarDevolucion(idDevolucion: string): void {
    this.router.navigate(['/pages/atencion-cliente/devoluciones/editar', idDevolucion]);
  }
  
  /**
   * Mostrar modal para cambiar estado
   */
  mostrarCambioEstadoModal(devolucion: DevolucionListado): void {
    if (!this.catalogos?.estados) return;
    
    const estadosDisponibles = this.catalogos.estados.filter(e => 
      e.descripcion !== devolucion.estadoDevolucion
    );
    
    if (estadosDisponibles.length === 0) {
      Swal.fire('Información', 'No hay otros estados disponibles', 'info');
      return;
    }
    
    const inputOptions: { [key: string]: string } = {};
    estadosDisponibles.forEach(estado => {
      inputOptions[estado.idEstadoDevolucion.toString()] = estado.descripcion;
    });
    
    Swal.fire({
      title: 'Cambiar Estado',
      text: `Seleccione el nuevo estado para la devolución ${devolucion.idDevolucion}:`,
      input: 'select',
      inputOptions: inputOptions,
      inputPlaceholder: 'Seleccione un estado',
      showCancelButton: true,
      confirmButtonText: 'Cambiar Estado',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      inputValidator: (value) => {
        if (!value) {
          return 'Debe seleccionar un estado';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.cambiarEstadoRapido(devolucion, parseInt(result.value));
      }
    });
  }

  /**
   * Cambiar estado rápido de devolución
   */
  cambiarEstadoRapido(devolucion: DevolucionListado, nuevoEstadoId: number): void {
    const estado = this.catalogos?.estados.find(e => e.idEstadoDevolucion === nuevoEstadoId);
    if (!estado) return;
    
    Swal.fire({
      title: '¿Cambiar estado?',
      text: `¿Está seguro de cambiar el estado a "${estado.descripcion}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        const usuarioData = this.dataService.getLoggedUser();
        const usuario = usuarioData?.usuario || usuarioData?.nombre || 'sistema';
        
        this.devolucionService.cambiarEstado(devolucion.idDevolucion, {
          idEstadoDevolucion: nuevoEstadoId,
          usuarioGestion: usuario
        }).subscribe({
          next: (response) => {
            if (response.success) {
              Swal.fire('¡Éxito!', 'Estado cambiado correctamente', 'success');
              this.cargarDevoluciones();
            } else {
              Swal.fire('Error', response.mensaje || 'No se pudo cambiar el estado', 'error');
            }
          },
          error: (error) => {
            console.error('Error al cambiar estado:', error);
            Swal.fire('Error', 'No se pudo cambiar el estado', 'error');
          }
        });
      }
    });
  }
  
  /**
   * Eliminar devolución
   */
  eliminarDevolucion(devolucion: DevolucionListado): void {
    Swal.fire({
      title: '¿Eliminar devolución?',
      text: `¿Está seguro de eliminar la devolución ${devolucion.idDevolucion}?`,
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
        
        this.devolucionService.eliminarDevolucion(devolucion.idDevolucion, usuario).subscribe({
          next: (response) => {
            if (response.success) {
              Swal.fire('¡Eliminada!', 'La devolución ha sido eliminada', 'success');
              this.cargarDevoluciones();
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
   * Formatear fecha para envío al backend
   */
  private formatearFecha(fecha: Date): string {
    return fecha.toISOString().split('T')[0] + 'T00:00:00';
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
   * Formatear monto con símbolo de moneda
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
   * TrackBy para optimizar el rendimiento de la tabla
   */
  trackByDevolucion(index: number, devolucion: DevolucionListado): string {
    return devolucion.idDevolucion;
  }

  /**
   * Referencia a Math para usar en el template
   */
  Math = Math;

  /**
   * Generar array para paginación
   */
  generarArrayPaginacion(): number[] {
    return Array(this.totalPaginas).fill(0).map((_, i) => i);
  }

  /**
   * TrackBy para paginación
   */
  trackByPaginacion(index: number, item: number): number {
    return item;
  }
}