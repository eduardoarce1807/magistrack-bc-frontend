import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MultiSelectModule } from 'primeng/multiselect';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';

import { Chart } from 'chart.js/auto';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Swal from 'sweetalert2';

import { ClienteService } from '../../../services/cliente.service';
import { CanalVentaService } from '../../../services/canal-venta.service';
import { TipoPagoService } from '../../../services/tipo-pago.service';
import { RolService } from '../../../services/rol.service';
import { ExcelService } from '../../../services/excel.service';
import { ReportesGraficosService, FiltrosVentasRol } from '../../../services/reportes-graficos.service';

@Component({
  selector: 'app-reporte-ventas-roles',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    CardModule,
    MultiSelectModule,
    CalendarModule,
    DropdownModule,
    InputTextModule,
    DividerModule,
    TooltipModule
  ],
  templateUrl: './reporte-ventas-roles.component.html',
  styleUrl: './reporte-ventas-roles.component.scss',
  providers: [ExcelService, DatePipe]
})
export class ReporteVentasRolesComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('ventasRolBarChart') ventasRolBarChart!: ElementRef;
  @ViewChild('ventasRolLineChart') ventasRolLineChart!: ElementRef;

  // Variables para gráficos
  barChart: Chart | undefined;
  lineChart: Chart | undefined;

  // Filtros específicos
  filtrosVentasRol = {
    fechaInicio: new Date(),
    fechaFin: new Date(),
    rangoFechas: '',
    canalesSeleccionados: [],
    tiposPagoSeleccionados: [],
    rolesSeleccionados: [],
    clientesSeleccionados: []
  };

  // Opciones para filtros
  rangosFecha = [
    { label: 'Hoy', value: 'hoy' },
    { label: 'Últimos 7 días', value: 'ultimos7' },
    { label: 'Últimos 30 días', value: 'ultimos30' },
    { label: 'Personalizado', value: 'personalizado' }
  ];

  // Datos para filtros
  canalesVenta: any[] = [];
  tiposPago: any[] = [];
  clientes: any[] = [];
  roles: any[] = [];

  // Datos para tabla
  datosVentasRol: any[] = [];

  // Datos para gráficos específicos
  datosGraficosRol: any = null;

  // KPIs
  kpisVentasRol = {
    total: 0,
    pedidos: 0,
    ticketPromedio: 0,
    recompra: 0
  };

  constructor(
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
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.crearGraficos();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.barChart) {
      this.barChart.destroy();
    }
    if (this.lineChart) {
      this.lineChart.destroy();
    }
  }

  initializeFechas(): void {
    const hoy = new Date();
    this.filtrosVentasRol.fechaFin = new Date(hoy);
    this.filtrosVentasRol.fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  }

  cargarDatosIniciales(): void {
    console.log('Iniciando carga de datos de filtros...');
    
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

  crearGraficos(): void {
    if (this.datosVentasRol && this.datosVentasRol.length > 0) {
      this.crearGraficoVentasRol();
    }
  }

  crearGraficoVentasRol(): void {
    console.log('Creando gráficos de ventas por tipo cliente...');
    console.log('Datos disponibles:', this.datosVentasRol);
    
    // Destruir gráficos existentes
    if (this.barChart) {
      this.barChart.destroy();
      this.barChart = undefined;
    }
    if (this.lineChart) {
      this.lineChart.destroy();
      this.lineChart = undefined;
    }

    // Verificar que hay datos
    if (!this.datosVentasRol || this.datosVentasRol.length === 0) {
      console.log('No hay datos para crear gráficos');
      return;
    }

    // Verificar que los ViewChild están disponibles
    if (!this.ventasRolBarChart || !this.ventasRolLineChart) {
      console.log('ViewChild no están disponibles aún');
      return;
    }

    try {
      // Gráfico de barras - Ingresos por rol
      const ctxBar = this.ventasRolBarChart.nativeElement.getContext('2d');
      
      console.log('Creando gráfico de barras con datos:', this.datosVentasRol);
      
      // Usar datos del barChart que vienen del API
      let barChartLabels = [];
      let barChartData = [];
      
      if (this.datosGraficosRol && this.datosGraficosRol.barChart) {
        barChartLabels = this.datosGraficosRol.barChart.labels;
        barChartData = this.datosGraficosRol.barChart.data;
      } else {
        // Fallback usando datos de la tabla
        barChartLabels = this.datosVentasRol.map(r => r.nombre);
        barChartData = this.datosVentasRol.map(r => r.ingresos);
      }
      
      this.barChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
          labels: barChartLabels,
          datasets: [{
            label: 'Ingresos (S/)',
            data: barChartData,
            backgroundColor: 'rgba(255, 159, 64, 0.8)',
            borderColor: 'rgba(255, 159, 64, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Ingresos por Tipo Cliente'
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

      // Gráfico de línea - Tendencia de ventas por rol
      const ctxLine = this.ventasRolLineChart.nativeElement.getContext('2d');
      
      // Usar datos del lineChart que vienen del API
      let lineChartLabels = [];
      let lineChartDatasets = [];
      
      if (this.datosGraficosRol && this.datosGraficosRol.lineChart) {
        lineChartLabels = this.datosGraficosRol.lineChart.labels;
        lineChartDatasets = this.datosGraficosRol.lineChart.datasets.map((dataset: any, index: number) => ({
          label: dataset.label,
          data: dataset.data,
          borderColor: this.getLineColor(index),
          backgroundColor: this.getLineColor(index, 0.2),
          borderWidth: 2,
          fill: false
        }));
      } else {
        // Fallback con datos vacíos
        const fechaInicioFiltro = new Date(this.filtrosVentasRol.fechaInicio);
        const fechaFinFiltro = new Date(this.filtrosVentasRol.fechaFin);
        const semanas = Math.min(4, Math.ceil((fechaFinFiltro.getTime() - fechaInicioFiltro.getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1);
        
        for (let i = 0; i < semanas; i++) {
          lineChartLabels.push(`Sem ${i + 1}`);
        }
        
        lineChartDatasets = this.datosVentasRol.map((rol: any, index: number) => ({
          label: rol.nombre,
          data: new Array(semanas).fill(0),
          borderColor: this.getLineColor(index),
          backgroundColor: this.getLineColor(index, 0.2),
          borderWidth: 2,
          fill: false
        }));
      }
      
      console.log('Creando gráfico de línea con datos del API:', { lineChartLabels, lineChartDatasets });
      
      this.lineChart = new Chart(ctxLine, {
        type: 'line',
        data: {
          labels: lineChartLabels,
          datasets: lineChartDatasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Tendencia de Ventas por Tipo Cliente'
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

      console.log('Gráficos de tipos cliente creados exitosamente');
      
    } catch (error) {
      console.error('Error al crear gráficos:', error);
    }
  }

  // Método auxiliar para obtener colores para las líneas
  getLineColor(index: number, alpha: number = 1): string {
    const colors = [
      `rgba(255, 99, 132, ${alpha})`,   // Rojo
      `rgba(54, 162, 235, ${alpha})`,   // Azul
      `rgba(255, 206, 86, ${alpha})`,   // Amarillo
      `rgba(75, 192, 192, ${alpha})`,   // Verde
      `rgba(153, 102, 255, ${alpha})`,  // Violeta
      `rgba(255, 159, 64, ${alpha})`,   // Naranja
      `rgba(199, 199, 199, ${alpha})`,  // Gris
      `rgba(83, 102, 255, ${alpha})`    // Azul claro
    ];
    return colors[index % colors.length];
  }

  // Método para manejar cambios de rango de fechas
  onRangoFechaChange(): void {
    const hoy = new Date();
    
    switch (this.filtrosVentasRol.rangoFechas) {
      case 'hoy':
        this.filtrosVentasRol.fechaInicio = new Date(hoy);
        this.filtrosVentasRol.fechaFin = new Date(hoy);
        break;
      case 'ultimos7':
        this.filtrosVentasRol.fechaInicio = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
        this.filtrosVentasRol.fechaFin = new Date(hoy);
        break;
      case 'ultimos30':
        this.filtrosVentasRol.fechaInicio = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
        this.filtrosVentasRol.fechaFin = new Date(hoy);
        break;
    }
  }

  // Método para aplicar filtros
  aplicarFiltros(): void {
    Swal.fire({
      title: 'Aplicando filtros...',
      text: 'Generando reporte de ventas por tipo cliente',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Preparar filtros para la API
    const filtros: FiltrosVentasRol = {
      fechaInicio: this.datePipe.transform(this.filtrosVentasRol.fechaInicio, 'yyyy-MM-dd') || '',
      fechaFin: this.datePipe.transform(this.filtrosVentasRol.fechaFin, 'yyyy-MM-dd') || '',
      canalesSeleccionados: this.filtrosVentasRol.canalesSeleccionados,
      tiposPagoSeleccionados: this.filtrosVentasRol.tiposPagoSeleccionados,
      rolesSeleccionados: this.filtrosVentasRol.rolesSeleccionados,
      clientesSeleccionados: this.filtrosVentasRol.clientesSeleccionados
    };

    this.reportesGraficosService.getVentasPorRol(filtros).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Actualizar datos
          this.datosVentasRol = response.data.roles || [];
          this.kpisVentasRol = response.data.kpis || {};
          this.datosGraficosRol = response.data.graficos || null;

          console.log('Datos de gráficos del rol recibidos:', this.datosGraficosRol);

          // Actualizar gráficos con un pequeño delay para asegurar que el DOM esté listo
          setTimeout(() => {
            try {
              this.crearGraficoVentasRol();
              // Forzar detección de cambios
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('resize'));
              }
            } catch (error) {
              console.error('Error al crear gráficos de roles después de aplicar filtros:', error);
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
        console.error('Error al obtener datos de ventas por tipo cliente:', error);
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

  // Métodos de exportación
  private generarTextoFiltros(): string {
    const filtros = [];
    
    // Fechas
    const fechaInicio = this.datePipe.transform(this.filtrosVentasRol.fechaInicio, 'dd/MM/yyyy');
    const fechaFin = this.datePipe.transform(this.filtrosVentasRol.fechaFin, 'dd/MM/yyyy');
    filtros.push(`Período: ${fechaInicio} - ${fechaFin}`);

    // Canales
    if (this.filtrosVentasRol.canalesSeleccionados.length > 0) {
      const canalesNombres = this.filtrosVentasRol.canalesSeleccionados.map(id => {
        const canal = this.canalesVenta.find(c => c.idCanalVenta === id);
        return canal ? canal.nombre : id;
      }).join(', ');
      filtros.push(`Canales: ${canalesNombres}`);
    } else {
      filtros.push('Canales: Todos');
    }

    // Tipos de pago
    if (this.filtrosVentasRol.tiposPagoSeleccionados.length > 0) {
      const tiposPagoNombres = this.filtrosVentasRol.tiposPagoSeleccionados.map(id => {
        const tipoPago = this.tiposPago.find(t => t.idTipoPago === id);
        return tipoPago ? tipoPago.nombre : id;
      }).join(', ');
      filtros.push(`Métodos de pago: ${tiposPagoNombres}`);
    } else {
      filtros.push('Métodos de pago: Todos');
    }

    // Roles específicos
    if (this.filtrosVentasRol.rolesSeleccionados.length > 0) {
      const rolesNombres = this.filtrosVentasRol.rolesSeleccionados.map(id => {
        const rol = this.roles.find(r => r.idRol === id);
        return rol ? rol.nombre : id;
      }).join(', ');
      filtros.push(`Roles: ${rolesNombres}`);
    } else {
      filtros.push('Tipos Cliente: Todos');
    }

    // Clientes específicos
    if (this.filtrosVentasRol.clientesSeleccionados.length > 0) {
      const clientesNombres = this.filtrosVentasRol.clientesSeleccionados.map(id => {
        const cliente = this.clientes.find(c => c.idCliente === id);
        return cliente ? cliente.nombre : id;
      }).slice(0, 3).join(', ');
      const textoClientes = this.filtrosVentasRol.clientesSeleccionados.length > 3 
        ? `${clientesNombres} y ${this.filtrosVentasRol.clientesSeleccionados.length - 3} más`
        : clientesNombres;
      filtros.push(`Clientes: ${textoClientes}`);
    } else {
      filtros.push('Clientes: Todos');
    }

    return filtros.join(' | ');
  }

  exportarExcel(): void {
    const datosExport = this.datosVentasRol.map(item => ({
      'Tipo Cliente': item.nombre,
      '# Pedidos': item.pedidos,
      'Unidades': item.unidades,
      'Ingresos (S/)': item.ingresos,
      '% Participación': item.participacion,
      'Clientes Únicos': item.clientesUnicos
    }));

    // Generar texto de filtros aplicados
    const filtrosTexto = this.generarTextoFiltros();
    
    // Fecha de generación
    const fechaGeneracion = this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm');

    // Usando el método disponible del ExcelService
    const cabecera = ['Tipo Cliente', '# Pedidos', 'Unidades', 'Ingresos (S/)', '% Participación', 'Clientes Únicos'];
    const campos = ['Rol', '# Pedidos', 'Unidades', 'Ingresos (S/)', '% Participación', 'Clientes Únicos'];
    const ancho = [25, 15, 15, 20, 20, 20];

    // Subcabecera con información de filtros
    const subcabecera = [
      `Generado el: ${fechaGeneracion}`,
      `Filtros aplicados: ${filtrosTexto}`
    ];

    // Agregar columna inicial vacía
    subcabecera.unshift("");
    cabecera.unshift("");
    campos.unshift("");
    
    this.excelService.downloadExcel(
      datosExport,
      cabecera,
      campos,
      'Reporte de Ventas por Rol',
      ancho,
      subcabecera,
      'ventas-por-rol',
      []
    );
  }

  async exportarPDF(): Promise<void> {
    await this.exportarGraficosYTablaPDF('Ventas por Rol', 'reporte-ventas-rol.pdf');
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
      const fechaInicio = this.datePipe.transform(this.filtrosVentasRol.fechaInicio, 'dd/MM/yyyy');
      const fechaFin = this.datePipe.transform(this.filtrosVentasRol.fechaFin, 'dd/MM/yyyy');
      pdf.text(`• Período: ${fechaInicio} - ${fechaFin}`, margin + 5, currentY);
      currentY += 4;

      // Canales de venta
      if (this.filtrosVentasRol.canalesSeleccionados.length > 0) {
        const canalesNombres = this.filtrosVentasRol.canalesSeleccionados.map(id => {
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
      if (this.filtrosVentasRol.tiposPagoSeleccionados.length > 0) {
        const tiposPagoNombres = this.filtrosVentasRol.tiposPagoSeleccionados.map(id => {
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
      if (this.filtrosVentasRol.rolesSeleccionados.length > 0) {
        const rolesNombres = this.filtrosVentasRol.rolesSeleccionados.map(id => {
          const rol = this.roles.find(r => r.idRol === id);
          return rol ? rol.nombre : id;
        }).join(', ');
        pdf.text(`• Roles: ${rolesNombres}`, margin + 5, currentY);
        currentY += 4;
      } else {
        pdf.text('• Roles: Todos', margin + 5, currentY);
        currentY += 4;
      }

      // Clientes
      if (this.filtrosVentasRol.clientesSeleccionados.length > 0) {
        const clientesNombres = this.filtrosVentasRol.clientesSeleccionados.map(id => {
          const cliente = this.clientes.find(c => c.idCliente === id);
          return cliente ? cliente.nombre : id;
        }).slice(0, 3).join(', ');
        const textoClientes = this.filtrosVentasRol.clientesSeleccionados.length > 3 
          ? `${clientesNombres} y ${this.filtrosVentasRol.clientesSeleccionados.length - 3} más`
          : clientesNombres;
        pdf.text(`• Clientes: ${textoClientes}`, margin + 5, currentY);
        currentY += 4;
      } else {
        pdf.text('• Clientes: Todos', margin + 5, currentY);
        currentY += 4;
      }

      currentY += 10;

      // Capturar gráficos si existen datos
      if (this.datosVentasRol && this.datosVentasRol.length > 0) {
        // Gráfico de barras
        const graficoBarElement = this.ventasRolBarChart?.nativeElement?.parentElement;
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

          // Gráfico de línea en nueva página
          pdf.addPage();
          currentY = 20;

          const graficoLineElement = this.ventasRolLineChart?.nativeElement?.parentElement;
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

            pdf.addImage(imgDataLine, 'PNG', margin, currentY, lineWidth, lineHeight);
            currentY += lineHeight + 15;
          }
        }

        // Tabla de datos en nueva página
        pdf.addPage();
        currentY = 20;

        pdf.setFontSize(14);
        pdf.text('Detalle por Rol', margin, currentY);
        currentY += 10;

        // Encabezados de tabla
        pdf.setFontSize(8);
        const headers = ['Rol', '# Pedidos', 'Unidades', 'Ingresos (S/)', '% Part.', 'Clientes'];
        const colWidths = [35, 25, 25, 35, 30, 30];
        let xPos = margin;

        // Dibujar encabezados
        headers.forEach((header, index) => {
          pdf.rect(xPos, currentY, colWidths[index], 8);
          pdf.text(header, xPos + 2, currentY + 5);
          xPos += colWidths[index];
        });
        currentY += 8;

        // Dibujar filas de datos
        this.datosVentasRol.forEach((item, index) => {
          if (currentY > 280) {
            pdf.addPage();
            currentY = 20;
          }

          xPos = margin;
          const rowData = [
            item.nombre.length > 18 ? item.nombre.substring(0, 18) + '...' : item.nombre,
            item.pedidos.toString(),
            item.unidades.toString(),
            `S/ ${item.ingresos.toFixed(2)}`,
            `${item.participacion.toFixed(1)}%`,
            item.clientesUnicos.toString()
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
}
