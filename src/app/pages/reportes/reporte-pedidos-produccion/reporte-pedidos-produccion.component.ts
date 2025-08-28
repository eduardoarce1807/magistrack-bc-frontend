import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MultiSelectModule } from 'primeng/multiselect';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Swal from 'sweetalert2';

import { ExcelService } from '../../../services/excel.service';
import { DataService } from '../../../services/data.service';
import { EstadoPedidoService, EstadoPedido as EstadoPedidoFromService } from '../../../services/estado-pedido.service';
import { environment } from '../../../../environments/environment';

// Interfaces para tipado
export interface FiltrosPedidosProduccion {
  fechaInicio: Date;
  fechaFin: Date;
  idEstadoPedido: number[];
}

export interface PedidoProduccion {
  bulk: string;
  numeroPedido: string;
  etapaActual: string;
  inicioEtapa: string; // ISO string desde API
  tiempoTranscurrido: number | string; // en horas o "Sin datos"
  idEstadoPedido: number;
}

export interface KpisPedidosProduccion {
  enCola: number;
  enProceso: number;
  tiempoMedioEtapa: number | string; // en horas, puede venir como string desde API
}

export interface EstadoPedido extends EstadoPedidoFromService {}

@Component({
  selector: 'app-reporte-pedidos-produccion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    TableModule,
    ButtonModule,
    CardModule,
    MultiSelectModule,
    CalendarModule,
    DropdownModule,
    InputTextModule,
    TooltipModule
  ],
  templateUrl: './reporte-pedidos-produccion.component.html',
  styleUrl: './reporte-pedidos-produccion.component.scss',
  providers: [ExcelService, DatePipe]
})
export class ReportePedidosProduccionComponent implements OnInit, OnDestroy {
  // Propiedades de filtros
  filtrosPedidosProduccion: FiltrosPedidosProduccion = {
    fechaInicio: new Date(new Date().setDate(new Date().getDate() - 30)),
    fechaFin: new Date(),
    idEstadoPedido: []
  };

  // Datos
  datosPedidosProduccion: PedidoProduccion[] = [];
  kpisPedidosProduccion: KpisPedidosProduccion = {
    enCola: 0,
    enProceso: 0,
    tiempoMedioEtapa: 0
  };

