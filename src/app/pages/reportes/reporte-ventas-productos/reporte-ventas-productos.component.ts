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

import { ProductoService } from '../../../services/producto.service';
import { CanalVentaService } from '../../../services/canal-venta.service';
import { TipoPagoService } from '../../../services/tipo-pago.service';
import { RolService } from '../../../services/rol.service';
import { ExcelService } from '../../../services/excel.service';
import { ReportesGraficosService, FiltrosVentasProducto } from '../../../services/reportes-graficos.service';

@Component({
  selector: 'app-reporte-ventas-productos',
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
  templateUrl: './reporte-ventas-productos.component.html',
  styleUrl: './reporte-ventas-productos.component.scss',
  providers: [ExcelService, DatePipe]
})
export class ReporteVentasProductosComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('ventasProductoBarChart') ventasProductoBarChart!: ElementRef;
  @ViewChild('ventasProductoPieChart') ventasProductoPieChart!: ElementRef;

  // Variables para gráficos
  barChart: Chart | undefined;
  pieChart: Chart | undefined;

  // Filtros específicos
  filtrosVentasProducto = {
    fechaInicio: new Date(),
    fechaFin: new Date(),
    rangoFechas: '',
    canalesSeleccionados: [],
    tiposPagoSeleccionados: [],
    productosSeleccionados: [],
    rolesSeleccionados: []
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
  productos: any[] = [];
  roles: any[] = [];

  // Datos para tabla
  datosVentasProducto: any[] = [];

  // KPIs
  kpisVentasProducto = {
    totalVendido: 0,
    unidades: 0,
    ticketPromedio: 0,
    participacionTop5: 0
  };

  constructor(
    private productoService: ProductoService,
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
    if (this.pieChart) {
      this.pieChart.destroy();
    }
  }

  initializeFechas(): void {
    const hoy = new Date();
    this.filtrosVentasProducto.fechaFin = new Date(hoy);
    this.filtrosVentasProducto.fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
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
    if (this.datosVentasProducto && this.datosVentasProducto.length > 0) {
      this.crearGraficoVentasProducto();
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
          maintainAspectRatio: false,
          layout: {
            padding: {
              top: 10,
              bottom: 10,
              left: 10,
              right: 10
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Participación por Producto (%)',
              font: {
                size: 16
              }
            },
            legend: {
              position: 'bottom',
              labels: {
                font: {
                  size: 12
                },
                boxWidth: 16,
                padding: 12
              }
            }
          },
          elements: {
            arc: {
              borderWidth: 1
            }
          }
        }
      });
      
      console.log('Gráficos creados exitosamente');
      
    } catch (error) {
      console.error('Error al crear gráficos:', error);
    }
  }

  // Método para manejar cambios de rango de fechas
  onRangoFechaChange(): void {
    const hoy = new Date();
    
    switch (this.filtrosVentasProducto.rangoFechas) {
      case 'hoy':
        this.filtrosVentasProducto.fechaInicio = new Date(hoy);
        this.filtrosVentasProducto.fechaFin = new Date(hoy);
        break;
      case 'ultimos7':
        this.filtrosVentasProducto.fechaInicio = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
        this.filtrosVentasProducto.fechaFin = new Date(hoy);
        break;
      case 'ultimos30':
        this.filtrosVentasProducto.fechaInicio = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
        this.filtrosVentasProducto.fechaFin = new Date(hoy);
        break;
    }
  }

  // Método para aplicar filtros
  aplicarFiltros(): void {
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

  // Métodos de exportación
  private generarTextoFiltros(): string {
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

  exportarExcel(): void {
    const datosExport = this.datosVentasProducto.map(item => ({
      'Producto': item.producto,
      'Presentación': item.presentacion,
      'Unidades': item.unidades,
      'Ingresos (S/)': item.ingresos,
      '% Participación': item.participacion
    }));

    // Generar texto de filtros aplicados
    const filtrosTexto = this.generarTextoFiltros();
    
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
    subcabecera.unshift("");
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

  async exportarPDF(): Promise<void> {
    await this.exportarGraficosYTablaPDF('Ventas por Producto', 'reporte-ventas-producto.pdf');
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
}
