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

import { TipoPagoService } from '../../../services/tipo-pago.service';
import { ExcelService } from '../../../services/excel.service';
import { ReportesGraficosService, FiltrosVentasCanal } from '../../../services/reportes-graficos.service';

@Component({
  selector: 'app-reporte-ventas-canales',
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
  templateUrl: './reporte-ventas-canales.component.html',
  styleUrl: './reporte-ventas-canales.component.scss',
  providers: [ExcelService, DatePipe]
})
export class ReporteVentasCanalesComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('ventasCanalesStackedChart') ventasCanalesStackedChart!: ElementRef;
  @ViewChild('ventasCanalesPieChart') ventasCanalesPieChart!: ElementRef;

  // Variables para gráficos
  stackedChart: Chart | undefined;
  pieChart: Chart | undefined;

  // Filtros
  filtrosVentasCanal = {
    fechaInicio: new Date(),
    fechaFin: new Date(),
    rangoFechas: '',
    tiposPagoSeleccionados: []
  };

  // Opciones para filtros
  rangosFecha = [
    { label: 'Hoy', value: 'hoy' },
    { label: 'Últimos 7 días', value: 'ultimos7' },
    { label: 'Últimos 30 días', value: 'ultimos30' },
    { label: 'Este mes', value: 'mes_actual' },
    { label: 'Mes anterior', value: 'mes_anterior' },
    { label: 'Personalizado', value: 'personalizado' }
  ];

  // Datos de filtros
  tiposPago: any[] = [];

  // Datos para tablas y gráficos
  datosVentasCanal: any[] = [];

  // Datos para gráficos específicos
  datosGraficosCanal: any = null;

  // KPIs
  kpisVentasCanal = {
    ingresosTotales: 0,
    pedidosTotales: 0,
    ticketPromedioGeneral: 0,
    porcentajePorCanal: {},
    ticketPromedioPorCanal: {}
  };

  constructor(
    private tipoPagoService: TipoPagoService,
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
    // Los gráficos se crearán cuando el usuario aplique filtros
  }

  ngOnDestroy(): void {
    if (this.stackedChart) {
      this.stackedChart.destroy();
    }
    if (this.pieChart) {
      this.pieChart.destroy();
    }
  }

  initializeFechas(): void {
    const hoy = new Date();
    this.filtrosVentasCanal.fechaFin = new Date(hoy);
    this.filtrosVentasCanal.fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  }

  cargarDatosIniciales(): void {
    console.log('Cargando datos iniciales...');

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
  }

  onRangoFechaChange(): void {
    const hoy = new Date();
    
    switch (this.filtrosVentasCanal.rangoFechas) {
      case 'hoy':
        this.filtrosVentasCanal.fechaInicio = new Date(hoy);
        this.filtrosVentasCanal.fechaFin = new Date(hoy);
        break;
      case 'ultimos7':
        this.filtrosVentasCanal.fechaInicio = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
        this.filtrosVentasCanal.fechaFin = new Date(hoy);
        break;
      case 'ultimos30':
        this.filtrosVentasCanal.fechaInicio = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
        this.filtrosVentasCanal.fechaFin = new Date(hoy);
        break;
      case 'mes_actual':
        this.filtrosVentasCanal.fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        this.filtrosVentasCanal.fechaFin = new Date(hoy);
        break;
      case 'mes_anterior':
        const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        this.filtrosVentasCanal.fechaInicio = mesAnterior;
        this.filtrosVentasCanal.fechaFin = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
        break;
    }
  }

  crearGraficos(): void {
    console.log('Creando gráficos de ventas por canal...');
    console.log('Datos disponibles:', this.datosVentasCanal);
    console.log('Datos gráficos:', this.datosGraficosCanal);
    
    // Destruir gráficos existentes
    if (this.stackedChart) {
      this.stackedChart.destroy();
      this.stackedChart = undefined;
    }
    if (this.pieChart) {
      this.pieChart.destroy();
      this.pieChart = undefined;
    }

    // Verificar que hay datos
    if (!this.datosVentasCanal || this.datosVentasCanal.length === 0) {
      console.log('No hay datos para crear gráficos');
      return;
    }

    // Verificar que los ViewChild están disponibles
    if (!this.ventasCanalesStackedChart || !this.ventasCanalesPieChart) {
      console.log('ViewChild no están disponibles aún');
      return;
    }

    try {
      this.crearGraficoStackedBar();
      this.crearGraficoPie();
      
      console.log('Gráficos de canales creados exitosamente');
      
    } catch (error) {
      console.error('Error al crear gráficos de canales:', error);
    }
  }

  crearGraficoStackedBar(): void {
    const ctxStacked = this.ventasCanalesStackedChart.nativeElement.getContext('2d');
    
    // Usar datos del API si están disponibles
    let labels = [];
    let datasets = [];
    
    if (this.datosGraficosCanal && this.datosGraficosCanal.stackedBarChart) {
      labels = this.datosGraficosCanal.stackedBarChart.labels;
      datasets = this.datosGraficosCanal.stackedBarChart.datasets.map((dataset: any, index: number) => ({
        label: dataset.label,
        data: dataset.data,
        backgroundColor: index === 0 ? 'rgba(54, 162, 235, 0.8)' : 'rgba(255, 99, 132, 0.8)',
        borderColor: index === 0 ? 'rgba(54, 162, 235, 1)' : 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }));
    } else {
      // Datos de fallback
      labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
      datasets = [
        {
          label: 'Web',
          data: [0, 0, 0, 0],
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Venta Rápida',
          data: [0, 0, 0, 0],
          backgroundColor: 'rgba(255, 99, 132, 0.8)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ];
    }
    
    this.stackedChart = new Chart(ctxStacked, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Ingresos por Canal de Venta'
          },
          legend: {
            position: 'top'
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
  }

  crearGraficoPie(): void {
    const ctxPie = this.ventasCanalesPieChart.nativeElement.getContext('2d');
    
    // Usar datos del API si están disponibles
    let labels = [];
    let data = [];
    
    if (this.datosGraficosCanal && this.datosGraficosCanal.pieChart) {
      labels = this.datosGraficosCanal.pieChart.labels;
      data = this.datosGraficosCanal.pieChart.data;
    } else {
      // Datos de fallback basados en la tabla
      labels = this.datosVentasCanal.map(c => c.canal);
      data = this.datosVentasCanal.map(c => c.ingresos);
    }
    
    this.pieChart = new Chart(ctxPie, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            'rgba(54, 162, 235, 0.8)', 
            'rgba(255, 99, 132, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)', 
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
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

  aplicarFiltros(): void {
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

    console.log('Enviando filtros al API:', filtros);

    this.reportesGraficosService.getVentasPorCanal(filtros).subscribe({
      next: (response: any) => {
        console.log('Respuesta del API:', response);
        if (response.success) {
          // Actualizar datos
          this.datosVentasCanal = response.data.canales || [];
          this.kpisVentasCanal = response.data.kpis || {};
          this.datosGraficosCanal = response.data.graficos || null;

          console.log('Datos de canales recibidos:', this.datosVentasCanal);
          console.log('KPIs recibidos:', this.kpisVentasCanal);
          console.log('Datos de gráficos del canal recibidos:', this.datosGraficosCanal);

          // Actualizar gráficos con un pequeño delay para asegurar que el DOM esté listo
          setTimeout(() => {
            try {
              this.crearGraficos();
              // Forzar detección de cambios
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('resize'));
              }
            } catch (error) {
              console.error('Error al crear gráficos de canales después de aplicar filtros:', error);
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

  // Métodos de exportación
  private generarTextoFiltros(): string {
    const filtros = [];
    
    // Fechas
    const fechaInicio = this.datePipe.transform(this.filtrosVentasCanal.fechaInicio, 'dd/MM/yyyy');
    const fechaFin = this.datePipe.transform(this.filtrosVentasCanal.fechaFin, 'dd/MM/yyyy');
    filtros.push(`Período: ${fechaInicio} - ${fechaFin}`);

    // Tipos de pago
    if (this.filtrosVentasCanal.tiposPagoSeleccionados.length > 0) {
      const tiposPagoNombres = this.filtrosVentasCanal.tiposPagoSeleccionados.map(id => {
        const tipoPago = this.tiposPago.find(t => t.idTipoPago === id);
        return tipoPago ? tipoPago.nombre : id;
      }).join(', ');
      filtros.push(`Métodos de pago: ${tiposPagoNombres}`);
    } else {
      filtros.push('Métodos de pago: Todos');
    }

    return filtros.join(' | ');
  }

  exportarExcel(): void {
    const datosExport = this.datosVentasCanal.map(item => ({
      'Canal': item.canal,
      '# Pedidos': item.pedidos,
      'Ingresos (S/)': item.ingresos,
      'Ticket Promedio (S/)': item.ticketPromedio
    }));

    // Generar texto de filtros aplicados
    const filtrosTexto = this.generarTextoFiltros();
    
    // Fecha de generación
    const fechaGeneracion = this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm');

    const cabecera = ['Canal', '# Pedidos', 'Ingresos (S/)', 'Ticket Promedio (S/)'];
    const campos = ['Canal', '# Pedidos', 'Ingresos (S/)', 'Ticket Promedio (S/)'];
    const ancho = [25, 15, 20, 25];

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
      'Reporte de Ventas por Canal',
      ancho,
      subcabecera,
      'ventas-por-canal',
      []
    );
  }

  exportarPDF(): Promise<void> {
    return new Promise((resolve) => {
      Swal.fire({
        title: 'Generando PDF...',
        text: 'Por favor espere mientras se genera el archivo',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      setTimeout(async () => {
        try {
          const pdf = new jsPDF('p', 'mm', 'a4');
          let currentY = 20;
          const pageWidth = 190;
          const margin = 10;

          // Título del reporte
          pdf.setFontSize(16);
          pdf.text('Reporte de Ventas por Canal', margin, currentY);
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

          const filtrosTexto = this.generarTextoFiltros();
          const filtrosLineas = pdf.splitTextToSize(filtrosTexto, pageWidth - 20);
          filtrosLineas.forEach((linea: string) => {
            pdf.text(`• ${linea}`, margin + 5, currentY);
            currentY += 4;
          });

          currentY += 10;

          // KPIs
          pdf.setFontSize(12);
          pdf.text('Indicadores Clave:', margin, currentY);
          currentY += 8;

          pdf.setFontSize(10);
          pdf.text(`• Ingresos Totales: S/ ${this.kpisVentasCanal.ingresosTotales.toFixed(2)}`, margin + 5, currentY);
          currentY += 5;
          pdf.text(`• Pedidos Totales: ${this.kpisVentasCanal.pedidosTotales}`, margin + 5, currentY);
          currentY += 5;
          pdf.text(`• Ticket Promedio General: S/ ${this.kpisVentasCanal.ticketPromedioGeneral.toFixed(2)}`, margin + 5, currentY);
          currentY += 10;

          // Capturar gráficos si existen datos
          if (this.datosVentasCanal && this.datosVentasCanal.length > 0) {
            // Gráfico de barras apiladas
            const graficoStackedElement = this.ventasCanalesStackedChart?.nativeElement?.parentElement;
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

              // Verificar si cabe en la página actual
              if (currentY + imgHeight > 280) {
                pdf.addPage();
                currentY = 20;
              }

              pdf.addImage(imgDataStacked, 'PNG', margin, currentY, imgWidth, imgHeight);
              currentY += imgHeight + 10;

              // Gráfico de pie en nueva página
              pdf.addPage();
              currentY = 20;

              const graficoPieElement = this.ventasCanalesPieChart?.nativeElement?.parentElement;
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
            const headers = ['Canal', '# Pedidos', 'Ingresos (S/)', 'Ticket Promedio'];
            const colWidths = [40, 30, 40, 40];
            let xPos = margin;

            // Dibujar encabezados
            headers.forEach((header, index) => {
              pdf.rect(xPos, currentY, colWidths[index], 8);
              pdf.text(header, xPos + 2, currentY + 5);
              xPos += colWidths[index];
            });
            currentY += 8;

            // Dibujar filas de datos
            this.datosVentasCanal.forEach((item, index) => {
              if (currentY > 280) {
                pdf.addPage();
                currentY = 20;
              }

              xPos = margin;
              const rowData = [
                item.canal,
                item.pedidos.toString(),
                `S/ ${item.ingresos.toFixed(2)}`,
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
            // Si no hay datos
            pdf.setFontSize(12);
            pdf.text('No hay datos disponibles para mostrar.', margin, currentY);
            pdf.text('Aplique filtros para generar el reporte.', margin, currentY + 10);
          }

          pdf.save('reporte-ventas-canales.pdf');

          Swal.close();
          Swal.fire({
            icon: 'success',
            title: 'PDF generado',
            text: 'El archivo se ha descargado correctamente',
            timer: 2000,
            showConfirmButton: false
          });

          resolve();

        } catch (error) {
          console.error('Error al generar PDF:', error);
          Swal.close();
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un error al generar el PDF',
            confirmButtonText: 'Aceptar'
          });
          resolve();
        }
      }, 100);
    });
  }
}
