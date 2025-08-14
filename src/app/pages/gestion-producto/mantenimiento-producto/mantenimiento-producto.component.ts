import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbTypeaheadModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ProductoService } from '../../../services/producto.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mantenimiento-producto',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbTypeaheadModule, NgbPaginationModule, TableModule, ButtonModule, IconFieldModule, InputIconModule, InputTextModule],
  templateUrl: './mantenimiento-producto.component.html',
  styleUrls: ['./mantenimiento-producto.component.scss']
})
export class MantenimientoProductoComponent implements OnInit {

  productosMaestros: any[] = [];
  page = 1;
  pageSize = 5;
  collectionSize = this.productosMaestros.length;

  lstProductosSeleccionados: string[] = [];

  constructor(
    private productoService: ProductoService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.cargarProductosMaestros();
  }

  cargarProductosMaestros(): void {
    this.productoService.getProductosMaestros().subscribe(
      (productos) => {
        this.productosMaestros = productos;
        this.collectionSize = this.productosMaestros.length;
      },
      (error) => console.error('Error al cargar productos maestros', error)
    );
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
    const datosFiltrados = this.productosMaestros.filter(item => {
      // Crear una cadena de texto con todos los campos buscables
      const textoBuscable = [
        item.idProductoMaestro?.toString() || '',
        item.nombre || '',
        item.descripcion || '',
        item.phDefinidoMin?.toString() || '',
        item.phDefinidoMax?.toString() || ''
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

  desactivarProducto(producto: any): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Por favor, confirma la desactivación del producto maestro "${producto.nombre}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.productoService.updateEstadoProductoMaestroById(producto.idProductoMaestro, false).subscribe({
          next: (response) => {
            Swal.fire('¡Listo!', 'Producto maestro desactivado exitosamente', 'success');
            this.cargarProductosMaestros();
          },
          error: (error) => {
            console.error('Error al desactivar producto maestro:', error);
            Swal.fire('Error', 'No se pudo desactivar el producto maestro', 'error');
          }
        });
      }
    });
  }

  activarProducto(producto: any): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Por favor, confirma la activación del producto maestro "${producto.nombre}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, activar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.productoService.updateEstadoProductoMaestroById(producto.idProductoMaestro, true).subscribe({
          next: (response) => {
            Swal.fire('¡Listo!', 'Producto maestro activado exitosamente', 'success');
            this.cargarProductosMaestros();
          },
          error: (error) => {
            console.error('Error al activar producto maestro:', error);
            Swal.fire('Error', 'No se pudo activar el producto maestro', 'error');
          }
        });
      }
    });
  }

  eliminarProducto(producto: any): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Esta acción eliminará permanentemente el producto maestro "${producto.nombre}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        // TODO: Implementar servicio de eliminación
        this.eliminarProductoService(producto.idProductoMaestro).then((response) => {
          if (response.success) {
            Swal.fire('¡Eliminado!', 'Producto maestro eliminado exitosamente', 'success');
            this.cargarProductosMaestros();
          } else {
            Swal.fire('Error', 'No se pudo eliminar el producto maestro', 'error');
          }
        }).catch(() => {
          Swal.fire('Error', 'No se pudo eliminar el producto maestro', 'error');
        });
      }
    });
  }

  verDetalleProducto(producto: any): void {
    // TODO: Implementar navegación a detalle del producto maestro
    this.router.navigate(['/pages/gestion-producto/detalle-producto-maestro', producto.idProductoMaestro]);
  }

  editarProducto(producto: any): void {
    // Navegar al componente de registro en modo edición
    this.router.navigate(['/pages/gestion-producto/actualizar-producto', producto.idProductoMaestro]);
  }

  duplicarProducto(producto: any): void {
    Swal.fire({
      title: '¿Duplicar producto maestro?',
      text: `Se creará una copia del producto maestro "${producto.nombre}".`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, duplicar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // TODO: Implementar servicio de duplicación
        this.duplicarProductoService(producto).then((response) => {
          if (response.success) {
            Swal.fire('¡Duplicado!', 'Producto maestro duplicado exitosamente', 'success');
            this.cargarProductosMaestros();
          } else {
            Swal.fire('Error', 'No se pudo duplicar el producto maestro', 'error');
          }
        }).catch(() => {
          Swal.fire('Error', 'No se pudo duplicar el producto maestro', 'error');
        });
      }
    });
  }

  exportarProductos(): void {
    // TODO: Implementar exportación de productos (Excel, PDF, etc.)
    Swal.fire('TODO', 'Función de exportación en desarrollo', 'info');
  }

  importarProductos(): void {
    // TODO: Implementar importación masiva de productos
    Swal.fire('TODO', 'Función de importación en desarrollo', 'info');
  }

  // TODO: Métodos de servicio a implementar
  private async eliminarProductoService(idProducto: string): Promise<any> {
    // Simulación - Reemplazar con llamada real al servicio
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: 'Producto eliminado' });
      }, 1000);
    });
  }

  private async duplicarProductoService(producto: any): Promise<any> {
    // Simulación - Reemplazar con llamada real al servicio
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: 'Producto duplicado' });
      }, 1000);
    });
  }
}
