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
import { ReportesGraficosService, FiltrosVentasCliente } from '../../../services/reportes-graficos.service';

@Component({
  selector: 'app-reporte-ventas-clientes',
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
  templateUrl: './reporte-ventas-clientes.component.html',
  styleUrl: './reporte-ventas-clientes.component.scss',
  providers: [ExcelService, DatePipe]
})
export class ReporteVentasClientesComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('ventasClienteBarChart') ventasClienteBarChart!: ElementRef;
  @ViewChild('ventasClienteLineChart') ventasClienteLineChart!: ElementRef;

  // Variables para gráficos
  clienteBarChart: Chart | undefined;
  clienteLineChart: Chart | undefined;

  // Filtros específicos
  filtrosVentasCliente = {
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
  datosVentasCliente: any[] = [];

  // Datos para gráficos específicos
  datosGraficosCliente: any = null;

  // KPIs
  kpisVentasCliente = {
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
    if (this.clienteBarChart) {
      this.clienteBarChart.destroy();
    }
    if (this.clienteLineChart) {
      this.clienteLineChart.destroy();
    }
  }

  initializeFechas(): void {
    const hoy = new Date();
    this.filtrosVentasCliente.fechaFin = new Date(hoy);
    this.filtrosVentasCliente.fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
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
    if (this.datosVentasCliente && this.datosVentasCliente.length > 0) {
      this.crearGraficoVentasCliente();
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

  // Método para manejar cambios de rango de fechas
  onRangoFechaChange(): void {
    const hoy = new Date();
    
    switch (this.filtrosVentasCliente.rangoFechas) {
      case 'hoy':
        this.filtrosVentasCliente.fechaInicio = new Date(hoy);
        this.filtrosVentasCliente.fechaFin = new Date(hoy);
        break;
      case 'ultimos7':
        this.filtrosVentasCliente.fechaInicio = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
        this.filtrosVentasCliente.fechaFin = new Date(hoy);
        break;
      case 'ultimos30':
        this.filtrosVentasCliente.fechaInicio = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
        this.filtrosVentasCliente.fechaFin = new Date(hoy);
        break;
    }
  }

  // Método para aplicar filtros
  aplicarFiltros(): void {
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

  // Métodos de exportación
  private generarTextoFiltros(): string {
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

  exportarExcel(): void {
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
    const filtrosTexto = this.generarTextoFiltros();
    
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

  async exportarPDF(): Promise<void> {
    await this.exportarGraficosYTablaClientePDF('Ventas por Cliente', 'reporte-ventas-cliente.pdf');
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

            pdf.addImage(imgDataLine, 'PNG', margin, currentY, lineWidth, lineHeight);
            currentY += lineHeight + 15;
          }
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
        this.datosVentasCliente.forEach((item, index) => {
          if (currentY > 280) {
            pdf.addPage();
            currentY = 20;
          }

          xPos = margin;
          const rowData = [
            item.cliente.length > 30 ? item.cliente.substring(0, 30) + '...' : item.cliente,
            item.documento,
            item.tipo,
            item.pedidos.toString(),
            item.unidades.toString(),
            `S/ ${item.ingresos.toFixed(2)}`,
            item.ultimaCompra
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
