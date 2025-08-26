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

import { CanalVentaService } from '../../../services/canal-venta.service';
import { TipoPagoService } from '../../../services/tipo-pago.service';
import { ExcelService } from '../../../services/excel.service';
import { ReportesGraficosService, FiltrosTopN } from '../../../services/reportes-graficos.service';

@Component({
  selector: 'app-reporte-top-n',
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
  templateUrl: './reporte-top-n.component.html',
  styleUrl: './reporte-top-n.component.scss',
  providers: [ExcelService, DatePipe]
})
export class ReporteTopNComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('topNChart') topNChart!: ElementRef;

  // Variables para gráficos
  topChart: Chart | undefined;

  // Filtros específicos
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
    { label: 'Este mes', value: 'mes_actual' },
    { label: 'Mes anterior', value: 'mes_anterior' },
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

  // Datos para filtros
  canalesVenta: any[] = [];
  tiposPago: any[] = [];

  // Datos para tabla y gráficos
  datosTopN: any[] = [];

  // Datos para gráficos específicos
  datosGraficosTopN: any = null;

  // KPIs
  kpisTopN = {
    porcentajeAcumulado: 0,
    totalGeneral: 0
  };

  constructor(
    private canalVentaService: CanalVentaService,
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
    if (this.topChart) {
      this.topChart.destroy();
    }
  }

  initializeFechas(): void {
    const hoy = new Date();
    this.filtrosTopN.fechaFin = new Date(hoy);
    this.filtrosTopN.fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  }

  cargarDatosIniciales(): void {
    console.log('Cargando datos iniciales...');

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
  }

  onRangoFechaChange(): void {
    const hoy = new Date();
    
    switch (this.filtrosTopN.rangoFechas) {
      case 'hoy':
        this.filtrosTopN.fechaInicio = new Date(hoy);
        this.filtrosTopN.fechaFin = new Date(hoy);
        break;
      case 'ultimos7':
        this.filtrosTopN.fechaInicio = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
        this.filtrosTopN.fechaFin = new Date(hoy);
        break;
      case 'ultimos30':
        this.filtrosTopN.fechaInicio = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
        this.filtrosTopN.fechaFin = new Date(hoy);
        break;
      case 'mes_actual':
        this.filtrosTopN.fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        this.filtrosTopN.fechaFin = new Date(hoy);
        break;
      case 'mes_anterior':
        const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        this.filtrosTopN.fechaInicio = mesAnterior;
        this.filtrosTopN.fechaFin = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
        break;
    }
  }

  onDimensionChange(): void {
    // Si ya hay datos cargados, volver a aplicar filtros automáticamente
    if (this.datosTopN && this.datosTopN.length > 0) {
      this.aplicarFiltros();
    }
  }

  crearGraficoTopN(): void {
    console.log('Creando gráfico Top N...');
    console.log('Datos disponibles:', this.datosTopN);
    console.log('Datos gráficos:', this.datosGraficosTopN);
    
    // Destruir gráfico existente
    if (this.topChart) {
      this.topChart.destroy();
      this.topChart = undefined;
    }

    // Verificar que hay datos
    if (!this.datosTopN || this.datosTopN.length === 0) {
      console.log('No hay datos para crear gráfico');
      return;
    }

    // Verificar que el ViewChild está disponible
    if (!this.topNChart) {
      console.log('ViewChild no está disponible aún');
      return;
    }

    try {
      const ctx = this.topNChart.nativeElement.getContext('2d');
      
      // Usar datos del API si están disponibles
      let labels = [];
      let data = [];
      
      if (this.datosGraficosTopN && this.datosGraficosTopN.barChart) {
        labels = this.datosGraficosTopN.barChart.labels;
        data = this.datosGraficosTopN.barChart.data;
      } else {
        // Datos de fallback basados en la tabla
        const datosLimitados = this.datosTopN.slice(0, this.filtrosTopN.topN);
        labels = datosLimitados.map(item => item.nombre);
        data = datosLimitados.map(item => item.ingresos);
      }
      
      this.topChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Ingresos (S/)',
            data: data,
            backgroundColor: 'rgba(75, 192, 192, 0.8)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
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
            },
            x: {
              ticks: {
                maxRotation: 45,
                minRotation: 0
              }
            }
          }
        }
      });

      console.log('Gráfico Top N creado exitosamente');
      
    } catch (error) {
      console.error('Error al crear gráfico Top N:', error);
    }
  }

  aplicarFiltros(): void {
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

    console.log('Enviando filtros al API:', filtros);

    this.reportesGraficosService.getTopN(filtros).subscribe({
      next: (response: any) => {
        console.log('Respuesta del API:', response);
        if (response.success) {
          // Actualizar datos
          this.datosTopN = response.data.items || [];
          this.kpisTopN = response.data.kpis || {};
          this.datosGraficosTopN = response.data.graficos || null;

          console.log('Datos de TopN recibidos:', this.datosTopN);
          console.log('KPIs recibidos:', this.kpisTopN);
          console.log('Datos de gráficos TopN recibidos:', this.datosGraficosTopN);

          // Actualizar gráficos con un pequeño delay para asegurar que el DOM esté listo
          setTimeout(() => {
            try {
              this.crearGraficoTopN();
              // Forzar detección de cambios
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('resize'));
              }
            } catch (error) {
              console.error('Error al crear gráfico TopN después de aplicar filtros:', error);
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

  // Métodos de exportación
  private generarTextoFiltros(): string {
    const filtros = [];
    
    // Fechas
    const fechaInicio = this.datePipe.transform(this.filtrosTopN.fechaInicio, 'dd/MM/yyyy');
    const fechaFin = this.datePipe.transform(this.filtrosTopN.fechaFin, 'dd/MM/yyyy');
    filtros.push(`Período: ${fechaInicio} - ${fechaFin}`);

    // Canales
    if (this.filtrosTopN.canalesSeleccionados.length > 0) {
      const canalesNombres = this.filtrosTopN.canalesSeleccionados.map(id => {
        const canal = this.canalesVenta.find(c => c.idCanalVenta === id);
        return canal ? canal.nombre : id;
      }).join(', ');
      filtros.push(`Canales: ${canalesNombres}`);
    } else {
      filtros.push('Canales: Todos');
    }

    // Tipos de pago
    if (this.filtrosTopN.tiposPagoSeleccionados.length > 0) {
      const tiposPagoNombres = this.filtrosTopN.tiposPagoSeleccionados.map(id => {
        const tipoPago = this.tiposPago.find(t => t.idTipoPago === id);
        return tipoPago ? tipoPago.nombre : id;
      }).join(', ');
      filtros.push(`Métodos de pago: ${tiposPagoNombres}`);
    } else {
      filtros.push('Métodos de pago: Todos');
    }

    // Dimensión y topN
    filtros.push(`Top: ${this.filtrosTopN.topN} ${this.filtrosTopN.dimension}`);

    return filtros.join(' | ');
  }

  exportarExcel(): void {
    const datosExport = this.datosTopN.slice(0, this.filtrosTopN.topN).map((item, index) => ({
      'Posición': index + 1,
      'ID': item.id,
      'Nombre': item.nombre,
      'Ingresos (S/)': item.ingresos,
      '% Participación': item.participacion,
      'Unidades': item.unidades || 0,
      'Pedidos': item.pedidos || 0
    }));

    // Generar texto de filtros aplicados
    const filtrosTexto = this.generarTextoFiltros();
    
    // Fecha de generación
    const fechaGeneracion = this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm');

    const cabecera = ['Posición', 'ID', 'Nombre', 'Ingresos (S/)', '% Participación', 'Unidades', 'Pedidos'];
    const campos = ['Posición', 'ID', 'Nombre', 'Ingresos (S/)', '% Participación', 'Unidades', 'Pedidos'];
    const ancho = [15, 20, 40, 20, 20, 15, 15];

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
      `Top ${this.filtrosTopN.topN} ${this.filtrosTopN.dimension}`,
      ancho,
      subcabecera,
      `top-${this.filtrosTopN.topN}-${this.filtrosTopN.dimension}`,
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
          pdf.text(`Top ${this.filtrosTopN.topN} ${this.filtrosTopN.dimension}`, margin, currentY);
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
          pdf.text(`• Porcentaje Acumulado: ${this.kpisTopN.porcentajeAcumulado.toFixed(1)}%`, margin + 5, currentY);
          currentY += 5;
          pdf.text(`• Total General: S/ ${this.kpisTopN.totalGeneral.toFixed(2)}`, margin + 5, currentY);
          currentY += 10;

          // Capturar gráfico si existen datos
          if (this.datosTopN && this.datosTopN.length > 0) {
            // Gráfico
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

              // Verificar si cabe en la página actual
              if (currentY + imgHeight > 280) {
                pdf.addPage();
                currentY = 20;
              }

              pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
              currentY += imgHeight + 15;
            }

            // Tabla de datos en nueva página si es necesario
            if (currentY > 200) {
              pdf.addPage();
              currentY = 20;
            }

            pdf.setFontSize(14);
            pdf.text(`Detalle Top ${this.filtrosTopN.topN}`, margin, currentY);
            currentY += 10;

            // Encabezados de tabla
            pdf.setFontSize(8);
            const headers = ['Pos.', 'ID', 'Nombre', 'Ingresos (S/)', '% Part.', 'Unidades'];
            const colWidths = [15, 25, 60, 30, 25, 25];
            let xPos = margin;

            // Dibujar encabezados
            headers.forEach((header, index) => {
              pdf.rect(xPos, currentY, colWidths[index], 8);
              pdf.text(header, xPos + 2, currentY + 5);
              xPos += colWidths[index];
            });
            currentY += 8;

            // Dibujar filas de datos
            this.datosTopN.slice(0, this.filtrosTopN.topN).forEach((item, index) => {
              if (currentY > 280) {
                pdf.addPage();
                currentY = 20;
              }

              xPos = margin;
              const rowData = [
                (index + 1).toString(),
                item.id,
                item.nombre.length > 30 ? item.nombre.substring(0, 30) + '...' : item.nombre,
                `S/ ${item.ingresos.toFixed(2)}`,
                `${item.participacion.toFixed(1)}%`,
                item.unidades.toString()
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

          pdf.save(`top-${this.filtrosTopN.topN}-${this.filtrosTopN.dimension}.pdf`);

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
