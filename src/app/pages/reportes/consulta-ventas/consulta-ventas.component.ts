import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { CalendarModule } from 'primeng/calendar';
import Swal from 'sweetalert2';

import { ReporteService } from '../../../services/reporte.service';
import { TipoPagoService } from '../../../services/tipo-pago.service';
import { ProductoService } from '../../../services/producto.service';
import { ClienteService } from '../../../services/cliente.service';
import { RolService } from '../../../services/rol.service';
import { CanalVentaService } from '../../../services/canal-venta.service';
import { ExcelService } from '../../../services/excel.service';

@Component({
  selector: 'app-consulta-ventas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    MultiSelectModule,
    CalendarModule
  ],
  templateUrl: './consulta-ventas.component.html',
  styleUrl: './consulta-ventas.component.scss',
  providers: [ExcelService, DatePipe]
})
export class ConsultaVentasComponent implements OnInit {

  // Filtros
  fechaInicio: Date = new Date();
  fechaFin: Date = new Date();
  tiposPagoSeleccionados: any[] = [];
  productosSeleccionados: any[] = [];
  clientesSeleccionados: any[] = [];
  rolesSeleccionados: any[] = [];
  canalesVentaSeleccionados: any[] = [];

  // Opciones para los filtros
  tiposPago: any[] = [];
  productos: any[] = [];
  clientes: any[] = [];
  roles: any[] = [];
  canalesVenta: any[] = [];

  // Datos de la tabla
  ventas: any[] = [];
  loading: boolean = false;
  exportDisabled: boolean = true;

  // Paginación
  pageSize: number = 25;

  constructor(
    private reporteService: ReporteService,
    private tipoPagoService: TipoPagoService,
    private productoService: ProductoService,
    private clienteService: ClienteService,
    private rolService: RolService,
    private canalVentaService: CanalVentaService,
    private excelService: ExcelService
  ) {
    // Inicializar fechas con rango del mes actual
    const now = new Date();
    this.fechaInicio = new Date(now.getFullYear(), now.getMonth(), 1);
    this.fechaFin = now;
  }

  ngOnInit(): void {
    this.cargarDatosFiltros();
  }

  cargarDatosFiltros(): void {
    // Cargar tipos de pago
    this.tipoPagoService.getTiposPago().subscribe(
      (data) => this.tiposPago = data,
      (error) => console.error('Error al cargar tipos de pago:', error)
    );

    // Cargar productos
    this.productoService.getProductos().subscribe(
      (data) => {
        // Agregar campo de texto de búsqueda completo
        this.productos = data.map((producto: any) => ({
          ...producto,
          displayText: `${producto.idProducto} ${producto.productoMaestro?.nombre || ''} ${producto.presentacion || ''} ${producto.tipoPresentacion?.descripcion || ''}`
        }));
      },
      (error) => console.error('Error al cargar productos:', error)
    );

    // Cargar clientes
    this.clienteService.getClientes().subscribe(
      (data) => this.clientes = data,
      (error) => console.error('Error al cargar clientes:', error)
    );

    // Cargar roles
    this.rolService.getRoles().subscribe(
      (data) => {
        // Filtrar solo los roles 2, 3 y 4
        this.roles = data.filter((rol: any) => [2, 3, 4].includes(rol.idRol));
      },
      (error) => console.error('Error al cargar roles:', error)
    );

    // Cargar canales de venta
    this.canalVentaService.getCanalesVenta().subscribe(
      (data) => this.canalesVenta = data,
      (error) => console.error('Error al cargar canales de venta:', error)
    );
  }

