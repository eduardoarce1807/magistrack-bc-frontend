import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbTypeaheadModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { ClienteService } from '../../../services/cliente.service';
import { CuponService } from '../../../services/cupon.service';
import { PedidoService } from '../../../services/pedido.service';
import { CatalogoPrecioService } from '../../../services/catalogo-precio.service';
import { RolService } from '../../../services/rol.service';
import { Table, TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

interface PageEvent {
    first: number;
    rows: number;
    page: number;
    pageCount: number;
}

@Component({
  selector: 'app-catalogo-precios',
  standalone: true,
  imports: [FormsModule, NgbTypeaheadModule, NgbPaginationModule, CommonModule, TableModule, ButtonModule, IconFieldModule, InputIconModule, InputTextModule],
  templateUrl: './catalogo-precios.component.html',
  styleUrl: './catalogo-precios.component.scss'
})
export class CatalogoPreciosComponent implements OnInit {

  catalogos: any[] = [];
  page = 1;
  pageSize = 5;
  collectionSize = this.catalogos.length;

  lstCuponesSeleccionados: string[] = [];

  roles: any[] = [];

  catalogo: any = null;
  nombreCatalogo: string = '';
  idRol: number = 2;

  // Para la edición inline
  editingItemId: number | null = null;
  originalItem: any = null;

  constructor(
    private rolService: RolService,
    public router: Router,
    private catalogoPrecioService: CatalogoPrecioService
  ) {}

  ngOnInit(): void {
    this.listarRoles();
    this.cargarCatalogosPrecio();
  }

  listarRoles(): void {
    this.rolService.getRoles().subscribe(
      (roles) => {
      this.roles = roles.filter((r: any) => [2, 3, 4, 10].includes(r.idRol));
      },
      (error) => console.error('Error al cargar roles', error)
    );
  }

  cargarCatalogosPrecio(): void {
    this.catalogoPrecioService.obtenerCatalogoPorRol(this.idRol).subscribe(
      (catalogo) => {
        if(catalogo) {
          this.catalogo = catalogo;
          this.nombreCatalogo = catalogo.nombre;
          this.catalogos = catalogo.productos || [];
          this.collectionSize = this.catalogos.length;
        }else{
          this.catalogo = null;
          this.catalogos = [];
          let rol = this.roles.find(r => r.idRol == this.idRol);
          this.nombreCatalogo = "";
          
        }
      },
      (error) => console.error('Error al cargar catalogos', error)
    );
  }

  crearCatalogo() {

    if(this.nombreCatalogo.trim() === '') {
      Swal.fire('Error', 'El nombre del catálogo es obligatorio', 'error');
      return;
    }

    let rol = this.roles.find(r => r.idRol == this.idRol);

    Swal.fire({
      title: 'Crear Catálogo',
      html: `¿Estás seguro de que deseas crear un nuevo catálogo para el tipo de cliente <span style="font-weight: bold;">"${rol?.nombre}"</span>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, crear',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.catalogoPrecioService.crearCatalogo({ nombre: this.nombreCatalogo, idRol: this.idRol }).subscribe(
          (response) => {
            Swal.fire('Éxito', 'Catálogo creado exitosamente', 'success');
            this.cargarCatalogosPrecio();
          },
          (error) => {
            Swal.fire('Error', 'No se pudo crear el catálogo', 'error');
          }
        );
      }
    });
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
    const datosFiltrados = this.catalogos.filter(item => {
      // Crear una cadena de texto con todos los campos buscables
      const textoBuscable = [
        item.producto?.idProducto?.toString() || '',
        item.producto?.productoMaestro?.nombre || '',
        item.producto?.presentacion || '',
        item.producto?.tipoPresentacion?.descripcion || ''
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

  // Métodos para la edición inline
  editarItem(item: any): void {
    this.editingItemId = item.idCatalogoProducto;
    // Guardamos una copia del item original para poder cancelar
    this.originalItem = JSON.parse(JSON.stringify(item));
  }

  guardarEdicion(item: any): void {
    this.editarProductoCatalogo(item);
    this.editingItemId = null;
    this.originalItem = null;
  }

  cancelarEdicion(item: any): void {
    // Restauramos los valores originales
    if (this.originalItem) {
      item.costo = this.originalItem.costo;
      item.margen = this.originalItem.margen;
      item.precio = this.originalItem.precio;
    }
    this.editingItemId = null;
    this.originalItem = null;
  }

  editarProductoCatalogo(item: any): void {
    // Validaciones básicas
    if (!item.costo || item.costo <= 0) {
      Swal.fire('Error', 'El costo debe ser mayor a 0', 'error');
      return;
    }
    
    if (!item.margen || item.margen < 0) {
      Swal.fire('Error', 'El margen debe ser mayor o igual a 0', 'error');
      return;
    }
    
    if (!item.precio || item.precio <= 0) {
      Swal.fire('Error', 'El precio debe ser mayor a 0', 'error');
      return;
    }

    // Crear objeto con solo los campos necesarios para el request
    const updateRequest = {
      idCatalogoProducto: item.idCatalogoProducto,
      costo: item.costo,
      margen: item.margen,
      precio: item.precio,
      estado: item.estado
    };

    // Llamada al servicio para actualizar
    this.catalogoPrecioService.actualizarProductoCatalogo(updateRequest).subscribe(
      (response) => {
        if (response.idResultado === 1) {
          Swal.fire('Éxito', 'Producto actualizado correctamente', 'success');
          // Recargar los datos para reflejar los cambios
          this.cargarCatalogosPrecio();
        } else {
          Swal.fire('Error', response.resultado || 'No se pudo actualizar el producto', 'error');
        }
      },
      (error) => {
        console.error('Error al actualizar producto del catálogo:', error);
        Swal.fire('Error', 'Ocurrió un error al actualizar el producto', 'error');
      }
    );
  }

  isEditing(item: any): boolean {
    return this.editingItemId === item.idCatalogoProducto;
  }

  // Métodos para calcular precios automáticamente
  onCostoChange(item: any): void {
    if (item.costo && item.margen) {
      item.precio = parseFloat((item.costo + (item.costo * item.margen / 100)).toFixed(2));
    }
  }

  onMargenChange(item: any): void {
    if (item.costo && item.margen) {
      item.precio = parseFloat((item.costo + (item.costo * item.margen / 100)).toFixed(2));
    }
  }

  onPrecioChange(item: any): void {
    if (item.precio && item.margen && item.margen > 0) {
      // Despejamos el costo de la fórmula: precio = costo + (costo * margen / 100)
      // precio = costo * (1 + margen / 100)
      // costo = precio / (1 + margen / 100)
      item.costo = parseFloat((item.precio / (1 + item.margen / 100)).toFixed(2));
    }
  }

  // Método para cambiar el estado del producto
  cambiarEstadoProducto(item: any): void {
    const nuevoEstado = !item.estado;
    const accion = nuevoEstado ? 'activar' : 'desactivar';
    const estadoTexto = nuevoEstado ? 'activo' : 'inactivo';

    Swal.fire({
      title: `${accion.charAt(0).toUpperCase() + accion.slice(1)} Producto`,
      html: `¿Estás seguro de que deseas ${accion} este producto?<br>El producto quedará <span style="font-weight: bold;">${estadoTexto}</span>.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const updateRequest = {
          idCatalogoProducto: item.idCatalogoProducto,
          costo: item.costo,
          margen: item.margen,
          precio: item.precio,
          estado: nuevoEstado
        };

        this.catalogoPrecioService.actualizarProductoCatalogo(updateRequest).subscribe(
          (response) => {
            if (response.idResultado === 1) {
              Swal.fire('Éxito', `Producto ${accion === 'activar' ? 'activado' : 'desactivado'} correctamente`, 'success');
              // Recargar los datos para reflejar los cambios
              this.cargarCatalogosPrecio();
            } else {
              Swal.fire('Error', response.resultado || `No se pudo ${accion} el producto`, 'error');
            }
          },
          (error) => {
            console.error(`Error al ${accion} producto del catálogo:`, error);
            Swal.fire('Error', `Ocurrió un error al ${accion} el producto`, 'error');
          }
        );
      }
    });
  }

}
