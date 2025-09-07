import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables,ChartConfiguration  } from 'chart.js';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TabViewModule } from 'primeng/tabview';
import { CardModule } from 'primeng/card';
import { MultiSelectModule } from 'primeng/multiselect';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';

// Services
import { ProductoService } from '../../../services/producto.service';
import { ClienteService } from '../../../services/cliente.service';
import { CanalVentaService } from '../../../services/canal-venta.service';
import { TipoPagoService } from '../../../services/tipo-pago.service';
import { RolService } from '../../../services/rol.service';
import { ExcelService } from '../../../services/excel.service';
import { ReportesGraficosService, FiltrosVentasProducto, FiltrosVentasCliente, FiltrosVentasCanal, FiltrosTopN } from '../../../services/reportes-graficos.service';

Chart.register(...registerables);

@Component({
  selector: 'app-reportes-graficos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TabViewModule,
    CardModule,
    MultiSelectModule,
    CalendarModule,
    DropdownModule,
    InputTextModule,
    DividerModule,
    TooltipModule
  ],
  templateUrl: './reportes-graficos.component.html',
  styleUrl: './reportes-graficos.component.scss',
  providers: [ExcelService, DatePipe]
})
export class ReportesGraficosComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('ventasProductoBarChart') ventasProductoBarChart!: ElementRef;
  @ViewChild('ventasProductoPieChart') ventasProductoPieChart!: ElementRef;
  @ViewChild('ventasClienteBarChart') ventasClienteBarChart!: ElementRef;
  @ViewChild('ventasClienteLineChart') ventasClienteLineChart!: ElementRef;
  @ViewChild('ventasTipoClienteBarChart') ventasTipoClienteBarChart!: ElementRef;
  @ViewChild('ventasTipoClienteLineChart') ventasTipoClienteLineChart!: ElementRef;
  @ViewChild('ventasCanalStackedChart') ventasCanalStackedChart!: ElementRef;
  @ViewChild('ventasCanalPieChart') ventasCanalPieChart!: ElementRef;
  @ViewChild('topNChart') topNChart!: ElementRef;

  // Variables para gráficos
  barChart: Chart | undefined;
  pieChart: Chart | undefined;
  clienteBarChart: Chart | undefined;
  clienteLineChart: Chart | undefined;
  tipoClienteBarChart: Chart | undefined;
  tipoClienteLineChart: Chart | undefined;
  canalStackedChart: Chart | undefined;
  canalPieChart: Chart | undefined;
  topChart: Chart | undefined;

  // Filtros generales
  fechaInicio: Date = new Date();
  fechaFin: Date = new Date();
  rangoFechas: string = '';
  canalesVenta: any[] = [];
  tiposPago: any[] = [];
  productos: any[] = [];
  clientes: any[] = [];
  roles: any[] = [];
  tiposCliente: any[] = [];

  // Filtros específicos por reporte
  filtrosVentasProducto = {
    fechaInicio: new Date(),
    fechaFin: new Date(),
    rangoFechas: '',
    canalesSeleccionados: [],
    tiposPagoSeleccionados: [],
    productosSeleccionados: [],
    rolesSeleccionados: []
  };

  filtrosVentasCliente = {
    fechaInicio: new Date(),
    fechaFin: new Date(),
    rangoFechas: '',
    canalesSeleccionados: [],
    tiposPagoSeleccionados: [],
    rolesSeleccionados: [],
    clientesSeleccionados: []
  };

  filtrosVentasTipoCliente = {
    fechaInicio: new Date(),
    fechaFin: new Date(),
    rangoFechas: '',
    canalesSeleccionados: [],
    tiposPagoSeleccionados: [],
    rolesSeleccionados: [],
    clientesSeleccionados: []
  };

  filtrosVentasCanal = {
    fechaInicio: new Date(),
    fechaFin: new Date(),
    rangoFechas: '',
    tiposPagoSeleccionados: []
  };

  filtrosTopN = {
    fechaInicio: new Date(),
    fechaFin: new Date(),
    rangoFechas: '',
    canalesSeleccionados: [],
    tiposPagoSeleccionados: [],
    topN: 10,
    dimension: 'productos' // productos o clientes
  };

  // Opciones para filtros
  rangosFecha = [
    { label: 'Hoy', value: 'hoy' },
    { label: 'Últimos 7 días', value: 'ultimos7' },
    { label: 'Últimos 30 días', value: 'ultimos30' },
    { label: 'Personalizado', value: 'personalizado' }
  ];

  opcionesTopN = [
    { label: 'Top 5', value: 5 },
    { label: 'Top 10', value: 10 },
    { label: 'Top 20', value: 20 }
  ];

  dimensionesTopN = [
    { label: 'Productos', value: 'productos' },
    { label: 'Clientes', value: 'clientes' }
  ];

  // Datos para tablas
  datosVentasProducto: any[] = [];
  datosVentasCliente: any[] = [];
  datosVentasTipoCliente: any[] = [];
  datosVentasCanal: any[] = [];
  datosTopN: any[] = [];

  // Datos para gráficos específicos
  datosGraficosCliente: any = null;

  // KPIs
  kpisVentasProducto = {
    totalVendido: 0,
    unidades: 0,
    ticketPromedio: 0,
    participacionTop5: 0
  };

  kpisVentasCliente = {
    total: 0,
    pedidos: 0,
    ticketPromedio: 0,
    recompra: 0
  };

  kpisVentasTipoCliente = {
    total: 0,
    pedidos: 0,
    ticketPromedio: 0,
    recompra: 0
  };

  kpisVentasCanal = {
    total: 0,
    porcentajePorCanal: {},
    pedidos: 0,
    ticketPromedioPorCanal: {}
  };

  kpisTopN = {
    porcentajeAcumulado: 0
  };

  constructor(
    private productoService: ProductoService,
    private clienteService: ClienteService,
    private canalVentaService: CanalVentaService,
    private tipoPagoService: TipoPagoService,
    private rolService: RolService,
    private excelService: ExcelService,
    private datePipe: DatePipe,
    private reportesGraficosService: ReportesGraficosService
  ) {
    this.initializeFechas();
  }

  ngOnInit(): void {
    this.cargarDatosIniciales();
    // Los datos de reportes se cargarán cuando el usuario aplique filtros
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.crearGraficos();
    }, 100);
  }

  initializeFechas(): void {
    const hoy = new Date();
    this.fechaFin = new Date(hoy);
    this.fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    // Inicializar fechas en todos los filtros
    Object.keys(this).forEach(key => {
      if (key.startsWith('filtros') && this[key as keyof this]) {
        const filtro = this[key as keyof this] as any;
        if (filtro.fechaInicio !== undefined) {
          filtro.fechaInicio = new Date(this.fechaInicio);
          filtro.fechaFin = new Date(this.fechaFin);
        }
      }
    });
  }

  cargarDatosIniciales(): void {
    console.log('Iniciando carga de datos de filtros...');

    // Cargar productos
    this.productoService.getProductos().subscribe({
      next: (productos: any[]) => {
        console.log('Productos recibidos:', productos);
        if (productos && Array.isArray(productos)) {
          this.productos = productos.map((p: any) => ({
            ...p,
            displayText: `${p.productoMaestro.nombre.length > 35 ? p.productoMaestro.nombre.substring(0, 35) + '...' : p.productoMaestro.nombre} - ${p.presentacion}${p.tipoPresentacion.descripcion}`
          }));
          console.log('Productos procesados:', this.productos);
        } else {
          console.warn('Respuesta de productos no es un array:', productos);
          this.productos = [];
        }
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.productos = [];
      }
    });

    // Cargar clientes
    this.clienteService.getClientes().subscribe({
      next: (clientes: any[]) => {
        console.log('Clientes recibidos:', clientes);
        if (clientes && Array.isArray(clientes)) {
          this.clientes = clientes.map((c: any) => ({
            ...c,
            nombre: `${c.nombres} ${c.apellidos}`,
            documento: c.numeroDocumento
          }));
          console.log('Clientes procesados:', this.clientes);
        } else {
          console.warn('Respuesta de clientes no es un array:', clientes);
          this.clientes = [];
        }
      },
      error: (error) => {
        console.error('Error al cargar clientes:', error);
        this.clientes = [];
      }
    });

    // Cargar canales de venta
    this.canalVentaService.getCanalesVenta().subscribe({
      next: (canales: any[]) => {
        console.log('Canales recibidos:', canales);
        if (canales && Array.isArray(canales)) {
          this.canalesVenta = canales.map((c: any) => ({
            idCanalVenta: c.idCanalVenta,
            nombre: c.descripcion
          }));
          console.log('Canales procesados:', this.canalesVenta);
        } else {
          console.warn('Respuesta de canales no es un array:', canales);
          this.canalesVenta = [];
        }
      },
      error: (error: any) => {
        console.error('Error al cargar canales de venta:', error);
        this.canalesVenta = [];
      }
    });

    // Cargar tipos de pago
    this.tipoPagoService.getTiposPago().subscribe({
      next: (tiposPago: any[]) => {
        console.log('Tipos de pago recibidos:', tiposPago);
        if (tiposPago && Array.isArray(tiposPago)) {
          this.tiposPago = tiposPago.map((t: any) => ({
            idTipoPago: t.idTipoPago,
            nombre: t.descripcion
          }));
          console.log('Tipos de pago procesados:', this.tiposPago);
        } else {
          console.warn('Respuesta de tipos de pago no es un array:', tiposPago);
          this.tiposPago = [];
        }
      },
      error: (error: any) => {
        console.error('Error al cargar tipos de pago:', error);
        this.tiposPago = [];
      }
    });

    // Cargar roles
    this.rolService.getRoles().subscribe({
      next: (roles: any[]) => {
        console.log('Roles recibidos:', roles);
        if (roles && Array.isArray(roles)) {
          this.roles = roles;
          console.log('Roles cargados:', this.roles);
        } else {
          console.warn('Respuesta de roles no es un array:', roles);
          this.roles = [];
        }
      },
      error: (error: any) => {
        console.error('Error al cargar roles:', error);
        this.roles = [];
      }
    });
  }

  // Método para recargar datos de filtros (debug)
  recargarDatosDebug(): void {
    console.log('Recargando datos de filtros manualmente...');
    this.cargarDatosIniciales();
  }

  crearGraficos(): void {
    // Solo crear gráficos si hay datos disponibles
    if (this.datosVentasProducto && this.datosVentasProducto.length > 0) {
      this.crearGraficoVentasProducto();
    }
    if (this.datosVentasCliente && this.datosVentasCliente.length > 0) {
      this.crearGraficoVentasCliente();
    }
    if (this.datosVentasCanal && this.datosVentasCanal.length > 0) {
      this.crearGraficoVentasCanal();
    }
    if (this.datosTopN && this.datosTopN.length > 0) {
      this.crearGraficoTopN();
    }
  }

  crearGraficoVentasProducto(): void {
    console.log('Creando gráficos de ventas por producto...');
    console.log('Datos disponibles:', this.datosVentasProducto);

    // Destruir gráficos existentes
    if (this.barChart) {
      this.barChart.destroy();
      this.barChart = undefined;
    }
    if (this.pieChart) {
      this.pieChart.destroy();
      this.pieChart = undefined;
    }

    // Verificar que hay datos
    if (!this.datosVentasProducto || this.datosVentasProducto.length === 0) {
      console.log('No hay datos para crear gráficos');
      return;
    }

    // Verificar que los ViewChild están disponibles
    if (!this.ventasProductoBarChart || !this.ventasProductoPieChart) {
      console.log('ViewChild no están disponibles aún');
      return;
    }

    try {
      // Gráfico de barras horizontales - Top 10 productos por ingresos
      const ctxBar = this.ventasProductoBarChart.nativeElement.getContext('2d');
      const productosTop10 = this.datosVentasProducto.slice(0, 10);

      console.log('Creando gráfico de barras con datos:', productosTop10);

      this.barChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
          labels: productosTop10.map(p => `${p.producto} - ${p.presentacion}`),
          datasets: [{
            label: 'Ingresos (S/)',
            data: productosTop10.map(p => p.ingresos),
            backgroundColor: 'rgba(54, 162, 235, 0.8)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Top 10 Productos por Ingresos'
            },
            legend: {
              display: false
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return 'S/ ' + value;
                }
              }
            }
          }
        }
      });

      // Gráfico de pie - Participación por producto
      const ctxPie = this.ventasProductoPieChart.nativeElement.getContext('2d');

      console.log('Creando gráfico de pie con datos:', productosTop10);

      this.pieChart = new Chart(ctxPie, {
        type: 'pie',
        data: {
          labels: productosTop10.map(p => `${p.producto} - ${p.presentacion}`),
          datasets: [{
            data: productosTop10.map(p => p.participacion),
            backgroundColor: [
              '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
              '#9966FF', '#FF9F40', '#FF6384', '#36A2EB',
              '#FFCE56', '#4BC0C0'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Participación por Producto (%)'
            },
            legend: {
              position: 'bottom'
            }
          }
        }
      });

      console.log('Gráficos creados exitosamente');

    } catch (error) {
      console.error('Error al crear gráficos:', error);
    }
  }

  crearGraficoVentasCliente(): void {
    console.log('Creando gráficos de ventas por cliente...');
    console.log('Datos disponibles:', this.datosVentasCliente);

    // Destruir gráficos existentes
    if (this.clienteBarChart) {
      this.clienteBarChart.destroy();
      this.clienteBarChart = undefined;
    }
    if (this.clienteLineChart) {
      this.clienteLineChart.destroy();
      this.clienteLineChart = undefined;
    }

    // Verificar que hay datos
    if (!this.datosVentasCliente || this.datosVentasCliente.length === 0) {
      console.log('No hay datos para crear gráficos de clientes');
      return;
    }

    // Verificar que los ViewChild están disponibles
    if (!this.ventasClienteBarChart || !this.ventasClienteLineChart) {
      console.log('ViewChild de gráficos de cliente no están disponibles aún');
      return;
    }

    try {
      // Gráfico de barras - Top 10 clientes por ingresos
      const ctxBar = this.ventasClienteBarChart.nativeElement.getContext('2d');
      const clientesTop10 = this.datosVentasCliente.slice(0, 10);

      console.log('Creando gráfico de barras de clientes con datos:', clientesTop10);

      this.clienteBarChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
          labels: clientesTop10.map(c => c.cliente),
          datasets: [{
            label: 'Ingresos (S/)',
            data: clientesTop10.map(c => c.ingresos),
            backgroundColor: 'rgba(255, 99, 132, 0.8)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Top 10 Clientes por Ingresos'
            },
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return 'S/ ' + value;
                }
              }
            }
          }
        }
      });

      // Gráfico de línea - Ingresos por día (datos reales del API)
      const ctxLine = this.ventasClienteLineChart.nativeElement.getContext('2d');

      // Usar datos del lineChart que vienen del API
      let lineChartLabels = [];
      let lineChartData = [];

      // Verificar si tenemos datos de gráfico de línea del API
      if (this.datosGraficosCliente && this.datosGraficosCliente.lineChart) {
        // Formatear las fechas para mostrar solo día/mes - manejar formato YYYY-MM-DD directamente
        lineChartLabels = this.datosGraficosCliente.lineChart.labels.map((fecha: string) => {
          // Manejar fecha en formato YYYY-MM-DD evitando problemas de zona horaria
          const [year, month, day] = fecha.split('-');
          const fechaObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          return this.datePipe.transform(fechaObj, 'dd/MM') || fecha;
        });
        lineChartData = this.datosGraficosCliente.lineChart.datasets[0].data;

        console.log('Fechas originales del API:', this.datosGraficosCliente.lineChart.labels);
        console.log('Fechas transformadas para el gráfico:', lineChartLabels);
      } else {
        // Fallback: si no hay datos del API, usar fechas del filtro con datos en cero
        const fechaInicioFiltro = new Date(this.filtrosVentasCliente.fechaInicio);
        const fechaFinFiltro = new Date(this.filtrosVentasCliente.fechaFin);
        const diasEnRango = Math.min(30, Math.ceil((fechaFinFiltro.getTime() - fechaInicioFiltro.getTime()) / (1000 * 60 * 60 * 24)) + 1);

        for (let i = 0; i < diasEnRango; i++) {
          const fecha = new Date(fechaInicioFiltro);
          fecha.setDate(fecha.getDate() + i);
          lineChartLabels.push(this.datePipe.transform(fecha, 'dd/MM') || `Día ${i + 1}`);
          lineChartData.push(0);
        }
      }

      console.log('Creando gráfico de línea de clientes con datos del API:', { lineChartLabels, lineChartData });

      this.clienteLineChart = new Chart(ctxLine, {
        type: 'line',
        data: {
          labels: lineChartLabels,
          datasets: [{
            label: 'Ventas Diarias (S/)',
            data: lineChartData,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderWidth: 2,
            fill: true
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Ingresos por Día - Cliente Seleccionado'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return 'S/ ' + value;
                }
              }
            }
          }
        }
      });

      console.log('Gráficos de clientes creados exitosamente');

    } catch (error) {
      console.error('Error al crear gráficos de clientes:', error);
    }
  }

  crearGraficoVentasTipoCliente(): void {
    // Datos agrupados por tipo de cliente
    const tiposCliente = ['Regular', 'Premium', 'Corporativo'];
    const ingresosPorTipo = [850, 1350, 1200]; // Datos ficticios

    // Gráfico de barras - Top clientes por tipo
    const ctxBar = this.ventasTipoClienteBarChart.nativeElement.getContext('2d');

    this.tipoClienteBarChart = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: tiposCliente,
        datasets: [{
          label: 'Ingresos por Tipo (S/)',
          data: ingresosPorTipo,
          backgroundColor: ['rgba(255, 206, 86, 0.8)', 'rgba(153, 102, 255, 0.8)', 'rgba(255, 159, 64, 0.8)'],
          borderColor: ['rgba(255, 206, 86, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Ingresos por Tipo de Cliente'
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'S/ ' + value;
              }
            }
          }
        }
      }
    });

    // Gráfico de línea - Tendencia por tipo de cliente
    const ctxLine = this.ventasTipoClienteLineChart.nativeElement.getContext('2d');
    const semanas = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];

    this.tipoClienteLineChart = new Chart(ctxLine, {
      type: 'line',
      data: {
        labels: semanas,
        datasets: [
          {
            label: 'Regular',
            data: [200, 220, 180, 250],
            borderColor: 'rgba(255, 206, 86, 1)',
            backgroundColor: 'rgba(255, 206, 86, 0.2)',
            borderWidth: 2
          },
          {
            label: 'Premium',
            data: [300, 350, 320, 380],
            borderColor: 'rgba(153, 102, 255, 1)',
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            borderWidth: 2
          },
          {
            label: 'Corporativo',
            data: [400, 280, 350, 370],
            borderColor: 'rgba(255, 159, 64, 1)',
            backgroundColor: 'rgba(255, 159, 64, 0.2)',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Tendencia de Ventas por Tipo de Cliente'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'S/ ' + value;
              }
            }
          }
        }
      }
    });
  }

  crearGraficoVentasCanal(): void {
    // Gráfico de columnas apiladas - Ingresos por canal
    const ctxStacked = this.ventasCanalStackedChart.nativeElement.getContext('2d');
    const semanas = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];

    this.canalStackedChart = new Chart(ctxStacked, {
      type: 'bar',
      data: {
        labels: semanas,
        datasets: [
          {
            label: 'Web',
            data: [1800, 2000, 1900, 1800],
            backgroundColor: 'rgba(54, 162, 235, 0.8)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Venta Rápida',
            data: [1000, 1100, 900, 1000],
            backgroundColor: 'rgba(255, 99, 132, 0.8)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Ingresos por Canal de Venta'
          }
        },
        scales: {
          x: {
            stacked: true
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'S/ ' + value;
              }
            }
          }
        }
      }
    });

    // Gráfico de pie - Participación por canal
    const ctxPie = this.ventasCanalPieChart.nativeElement.getContext('2d');

    this.canalPieChart = new Chart(ctxPie, {
      type: 'pie',
      data: {
        labels: this.datosVentasCanal.map(c => c.canal),
        datasets: [{
          data: this.datosVentasCanal.map(c => c.participacion),
          backgroundColor: ['rgba(54, 162, 235, 0.8)', 'rgba(255, 99, 132, 0.8)']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Participación por Canal (%)'
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  crearGraficoTopN(): void {
    const ctx = this.topNChart.nativeElement.getContext('2d');

    this.topChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.datosTopN.map(item => item.nombre),
        datasets: [{
          label: 'Ingresos (S/)',
          data: this.datosTopN.map(item => item.ingresos),
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Top ${this.filtrosTopN.topN} ${this.filtrosTopN.dimension}`
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'S/ ' + value;
              }
            }
          }
        }
      }
    });
  }

  // Métodos para manejar cambios de rango de fechas
  onRangoFechaChange(filtros: any): void {
    const hoy = new Date();

    switch (filtros.rangoFechas) {
      case 'hoy':
        filtros.fechaInicio = new Date(hoy);
        filtros.fechaFin = new Date(hoy);
        break;
      case 'ultimos7':
        filtros.fechaInicio = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtros.fechaFin = new Date(hoy);
        break;
      case 'ultimos30':
        filtros.fechaInicio = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtros.fechaFin = new Date(hoy);
        break;
    }
  }

  // Métodos para aplicar filtros
  aplicarFiltrosVentasProducto(): void {
    Swal.fire({
      title: 'Aplicando filtros...',
      text: 'Generando reporte de ventas por producto',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Preparar filtros para la API
    const filtros: FiltrosVentasProducto = {
      fechaInicio: this.datePipe.transform(this.filtrosVentasProducto.fechaInicio, 'yyyy-MM-dd') || '',
      fechaFin: this.datePipe.transform(this.filtrosVentasProducto.fechaFin, 'yyyy-MM-dd') || '',
      canalesSeleccionados: this.filtrosVentasProducto.canalesSeleccionados,
      tiposPagoSeleccionados: this.filtrosVentasProducto.tiposPagoSeleccionados,
      productosSeleccionados: this.filtrosVentasProducto.productosSeleccionados,
      rolesSeleccionados: this.filtrosVentasProducto.rolesSeleccionados
    };

    this.reportesGraficosService.getVentasPorProducto(filtros).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Actualizar datos
          this.datosVentasProducto = response.data.productos || [];
          this.kpisVentasProducto = response.data.kpis || {};

          // Actualizar gráficos con un pequeño delay para asegurar que el DOM esté listo
          setTimeout(() => {
            this.crearGraficoVentasProducto();
            // Forzar detección de cambios
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('resize'));
            }
          }, 100);

          Swal.close();
          Swal.fire({
            icon: 'success',
            title: 'Reporte generado',
            text: 'Los datos han sido actualizados correctamente',
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          Swal.close();
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: response.message || 'Error al generar el reporte',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: (error: any) => {
        console.error('Error al obtener datos de ventas por producto:', error);
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al conectar con el servidor',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  aplicarFiltrosVentasCliente(): void {
    Swal.fire({
      title: 'Aplicando filtros...',
      text: 'Generando reporte de ventas por cliente',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Preparar filtros para la API
    const filtros: FiltrosVentasCliente = {
      fechaInicio: this.datePipe.transform(this.filtrosVentasCliente.fechaInicio, 'yyyy-MM-dd') || '',
      fechaFin: this.datePipe.transform(this.filtrosVentasCliente.fechaFin, 'yyyy-MM-dd') || '',
      canalesSeleccionados: this.filtrosVentasCliente.canalesSeleccionados,
      tiposPagoSeleccionados: this.filtrosVentasCliente.tiposPagoSeleccionados,
      rolesSeleccionados: this.filtrosVentasCliente.rolesSeleccionados,
      clientesSeleccionados: this.filtrosVentasCliente.clientesSeleccionados
    };

    this.reportesGraficosService.getVentasPorCliente(filtros).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Actualizar datos
          this.datosVentasCliente = response.data.clientes || [];
          this.kpisVentasCliente = response.data.kpis || {};
          this.datosGraficosCliente = response.data.graficos || null;

          console.log('Datos de gráficos del cliente recibidos:', this.datosGraficosCliente);

          // Actualizar gráficos con un pequeño delay para asegurar que el DOM esté listo
          setTimeout(() => {
            try {
              this.crearGraficoVentasCliente();
              // Forzar detección de cambios
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('resize'));
              }
            } catch (error) {
              console.error('Error al crear gráficos de clientes después de aplicar filtros:', error);
            }
          }, 100);

          Swal.close();
          Swal.fire({
            icon: 'success',
            title: 'Reporte generado',
            text: 'Los datos han sido actualizados correctamente',
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          Swal.close();
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: response.message || 'Error al generar el reporte',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: (error: any) => {
        console.error('Error al obtener datos de ventas por cliente:', error);
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al conectar con el servidor',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  aplicarFiltrosVentasCanal(): void {
    Swal.fire({
      title: 'Aplicando filtros...',
      text: 'Generando reporte de ventas por canal',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Preparar filtros para la API
    const filtros: FiltrosVentasCanal = {
      fechaInicio: this.datePipe.transform(this.filtrosVentasCanal.fechaInicio, 'yyyy-MM-dd') || '',
      fechaFin: this.datePipe.transform(this.filtrosVentasCanal.fechaFin, 'yyyy-MM-dd') || '',
      tiposPagoSeleccionados: this.filtrosVentasCanal.tiposPagoSeleccionados
    };

    this.reportesGraficosService.getVentasPorCanal(filtros).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Actualizar datos
          this.datosVentasCanal = response.data.canales || [];
          this.kpisVentasCanal = response.data.kpis || {};

          // Actualizar gráficos
          this.crearGraficoVentasCanal();

          Swal.close();
          Swal.fire({
            icon: 'success',
            title: 'Reporte generado',
            text: 'Los datos han sido actualizados correctamente',
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          Swal.close();
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: response.message || 'Error al generar el reporte',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: (error: any) => {
        console.error('Error al obtener datos de ventas por canal:', error);
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al conectar con el servidor',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  aplicarFiltrosTopN(): void {
    Swal.fire({
      title: 'Aplicando filtros...',
      text: 'Generando reporte Top N',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Preparar filtros para la API
    const filtros: FiltrosTopN = {
      fechaInicio: this.datePipe.transform(this.filtrosTopN.fechaInicio, 'yyyy-MM-dd') || '',
      fechaFin: this.datePipe.transform(this.filtrosTopN.fechaFin, 'yyyy-MM-dd') || '',
      canalesSeleccionados: this.filtrosTopN.canalesSeleccionados,
      tiposPagoSeleccionados: this.filtrosTopN.tiposPagoSeleccionados,
      topN: this.filtrosTopN.topN,
      dimension: this.filtrosTopN.dimension
    };

    this.reportesGraficosService.getTopN(filtros).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Actualizar datos
          this.datosTopN = response.data.top || [];
          this.kpisTopN = response.data.kpis || {};

          // Actualizar gráficos
          this.crearGraficoTopN();

          Swal.close();
          Swal.fire({
            icon: 'success',
            title: 'Reporte generado',
            text: 'Los datos han sido actualizados correctamente',
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          Swal.close();
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: response.message || 'Error al generar el reporte',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: (error: any) => {
        console.error('Error al obtener datos de Top N:', error);
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al conectar con el servidor',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  actualizarGraficoTopN(): void {
    if (this.topChart) {
      const datosLimitados = this.datosTopN.slice(0, this.filtrosTopN.topN);
      this.topChart.data.labels = datosLimitados.map(item => item.nombre);
      this.topChart.data.datasets[0].data = datosLimitados.map(item => item.ingresos);
      this.topChart.options!.plugins!.title!.text = `Top ${this.filtrosTopN.topN} ${this.filtrosTopN.dimension}`;
      this.topChart.update();
    }
  }

  // Métodos de exportación
  private generarTextoFiltrosVentasProducto(): string {
    const filtros = [];

    // Fechas
    const fechaInicio = this.datePipe.transform(this.filtrosVentasProducto.fechaInicio, 'dd/MM/yyyy');
    const fechaFin = this.datePipe.transform(this.filtrosVentasProducto.fechaFin, 'dd/MM/yyyy');
    filtros.push(`Período: ${fechaInicio} - ${fechaFin}`);

    // Canales
    if (this.filtrosVentasProducto.canalesSeleccionados.length > 0) {
      const canalesNombres = this.filtrosVentasProducto.canalesSeleccionados.map(id => {
        const canal = this.canalesVenta.find(c => c.idCanalVenta === id);
        return canal ? canal.nombre : id;
      }).join(', ');
      filtros.push(`Canales: ${canalesNombres}`);
    } else {
      filtros.push('Canales: Todos');
    }

    // Tipos de pago
    if (this.filtrosVentasProducto.tiposPagoSeleccionados.length > 0) {
      const tiposPagoNombres = this.filtrosVentasProducto.tiposPagoSeleccionados.map(id => {
        const tipoPago = this.tiposPago.find(t => t.idTipoPago === id);
        return tipoPago ? tipoPago.nombre : id;
      }).join(', ');
      filtros.push(`Métodos de pago: ${tiposPagoNombres}`);
    } else {
      filtros.push('Métodos de pago: Todos');
    }

    // Productos
    if (this.filtrosVentasProducto.productosSeleccionados.length > 0) {
      const productosNombres = this.filtrosVentasProducto.productosSeleccionados.map(id => {
        const producto = this.productos.find(p => p.idProducto === id);
        return producto ? producto.productoMaestro.nombre : id;
      }).slice(0, 3).join(', ');
      const textoProductos = this.filtrosVentasProducto.productosSeleccionados.length > 3
        ? `${productosNombres} y ${this.filtrosVentasProducto.productosSeleccionados.length - 3} más`
        : productosNombres;
      filtros.push(`Productos: ${textoProductos}`);
    } else {
      filtros.push('Productos: Todos');
    }

    // Roles
    if (this.filtrosVentasProducto.rolesSeleccionados.length > 0) {
      const rolesNombres = this.filtrosVentasProducto.rolesSeleccionados.map(id => {
        const rol = this.roles.find(r => r.idRol === id);
        return rol ? rol.nombre : id;
      }).join(', ');
      filtros.push(`Roles: ${rolesNombres}`);
    } else {
      filtros.push('Roles: Todos');
    }

    return filtros.join(' | ');
  }

  private generarTextoFiltrosVentasCliente(): string {
    const filtros = [];

    // Fechas
    const fechaInicio = this.datePipe.transform(this.filtrosVentasCliente.fechaInicio, 'dd/MM/yyyy');
    const fechaFin = this.datePipe.transform(this.filtrosVentasCliente.fechaFin, 'dd/MM/yyyy');
    filtros.push(`Período: ${fechaInicio} - ${fechaFin}`);

    // Canales
    if (this.filtrosVentasCliente.canalesSeleccionados.length > 0) {
      const canalesNombres = this.filtrosVentasCliente.canalesSeleccionados.map(id => {
        const canal = this.canalesVenta.find(c => c.idCanalVenta === id);
        return canal ? canal.nombre : id;
      }).join(', ');
      filtros.push(`Canales: ${canalesNombres}`);
    } else {
      filtros.push('Canales: Todos');
    }

    // Tipos de pago
    if (this.filtrosVentasCliente.tiposPagoSeleccionados.length > 0) {
      const tiposPagoNombres = this.filtrosVentasCliente.tiposPagoSeleccionados.map(id => {
        const tipoPago = this.tiposPago.find(t => t.idTipoPago === id);
        return tipoPago ? tipoPago.nombre : id;
      }).join(', ');
      filtros.push(`Métodos de pago: ${tiposPagoNombres}`);
    } else {
      filtros.push('Métodos de pago: Todos');
    }

    // Roles
    if (this.filtrosVentasCliente.rolesSeleccionados.length > 0) {
      const rolesNombres = this.filtrosVentasCliente.rolesSeleccionados.map(id => {
        const rol = this.roles.find(r => r.idRol === id);
        return rol ? rol.nombre : id;
      }).join(', ');
      filtros.push(`Roles: ${rolesNombres}`);
    } else {
      filtros.push('Roles: Todos');
    }

    // Clientes específicos
    if (this.filtrosVentasCliente.clientesSeleccionados.length > 0) {
      const clientesNombres = this.filtrosVentasCliente.clientesSeleccionados.map(id => {
        const cliente = this.clientes.find(c => c.idCliente === id);
        return cliente ? cliente.nombre : id;
      }).slice(0, 3).join(', ');
      const textoClientes = this.filtrosVentasCliente.clientesSeleccionados.length > 3
        ? `${clientesNombres} y ${this.filtrosVentasCliente.clientesSeleccionados.length - 3} más`
        : clientesNombres;
      filtros.push(`Clientes: ${textoClientes}`);
    } else {
      filtros.push('Clientes: Todos');
    }

    return filtros.join(' | ');
  }

  exportarExcelVentasProducto(): void {
    const datosExport = this.datosVentasProducto.map(item => ({
      'Producto': item.producto,
      'Presentación': item.presentacion,
      'Unidades': item.unidades,
      'Ingresos (S/)': item.ingresos,
      '% Participación': item.participacion
    }));

    // Generar texto de filtros aplicados
    const filtrosTexto = this.generarTextoFiltrosVentasProducto();

    // Fecha de generación
    const fechaGeneracion = this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm');

    // Usando el método disponible del ExcelService
    const cabecera = ['Producto', 'Presentación', 'Unidades', 'Ingresos (S/)', '% Participación'];
    const campos = ['Producto', 'Presentación', 'Unidades', 'Ingresos (S/)', '% Participación'];
    const ancho = [30, 20, 15, 20, 20];

    // Subcabecera con información de filtros
    const subcabecera = [
      `Generado el: ${fechaGeneracion}`,
      `Filtros aplicados: ${filtrosTexto}`
    ];

    // Agregar columna inicial vacía
    cabecera.unshift("");
    campos.unshift("");

    this.excelService.downloadExcel(
      datosExport,
      cabecera,
      campos,
      'Reporte de Ventas por Producto',
      ancho,
      subcabecera,
      'ventas-por-producto',
      []
    );
  }

  exportarExcelVentasCliente(): void {
    const datosExport = this.datosVentasCliente.map(item => ({
      'Cliente': item.cliente,
      'Documento': item.documento,
      'Tipo': item.tipo,
      '# Pedidos': item.pedidos,
      'Unidades': item.unidades,
      'Ingresos (S/)': item.ingresos,
      'Última Compra': item.ultimaCompra
    }));

    // Generar texto de filtros aplicados
    const filtrosTexto = this.generarTextoFiltrosVentasCliente();

    // Fecha de generación
    const fechaGeneracion = this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm');

    const cabecera = ['Cliente', 'Documento', 'Tipo', '# Pedidos', 'Unidades', 'Ingresos (S/)', 'Última Compra'];
    const campos = ['Cliente', 'Documento', 'Tipo', '# Pedidos', 'Unidades', 'Ingresos (S/)', 'Última Compra'];
    const ancho = [25, 15, 15, 15, 15, 20, 20];

    // Subcabecera con información de filtros
    const subcabecera = [
      `Generado el: ${fechaGeneracion}`,
      `Filtros aplicados: ${filtrosTexto}`
    ];

    cabecera.unshift("");
    campos.unshift("");

    this.excelService.downloadExcel(
      datosExport,
      cabecera,
      campos,
      'Reporte de Ventas por Cliente',
      ancho,
      subcabecera,
      'ventas-por-cliente',
      []
    );
  }

  exportarExcelVentasTipoCliente(): void {
    // Los datos serían similares a ventas por cliente, agrupados por tipo
    this.exportarExcelVentasCliente();
  }

  exportarExcelVentasCanal(): void {
    const datosExport = this.datosVentasCanal.map(item => ({
      'Canal': item.canal,
      '# Pedidos': item.pedidos,
      'Ingresos (S/)': item.ingresos,
      '% Participación': item.participacion,
      'Ticket Promedio': item.ticketPromedio
    }));

    const cabecera = ['Canal', '# Pedidos', 'Ingresos (S/)', '% Participación', 'Ticket Promedio'];
    const campos = ['Canal', '# Pedidos', 'Ingresos (S/)', '% Participación', 'Ticket Promedio'];
    const ancho = [20, 15, 20, 20, 20];

    this.excelService.downloadExcel(
      datosExport,
      cabecera,
      campos,
      'Reporte de Ventas por Canal',
      ancho,
      [],
      'ventas-por-canal',
      []
    );
  }

  exportarExcelTopN(): void {
    const datosExport = this.datosTopN.slice(0, this.filtrosTopN.topN).map(item => ({
      'Nombre': item.nombre,
      'Ingresos (S/)': item.ingresos,
      '% Participación': item.participacion
    }));

    const cabecera = ['Nombre', 'Ingresos (S/)', '% Participación'];
    const campos = ['Nombre', 'Ingresos (S/)', '% Participación'];
    const ancho = [30, 20, 20];

    this.excelService.downloadExcel(
      datosExport,
      cabecera,
      campos,
      `Top ${this.filtrosTopN.topN} ${this.filtrosTopN.dimension}`,
      ancho,
      [],
      `top-${this.filtrosTopN.topN}-${this.filtrosTopN.dimension}`,
      []
    );
  }

  // Métodos de exportación a PDF
  async exportarPDFVentasProducto(): Promise<void> {
    await this.exportarGraficosYTablaPDF('Ventas por Producto', 'reporte-ventas-producto.pdf');
  }

  async exportarPDFVentasCliente(): Promise<void> {
    await this.exportarGraficosYTablaClientePDF('Ventas por Cliente', 'reporte-ventas-cliente.pdf');
  }

  async exportarPDFVentasTipoCliente(): Promise<void> {
    await this.exportarSeccionPDF('ventas-tipo-cliente-section', 'reporte-ventas-tipo-cliente.pdf');
  }

  async exportarPDFVentasCanal(): Promise<void> {
    await this.exportarGraficosYTablaCanalPDF('Ventas por Canal', 'reporte-ventas-canal.pdf');
  }

  async exportarPDFTopN(): Promise<void> {
    await this.exportarGraficosYTablaTopNPDF(`Top ${this.filtrosTopN.topN} ${this.filtrosTopN.dimension}`, 'reporte-top-n.pdf');
  }

  private async exportarSeccionPDF(elementId: string, fileName: string): Promise<void> {
    try {
      Swal.fire({
        title: 'Generando PDF...',
        text: 'Por favor espere mientras se genera el archivo',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const elemento = document.getElementById(elementId);
      if (elemento) {
        const canvas = await html2canvas(elemento, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');

        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let position = 10;
        const pageHeight = 280;

        if (imgHeight <= pageHeight) {
          pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        } else {
          let remainingHeight = imgHeight;

          while (remainingHeight > 0) {
            const currentHeight = Math.min(remainingHeight, pageHeight);
            const sourceY = imgHeight - remainingHeight;

            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, currentHeight);

            remainingHeight -= pageHeight;

            if (remainingHeight > 0) {
              pdf.addPage();
              position = 10;
            }
          }
        }

        pdf.save(fileName);

        Swal.close();
        Swal.fire({
          icon: 'success',
          title: 'PDF generado',
          text: 'El archivo se ha descargado correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error al generar PDF:', error);
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al generar el PDF',
        confirmButtonText: 'Aceptar'
      });
    }
  }

  private async exportarGraficosYTablaPDF(titulo: string, fileName: string): Promise<void> {
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
      pdf.text(titulo, margin, currentY);
      currentY += 15;

      // Fecha del reporte
      pdf.setFontSize(10);
      const fechaReporte = this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm');
      pdf.text(`Generado el: ${fechaReporte}`, margin, currentY);
      currentY += 10;

      // Filtros aplicados
      pdf.setFontSize(9);
      pdf.text('Filtros aplicados:', margin, currentY);
      currentY += 5;

      // Rango de fechas
      const fechaInicio = this.datePipe.transform(this.filtrosVentasProducto.fechaInicio, 'dd/MM/yyyy');
      const fechaFin = this.datePipe.transform(this.filtrosVentasProducto.fechaFin, 'dd/MM/yyyy');
      pdf.text(`• Período: ${fechaInicio} - ${fechaFin}`, margin + 5, currentY);
      currentY += 4;

      // Canales de venta
      if (this.filtrosVentasProducto.canalesSeleccionados.length > 0) {
        const canalesNombres = this.filtrosVentasProducto.canalesSeleccionados.map(id => {
          const canal = this.canalesVenta.find(c => c.idCanalVenta === id);
          return canal ? canal.nombre : id;
        }).join(', ');
        pdf.text(`• Canales: ${canalesNombres}`, margin + 5, currentY);
        currentY += 4;
      } else {
        pdf.text('• Canales: Todos', margin + 5, currentY);
        currentY += 4;
      }

      // Tipos de pago
      if (this.filtrosVentasProducto.tiposPagoSeleccionados.length > 0) {
        const tiposPagoNombres = this.filtrosVentasProducto.tiposPagoSeleccionados.map(id => {
          const tipoPago = this.tiposPago.find(t => t.idTipoPago === id);
          return tipoPago ? tipoPago.nombre : id;
        }).join(', ');
        pdf.text(`• Métodos de pago: ${tiposPagoNombres}`, margin + 5, currentY);
        currentY += 4;
      } else {
        pdf.text('• Métodos de pago: Todos', margin + 5, currentY);
        currentY += 4;
      }

      // Productos
      if (this.filtrosVentasProducto.productosSeleccionados.length > 0) {
        const productosNombres = this.filtrosVentasProducto.productosSeleccionados.map(id => {
          const producto = this.productos.find(p => p.idProducto === id);
          return producto ? producto.productoMaestro.nombre : id;
        }).slice(0, 3).join(', ');
        const textoProductos = this.filtrosVentasProducto.productosSeleccionados.length > 3
          ? `${productosNombres} y ${this.filtrosVentasProducto.productosSeleccionados.length - 3} más`
          : productosNombres;
        pdf.text(`• Productos: ${textoProductos}`, margin + 5, currentY);
        currentY += 4;
      } else {
        pdf.text('• Productos: Todos', margin + 5, currentY);
        currentY += 4;
      }

      // Roles
      if (this.filtrosVentasProducto.rolesSeleccionados.length > 0) {
        const rolesNombres = this.filtrosVentasProducto.rolesSeleccionados.map(id => {
          const rol = this.roles.find(r => r.idRol === id);
          return rol ? rol.nombre : id;
        }).join(', ');
        pdf.text(`• Roles: ${rolesNombres}`, margin + 5, currentY);
        currentY += 4;
      } else {
        pdf.text('• Roles: Todos', margin + 5, currentY);
        currentY += 4;
      }

      currentY += 10;

      // Capturar gráficos si existen datos
      if (this.datosVentasProducto && this.datosVentasProducto.length > 0) {
        // Gráfico de barras
        const graficoBarElement = this.ventasProductoBarChart?.nativeElement?.parentElement;
        if (graficoBarElement) {
          const canvasBar = await html2canvas(graficoBarElement, {
            scale: 1.5,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
          });

          const imgDataBar = canvasBar.toDataURL('image/png');
          const imgWidth = pageWidth;
          const imgHeight = (canvasBar.height * imgWidth) / canvasBar.width;

          // Verificar si cabe en la página actual
          if (currentY + imgHeight > 280) {
            pdf.addPage();
            currentY = 20;
          }

          pdf.addImage(imgDataBar, 'PNG', margin, currentY, imgWidth, imgHeight);
          currentY += imgHeight + 10;

          // Gráfico de pie en nueva página
          pdf.addPage();
          currentY = 20;

          const graficoPieElement = this.ventasProductoPieChart?.nativeElement?.parentElement;
          if (graficoPieElement) {
            const canvasPie = await html2canvas(graficoPieElement, {
              scale: 1.5,
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#ffffff'
            });

            const imgDataPie = canvasPie.toDataURL('image/png');
            const pieWidth = pageWidth;
            const pieHeight = (canvasPie.height * pieWidth) / canvasPie.width;

            pdf.addImage(imgDataPie, 'PNG', margin, currentY, pieWidth, pieHeight);
            currentY += pieHeight + 15;
          }
        }

        // Tabla de datos en nueva página
        pdf.addPage();
        currentY = 20;

        pdf.setFontSize(14);
        pdf.text('Detalle por Producto', margin, currentY);
        currentY += 10;

        // Encabezados de tabla
        pdf.setFontSize(8);
        const headers = ['Producto', 'Presentación', 'Unidades', 'Ingresos (S/)', '% Participación'];
        const colWidths = [50, 40, 25, 35, 30];
        let xPos = margin;

        // Dibujar encabezados
        headers.forEach((header, index) => {
          pdf.rect(xPos, currentY, colWidths[index], 8);
          pdf.text(header, xPos + 2, currentY + 5);
          xPos += colWidths[index];
        });
        currentY += 8;

        // Dibujar filas de datos
        this.datosVentasProducto.forEach((item, index) => {
          if (currentY > 280) {
            pdf.addPage();
            currentY = 20;

            // Redibujar encabezados en nueva página
            xPos = margin;
            headers.forEach((header, headerIndex) => {
              pdf.rect(xPos, currentY, colWidths[headerIndex], 8);
              pdf.text(header, xPos + 2, currentY + 5);
              xPos += colWidths[headerIndex];
            });
            currentY += 8;
          }

          xPos = margin;
          const rowData = [
            item.producto.length > 25 ? item.producto.substring(0, 25) + '...' : item.producto,
            item.presentacion,
            item.unidades.toString(),
            `S/ ${item.ingresos.toFixed(2)}`,
            `${item.participacion.toFixed(1)}%`
          ];

          rowData.forEach((data, dataIndex) => {
            pdf.rect(xPos, currentY, colWidths[dataIndex], 6);
            pdf.text(data, xPos + 2, currentY + 4);
            xPos += colWidths[dataIndex];
          });
          currentY += 6;
        });
      } else {
        // Si no hay datos
        pdf.setFontSize(12);
        pdf.text('No hay datos disponibles para mostrar.', margin, currentY);
        pdf.text('Aplique filtros para generar el reporte.', margin, currentY + 10);
      }

      pdf.save(fileName);

      Swal.close();
      Swal.fire({
        icon: 'success',
        title: 'PDF generado',
        text: 'El archivo se ha descargado correctamente',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('Error al generar PDF:', error);
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al generar el PDF',
        confirmButtonText: 'Aceptar'
      });
    }
  }

  private async exportarGraficosYTablaClientePDF(titulo: string, fileName: string): Promise<void> {
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
      pdf.text(titulo, margin, currentY);
      currentY += 15;

      // Fecha del reporte
      pdf.setFontSize(10);
      const fechaReporte = this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm');
      pdf.text(`Generado el: ${fechaReporte}`, margin, currentY);
      currentY += 10;

      // Filtros aplicados
      pdf.setFontSize(9);
      pdf.text('Filtros aplicados:', margin, currentY);
      currentY += 5;

      // Rango de fechas
      const fechaInicio = this.datePipe.transform(this.filtrosVentasCliente.fechaInicio, 'dd/MM/yyyy');
      const fechaFin = this.datePipe.transform(this.filtrosVentasCliente.fechaFin, 'dd/MM/yyyy');
      pdf.text(`• Período: ${fechaInicio} - ${fechaFin}`, margin + 5, currentY);
      currentY += 4;

      // Canales de venta
      if (this.filtrosVentasCliente.canalesSeleccionados.length > 0) {
        const canalesNombres = this.filtrosVentasCliente.canalesSeleccionados.map(id => {
          const canal = this.canalesVenta.find(c => c.idCanalVenta === id);
          return canal ? canal.nombre : id;
        }).join(', ');
        pdf.text(`• Canales: ${canalesNombres}`, margin + 5, currentY);
        currentY += 4;
      } else {
        pdf.text('• Canales: Todos', margin + 5, currentY);
        currentY += 4;
      }

      // Tipos de pago
      if (this.filtrosVentasCliente.tiposPagoSeleccionados.length > 0) {
        const tiposPagoNombres = this.filtrosVentasCliente.tiposPagoSeleccionados.map(id => {
          const tipoPago = this.tiposPago.find(t => t.idTipoPago === id);
          return tipoPago ? tipoPago.nombre : id;
        }).join(', ');
        pdf.text(`• Métodos de pago: ${tiposPagoNombres}`, margin + 5, currentY);
        currentY += 4;
      } else {
        pdf.text('• Métodos de pago: Todos', margin + 5, currentY);
        currentY += 4;
      }

      // Roles
      if (this.filtrosVentasCliente.rolesSeleccionados.length > 0) {
        const rolesNombres = this.filtrosVentasCliente.rolesSeleccionados.map(id => {
          const rol = this.roles.find(r => r.idRol === id);
          return rol ? rol.nombre : id;
        }).join(', ');
        pdf.text(`• Roles: ${rolesNombres}`, margin + 5, currentY);
        currentY += 4;
      } else {
        pdf.text('• Roles: Todos', margin + 5, currentY);
        currentY += 4;
      }

      // Clientes específicos
      if (this.filtrosVentasCliente.clientesSeleccionados.length > 0) {
        const clientesNombres = this.filtrosVentasCliente.clientesSeleccionados.map(id => {
          const cliente = this.clientes.find(c => c.idCliente === id);
          return cliente ? cliente.nombre : id;
        }).slice(0, 3).join(', ');
        const textoClientes = this.filtrosVentasCliente.clientesSeleccionados.length > 3
          ? `${clientesNombres} y ${this.filtrosVentasCliente.clientesSeleccionados.length - 3} más`
          : clientesNombres;
        pdf.text(`• Clientes: ${textoClientes}`, margin + 5, currentY);
        currentY += 4;
      } else {
        pdf.text('• Clientes: Todos', margin + 5, currentY);
        currentY += 4;
      }

      currentY += 10;

      // Capturar gráficos si existen datos
      if (this.datosVentasCliente && this.datosVentasCliente.length > 0) {
        // Gráfico de barras
        const graficoBarElement = this.ventasClienteBarChart?.nativeElement?.parentElement;
        if (graficoBarElement) {
          const canvasBar = await html2canvas(graficoBarElement, {
            scale: 1.5,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
          });

          const imgDataBar = canvasBar.toDataURL('image/png');
          const imgWidth = pageWidth;
          const imgHeight = (canvasBar.height * imgWidth) / canvasBar.width;

          if (currentY + imgHeight > 280) {
            pdf.addPage();
            currentY = 20;
          }

          pdf.addImage(imgDataBar, 'PNG', margin, currentY, imgWidth, imgHeight);
          currentY += imgHeight + 10;
        }

        // Gráfico de línea - Ingresos por Día
        const graficoLineElement = this.ventasClienteLineChart?.nativeElement?.parentElement;
        if (graficoLineElement) {
          const canvasLine = await html2canvas(graficoLineElement, {
            scale: 1.5,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
          });

          const imgDataLine = canvasLine.toDataURL('image/png');
          const lineWidth = pageWidth;
          const lineHeight = (canvasLine.height * lineWidth) / canvasLine.width;

          // Verificar si cabe en la página actual
          if (currentY + lineHeight > 280) {
            pdf.addPage();
            currentY = 20;
          }

          pdf.addImage(imgDataLine, 'PNG', margin, currentY, lineWidth, lineHeight);
          currentY += lineHeight + 15;
        }

        // Tabla de datos en nueva página
        pdf.addPage();
        currentY = 20;

        pdf.setFontSize(14);
        pdf.text('Detalle por Cliente', margin, currentY);
        currentY += 10;

        // Encabezados de tabla
        pdf.setFontSize(8);
        const headers = ['Cliente', 'Documento', 'Tipo', '# Pedidos', 'Unidades', 'Ingresos (S/)', 'Última Compra'];

        // Calcular anchos para usar todo el ancho disponible (pageWidth - márgenes = 170mm)
        const anchoDisponible = pageWidth - (margin * 2); // 170mm disponibles
        const colWidths = [
          60,  // Cliente - más ancho para nombres largos
          25,  // Documento
          20,  // Tipo
          18,  // # Pedidos
          18,  // Unidades
          25,  // Ingresos (S/)
          24   // Última Compra
        ]; // Total: 170mm

        let xPos = margin;

        // Dibujar encabezados
        headers.forEach((header, index) => {
          pdf.rect(xPos, currentY, colWidths[index], 8);
          pdf.text(header, xPos + 2, currentY + 5);
          xPos += colWidths[index];
        });
        currentY += 8;

        // Dibujar filas de datos
        this.datosVentasCliente.forEach((item) => {
          if (currentY > 280) {
            pdf.addPage();
            currentY = 20;

            // Redibujar encabezados en nueva página
            xPos = margin;
            headers.forEach((header, headerIndex) => {
              pdf.rect(xPos, currentY, colWidths[headerIndex], 8);
              pdf.text(header, xPos + 2, currentY + 5);
              xPos += colWidths[headerIndex];
            });
            currentY += 8;
          }

          xPos = margin;
          const rowData = [
            item.cliente.length > 35 ? item.cliente.substring(0, 35) + '...' : item.cliente,
            item.documento,
            item.tipo,
            item.pedidos.toString(),
            item.unidades.toString(),
            `S/ ${item.ingresos.toFixed(2)}`,
            this.datePipe.transform(item.ultimaCompra, 'dd/MM/yyyy') || ''
          ];

          rowData.forEach((data, dataIndex) => {
            pdf.rect(xPos, currentY, colWidths[dataIndex], 6);
            pdf.text(data, xPos + 2, currentY + 4);
            xPos += colWidths[dataIndex];
          });
          currentY += 6;
        });
      } else {
        pdf.setFontSize(12);
        pdf.text('No hay datos disponibles para mostrar.', margin, currentY);
        pdf.text('Aplique filtros para generar el reporte.', margin, currentY + 10);
      }

      pdf.save(fileName);

      Swal.close();
      Swal.fire({
        icon: 'success',
        title: 'PDF generado',
        text: 'El archivo se ha descargado correctamente',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('Error al generar PDF:', error);
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al generar el PDF',
        confirmButtonText: 'Aceptar'
      });
    }
  }

  private async exportarGraficosYTablaCanalPDF(titulo: string, fileName: string): Promise<void> {
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
      pdf.text(titulo, margin, currentY);
      currentY += 15;

      // Fecha del reporte
      pdf.setFontSize(10);
      const fechaReporte = this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm');
      pdf.text(`Generado el: ${fechaReporte}`, margin, currentY);
      currentY += 20;

      // Capturar gráficos si existen datos
      if (this.datosVentasCanal && this.datosVentasCanal.length > 0) {
        // Gráfico de columnas apiladas
        const graficoStackedElement = this.ventasCanalStackedChart?.nativeElement?.parentElement;
        if (graficoStackedElement) {
          const canvasStacked = await html2canvas(graficoStackedElement, {
            scale: 1.5,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
          });

          const imgDataStacked = canvasStacked.toDataURL('image/png');
          const imgWidth = pageWidth;
          const imgHeight = (canvasStacked.height * imgWidth) / canvasStacked.width;

          if (currentY + imgHeight > 280) {
            pdf.addPage();
            currentY = 20;
          }

          pdf.addImage(imgDataStacked, 'PNG', margin, currentY, imgWidth, imgHeight);
          currentY += imgHeight + 10;

          // Gráfico de pie en nueva página
          pdf.addPage();
          currentY = 20;

          const graficoPieElement = this.ventasCanalPieChart?.nativeElement?.parentElement;
          if (graficoPieElement) {
            const canvasPie = await html2canvas(graficoPieElement, {
              scale: 1.5,
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#ffffff'
            });

            const imgDataPie = canvasPie.toDataURL('image/png');
            const pieWidth = pageWidth;
            const pieHeight = (canvasPie.height * pieWidth) / canvasPie.width;

            pdf.addImage(imgDataPie, 'PNG', margin, currentY, pieWidth, pieHeight);
            currentY += pieHeight + 15;
          }
        }

        // Tabla de datos en nueva página
        pdf.addPage();
        currentY = 20;

        pdf.setFontSize(14);
        pdf.text('Detalle por Canal', margin, currentY);
        currentY += 10;

        // Encabezados de tabla
        pdf.setFontSize(8);
        const headers = ['Canal', '# Pedidos', 'Ingresos (S/)', '% Participación', 'Ticket Promedio'];
        const colWidths = [40, 30, 40, 40, 40];
        let xPos = margin;

        // Dibujar encabezados
        headers.forEach((header, index) => {
          pdf.rect(xPos, currentY, colWidths[index], 8);
          pdf.text(header, xPos + 2, currentY + 5);
          xPos += colWidths[index];
        });
        currentY += 8;

        // Dibujar filas de datos
        this.datosVentasCanal.forEach((item) => {
          if (currentY > 280) {
            pdf.addPage();
            currentY = 20;

            // Redibujar encabezados en nueva página
            xPos = margin;
            headers.forEach((header, headerIndex) => {
              pdf.rect(xPos, currentY, colWidths[headerIndex], 8);
              pdf.text(header, xPos + 2, currentY + 5);
              xPos += colWidths[headerIndex];
            });
            currentY += 8;
          }

          xPos = margin;
          const rowData = [
            item.canal,
            item.pedidos.toString(),
            `S/ ${item.ingresos.toFixed(2)}`,
            `${item.participacion.toFixed(1)}%`,
            `S/ ${item.ticketPromedio.toFixed(2)}`
          ];

          rowData.forEach((data, dataIndex) => {
            pdf.rect(xPos, currentY, colWidths[dataIndex], 6);
            pdf.text(data, xPos + 2, currentY + 4);
            xPos += colWidths[dataIndex];
          });
          currentY += 6;
        });
      } else {
        pdf.setFontSize(12);
        pdf.text('No hay datos disponibles para mostrar.', margin, currentY);
        pdf.text('Aplique filtros para generar el reporte.', margin, currentY + 10);
      }

      pdf.save(fileName);

      Swal.close();
      Swal.fire({
        icon: 'success',
        title: 'PDF generado',
        text: 'El archivo se ha descargado correctamente',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('Error al generar PDF:', error);
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al generar el PDF',
        confirmButtonText: 'Aceptar'
      });
    }
  }

  private async exportarGraficosYTablaTopNPDF(titulo: string, fileName: string): Promise<void> {
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
      pdf.text(titulo, margin, currentY);
      currentY += 15;

      // Fecha del reporte
      pdf.setFontSize(10);
      const fechaReporte = this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm');
      pdf.text(`Generado el: ${fechaReporte}`, margin, currentY);
      currentY += 20;

      // Capturar gráfico si existen datos
      if (this.datosTopN && this.datosTopN.length > 0) {
        // Gráfico Top N
        const graficoElement = this.topNChart?.nativeElement?.parentElement;
        if (graficoElement) {
          const canvas = await html2canvas(graficoElement, {
            scale: 1.5,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
          });

          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          if (currentY + imgHeight > 280) {
            pdf.addPage();
            currentY = 20;
          }

          pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
          currentY += imgHeight + 15;
        }

        // Tabla de datos
        if (currentY > 200) {
          pdf.addPage();
          currentY = 20;
        }

        pdf.setFontSize(14);
        pdf.text(titulo, margin, currentY);
        currentY += 10;

        // Encabezados de tabla
        pdf.setFontSize(8);
        const headers = ['#', 'Nombre', 'Ingresos (S/)', '% Participación'];
        const colWidths = [15, 80, 50, 45];
        let xPos = margin;

        // Dibujar encabezados
        headers.forEach((header, index) => {
          pdf.rect(xPos, currentY, colWidths[index], 8);
          pdf.text(header, xPos + 2, currentY + 5);
          xPos += colWidths[index];
        });
        currentY += 8;

        // Dibujar filas de datos (limitado al topN seleccionado)
        const datosLimitados = this.datosTopN.slice(0, this.filtrosTopN.topN);
        datosLimitados.forEach((item, index) => {
          if (currentY > 280) {
            pdf.addPage();
            currentY = 20;

            // Redibujar encabezados en nueva página
            xPos = margin;
            headers.forEach((header, headerIndex) => {
              pdf.rect(xPos, currentY, colWidths[headerIndex], 8);
              pdf.text(header, xPos + 2, currentY + 5);
              xPos += colWidths[headerIndex];
            });
            currentY += 8;
          }

          xPos = margin;
          const rowData = [
            (index + 1).toString(),
            item.nombre,
            `S/ ${item.ingresos.toFixed(2)}`,
            `${item.participacion.toFixed(1)}%`
          ];

          rowData.forEach((data, dataIndex) => {
            pdf.rect(xPos, currentY, colWidths[dataIndex], 6);
            pdf.text(data, xPos + 2, currentY + 4);
            xPos += colWidths[dataIndex];
          });
          currentY += 6;
        });
      } else {
        pdf.setFontSize(12);
        pdf.text('No hay datos disponibles para mostrar.', margin, currentY);
        pdf.text('Aplique filtros para generar el reporte.', margin, currentY + 10);
      }

      pdf.save(fileName);

      Swal.close();
      Swal.fire({
        icon: 'success',
        title: 'PDF generado',
        text: 'El archivo se ha descargado correctamente',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('Error al generar PDF:', error);
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al generar el PDF',
        confirmButtonText: 'Aceptar'
      });
    }
  }

  ngOnDestroy(): void {
    // Destruir todos los gráficos
    if (this.barChart) this.barChart.destroy();
    if (this.pieChart) this.pieChart.destroy();
    if (this.clienteBarChart) this.clienteBarChart.destroy();
    if (this.clienteLineChart) this.clienteLineChart.destroy();
    if (this.tipoClienteBarChart) this.tipoClienteBarChart.destroy();
    if (this.tipoClienteLineChart) this.tipoClienteLineChart.destroy();
    if (this.canalStackedChart) this.canalStackedChart.destroy();
    if (this.canalPieChart) this.canalPieChart.destroy();
    if (this.topChart) this.topChart.destroy();
  }
}
