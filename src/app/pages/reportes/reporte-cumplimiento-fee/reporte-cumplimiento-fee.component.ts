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
import { DataService } from '../../../services/data.service';
import { ExcelService } from '../../../services/excel.service';

// Interfaces
interface FiltrosCumplimientoFEE {
  fechaInicio: Date;
  fechaFin: Date;
  tipoFechaAnalisis: 'pedido' | 'entrega';
  estadosEntrega: string[];
  clientesSeleccionados: number[];
  rangoDelayDias: {
    min: number;
    max: number;
  };
}

interface PedidoCumplimientoFEE {
  numeroPedido: string;
  cliente: string;
  fechaPedido: Date;
  fechaEstimadaEntrega: Date;
  fechaRealEntrega: Date | null;
  estadoEntrega: 'Entregado' | 'En Proceso' | 'Retrasado' | 'Cancelado';
  diasDelay: number; // Positivo = retraso, Negativo = anticipado, 0 = a tiempo
  valorPedido: number;
  responsableEntrega: string;
  motivoRetraso?: string;
  observaciones?: string;
  cumpleFEE: boolean;
}

interface KpisCumplimientoFEE {
  totalPedidos: number;
  pedidosEntregadosATiempo: number;
  pedidosRetrasados: number;
  porcentajeCumplimiento: number;
  promedioDelayDias: number;
  impactoEconomicoRetrasos: number;
  otifScore: number; // On Time In Full
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
    fechaInicio: new Date(new Date().setDate(new Date().getDate() - 30)),
    fechaFin: new Date(),
    tipoFechaAnalisis: 'entrega',
    estadosEntrega: [],
    clientesSeleccionados: [],
    rangoDelayDias: {
      min: -10,
      max: 30
    }
  };

  // Datos
  datosCumplimientoFEE: PedidoCumplimientoFEE[] = [];
  datosClientesOTIF: ClienteOTIF[] = [];
  kpisCumplimientoFEE: KpisCumplimientoFEE = {
    totalPedidos: 0,
    pedidosEntregadosATiempo: 0,
    pedidosRetrasados: 0,
    porcentajeCumplimiento: 0,
    promedioDelayDias: 0,
    impactoEconomicoRetrasos: 0,
    otifScore: 0
  };

  // Opciones para dropdowns
  tiposFechaAnalisis = [
    { label: 'Por Fecha de Pedido', value: 'pedido' },
    { label: 'Por Fecha de Entrega', value: 'entrega' }
  ];

  estadosEntrega = [
    { label: 'Entregado', value: 'Entregado' },
    { label: 'En Proceso', value: 'En Proceso' },
    { label: 'Retrasado', value: 'Retrasado' },
    { label: 'Cancelado', value: 'Cancelado' }
  ];

  clientesDisponibles = [
    { idCliente: 1, nombre: 'Distribuidora Central S.A.' },
    { idCliente: 2, nombre: 'Supermercados Unidos Ltda.' },
    { idCliente: 3, nombre: 'Comercial del Norte S.A.S.' },
    { idCliente: 4, nombre: 'Grupo Retail Premium' },
    { idCliente: 5, nombre: 'Mayorista Integral S.A.' }
  ];

  rangosFecha = [
    { label: 'Últimos 7 días', value: 7 },
    { label: 'Últimos 15 días', value: 15 },
    { label: 'Últimos 30 días', value: 30 },
    { label: 'Últimos 60 días', value: 60 },
    { label: 'Últimos 90 días', value: 90 }
  ];

  rangoFechas: number = 30;
  fechaInicio: Date = new Date(new Date().setDate(new Date().getDate() - 30));
  fechaFin: Date = new Date();

  constructor(
    private dataService: DataService,
    private excelService: ExcelService
  ) {}

  ngOnInit(): void {
    this.generarDatosFicticios();
    this.calcularKPIs();
    this.calcularOTIFPorCliente();
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
    this.filtrosCumplimientoFEE.fechaInicio = this.fechaInicio;
    this.filtrosCumplimientoFEE.fechaFin = this.fechaFin;
    
    // Aquí iría la llamada real al API
    // this.dataService.post('api/reporte/cumplimiento-fee', this.filtrosCumplimientoFEE)
    //   .subscribe(response => {
    //     this.datosCumplimientoFEE = response.data;
    //     this.calcularKPIs();
    //     this.calcularOTIFPorCliente();
    //   });
    
    // Por ahora regeneramos datos ficticios
    this.generarDatosFicticios();
    this.calcularKPIs();
    this.calcularOTIFPorCliente();
  }

  private generarDatosFicticios(): void {
    const productos = [
      'Shampoo Anticaspa 500ml',
      'Acondicionador Hidratante 400ml',
      'Crema Facial Antiarrugas 50ml',
      'Loción Corporal Humectante 250ml',
      'Serum Vitamina C 30ml',
      'Mascarilla Facial Purificante 100ml',
      'Jabón Líquido Antibacterial 300ml',
      'Desodorante Roll-on 75ml',
      'Gel de Ducha Refrescante 400ml',
      'Bálsamo Labial SPF 15 4g'
    ];

    const responsables = [
      'Carlos Mendoza',
      'Ana García',
      'Luis Rodríguez',
      'María Fernández',
      'Jorge López'
    ];

    const motivosRetraso = [
      'Falta de stock',
      'Demora en transporte',
      'Problemas de calidad',
      'Incidencia logística',
      'Cambio de dirección cliente',
      'Feriados/días no laborales',
      'Condiciones climáticas',
      'Problema con proveedor'
    ];

    this.datosCumplimientoFEE = [];

    for (let i = 1; i <= 150; i++) {
      const fechaPedido = new Date(this.fechaInicio.getTime() + 
        Math.random() * (this.fechaFin.getTime() - this.fechaInicio.getTime()));
      
      const fechaEstimada = new Date(fechaPedido);
      fechaEstimada.setDate(fechaEstimada.getDate() + Math.floor(Math.random() * 10) + 1);
      
      const diasDelay = Math.floor(Math.random() * 21) - 5; // -5 a +15 días
      const fechaReal = new Date(fechaEstimada);
      fechaReal.setDate(fechaReal.getDate() + diasDelay);
      
      const estados: Array<'Entregado' | 'En Proceso' | 'Retrasado' | 'Cancelado'> = 
        ['Entregado', 'En Proceso', 'Retrasado', 'Cancelado'];
      let estadoEntrega: 'Entregado' | 'En Proceso' | 'Retrasado' | 'Cancelado';
      
      if (diasDelay > 0 && Math.random() > 0.3) {
        estadoEntrega = 'Retrasado';
      } else if (Math.random() > 0.8) {
        estadoEntrega = 'En Proceso';
      } else if (Math.random() > 0.95) {
        estadoEntrega = 'Cancelado';
      } else {
        estadoEntrega = 'Entregado';
      }

      const pedido: PedidoCumplimientoFEE = {
        numeroPedido: `PED-${String(i).padStart(6, '0')}`,
        cliente: this.clientesDisponibles[Math.floor(Math.random() * this.clientesDisponibles.length)].nombre,
        fechaPedido: fechaPedido,
        fechaEstimadaEntrega: fechaEstimada,
        fechaRealEntrega: estadoEntrega === 'Entregado' || estadoEntrega === 'Retrasado' ? fechaReal : null,
        estadoEntrega: estadoEntrega,
        diasDelay: estadoEntrega === 'Entregado' || estadoEntrega === 'Retrasado' ? diasDelay : 0,
        valorPedido: Math.floor(Math.random() * 5000) + 100, // Valores en soles peruanos más realistas
        responsableEntrega: responsables[Math.floor(Math.random() * responsables.length)],
        motivoRetraso: diasDelay > 0 ? motivosRetraso[Math.floor(Math.random() * motivosRetraso.length)] : undefined,
        observaciones: Math.random() > 0.7 ? 'Observaciones del pedido...' : undefined,
        cumpleFEE: diasDelay <= 0
      };

      this.datosCumplimientoFEE.push(pedido);
    }
  }

  private calcularKPIs(): void {
    const totalPedidos = this.datosCumplimientoFEE.length;
    const pedidosEntregados = this.datosCumplimientoFEE.filter(p => p.estadoEntrega === 'Entregado');
    const pedidosATiempo = pedidosEntregados.filter(p => p.cumpleFEE);
    const pedidosRetrasados = this.datosCumplimientoFEE.filter(p => p.diasDelay > 0);
    
    const promedioDelay = pedidosEntregados.length > 0 
      ? pedidosEntregados.reduce((sum, p) => sum + p.diasDelay, 0) / pedidosEntregados.length 
      : 0;
    
    const impactoEconomico = pedidosRetrasados.reduce((sum, p) => sum + (p.valorPedido * 0.05), 0);
    
    const otifScore = totalPedidos > 0 ? (pedidosATiempo.length / totalPedidos) * 100 : 0;

    this.kpisCumplimientoFEE = {
      totalPedidos: totalPedidos,
      pedidosEntregadosATiempo: pedidosATiempo.length,
      pedidosRetrasados: pedidosRetrasados.length,
      porcentajeCumplimiento: totalPedidos > 0 ? (pedidosATiempo.length / totalPedidos) * 100 : 0,
      promedioDelayDias: promedioDelay,
      impactoEconomicoRetrasos: impactoEconomico,
      otifScore: otifScore
    };
  }

  private calcularOTIFPorCliente(): void {
    const clientesMap = new Map<string, any>();

    this.datosCumplimientoFEE.forEach(pedido => {
      if (!clientesMap.has(pedido.cliente)) {
        clientesMap.set(pedido.cliente, {
          nombreCliente: pedido.cliente,
          totalPedidos: 0,
          pedidosATiempo: 0
        });
      }

      const cliente = clientesMap.get(pedido.cliente);
      cliente.totalPedidos++;
      
      if (pedido.cumpleFEE && pedido.estadoEntrega === 'Entregado') {
        cliente.pedidosATiempo++;
      }
    });

    this.datosClientesOTIF = Array.from(clientesMap.values()).map((cliente, index) => ({
      idCliente: index + 1,
      nombreCliente: cliente.nombreCliente,
      totalPedidos: cliente.totalPedidos,
      pedidosATiempo: cliente.pedidosATiempo,
      porcentajeCumplimiento: cliente.totalPedidos > 0 ? (cliente.pedidosATiempo / cliente.totalPedidos) * 100 : 0,
      promedioDelayDias: this.calcularPromedioDelayCliente(cliente.nombreCliente)
    })).sort((a, b) => b.porcentajeCumplimiento - a.porcentajeCumplimiento);
  }

  private calcularPromedioDelayCliente(nombreCliente: string): number {
    const pedidosCliente = this.datosCumplimientoFEE.filter(p => 
      p.cliente === nombreCliente && p.estadoEntrega === 'Entregado'
    );
    
    if (pedidosCliente.length === 0) return 0;
    
    return pedidosCliente.reduce((sum, p) => sum + p.diasDelay, 0) / pedidosCliente.length;
  }

  getEstadoEntrega(estado: string): string {
    const clases = {
      'Entregado': 'estado-entregado',
      'En Proceso': 'estado-proceso',
      'Retrasado': 'estado-retrasado',
      'Cancelado': 'estado-cancelado'
    };
    return clases[estado as keyof typeof clases] || '';
  }

  getEstadoDelay(diasDelay: number): string {
    if (diasDelay < 0) return 'delay-anticipado';
    if (diasDelay === 0) return 'delay-tiempo';
    if (diasDelay <= 3) return 'delay-leve';
    if (diasDelay <= 7) return 'delay-moderado';
    return 'delay-critico';
  }

  exportarExcel(): void {
    const datosExport = this.datosCumplimientoFEE.map(item => ({
      'Número Pedido': item.numeroPedido,
      'Cliente': item.cliente,
      'Fecha Pedido': item.fechaPedido.toLocaleDateString(),
      'Fecha Estimada Entrega': item.fechaEstimadaEntrega.toLocaleDateString(),
      'Fecha Real Entrega': item.fechaRealEntrega?.toLocaleDateString() || 'Pendiente',
      'Estado Entrega': item.estadoEntrega,
      'Días Delay': item.diasDelay,
      'Valor Pedido': item.valorPedido,
      'Responsable Entrega': item.responsableEntrega,
      'Motivo Retraso': item.motivoRetraso || 'N/A',
      'Cumple FEE': item.cumpleFEE ? 'Sí' : 'No'
    }));

    this.excelService.exportAsExcelFile(datosExport, 'Reporte_Cumplimiento_FEE');
  }

  exportarPDF(): void {
    // Implementar exportación a PDF
    console.log('Exportar PDF - Cumplimiento FEE');
  }
}
