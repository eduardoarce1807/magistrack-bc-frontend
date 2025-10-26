import { Component, OnInit, TemplateRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { NgbModal, NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

import { DeliveryService } from '../../../services/delivery.service';
import { UbigeoService } from '../../../services/ubigeo.service';
import { DataService } from '../../../services/data.service';
import { 
  TarifaDelivery, 
  FiltrosBusquedaTarifas,
  TIPOS_FECHA_ENTREGA_OPTIONS 
} from '../../../model/deliveryModel';

@Component({
  selector: 'app-mantenedor-delivery',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    NgbPaginationModule, 
    NgbTooltipModule
  ],
  templateUrl: './mantenedor-delivery.component.html',
  styleUrl: './mantenedor-delivery.component.scss'
})
export class MantenedorDeliveryComponent implements OnInit {

  // Referencia para usar Math en template
  Math = Math;

  // Datos de la tabla
  tarifas: TarifaDelivery[] = [];
  tarifasTable: TarifaDelivery[] = [];
  
  // Paginación
  page = 1;
  pageSize = 10;
  collectionSize = 0;
  
  // Estado de carga
  cargando = false;
  
  // Filtros de búsqueda
  filtros: FiltrosBusquedaTarifas = {
    idDepartamento: undefined,
    idProvincia: undefined,
    idDistrito: undefined,
    tipoFechaEntrega: undefined
  };
  
  // Datos para dropdowns
  departamentos: any[] = [];
  provincias: any[] = [];
  distritos: any[] = [];
  
  // Opciones de tipos de entrega
  tiposEntregaOptions = TIPOS_FECHA_ENTREGA_OPTIONS;
  
  // Modal service
  private modalService = inject(NgbModal);
  
  // Búsqueda de texto
  textoBusqueda = '';
  
  // Tarifa seleccionada para el modal de detalle
  tarifaSeleccionada: TarifaDelivery | null = null;

  constructor(
    private deliveryService: DeliveryService,
    private ubigeoService: UbigeoService,
    private dataService: DataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarTarifas();
    this.cargarDepartamentos();
  }

  /**
   * Carga las tarifas desde el backend
   */
  cargarTarifas(): void {
    this.cargando = true;
    
    this.deliveryService.listarTarifasActivas().subscribe({
      next: (tarifas: TarifaDelivery[]) => {
        this.tarifas = tarifas.map(tarifa => ({
          ...tarifa,
          ubicacionCompleta: this.deliveryService.formatearUbicacionCompleta(tarifa),
          resumenCondiciones: this.deliveryService.formatearResumenCondiciones(tarifa)
        }));
        this.actualizarPaginacion();
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error al cargar tarifas:', error);
        Swal.fire('Error', 'No se pudieron cargar las tarifas de delivery', 'error');
        this.cargando = false;
      }
    });
  }

  /**
   * Actualiza la paginación y filtrado
   */
  actualizarPaginacion(): void {
    let tarifasFiltradas = [...this.tarifas];
    
    // Aplicar búsqueda de texto
    if (this.textoBusqueda.trim()) {
      const texto = this.textoBusqueda.toLowerCase();
      tarifasFiltradas = tarifasFiltradas.filter(tarifa =>
        tarifa.ubicacionCompleta?.toLowerCase().includes(texto) ||
        tarifa.descripcionCondicion?.toLowerCase().includes(texto) ||
        tarifa.tipoFechaEntregaDescripcion?.toLowerCase().includes(texto) ||
        tarifa.puntoEncuentro?.toLowerCase().includes(texto)
      );
    }
    
    // Aplicar filtros
    if (this.filtros.idDepartamento) {
      tarifasFiltradas = tarifasFiltradas.filter(t => 
        t.departamento?.idDepartamento == this.filtros.idDepartamento);
    }
    
    if (this.filtros.idProvincia) {
      tarifasFiltradas = tarifasFiltradas.filter(t => 
        t.provincia?.idProvincia == this.filtros.idProvincia);
    }
    
    if (this.filtros.idDistrito) {
      tarifasFiltradas = tarifasFiltradas.filter(t => 
        t.distrito?.idDistrito == this.filtros.idDistrito);
    }
    
    if (this.filtros.tipoFechaEntrega) {
      tarifasFiltradas = tarifasFiltradas.filter(t => 
        t.tipoFechaEntrega == this.filtros.tipoFechaEntrega);
    }
    
    // Actualizar colección
    this.collectionSize = tarifasFiltradas.length;
    
    // Obtener elementos de la página actual
    const inicio = (this.page - 1) * this.pageSize;
    const fin = inicio + this.pageSize;
    this.tarifasTable = tarifasFiltradas.slice(inicio, fin);
  }

  /**
   * Maneja el cambio de página
   */
  onPageChange(): void {
    this.actualizarPaginacion();
  }

  /**
   * Busca texto en las tarifas
   */
  buscarTexto(): void {
    this.page = 1;
    this.actualizarPaginacion();
  }

  /**
   * Limpia el filtro de búsqueda
   */
  limpiarBusqueda(): void {
    this.textoBusqueda = '';
    this.buscarTexto();
  }

  /**
   * Aplica los filtros seleccionados
   */
  aplicarFiltros(): void {
    this.page = 1;
    this.actualizarPaginacion();
  }

  /**
   * Limpia todos los filtros
   */
  limpiarFiltros(): void {
    this.filtros = {
      idDepartamento: undefined,
      idProvincia: undefined,
      idDistrito: undefined,
      tipoFechaEntrega: undefined
    };
    this.provincias = [];
    this.distritos = [];
    this.aplicarFiltros();
  }

  /**
   * Navegar a crear nueva tarifa
   */
  nuevaTarifa(): void {
    this.router.navigate(['/pages/reportes/mantenedor-delivery/crear']);
  }

  /**
   * Navegar a editar tarifa
   */
  editarTarifa(tarifa: TarifaDelivery): void {
    if (tarifa.idTarifarioDelivery) {
      this.router.navigate(['/pages/reportes/mantenedor-delivery/editar', tarifa.idTarifarioDelivery]);
    }
  }

  /**
   * Eliminar (desactivar) tarifa
   */
  eliminarTarifa(tarifa: TarifaDelivery): void {
    if (!tarifa.idTarifarioDelivery) return;

    Swal.fire({
      title: '¿Confirmar eliminación?',
      text: `¿Está seguro de eliminar la tarifa para "${tarifa.ubicacionCompleta}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && tarifa.idTarifarioDelivery) {
        this.cargando = true;
        
        this.deliveryService.eliminarTarifa(tarifa.idTarifarioDelivery).subscribe({
          next: (response: any) => {
            Swal.fire('¡Eliminado!', response.mensaje, 'success');
            this.cargarTarifas(); // Recargar la lista
          },
          error: (error: any) => {
            console.error('Error al eliminar tarifa:', error);
            Swal.fire('Error', 'No se pudo eliminar la tarifa', 'error');
            this.cargando = false;
          }
        });
      }
    });
  }

  /**
   * Ver detalle de tarifa
   */
  verDetalle(tarifa: TarifaDelivery, content: TemplateRef<any>): void {
    this.tarifaSeleccionada = tarifa;
    this.modalService.open(content, { size: 'lg', centered: true });
  }

  /**
   * Duplicar tarifa (crear nueva basada en existente)
   */
  duplicarTarifa(tarifa: TarifaDelivery): void {
    if (tarifa.idTarifarioDelivery) {
      this.router.navigate(['/pages/reportes/mantenedor-delivery/duplicar', tarifa.idTarifarioDelivery]);
    }
  }

  /**
   * Refrescar lista de tarifas
   */
  refrescar(): void {
    this.cargarTarifas();
  }

  // ==================== MÉTODOS PARA DROPDOWNS ====================

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
      }
    });
  }

  /**
   * Manejar cambio de departamento
   */
  onDepartamentoChange(): void {
    this.filtros.idProvincia = undefined;
    this.filtros.idDistrito = undefined;
    this.provincias = [];
    this.distritos = [];

    if (this.filtros.idDepartamento) {
      this.cargarProvincias(this.filtros.idDepartamento);
    }
  }

  /**
   * Cargar provincias por departamento
   */
  cargarProvincias(idDepartamento: number): void {
    this.ubigeoService.getProvincias(idDepartamento).subscribe({
      next: (provincias: any[]) => {
        this.provincias = provincias;
      },
      error: (error: any) => {
        console.error('Error al cargar provincias:', error);
      }
    });
  }

  /**
   * Manejar cambio de provincia
   */
  onProvinciaChange(): void {
    this.filtros.idDistrito = undefined;
    this.distritos = [];

    if (this.filtros.idProvincia) {
      this.cargarDistritos(this.filtros.idProvincia);
    }
  }

  /**
   * Cargar distritos por provincia
   */
  cargarDistritos(idProvincia: number): void {
    this.ubigeoService.getDistritos(idProvincia).subscribe({
      next: (distritos: any[]) => {
        this.distritos = distritos;
      },
      error: (error: any) => {
        console.error('Error al cargar distritos:', error);
      }
    });
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Obtiene el color del badge de prioridad
   */
  getColorPrioridad(prioridad: number): string {
    return this.deliveryService.obtenerColorPrioridad(prioridad);
  }

  /**
   * Formatea el precio para mostrar
   */
  formatearPrecio(precio: number): string {
    return `S/ ${precio.toFixed(2)}`;
  }

  /**
   * Obtiene el texto del estado activo/inactivo
   */
  getTextoEstado(activo: boolean): string {
    return activo ? 'Activa' : 'Inactiva';
  }

  /**
   * Obtiene la clase CSS para el estado
   */
  getClaseEstado(activo: boolean): string {
    return activo ? 'text-success' : 'text-danger';
  }

  /**
   * Formatea la fecha de creación
   */
  formatearFecha(fecha: string | undefined): string {
    if (!fecha) return 'N/A';
    
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  }

  /**
   * Verifica si el usuario tiene permisos de edición
   */
  puedeEditar(): boolean {
    const usuario = this.dataService.getLoggedUser();
    if (!usuario) return false;
    
    // Solo administradores y logística pueden editar (roles 1 y 12)
    return [1, 12].includes(usuario.rol?.idRol);
  }

  /**
   * TrackBy function para optimización de NgFor
   */
  trackByTarifa(index: number, tarifa: TarifaDelivery): number {
    return tarifa.idTarifarioDelivery || index;
  }
}