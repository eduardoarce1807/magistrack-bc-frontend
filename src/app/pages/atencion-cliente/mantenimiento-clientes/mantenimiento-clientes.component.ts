import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbTypeaheadModule, NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ClienteService } from '../../../services/cliente.service';
import { PedidoService } from '../../../services/pedido.service';
import { ExcelService } from '../../../services/excel.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableModule } from 'primeng/table';
import { CommonModule, DatePipe } from '@angular/common';
import { DropdownModule } from 'primeng/dropdown';

@Component({
  selector: 'app-mantenimiento-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbTypeaheadModule, NgbPaginationModule, NgbTooltipModule, TableModule, ButtonModule, IconFieldModule, InputIconModule, InputTextModule, DropdownModule],
  templateUrl: './mantenimiento-clientes.component.html',
  styleUrl: './mantenimiento-clientes.component.scss'
})
export class MantenimientoClientesComponent implements OnInit {

  clientes: any[] = [];
	page = 1;
	pageSize = 5;
	collectionSize = this.clientes.length;

	lstClientesSeleccionados: string[] = [];

  // ==================== SECCIÓN REPORTE DE CUMPLEAÑOS ====================
  mesSeleccionado: any = null;
  mesesOpciones = [
    { label: 'ENERO', value: 1 },
    { label: 'FEBRERO', value: 2 },
    { label: 'MARZO', value: 3 },
    { label: 'ABRIL', value: 4 },
    { label: 'MAYO', value: 5 },
    { label: 'JUNIO', value: 6 },
    { label: 'JULIO', value: 7 },
    { label: 'AGOSTO', value: 8 },
    { label: 'SEPTIEMBRE', value: 9 },
    { label: 'OCTUBRE', value: 10 },
    { label: 'NOVIEMBRE', value: 11 },
    { label: 'DICIEMBRE', value: 12 }
  ];
  loadingReporte: boolean = false;

  constructor(
    private clienteService: ClienteService,
    private pedidoService: PedidoService, 
    private excelService: ExcelService,
    public router: Router
  ) {}

  ngOnInit(): void {
		this.cargarClientes();
	}

	cargarClientes(): void {
		this.clienteService.getClientes().subscribe(
			(clientes) => {
        this.clientes = clientes;
        this.clientes = this.clientes.map(cliente => ({
          ...cliente,
          nombreCompleto: `${cliente.nombres} ${cliente.apellidos}`
        }));
				this.collectionSize = this.clientes.length;
			},
			(error) => console.error('Error al cargar clientes', error)
		);
	}

  searchValue = "";
  clear(table: Table) {
    table.clear(); // o lo que sea necesario
  }


