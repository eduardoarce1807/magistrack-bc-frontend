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
import { DropdownModule } from 'primeng/dropdown';
import Swal from 'sweetalert2';

import { ReporteService } from '../../../services/reporte.service';
import { TipoPagoService } from '../../../services/tipo-pago.service';
import { ProductoService } from '../../../services/producto.service';
import { ClienteService } from '../../../services/cliente.service';
import { RolService } from '../../../services/rol.service';
import { CanalVentaService } from '../../../services/canal-venta.service';
import { MetodoEntregaService } from '../../../services/metodo-entrega.service';
import { ExcelService } from '../../../services/excel.service';

@Component({
  selector: 'app-reporte-despacho',
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
    CalendarModule,
    DropdownModule
  ],
  templateUrl: './reporte-despacho.component.html',
  styleUrl: './reporte-despacho.component.scss',
  providers: [ExcelService, DatePipe]
})
export class ReporteDespachoComponent implements OnInit {

  // Filtros
  fechaInicio: Date = new Date();
  fechaFin: Date = new Date();
  tiposPagoSeleccionados: any[] = [];
  productosSeleccionados: any[] = [];
  clientesSeleccionados: any[] = [];
  rolesSeleccionados: any[] = [];
  canalesVentaSeleccionados: any[] = [];
  tiposEntregaSeleccionados: any[] = [];

  // Opciones para los filtros
  tiposPago: any[] = [];
  productos: any[] = [];
  clientes: any[] = [];
  roles: any[] = [];
  canalesVenta: any[] = [];
  tiposEntrega: any[] = [];

  // Datos de la tabla
  datosDespacho: any[] = [];
  loading: boolean = false;
  exportDisabled: boolean = true;

  // Paginación
  pageSize: number = 25;

  // Agrupación de datos
  datosAgrupados: any[] = [];

  constructor(
    private reporteService: ReporteService,
    private tipoPagoService: TipoPagoService,
    private productoService: ProductoService,
    private clienteService: ClienteService,
    private rolService: RolService,
    private canalVentaService: CanalVentaService,
    private metodoEntregaService: MetodoEntregaService,
    private excelService: ExcelService,
    private datePipe: DatePipe
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
      (data) => this.roles = data,
      (error) => console.error('Error al cargar roles:', error)
    );

    // Cargar canales de venta
    this.canalVentaService.getCanalesVenta().subscribe(
      (data) => this.canalesVenta = data,
      (error) => console.error('Error al cargar canales de venta:', error)
    );

