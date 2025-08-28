import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import jsPDF from 'jspdf';
import Swal from 'sweetalert2';
import { DataService } from '../../../services/data.service';
import { ExcelService } from '../../../services/excel.service';
import { ReporteService } from '../../../services/reporte.service';
import { ClienteService } from '../../../services/cliente.service';
import { CanalVentaService } from '../../../services/canal-venta.service';
import { EstadoPedidoService, EstadoPedido } from '../../../services/estado-pedido.service';

// Interfaces
interface FiltrosCumplimientoFEE {
  fechaInicio: Date;
  fechaFin: Date;
  tipoFechaAnalisis: 'pedido' | 'entrega';
  estadosPedido: number[];
  clientesSeleccionados: number[];
  canalesSeleccionados: number[];
}

interface PedidoCumplimientoFEE {
  numeroPedido: string;
  cliente: string;
  fechaEstimadaEntrega: Date;
  fechaRealEntrega: Date | null;
  diasAtraso: number; // Solo positivos (días de atraso)
  clienteResponsable: string; // Cliente que cambió el estado a entregado
  estadoPedido: number;
  estadoPedidoNombre: string;
}

interface KpisCumplimientoFEE {
  otifPorcentaje: number; // OTIF %
  entregasATiempo: number; // Entregas a tiempo (N)
  entregasAtrasadas: number; // Atrasadas (N)
  atrasoMedioDias: number; // Atraso medio (días)
}

interface ClienteOTIF {
  idCliente: number;
  nombreCliente: string;
  totalPedidos: number;
  pedidosATiempo: number;
  porcentajeCumplimiento: number;
  promedioDelayDias: number;
}

@Component({
  selector: 'app-reporte-cumplimiento-fee',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    CalendarModule,
    DropdownModule,
    MultiSelectModule,
    TooltipModule,
    ProgressBarModule,
    TagModule
  ],
  providers: [ExcelService, DatePipe],
  templateUrl: './reporte-cumplimiento-fee.component.html',
  styleUrls: ['./reporte-cumplimiento-fee.component.scss']
})
export class ReporteCumplimientoFeeComponent implements OnInit {
  // Propiedades de filtros
  filtrosCumplimientoFEE: FiltrosCumplimientoFEE = {
    fechaInicio: new Date('2025-04-01'),
    fechaFin: new Date('2025-08-28'),
    tipoFechaAnalisis: 'entrega',
    estadosPedido: [],
    clientesSeleccionados: [],
    canalesSeleccionados: []
  };

  // Datos
  datosCumplimientoFEE: PedidoCumplimientoFEE[] = [];
  datosClientesOTIF: ClienteOTIF[] = [];
  kpisCumplimientoFEE: KpisCumplimientoFEE = {
    otifPorcentaje: 0,
    entregasATiempo: 0,
    entregasAtrasadas: 0,
    atrasoMedioDias: 0
  };

  // Opciones para dropdowns
  tiposFechaAnalisis = [
    { label: 'Por Fecha de Pedido', value: 'pedido' },
    { label: 'Por Fecha de Entrega', value: 'entrega' }
  ];

  estadosPedido: EstadoPedido[] = [];
  clientesDisponibles: any[] = [];
  canalesDisponibles: any[] = [];

  rangosFecha = [
    { label: 'Últimos 7 días', value: 7 },
    { label: 'Últimos 15 días', value: 15 },
    { label: 'Últimos 30 días', value: 30 },
    { label: 'Últimos 60 días', value: 60 },
    { label: 'Últimos 90 días', value: 90 }
  ];

  rangoFechas: number = 30;
  fechaInicio: Date = new Date('2025-04-01');
  fechaFin: Date = new Date('2025-08-28');

  constructor(
    private dataService: DataService,
    private excelService: ExcelService,
    private reporteService: ReporteService,
    private clienteService: ClienteService,
    private canalVentaService: CanalVentaService,
    private estadoPedidoService: EstadoPedidoService
  ) {}