  buscarVentas(): void {
    // Validar fechas
    if (!this.fechaInicio || !this.fechaFin) {
      Swal.fire({
        icon: 'warning',
        title: 'Fechas requeridas',
        text: 'Por favor, seleccione las fechas de inicio y fin.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (this.fechaInicio > this.fechaFin) {
      Swal.fire({
        icon: 'warning',
        title: 'Fechas inválidas',
        text: 'La fecha de inicio no puede ser posterior a la fecha de fin.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    this.loading = true;
    
    const filtros = {
      fechaInicio: this.formatDate(this.fechaInicio),
      fechaFin: this.formatDate(this.fechaFin),
      idTipoPago: this.tiposPagoSeleccionados.length > 0 ? this.tiposPagoSeleccionados.map(tp => tp.idTipoPago) : [-1],
      idProducto: this.productosSeleccionados.length > 0 ? this.productosSeleccionados.map(p => p.idProducto) : [""],
      idCliente: this.clientesSeleccionados.length > 0 ? this.clientesSeleccionados.map(c => c.idCliente) : [-1],
      idRol: this.rolesSeleccionados.length > 0 ? this.rolesSeleccionados.map(r => r.idRol) : [-1],
      idCanalVenta: this.canalesVentaSeleccionados.length > 0 ? this.canalesVentaSeleccionados.map(cv => cv.idCanalVenta) : [-1]
    };

    console.log('Filtros enviados:', filtros);

    this.reporteService.getReporteVentas(filtros).subscribe(
      (data) => {
        this.ventas = data || [];
        this.loading = false;
        
        if (this.ventas.length === 0) {
          this.exportDisabled = true;
          Swal.fire({
            icon: 'info',
            title: 'Sin resultados',
            text: 'No se encontraron ventas con los criterios de búsqueda especificados.',
            confirmButtonText: 'Entendido'
          });
        } else {
          this.exportDisabled = false;
          Swal.fire({
            icon: 'success',
            title: 'Búsqueda exitosa',
            text: `Se encontraron ${this.ventas.length} registros.`,
            timer: 2000,
            showConfirmButton: false
          });
        }
      },
      (error) => {
        console.error('Error al buscar ventas:', error);
        this.ventas = [];
        this.loading = false;
        this.exportDisabled = true;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al buscar las ventas. Por favor, inténtelo nuevamente.',
          confirmButtonText: 'Entendido'
        });
      }
    );
  }

  exportarExcel(): void {
    if (this.exportDisabled) return;

    let cabecera: any[] = [];
    let campos: any[] = [];
    let ancho: any[] = [];
    let subcabecera: any[] = [];
    let sumarcampos: any[] = [];

    // Define headers
    cabecera = [
      "Fecha",
      "N° Pedido",
      "Cliente",
      "ID Producto",
      "Nombre Producto",
      "Presentación",
      "Cantidad",
      "Precio Unit. (S/)",
      "Subtotal (S/)",
      "Total Pedido (S/)",
      "Método Pago",
      "Canal",
      "Tipo Cliente"
    ];

    // Define fields (deben coincidir con los nombres del JSON)
    campos = [
      "fecha",
      "idPedido",
      "cliente",
      "idProducto",
      "nombreProducto",
      "presentacion",
      "cantidad",
      "precio",
      "subtotal",
      "totalPedido",
      "metodoPago",
      "canal",
      "rol"
    ];

    // Column widths
    ancho = [
      15, // fecha
      20, // idPedido
      30, // cliente
      20, // idProducto
      40, // nombreProducto
      25, // presentacion
      15, // cantidad
      20, // precio
      20, // subtotal
      20, // totalPedido
      20, // metodoPago
      20, // canal
      25  // rol
    ];

    // Campos que se deben sumar (1 si es numérico acumulable)
    sumarcampos = [
      0,
      0, // fecha
      0, // idPedido
      0, // cliente
      0, // idProducto
      0, // nombreProducto
      0, // presentacion
      1, // cantidad
      1, // precio
      1, // subtotal
      1, // totalPedido
      0, // metodoPago
      0, // canal
      0  // rol
    ];

    // Subcabecera con datos adicionales
    subcabecera = [
      `Período: ${this.formatDate(this.fechaInicio)} - ${this.formatDate(this.fechaFin)}`,
      `# Registros: ${this.ventas?.length || 0}`,
      `Total General: S/ ${this.ventas?.reduce((sum, venta) => sum + venta.totalPedido, 0).toFixed(2) || '0.00'}`
    ];

    // Agregar columna inicial vacía
    cabecera.unshift("");
    campos.unshift("");

    try {
      // Llamar a servicio Excel
      this.excelService.downloadExcel(
        this.ventas, // datos de ventas
        cabecera,
        campos,
        "Reporte de Ventas",
        ancho,
        subcabecera,
        `reporte_ventas_${this.formatDate(this.fechaInicio).replace(/-/g, '')}_${this.formatDate(this.fechaFin).replace(/-/g, '')}`,
        sumarcampos
      );

      Swal.fire({
        icon: 'success',
        title: 'Exportación exitosa',
        text: 'El reporte ha sido descargado correctamente.',
        confirmButtonText: 'Entendido'
      });
    } catch (error) {
      console.error('Error al exportar:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al exportar',
        text: 'Ocurrió un error al exportar el reporte. Por favor, inténtelo nuevamente.',
        confirmButtonText: 'Entendido'
      });
    }
  }

  limpiarFiltros(): void {
    this.tiposPagoSeleccionados = [];
    this.productosSeleccionados = [];
    this.clientesSeleccionados = [];
    this.rolesSeleccionados = [];
    this.canalesVentaSeleccionados = [];
    
    const now = new Date();
    this.fechaInicio = new Date(now.getFullYear(), now.getMonth(), 1);
    this.fechaFin = now;
    
    this.ventas = [];
    this.exportDisabled = true;
  }

  private formatDate(date: Date): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
