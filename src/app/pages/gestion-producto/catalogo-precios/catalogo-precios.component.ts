import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbTypeaheadModule, NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { ClienteService } from '../../../services/cliente.service';
import { CuponService } from '../../../services/cupon.service';
import { PedidoService } from '../../../services/pedido.service';
import { CatalogoPrecioService } from '../../../services/catalogo-precio.service';
import { RolService } from '../../../services/rol.service';
import { ExcelService } from '../../../services/excel.service';
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
  imports: [FormsModule, NgbTypeaheadModule, NgbPaginationModule, NgbTooltipModule, CommonModule, TableModule, ButtonModule, IconFieldModule, InputIconModule, InputTextModule],
  templateUrl: './catalogo-precios.component.html',
  styleUrl: './catalogo-precios.component.scss',
  providers: [ExcelService, DatePipe]
})
export class CatalogoPreciosComponent implements OnInit {

  catalogos: any[] = [];
  page = 1;
  pageSize = 5;
  collectionSize = this.catalogos.length;

  lstCuponesSeleccionados: string[] = [];

  roles: any[] = [];

  catalogo: any = null;

  // Variables para selección múltiple
  productosSeleccionados: any[] = [];
  todosSeleccionados: boolean = false;
  nombreCatalogo: string = '';
  colorEtiqueta: string = '#667eea'; // Color por defecto
  idRol: number = 2;
  isLoading: boolean = false; // Estado de carga

  // Para la edición inline
  editingItemId: number | null = null;
  originalItem: any = null;

  // Referencia a la tabla PrimeNG
  @ViewChild('dt1') tabla!: Table;

  // Control para habilitar/deshabilitar exportación
  get exportDisabled(): boolean {
    return this.catalogos.length === 0 || this.isLoading;
  }

  constructor(
    private rolService: RolService,
    public router: Router,
    private catalogoPrecioService: CatalogoPrecioService,
    private excelService: ExcelService
  ) {}

  ngOnInit(): void {
    this.listarRoles();
    this.cargarCatalogosPrecio();
  }

  listarRoles(): void {
    this.rolService.getRoles().subscribe(
      (roles) => {
      this.roles = roles.filter((r: any) => [2, 3, 4, 10, 16].includes(r.idRol));
      },
      (error) => console.error('Error al cargar roles', error)
    );
  }