    // Cargar tipos de entrega (métodos de entrega)
    this.metodoEntregaService.getMetodosEntrega().subscribe(
      (data) => this.tiposEntrega = data,
      (error) => console.error('Error al cargar tipos de entrega:', error)
    );
  }

  buscarDespachos(): void {
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
      idProducto: this.productosSeleccionados.length > 0 ? this.productosSeleccionados.map(p => p.idProducto) : ['-1'],
      idCliente: this.clientesSeleccionados.length > 0 ? this.clientesSeleccionados.map(c => c.idCliente) : [-1],
      idRol: this.rolesSeleccionados.length > 0 ? this.rolesSeleccionados.map(r => r.idRol) : [-1],
      idCanalVenta: this.canalesVentaSeleccionados.length > 0 ? this.canalesVentaSeleccionados.map(cv => cv.idCanalVenta) : [-1],
      idTipoEntrega: this.tiposEntregaSeleccionados.length > 0 ? this.tiposEntregaSeleccionados.map(te => te.idMetodoEntrega) : [-1],
      // Solo filtrar pedidos en estado despacho (estado 8)
      estadoDespacho: 8
    };

    console.log('Filtros enviados:', filtros);

    // Temporal: usaremos getReporteVentas con filtros adicionales hasta que se implemente el endpoint específico
    this.reporteService.getReporteDespacho(filtros).subscribe(
      (data: any) => {
        this.datosDespacho = data || [];
        this.agruparDatosPorPedidoCliente();
        this.loading = false;
        
        if (this.datosDespacho.length === 0) {
          this.exportDisabled = true;
          Swal.fire({
            icon: 'info',
            title: 'Sin resultados',
            text: 'No se encontraron despachos con los criterios de búsqueda especificados.',
            confirmButtonText: 'Entendido'
          });
        } else {
          this.exportDisabled = false;
          Swal.fire({
            icon: 'success',
            title: 'Búsqueda completada',
            text: `Se encontraron ${this.datosDespacho.length} registros.`,
            confirmButtonText: 'Entendido'
          });
        }
      },
      (error: any) => {
        this.loading = false;
        console.error('Error al buscar despachos:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al buscar los despachos. Por favor, inténtelo nuevamente.',
          confirmButtonText: 'Entendido'
        });
      }
    );
  }

  agruparDatosPorPedidoCliente(): void {
    // Agrupar datos por pedido-cliente como especifica el cliente
    const agrupados = new Map();

    this.datosDespacho.forEach(item => {
      const clave = `${item.idPedido}-${item.cliente}`;
      
      if (!agrupados.has(clave)) {
        agrupados.set(clave, {
          idPedido: item.idPedido,
          cliente: item.cliente,
          fecha: item.fecha,
          metodoPago: item.metodoPago,
          canal: item.canal,
          tipoCliente: item.tipoCliente,
          tipoEntrega: item.tipoEntrega,
          totalPedido: item.totalPedido,
          productos: []
        });
      }

      const grupo = agrupados.get(clave);
      grupo.productos.push({
        producto: item.producto,
        presentacion: item.presentacion,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: item.subtotal
      });
    });

    this.datosAgrupados = Array.from(agrupados.values());
  }

  exportarExcel(): void {
    if (this.exportDisabled) return;

    let cabecera: any[] = [];
    let campos: any[] = [];
    let ancho: any[] = [];
    let subcabecera: any[] = [];
    let sumarcampos: any[] = [];

    // Define headers para el reporte de despacho
    cabecera = [
      "Fecha",
      "ID Pedido",
      "Cliente",
      "Producto",
      "Presentación",
      "Cantidad",
      "Precio Unit. (S/)",
      "Subtotal (S/)",
      "Total Pedido (S/)",
      "Método Pago",
      "Canal",
      "Tipo Cliente",
      "Tipo Entrega"
    ];

    // Define field mappings
    campos = [
      "fecha",
      "idPedido", 
      "cliente",
      "producto",
      "presentacion",
      "cantidad",
      "precioUnitario",
      "subtotal",
      "totalPedido",
      "metodoPago",
      "canal",
      "tipoCliente",
      "tipoEntrega"
    ];

    // Column widths
    ancho = [
      15, // fecha
      15, // idPedido
      25, // cliente
      30, // producto
      20, // presentacion
      12, // cantidad
      15, // precioUnitario
      15, // subtotal
      15, // totalPedido
      20, // metodoPago
      20, // canal
      20, // tipoCliente
      20  // tipoEntrega
    ];

    // Campos que se deben sumar (1 si es numérico acumulable)
    sumarcampos = [
      0,
      0, // fecha
      0, // idPedido
      0, // cliente
      0, // producto
      0, // presentacion
      1, // cantidad
      0, // precioUnitario
      0, // subtotal
      1, // totalPedido
      0, // metodoPago
      0, // canal
      0, // tipoCliente
      0  // tipoEntrega
    ];

    // Subcabecera con datos adicionales
    subcabecera = [
      `Período: ${this.formatDate(this.fechaInicio)} - ${this.formatDate(this.fechaFin)}`,
      `Fecha de generación: ${this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm')}`,
      `Total registros: ${this.datosDespacho.length}`
    ];

    // Agregar columna inicial vacía
    cabecera.unshift("");
    campos.unshift("");

    try {
      this.excelService.downloadExcel(
        this.datosDespacho, // datos de despacho
        cabecera,
        campos,
        "Reporte de Despacho",
        ancho,
        subcabecera,
        `reporte_despacho_${this.formatDate(this.fechaInicio).replace(/-/g, '')}_${this.formatDate(this.fechaFin).replace(/-/g, '')}`,
        sumarcampos
      );

      Swal.fire({
        icon: 'success',
        title: 'Exportación exitosa',
        text: 'El reporte ha sido exportado correctamente.',
        confirmButtonText: 'Entendido'
      });
    } catch (error) {
      console.error('Error al exportar:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error en la exportación',
        text: 'Ocurrió un error al exportar el reporte.',
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
    this.tiposEntregaSeleccionados = [];
    
    const now = new Date();
    this.fechaInicio = new Date(now.getFullYear(), now.getMonth(), 1);
    this.fechaFin = now;
    
    this.datosDespacho = [];
    this.datosAgrupados = [];
    this.exportDisabled = true;
  }

  private formatDate(date: Date): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Métodos de utilidad para la vista
  calcularTotalProductosPorPedido(productos: any[]): number {
    return productos.reduce((total, producto) => total + producto.cantidad, 0);
  }

  calcularSubtotalPorPedido(productos: any[]): number {
    return productos.reduce((total, producto) => total + producto.subtotal, 0);
  }
}