  ngOnInit(): void {
    // Cargar datos para los filtros
    this.cargarEstadosPedido();
    this.cargarClientes();
    this.cargarCanales();
  }

  cargarEstadosPedido(): void {
    this.estadoPedidoService.getEstadosPedido().subscribe({
      next: (estados) => {
        this.estadosPedido = estados;
      },
      error: (error) => {
        console.error('Error al cargar estados de pedido:', error);
      }
    });
  }

  cargarClientes(): void {
    this.clienteService.getClientes().subscribe({
      next: (clientes) => {
        this.clientesDisponibles = clientes.map(cliente => ({
          idCliente: cliente.idCliente,
          nombre: `${cliente.nombres} ${cliente.apellidos}`
        }));
      },
      error: (error) => {
        console.error('Error al cargar clientes:', error);
      }
    });
  }

  cargarCanales(): void {
    this.canalVentaService.getCanalesVenta().subscribe({
      next: (canales) => {
        this.canalesDisponibles = canales.map(canal => ({
          idCanal: canal.idCanalVenta,
          nombre: canal.descripcion
        }));
      },
      error: (error) => {
        console.error('Error al cargar canales:', error);
      }
    });
  }

  onRangoFechaChange(): void {
    const fechaFin = new Date();
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaFin.getDate() - this.rangoFechas);
    