  cargarCatalogosPrecio(): void {
    this.isLoading = true; // Iniciar loader
    this.catalogoPrecioService.obtenerCatalogoPorRol(this.idRol).subscribe(
      (catalogo) => {
        if(catalogo) {
          this.catalogo = catalogo;
          this.nombreCatalogo = catalogo.nombre;
          this.colorEtiqueta = catalogo.colorEtiqueta || '#667eea'; // Color por defecto si no viene
          this.catalogos = catalogo.productos || [];
          this.collectionSize = this.catalogos.length;
        }else{
          this.catalogo = null;
          this.catalogos = [];
          this.colorEtiqueta = '#667eea'; // Reset al color por defecto
          let rol = this.roles.find(r => r.idRol == this.idRol);
          this.nombreCatalogo = "";
          
        }
        
        // Limpiar selección cuando se recargan los datos
        this.limpiarSeleccion();
        
        // Resetear paginación
        this.page = 1;
        
        this.isLoading = false; // Finalizar loader
      },
      (error) => {
        console.error('Error al cargar catalogos', error);
        this.isLoading = false; // Finalizar loader en caso de error
      }
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
      // Actualizar estado de selección después de limpiar filtros
      setTimeout(() => this.actualizarEstadoSeleccionGeneral(), 100);
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
    
    // Actualizar estado de selección después de filtrar
    setTimeout(() => this.actualizarEstadoSeleccionGeneral(), 100);
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

  // Método para obtener el nombre del rol por ID
  getRolNombre(idRol: number): string {
    const rol = this.roles.find(r => r.idRol == idRol);
    return rol ? rol.nombre : 'Tipo de cliente';
  }

  // Método para obtener el estilo del header con el color dinámico
  getHeaderStyle(): any {
    return {
      'background': this.colorEtiqueta,
      'color': this.getTextColor(),
      'border': 'none',
      'border-radius': '0.5rem',
      'box-shadow': '0 4px 6px rgba(0, 0, 0, 0.1)'
    };
  }

  // Método para determinar si el color de fondo es claro y necesita texto oscuro
  isColorLight(hexColor: string): boolean {
    // Remover el # si existe
    const color = hexColor.replace('#', '');
    
    // Convertir a RGB
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    
    // Calcular luminancia usando la fórmula estándar
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Si la luminancia es mayor a 0.6, es un color claro
    return luminance > 0.6;
  }

  // Método para obtener el color del texto según el fondo
  getTextColor(): string {
    return this.isColorLight(this.colorEtiqueta) ? '#333333' : '#ffffff';
  }

  // ========== MÉTODOS PARA SELECCIÓN MÚLTIPLE ==========

  // Método para manejar la selección de un producto individual
  onSeleccionProducto(item: any): void {
    if (item.seleccionado) {
      // Agregar a la lista de seleccionados si no existe (evitar duplicados)
      if (!this.productosSeleccionados.find(p => p.idCatalogoProducto === item.idCatalogoProducto)) {
        this.productosSeleccionados.push(item);
      }
    } else {
      // Remover de la lista de seleccionados
      this.productosSeleccionados = this.productosSeleccionados.filter(
        p => p.idCatalogoProducto !== item.idCatalogoProducto
      );
    }
    this.actualizarEstadoSeleccionGeneral();
  }

  // Método para obtener los productos visibles en la página actual
  getProductosVisiblesPaginaActual(): any[] {
    if (this.tabla && this.tabla.filteredValue) {
      // Si hay filtros aplicados, usar los datos filtrados
      const datosFiltrados = this.tabla.filteredValue;
      const inicio = this.tabla.first || 0;
      const fin = inicio + (this.tabla.rows || this.pageSize);
      return datosFiltrados.slice(inicio, fin);
    } else if (this.tabla) {
      // Sin filtros, usar datos originales con paginación
      const inicio = this.tabla.first || 0;
      const fin = inicio + (this.tabla.rows || this.pageSize);
      return this.catalogos.slice(inicio, fin);
    }
    
    // Fallback: usar lógica manual si no hay referencia a tabla
    const paginaActual = this.page - 1;
    const inicio = paginaActual * this.pageSize;
    const fin = inicio + this.pageSize;
    return this.catalogos.slice(inicio, fin);
  }

  // Método para seleccionar/deseleccionar solo los productos visibles en la página actual
  toggleTodosSeleccionados(): void {
    const productosVisibles = this.getProductosVisiblesPaginaActual();
    
    // Determinar si todos los productos visibles ya están seleccionados
    const todosVisiblesSeleccionados = productosVisibles.every(item => item.seleccionado);
    
    // Si todos están seleccionados, deseleccionar todos los visibles
    // Si no todos están seleccionados, seleccionar todos los visibles
    const nuevoEstado = !todosVisiblesSeleccionados;
    
    productosVisibles.forEach(item => {
      const yaSeleccionado = this.productosSeleccionados.find(
        p => p.idCatalogoProducto === item.idCatalogoProducto
      );
      
      if (nuevoEstado) {
        // Seleccionar: marcar checkbox y agregar a lista si no existe
        item.seleccionado = true;
        if (!yaSeleccionado) {
          this.productosSeleccionados.push(item);
        }
      } else {
        // Deseleccionar: desmarcar checkbox y remover de lista
        item.seleccionado = false;
        if (yaSeleccionado) {
          this.productosSeleccionados = this.productosSeleccionados.filter(
            p => p.idCatalogoProducto !== item.idCatalogoProducto
          );
        }
      }
    });

    this.actualizarEstadoSeleccionGeneral();
  }

  // Método para actualizar el estado del checkbox principal basado en productos visibles
  actualizarEstadoSeleccionGeneral(): void {
    const productosVisibles = this.getProductosVisiblesPaginaActual();
    
    if (productosVisibles.length === 0) {
      this.todosSeleccionados = false;
      return;
    }

    // El checkbox general está marcado solo si TODOS los productos visibles están seleccionados
    this.todosSeleccionados = productosVisibles.every(item => item.seleccionado);
  }

  // Método para verificar si hay selección parcial en la página actual
  haySeleccionParcial(): boolean {
    const productosVisibles = this.getProductosVisiblesPaginaActual();
    
    if (productosVisibles.length === 0) {
      return false;
    }

    const productosVisiblesSeleccionados = productosVisibles.filter(item => item.seleccionado).length;
    return productosVisiblesSeleccionados > 0 && productosVisiblesSeleccionados < productosVisibles.length;
  }

  // Método para manejar cambios de página
  onPageChange(event: any): void {
    this.page = event.page + 1; // PrimeNG usa índice 0, pero nosotros usamos índice 1
    this.pageSize = event.rows;
    
    // Actualizar el estado del checkbox general para la nueva página
    this.actualizarEstadoSeleccionGeneral();
  }

  // Método para verificar si todos los productos seleccionados están activos
  todosSeleccionadosActivos(): boolean {
    return this.productosSeleccionados.length > 0 && 
           this.productosSeleccionados.every(producto => producto.estado === true);
  }

  // Método para verificar si todos los productos seleccionados están inactivos
  todosSeleccionadosInactivos(): boolean {
    return this.productosSeleccionados.length > 0 && 
           this.productosSeleccionados.every(producto => producto.estado === false);
  }

  // Método para limpiar la selección
  limpiarSeleccion(): void {
    this.catalogos.forEach(item => {
      item.seleccionado = false;
    });
    this.productosSeleccionados = [];
    this.todosSeleccionados = false;
  }

  // Método para activar productos en bloque
  activarEnBloque(): void {
    const productosAActivar = this.productosSeleccionados.filter(p => !p.estado);
    
    if (productosAActivar.length === 0) {
      Swal.fire('Información', 'No hay productos inactivos seleccionados para activar', 'info');
      return;
    }

    // Crear lista de productos para mostrar en el mensaje
    const listaProductos = productosAActivar.map(p => 
      `• ${p.producto.productoMaestro.nombre} - ${p.producto.presentacion} ${p.producto.tipoPresentacion.descripcion}`
    ).join('<br>');

    Swal.fire({
      title: 'Activar Productos en Bloque',
      html: `¿Estás seguro de que deseas <strong>activar</strong> los siguientes ${productosAActivar.length} productos?<br><br>
             <div style="text-align: left; max-height: 200px; overflow-y: auto; font-size: 0.9em;">
               ${listaProductos}
             </div>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Sí, activar ${productosAActivar.length} productos`,
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'swal-wide'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.ejecutarCambioEstadoBloque(productosAActivar, true);
      }
    });
  }

  // Método para desactivar productos en bloque
  desactivarEnBloque(): void {
    const productosADesactivar = this.productosSeleccionados.filter(p => p.estado);
    
    if (productosADesactivar.length === 0) {
      Swal.fire('Información', 'No hay productos activos seleccionados para desactivar', 'info');
      return;
    }

    // Crear lista de productos para mostrar en el mensaje
    const listaProductos = productosADesactivar.map(p => 
      `• ${p.producto.productoMaestro.nombre} - ${p.producto.presentacion} ${p.producto.tipoPresentacion.descripcion}`
    ).join('<br>');

    Swal.fire({
      title: 'Desactivar Productos en Bloque',
      html: `¿Estás seguro de que deseas <strong>desactivar</strong> los siguientes ${productosADesactivar.length} productos?<br><br>
             <div style="text-align: left; max-height: 200px; overflow-y: auto; font-size: 0.9em;">
               ${listaProductos}
             </div>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Sí, desactivar ${productosADesactivar.length} productos`,
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'swal-wide'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.ejecutarCambioEstadoBloque(productosADesactivar, false);
      }
    });
  }