  desactivarCliente(cliente: any): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Por favor, confirma la desactivación del cliente "${cliente.nombreCompleto}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.clienteService.desactivarCliente(cliente.idCliente).subscribe(
          (data) => {
            if(data && data.idResultado === 1) {
              Swal.fire({
                title: '¡Listo!',
                text: data.mensaje,
                icon: 'success'
              });
              this.cargarClientes(); // Recargar la lista de clientes
            } else {
              Swal.fire({
                title: 'Error',
                text: data.mensaje,
                icon: 'error'
              });
            }
          },
          (error) => {
            Swal.fire({
              title: 'Error',
              text: 'No se pudo desactivar el cliente.',
              icon: 'error'
            });
          }
          
        );
      }
    });
  }

  activarCliente(cliente: any){
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Por favor, confirma la activación del cliente "${cliente.nombreCompleto}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, activar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.clienteService.activarCliente(cliente.idCliente).subscribe(
          (data) => {
            if(data && data.idResultado === 1) {
              Swal.fire({
                title: '¡Listo!',
                text: data.mensaje,
                icon: 'success'
              });
              this.cargarClientes(); // Recargar la lista de clientes
            } else {
              Swal.fire({
                title: 'Error',
                text: data.mensaje,
                icon: 'error'
              });
            }
          },
          (error) => {
            Swal.fire({
              title: 'Error',
              text: 'No se pudo activar el cliente.',
              icon: 'error'
            });
          }
          
        );
      }
    });
  }

  // ==================== MÉTODOS DE REPORTE DE CUMPLEAÑOS ====================

  /**
   * Exportar reporte de cumpleaños por mes seleccionado
   */
  exportarReporteCumpleanos(): void {
    if (!this.mesSeleccionado) {
      Swal.fire({
        icon: 'warning',
        title: 'Mes requerido',
        text: 'Por favor selecciona un mes para generar el reporte.',
        showConfirmButton: true
      });
      return;
    }

    this.loadingReporte = true;
    const nombreMes = this.mesesOpciones.find(m => m.value === this.mesSeleccionado)?.label || '';

    this.clienteService.buscarPorMesNacimiento(this.mesSeleccionado).subscribe({
      next: (response) => {
        this.loadingReporte = false;
        
        if (response.idResultado === 1 && response.values && response.values.length > 0) {
          // Hay clientes para exportar
          const clientesCumpleanos = response.values;
          
          // Preparar datos para Excel con formato completo
          const datosExcel = clientesCumpleanos.map((cliente: any) => ({
            'ID Cliente': cliente.idCliente,
            'Nombres': cliente.nombres,
            'Apellidos': cliente.apellidos,
            'Tipo Documento': cliente.tipoDocumento,
            'N° Documento': cliente.numeroDocumento,
            'Fecha Nacimiento': this.formatearFecha(cliente.fechaNacimiento),
            'Dirección': cliente.direccion,
            'Rol': cliente.rol,
            'Estado': cliente.estado ? 'Activo' : 'Inactivo'
          }));

          // Configurar parámetros para el Excel con formato completo
          const cabecera = [
            '', // Columna vacía inicial
            'ID Cliente',
            'Nombres',
            'Apellidos',
            'Tipo Documento',
            'N° Documento',
            'Fecha Nacimiento',
            'Dirección',
            'Rol',
            'Estado'
          ];

          const campos = [
            '',
            'ID Cliente',
            'Nombres',
            'Apellidos',
            'Tipo Documento',
            'N° Documento',
            'Fecha Nacimiento',
            'Dirección',
            'Rol',
            'Estado'
          ];

          const ancho = [12, 12, 20, 20, 18, 15, 18, 30, 20, 12]; // Anchos de columnas

          const subcabecera = [
            '', '',
            'Reporte:', 'Cumpleaños por Mes',
            'Mes:', nombreMes,
            'Año:', new Date().getFullYear().toString(),
            'Total de Clientes:', clientesCumpleanos.length.toString()
          ];

          const sumarcampos = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // No sumar ningún campo

          const nombreArchivo = `reporte_cumpleanos_${nombreMes.toLowerCase()}_${new Date().getFullYear()}`;
          
          try {
            this.excelService.downloadExcel(
              datosExcel,
              cabecera,
              campos,
              `Reporte de Cumpleaños - ${nombreMes} ${new Date().getFullYear()}`,
              ancho,
              subcabecera,
              nombreArchivo,
              sumarcampos
            );

            // Mostrar mensaje de descarga exitosa con opción de imprimir
            Swal.fire({
              icon: 'success',
              title: '¡Descarga exitosa!',
              html: `
                <p>El reporte de cumpleaños de <strong>${nombreMes}</strong> ha sido descargado exitosamente.</p>
                <p><strong>${clientesCumpleanos.length}</strong> cliente(s) encontrado(s).</p>
              `,
              showCancelButton: true,
              confirmButtonText: 'Imprimir',
              cancelButtonText: 'Cancelar',
              confirmButtonColor: '#28a745',
              cancelButtonColor: '#6c757d'
            }).then((result) => {
              if (result.isConfirmed) {
                this.imprimirReporteCumpleanos(clientesCumpleanos, nombreMes);
              }
            });

          } catch (error) {
            console.error('Error al exportar a Excel:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error de exportación',
              text: 'Hubo un problema al generar el archivo Excel. Por favor, inténtalo de nuevo.',
              showConfirmButton: true
            });
          }

        } else {
          // No hay clientes en ese mes
          Swal.fire({
            icon: 'info',
            title: 'Sin resultados',
            text: `No se encontraron clientes que cumplan años en ${nombreMes}.`,
            showConfirmButton: true
          });
        }
      },
      error: (error) => {
        this.loadingReporte = false;
        console.error('Error al obtener reporte de cumpleaños:', error);
        
        let errorMessage = 'No se pudo generar el reporte de cumpleaños.';
        if (error.error && error.error.resultado) {
          errorMessage = error.error.resultado;
        }

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMessage,
          showConfirmButton: true
        });
      }
    });
  }

  /**
   * Imprimir reporte de cumpleaños en formato tabla
   */
  private imprimirReporteCumpleanos(clientes: any[], nombreMes: string): void {
    const fechaActual = new Date().toLocaleDateString('es-PE');
    
    let filas = '';
    clientes.forEach(cliente => {
      filas += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${cliente.idCliente}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${cliente.nombres} ${cliente.apellidos}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${cliente.tipoDocumento}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${cliente.numeroDocumento}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${this.formatearFecha(cliente.fechaNacimiento)}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${cliente.direccion}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">
            <span class="${cliente.estado ? 'estado-activo' : 'estado-inactivo'}">
              ${cliente.estado ? 'Activo' : 'Inactivo'}
            </span>
          </td>
        </tr>
      `;
    });

    const htmlContent = `
      <html>
        <head>
          <title>Reporte de Cumpleaños - ${nombreMes}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              font-size: 12px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .info-section {
              margin-bottom: 15px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th {
              background-color: #f5f5f5;
              padding: 8px;
              border: 1px solid #ddd;
              font-weight: bold;
              text-align: left;
            }
            td {
              padding: 8px;
              border: 1px solid #ddd;
            }
            .estado-activo {
              background-color: #d4edda;
              color: #155724;
              padding: 2px 8px;
              border-radius: 3px;
              font-size: 11px;
            }
            .estado-inactivo {
              background-color: #f8d7da;
              color: #721c24;
              padding: 2px 8px;
              border-radius: 3px;
              font-size: 11px;
            }
            .total {
              font-weight: bold;
              font-size: 14px;
              text-align: right;
              margin-top: 10px;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>REPORTE DE CUMPLEAÑOS</h1>
            <h2>${nombreMes} ${new Date().getFullYear()}</h2>
          </div>

          <div class="info-section">
            <strong>Fecha de generación:</strong> ${fechaActual}<br>
            <strong>Total de clientes:</strong> ${clientes.length}
          </div>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre Completo</th>
                <th>Tipo Doc.</th>
                <th>N° Documento</th>
                <th>Fecha Nacimiento</th>
                <th>Dirección</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${filas}
            </tbody>
          </table>

          <div class="total">
            Total de clientes con cumpleaños en ${nombreMes}: ${clientes.length}
          </div>
        </body>
      </html>
    `;

    // Crear ventana para imprimir
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error de impresión',
        text: 'No se pudo abrir la ventana de impresión. Verifique que las ventanas emergentes estén habilitadas.',
        showConfirmButton: true
      });
    }
  }

  /**
   * Formatear fecha para mostrar
   */
  private formatearFecha(fecha: string): string {
    if (!fecha) return '';
    
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return fecha;
    }
  }
}