  // Opciones para dropdowns
  estadosProduccion: EstadoPedido[] = [];

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
    private excelService: ExcelService,
    private dataService: DataService,
    private estadoPedidoService: EstadoPedidoService,
    private http: HttpClient,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    // Cargar estados de pedido desde el servicio
    this.cargarEstadosPedido();
    // Solo inicializar, no cargar datos automáticamente
    // Los datos se cargarán cuando el usuario aplique filtros
  }

  ngOnDestroy(): void {
    // Limpieza de recursos si es necesario
  }

  cargarEstadosPedido(): void {
    this.estadoPedidoService.getEstadosPedido().subscribe({
      next: (estados) => {
        this.estadosProduccion = estados;
      },
      error: (error) => {
        console.error('Error al cargar estados de pedido:', error);
        Swal.fire('Error', 'No se pudieron cargar los estados de pedido', 'error');
      }
    });
  }

  onRangoFechaChange(): void {
    const fechaFin = new Date();
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaFin.getDate() - this.rangoFechas);
    
    this.fechaInicio = fechaInicio;
    this.fechaFin = fechaFin;
    this.filtrosPedidosProduccion.fechaInicio = fechaInicio;
    this.filtrosPedidosProduccion.fechaFin = fechaFin;
  }

  aplicarFiltros(): void {
    // Preparar filtros para la API
    const filtrosAPI = {
      fechaInicio: this.datePipe.transform(this.fechaInicio, 'yyyy-MM-dd') || '',
      fechaFin: this.datePipe.transform(this.fechaFin, 'yyyy-MM-dd') || '',
      idEstadoPedido: this.filtrosPedidosProduccion.idEstadoPedido
    };

    console.log('Enviando filtros a API:', filtrosAPI);

    // Llamada real al API
    const apiUrl = `${environment.apiUrl}/reporte/pedidos-produccion`;
    
    this.http.post<any>(apiUrl, filtrosAPI)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.datosPedidosProduccion = response.data.pedidos || [];
            this.kpisPedidosProduccion = response.data.kpis || {
              enCola: 0,
              enProceso: 0,
              tiempoMedioEtapa: 0
            };
            console.log('Datos recibidos:', response.data);
            console.log('KPIs recibidos:', this.kpisPedidosProduccion);
            console.log('tiempoMedioEtapa específico:', this.kpisPedidosProduccion.tiempoMedioEtapa, 'Tipo:', typeof this.kpisPedidosProduccion.tiempoMedioEtapa);
          } else {
            console.error('Error en respuesta de API:', response);
            this.datosPedidosProduccion = [];
            this.kpisPedidosProduccion = {
              enCola: 0,
              enProceso: 0,
              tiempoMedioEtapa: 0
            };
          }
        },
        error: (error: any) => {
          console.error('Error al obtener datos de la API:', error);
          this.datosPedidosProduccion = [];
          this.kpisPedidosProduccion = {
            enCola: 0,
            enProceso: 0,
            tiempoMedioEtapa: 0
          };
        }
      });
  }

  getEstadoEtapa(etapa: string): string {
    const clases = {
      'En cola': 'estado-cola',
      'En producción': 'estado-produccion',
      'En calidad': 'estado-calidad',
      'En envasado': 'estado-envasado',
      'En etiquetado': 'estado-etiquetado',
      'En despacho': 'estado-despacho',
      'Borrador': 'estado-borrador',
      'Pagado': 'estado-pagado',
      'Validado': 'estado-validado',
      'Entregado': 'estado-entregado'
    };
    return clases[etapa as keyof typeof clases] || '';
  }

  formatearTiempoTranscurrido(tiempo: number | string): string {
    if (typeof tiempo === 'string') {
      return tiempo; // Retorna "Sin datos" o cualquier string
    }
    if (typeof tiempo === 'number') {
      return tiempo.toFixed(1); // Formato numérico con 1 decimal
    }
    return 'Sin datos';
  }

  formatearTiempoMedio(tiempo: number | string | null | undefined): string {
    console.log('formatearTiempoMedio - Valor recibido:', tiempo, 'Tipo:', typeof tiempo);
    
    // Si es string, intentar convertir a número
    if (typeof tiempo === 'string') {
      const numeroConvertido = parseFloat(tiempo);
      if (!isNaN(numeroConvertido)) {
        console.log('Conversión exitosa de string a número:', numeroConvertido);
        return numeroConvertido.toFixed(2);
      }
      console.log('String no pudo ser convertido a número:', tiempo);
      return tiempo; // Retornar el string tal como está si no es convertible
    }
    
    // Si es número válido
    if (typeof tiempo === 'number' && !isNaN(tiempo)) {
      console.log('Número válido recibido:', tiempo);
      return tiempo.toFixed(2);
    }
    
    console.log('Valor no válido, retornando 0.00');
    return '0.00';
  }

  private generarTextoFiltros(): string {
    const filtros = [];
    
    const fechaInicio = this.datePipe.transform(this.fechaInicio, 'dd/MM/yyyy');
    const fechaFin = this.datePipe.transform(this.fechaFin, 'dd/MM/yyyy');
    filtros.push(`Período: ${fechaInicio} - ${fechaFin}`);

    if (this.filtrosPedidosProduccion.idEstadoPedido.length > 0) {
      const estadosNombres = this.filtrosPedidosProduccion.idEstadoPedido.map(id => {
        const estado = this.estadosProduccion.find(e => e.idEstadoPedido === id);
        return estado ? estado.descripcion : `ID: ${id}`;
      });
      filtros.push(`Estados: ${estadosNombres.join(', ')}`);
    } else {
      filtros.push('Estados: Todos');
    }

    return filtros.join(' | ');
  }

  exportarExcel(): void {
    const archivoNombre = `reporte-pedidos-produccion-${new Date().getTime()}`;
    
    let titulo = 'Reporte de Pedidos en Producción por Etapa';
    let subcabecera: string[] = [];
    
    // Construir subcabecera
    const fechaGeneracion = this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm');
    const filtrosTexto = this.generarTextoFiltros();
    
    subcabecera.push(`Generado el: ${fechaGeneracion}`);
    subcabecera.push(`Filtros aplicados: ${filtrosTexto}`);

    subcabecera.unshift("");

    const datosExport = this.datosPedidosProduccion.map(item => ({
      'Bulk': item.bulk,
      'Número Pedido': item.numeroPedido,
      'Etapa Actual': item.etapaActual,
      'Inicio Etapa': this.datePipe.transform(item.inicioEtapa, 'dd/MM/yyyy HH:mm'),
      'Tiempo Transcurrido (h)': this.formatearTiempoTranscurrido(item.tiempoTranscurrido)
    }));

    const cabecera = ['', 'Bulk', 'Número Pedido', 'Etapa Actual', 'Inicio Etapa', 'Tiempo Transcurrido (h)'];
    const campos = ['', 'Bulk', 'Número Pedido', 'Etapa Actual', 'Inicio Etapa', 'Tiempo Transcurrido (h)'];
    const ancho = [20, 20, 20, 20, 20, 20];

    this.excelService.downloadExcel(
      datosExport,
      cabecera,
      campos,
      titulo,
      ancho,
      subcabecera,
      archivoNombre,
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
          const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape para más espacio
          let currentY = 20;
          const pageWidth = 270; // A4 landscape width
          const margin = 10;

          // Título del reporte
          pdf.setFontSize(16);
          pdf.text('Reporte de Pedidos en Producción por Etapa', margin, currentY);
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

          // Debug: Agregar logs para verificar los valores antes de usarlos en PDF
          console.log('=== DEBUG PDF KPIs ===');
          console.log('enCola:', this.kpisPedidosProduccion.enCola);
          console.log('enProceso:', this.kpisPedidosProduccion.enProceso);
          console.log('tiempoMedioEtapa original:', this.kpisPedidosProduccion.tiempoMedioEtapa);
          console.log('tiempoMedioEtapa formateado:', this.formatearTiempoMedio(this.kpisPedidosProduccion.tiempoMedioEtapa));
          console.log('==================');

          pdf.setFontSize(10);
          pdf.text(`• En Cola: ${this.kpisPedidosProduccion.enCola}`, margin + 5, currentY);
          currentY += 5;
          pdf.text(`• En Proceso: ${this.kpisPedidosProduccion.enProceso}`, margin + 5, currentY);
          currentY += 5;
          pdf.text(`• Tiempo Medio en Etapa: ${this.formatearTiempoMedio(this.kpisPedidosProduccion.tiempoMedioEtapa)} horas`, margin + 5, currentY);
          currentY += 5;
          pdf.text(`• Total Pedidos: ${this.datosPedidosProduccion.length}`, margin + 5, currentY);
          currentY += 15;

          // Tabla de datos
          if (this.datosPedidosProduccion && this.datosPedidosProduccion.length > 0) {
            pdf.setFontSize(14);
            pdf.text('Detalle de Pedidos', margin, currentY);
            currentY += 10;

            // Headers de la tabla
            pdf.setFontSize(8);
            const headers = ['Bulk', 'Número Pedido', 'Etapa Actual', 'Inicio Etapa', 'Tiempo (h)'];
            const colWidths = [40, 50, 45, 40, 25];
            let xPos = margin;

            // Dibujar encabezados
            headers.forEach((header, index) => {
              pdf.rect(xPos, currentY, colWidths[index], 8);
              pdf.text(header, xPos + 2, currentY + 5);
              xPos += colWidths[index];
            });
            currentY += 8;

            // Datos de la tabla
            this.datosPedidosProduccion.forEach((item) => {
              if (currentY > 180) { // Nueva página si es necesario
                pdf.addPage();
                currentY = 20;
              }

              xPos = margin;
              const rowData = [
                item.bulk.length > 15 ? item.bulk.substring(0, 15) + '...' : item.bulk,
                item.numeroPedido.length > 18 ? item.numeroPedido.substring(0, 18) + '...' : item.numeroPedido,
                item.etapaActual.length > 15 ? item.etapaActual.substring(0, 15) + '...' : item.etapaActual,
                this.datePipe.transform(item.inicioEtapa, 'dd/MM/yy HH:mm') || '',
                this.formatearTiempoTranscurrido(item.tiempoTranscurrido)
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
            pdf.text('No hay datos disponibles para mostrar', margin, currentY);
          }

          pdf.save('pedidos-produccion.pdf');

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
