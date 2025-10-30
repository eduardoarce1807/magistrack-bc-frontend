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
  TipoReglaDelivery,
  TIPOS_REGLA_OPTIONS
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
    tipoRegla: undefined,
    idDistrito: undefined,
    activo: undefined
  };
  
  // Datos para dropdowns
  distritos: any[] = [];
  
  // Opciones de tipos de regla
  tiposReglaOptions = TIPOS_REGLA_OPTIONS;
  
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
    // Los distritos se cargan solo cuando se necesiten para filtrar
  }

  /**
   * Carga las tarifas desde el backend
   */
  cargarTarifas(): void {
    this.cargando = true;
    
    this.deliveryService.listarTarifas().subscribe({
      next: (tarifas: TarifaDelivery[]) => {
        this.tarifas = tarifas.map(tarifa => ({
          ...tarifa,
          ubicacionCompleta: this.deliveryService.formatearUbicacionCompleta(tarifa),
          descripcionRegla: this.deliveryService.formatearResumenCondiciones(tarifa)
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
        tarifa.descripcionRegla?.toLowerCase().includes(texto) ||
        tarifa.tipoRegla.toLowerCase().includes(texto)
      );
    }
    
    // Aplicar filtros
    if (this.filtros.tipoRegla) {
      tarifasFiltradas = tarifasFiltradas.filter(t => 
        t.tipoRegla === this.filtros.tipoRegla);
    }
    
    if (this.filtros.idDistrito) {
      tarifasFiltradas = tarifasFiltradas.filter(t => 
        t.distrito?.idDistrito == this.filtros.idDistrito);
    }
    
    if (this.filtros.activo !== undefined) {
      tarifasFiltradas = tarifasFiltradas.filter(t => 
        t.activo === this.filtros.activo);
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
      tipoRegla: undefined,
      idDistrito: undefined,
      activo: undefined
    };
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
    if (tarifa.id) {
      this.router.navigate(['/pages/reportes/mantenedor-delivery/editar', tarifa.id]);
    }
  }

  /**
   * Eliminar tarifa
   */
  eliminarTarifa(tarifa: TarifaDelivery): void {
    if (!tarifa.id) return;

    Swal.fire({
      title: '¿Confirmar eliminación?',
      text: `¿Está seguro de eliminar la tarifa "${tarifa.ubicacionCompleta}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && tarifa.id) {
        this.cargando = true;
        
        this.deliveryService.eliminarTarifa(tarifa.id).subscribe({
          next: () => {
            Swal.fire('¡Eliminado!', 'Tarifa eliminada correctamente', 'success');
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
    if (tarifa.id) {
      this.router.navigate(['/pages/reportes/mantenedor-delivery/duplicar', tarifa.id]);
    }
  }

  /**
   * Refrescar lista de tarifas
   */
  refrescar(): void {
    this.cargarTarifas();
  }

  // ==================== MÉTODOS PARA DROPDOWNS SIMPLIFICADOS ====================

  /**
   * Cargar todos los distritos (solo cuando se necesita filtrar)
   */
  cargarTodosLosDistritos(): void {
    // Obtener distritos de Lima (departamento 15)
    this.ubigeoService.getDepartamentos().subscribe({
      next: (departamentos: any[]) => {
        const lima = departamentos.find(d => d.nombre.toLowerCase().includes('lima'));
        if (lima) {
          this.ubigeoService.getProvincias(lima.idDepartamento).subscribe({
            next: (provincias: any[]) => {
              // Obtener todos los distritos de todas las provincias de Lima
              const promises = provincias.map(p => 
                this.ubigeoService.getDistritos(p.idProvincia).toPromise()
              );
              Promise.all(promises).then((distritosArrays: any[]) => {
                this.distritos = distritosArrays.flat();
              });
            },
            error: (error: any) => console.error('Error al cargar provincias:', error)
          });
        }
      },
      error: (error: any) => {
        console.error('Error al cargar departamentos:', error);
      }
    });
  }

  /**
   * Manejar cambio en el filtro de tipo de regla
   */
  onTipoReglaChange(): void {
    // Si cambia a distrito específico, cargar distritos
    if (this.filtros.tipoRegla === TipoReglaDelivery.DISTRITO_ESPECIFICO) {
      this.cargarTodosLosDistritos();
    }
    this.aplicarFiltros();
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Obtiene el color del badge según el tipo de regla
   */
  getColorTipoRegla(tipoRegla: TipoReglaDelivery | string): string {
    return this.deliveryService.obtenerColorTipoRegla(tipoRegla);
  }

  /**
   * Formatea el precio para mostrar
   */
  formatearPrecio(tarifa: TarifaDelivery): string {
    // Usar el campo precio del backend o tarifa como fallback
    const precio = tarifa.precio ?? tarifa.tarifa ?? 0;
    return this.deliveryService.formatearPrecio(precio);
  }

  /**
   * Obtiene el texto del estado activo/inactivo
   */
  getTextoEstado(activo: boolean): string {
    return this.deliveryService.getTextoEstado(activo);
  }

  /**
   * Obtiene la clase CSS para el estado
   */
  getClaseEstado(activo: boolean): string {
    return this.deliveryService.getClaseEstado(activo);
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
   * Obtiene la descripción de la regla
   */
  getDescripcionRegla(tipoRegla: TipoReglaDelivery | string): string {
    const opcion = TIPOS_REGLA_OPTIONS.find(o => o.value === tipoRegla);
    return opcion?.label || 'Regla no definida';
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
    return tarifa.id || index;
  }
}