  // Método para ejecutar el cambio de estado en bloque (simplificado)
  private ejecutarCambioEstadoBloque(productos: any[], nuevoEstado: boolean): void {
    // Crear request simplificado con solo IDs y estado
    const request = {
      idsCatalogoProducto: productos.map(producto => producto.idCatalogoProducto),
      estado: nuevoEstado
    };

    // Llamada al servicio
    this.catalogoPrecioService.actualizarEstadoProductosEnBloque(request).subscribe(
      (response: any) => {
        if (response.idResultado === 1) {
          const accion = nuevoEstado ? 'activados' : 'desactivados';
          Swal.fire('Éxito', `${productos.length} productos ${accion} correctamente`, 'success');
          this.limpiarSeleccion();
          this.cargarCatalogosPrecio();
        } else {
          Swal.fire('Error', response.resultado || 'No se pudieron actualizar los productos', 'error');
        }
      },
      (error: any) => {
        console.error('Error al actualizar productos en bloque:', error);
        Swal.fire('Error', 'Ocurrió un error al actualizar los productos', 'error');
      }
    );
  }

  // Método para exportar a Excel
  exportarExcel(): void {
    if (this.catalogos.length === 0) {
      Swal.fire('Información', 'No hay datos para exportar', 'info');
      return;
    }

    // Obtener los datos a exportar (usar datos filtrados si existen)
    let datosAExportar = this.tabla && this.tabla.filteredValue ? this.tabla.filteredValue : this.catalogos;

    // Preparar los datos para exportación
    const datosExcel = datosAExportar.map((item: any) => ({
      'Código': item.producto?.idProducto || '',
      'Nombre del Producto': item.producto?.productoMaestro?.nombre || '',
      'Presentación': item.producto?.presentacion || '',
      'Tipo Presentación': item.producto?.tipoPresentacion?.descripcion || '',
      'Tipo de Envase': item.tipoEnvase || '',
      'Precio (S/)': Number(item.precio || 0).toFixed(2),
      'Estado': item.estado ? 'Activo' : 'Inactivo'
    }));

    // Configurar parámetros para el Excel con formato completo
    const cabecera = [
      '', // Columna vacía inicial
      'Código',
      'Nombre del Producto',
      'Presentación',
      'Tipo Presentación',
      'Tipo de Envase',
      'Precio (S/)',
      'Estado'
    ];

    const campos = [
      '',
      'Código',
      'Nombre del Producto',
      'Presentación',
      'Tipo Presentación',
      'Tipo de Envase',
      'Precio (S/)',
      'Estado'
    ];

    const ancho = [12, 40, 15, 15, 30, 18, 15, 12]; // Anchos de columnas

    const subcabecera = [
      '','',
      'Catálogo:', this.nombreCatalogo,
      'Tipo de Cliente:', this.getRolNombre(this.idRol),
      'Total de Productos:', this.catalogos.length.toString(),
      'Productos Filtrados:', datosAExportar.length.toString()
    ];

    const sumarcampos = [0, 0, 0, 0, 0, 0, 0, 0]; // No sumar ningún campo

    const nombreArchivo = `catalogo_precios_${this.getRolNombre(this.idRol).toLowerCase().replace(/ /g, '_')}`;
    
    try {
      this.excelService.downloadExcel(
        datosExcel,
        cabecera,
        campos,
        `Catálogo de Precios - ${this.getRolNombre(this.idRol)}`,
        ancho,
        subcabecera,
        nombreArchivo,
        sumarcampos
      );

      Swal.fire({
        icon: 'success',
        title: 'Exportación exitosa',
        text: 'El catálogo de precios ha sido descargado correctamente.',
        timer: 3000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de exportación',
        text: 'Hubo un problema al generar el archivo Excel. Por favor, inténtalo de nuevo.',
      });
    }
  }

}