    this.fechaInicio = fechaInicio;
    this.fechaFin = fechaFin;
    this.filtrosCumplimientoFEE.fechaInicio = fechaInicio;
    this.filtrosCumplimientoFEE.fechaFin = fechaFin;
  }

  aplicarFiltros(): void {
    // Formatear fechas como strings YYYY-MM-DD
    const fechaInicio = this.fechaInicio.toISOString().split('T')[0];
    const fechaFin = this.fechaFin.toISOString().split('T')[0];
    
    this.filtrosCumplimientoFEE.fechaInicio = this.fechaInicio;
    this.filtrosCumplimientoFEE.fechaFin = this.fechaFin;
    
    const payload = {
      fechaInicio: fechaInicio,
      fechaFin: fechaFin,
      tipoFechaAnalisis: this.filtrosCumplimientoFEE.tipoFechaAnalisis,
      estadosPedido: this.filtrosCumplimientoFEE.estadosPedido,
      clientesSeleccionados: this.filtrosCumplimientoFEE.clientesSeleccionados,
      canalesSeleccionados: this.filtrosCumplimientoFEE.canalesSeleccionados
    };
    
    this.reporteService.getReporteCumplimientoFee(payload)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.datosCumplimientoFEE = response.data.pedidos.map((pedido: any) => ({
              ...pedido,
              fechaEstimadaEntrega: new Date(pedido.fechaEstimadaEntrega),
              fechaRealEntrega: pedido.fechaRealEntrega ? new Date(pedido.fechaRealEntrega) : null
            }));
            this.kpisCumplimientoFEE = response.data.kpis;
            this.datosClientesOTIF = response.data.clientesOTIF;
          }
        },
        error: (error: any) => {
          console.error('Error al obtener datos del reporte:', error);
          Swal.fire({
            title: 'Error',
            text: 'No se pudieron cargar los datos del reporte',
            icon: 'error'
          });
        }
      });
  }

  getEstadoPedido(estadoPedido: number): string {
    const clases = {
      1: 'estado-borrador',
      2: 'estado-pagado', 
      3: 'estado-cola',
      4: 'estado-produccion',
      5: 'estado-calidad',
      6: 'estado-envasado',
      7: 'estado-etiquetado',
      8: 'estado-despacho',
      9: 'estado-validado',
      10: 'estado-entregado'
    };
    return clases[estadoPedido as keyof typeof clases] || '';
  }

  getEstadoAtraso(diasAtraso: number): string {
    if (diasAtraso === 0) return 'atraso-tiempo';
    if (diasAtraso <= 3) return 'atraso-leve';
    if (diasAtraso <= 7) return 'atraso-moderado';
    return 'atraso-critico';
  }

  exportarExcel(): void {
    if (this.datosCumplimientoFEE.length === 0) {
      Swal.fire({
        title: 'No hay datos',
        text: 'Debe aplicar filtros y generar el reporte antes de exportar',
        icon: 'warning'
      });
      return;
    }

    const datosExport = this.datosCumplimientoFEE.map(item => ({
      'Número Pedido': item.numeroPedido,
      'Cliente': item.cliente,
      'Fecha Estimada Entrega': item.fechaEstimadaEntrega ? new Date(item.fechaEstimadaEntrega).toLocaleDateString('es-PE') : '',
      'Fecha Real Entrega': item.fechaRealEntrega ? new Date(item.fechaRealEntrega).toLocaleDateString('es-PE') : 'Pendiente',
      'Atraso (días)': item.diasAtraso,
      'Cliente Responsable': item.clienteResponsable
    }));

    const cabecera = [
      'Número Pedido',
      'Cliente', 
      'Fecha Estimada Entrega',
      'Fecha Real Entrega',
      'Atraso (días)',
      'Cliente Responsable'
    ];

    const campos = [
      'Número Pedido',
      'Cliente',
      'Fecha Estimada Entrega', 
      'Fecha Real Entrega',
      'Atraso (días)',
      'Cliente Responsable'
    ];

    const ancho = [20, 30, 25, 25, 15, 25];

    const fechaGeneracion = new Date().toLocaleDateString('es-PE');
    const tipoAnalisis = this.filtrosCumplimientoFEE.tipoFechaAnalisis === 'pedido' ? 'Por Fecha de Pedido' : 'Por Fecha de Entrega';
    const rangoFechas = `${this.fechaInicio.toLocaleDateString('es-PE')} - ${this.fechaFin.toLocaleDateString('es-PE')}`;
    
    const filtrosTexto = `Período: ${rangoFechas}, Tipo de Análisis: ${tipoAnalisis}`;

    const subcabecera = [
      `Generado el: ${fechaGeneracion}`,
      `Filtros aplicados: ${filtrosTexto}`,
      `Total de pedidos: ${this.datosCumplimientoFEE.length}`,
      `OTIF: ${this.kpisCumplimientoFEE.otifPorcentaje.toFixed(2)}%`
    ];

    // Agregar columna inicial vacía para el formato
    subcabecera.unshift("");
    cabecera.unshift("");
    campos.unshift("");

    this.excelService.downloadExcel(
      datosExport,
      cabecera,
      campos,
      'Reporte de Cumplimiento FEE',
      ancho,
      subcabecera,
      'reporte-cumplimiento-fee',
      []
    );
  }

  async exportarPDF(): Promise<void> {
    if (this.datosCumplimientoFEE.length === 0) {
      Swal.fire({
        title: 'No hay datos',
        text: 'Debe aplicar filtros y generar el reporte antes de exportar',
        icon: 'warning'
      });
      return;
    }

    try {
      Swal.fire({
        title: 'Generando PDF...',
        text: 'Por favor espere mientras se genera el archivo',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      let currentY = 20;
      const pageWidth = 190;
      const margin = 10;

      // Título del reporte
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Reporte de Cumplimiento FEE', pageWidth / 2, currentY, { align: 'center' });
      currentY += 15;

      // Información de filtros
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const fechaGeneracion = new Date().toLocaleDateString('es-PE');
      const tipoAnalisis = this.filtrosCumplimientoFEE.tipoFechaAnalisis === 'pedido' ? 'Por Fecha de Pedido' : 'Por Fecha de Entrega';
      const rangoFechas = `${this.fechaInicio.toLocaleDateString('es-PE')} - ${this.fechaFin.toLocaleDateString('es-PE')}`;
      
      pdf.text(`Generado el: ${fechaGeneracion}`, margin, currentY);
      currentY += 6;
      pdf.text(`Período: ${rangoFechas}`, margin, currentY);
      currentY += 6;
      pdf.text(`Tipo de Análisis: ${tipoAnalisis}`, margin, currentY);
      currentY += 15;

      // KPIs
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Indicadores OTIF', margin, currentY);
      currentY += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`OTIF: ${this.kpisCumplimientoFEE.otifPorcentaje.toFixed(2)}%`, margin, currentY);
      pdf.text(`Entregas a Tiempo: ${this.kpisCumplimientoFEE.entregasATiempo}`, margin + 60, currentY);
      currentY += 6;
      pdf.text(`Entregas Atrasadas: ${this.kpisCumplimientoFEE.entregasAtrasadas}`, margin, currentY);
      pdf.text(`Atraso Medio: ${this.kpisCumplimientoFEE.atrasoMedioDias.toFixed(1)} días`, margin + 60, currentY);
      currentY += 15;

      // Tabla de OTIF por Cliente
      if (this.datosClientesOTIF.length > 0) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('OTIF por Cliente', margin, currentY);
        currentY += 10;

        const clientesHeaders = ['Cliente', 'Total Pedidos', 'A Tiempo', '% Cumplimiento'];
        const clientesData = this.datosClientesOTIF.map(cliente => [
          cliente.nombreCliente,
          cliente.totalPedidos.toString(),
          cliente.pedidosATiempo.toString(),
          `${cliente.porcentajeCumplimiento.toFixed(1)}%`
        ]);

        this.addTableToPDF(pdf, clientesHeaders, clientesData, currentY, [80, 30, 30, 30]);
        currentY += (clientesData.length * 8) + 20;
      }

      // Verificar si necesitamos nueva página
      if (currentY > 250) {
        pdf.addPage();
        currentY = 20;
      }

      // Tabla principal de pedidos
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Detalle de Pedidos', margin, currentY);
      currentY += 10;

      const headers = ['Pedido', 'Cliente', 'FEE', 'Entrega Real', 'Atraso', 'Responsable'];
      const tableData = this.datosCumplimientoFEE.map(item => [
        item.numeroPedido,
        item.cliente.length > 25 ? item.cliente.substring(0, 25) + '...' : item.cliente,
        item.fechaEstimadaEntrega ? new Date(item.fechaEstimadaEntrega).toLocaleDateString('es-PE') : '',
        item.fechaRealEntrega ? new Date(item.fechaRealEntrega).toLocaleDateString('es-PE') : 'Pendiente',
        item.diasAtraso.toString(),
        item.clienteResponsable.length > 20 ? item.clienteResponsable.substring(0, 20) + '...' : item.clienteResponsable
      ]);

      this.addTableToPDF(pdf, headers, tableData, currentY, [25, 45, 25, 25, 15, 35]);

      Swal.close();
      pdf.save('reporte-cumplimiento-fee.pdf');

    } catch (error) {
      Swal.close();
      console.error('Error al generar PDF:', error);
      Swal.fire({
        title: 'Error',
        text: 'Ocurrió un error al generar el PDF',
        icon: 'error'
      });
    }
  }

  private addTableToPDF(pdf: jsPDF, headers: string[], data: string[][], startY: number, columnWidths: number[]): void {
    const margin = 10;
    let currentY = startY;

    // Headers
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    let currentX = margin;
    headers.forEach((header, index) => {
      pdf.text(header, currentX, currentY);
      currentX += columnWidths[index];
    });
    currentY += 8;

    // Data rows
    pdf.setFont('helvetica', 'normal');
    data.forEach((row, rowIndex) => {
      // Verificar si necesitamos nueva página
      if (currentY > 280) {
        pdf.addPage();
        currentY = 20;
        
        // Repetir headers en nueva página
        pdf.setFont('helvetica', 'bold');
        currentX = margin;
        headers.forEach((header, index) => {
          pdf.text(header, currentX, currentY);
          currentX += columnWidths[index];
        });
        currentY += 8;
        pdf.setFont('helvetica', 'normal');
      }

      currentX = margin;
      row.forEach((cell, cellIndex) => {
        const text = cell || '';
        pdf.text(text, currentX, currentY);
        currentX += columnWidths[cellIndex];
      });
      currentY += 6;
    });
  }
}
