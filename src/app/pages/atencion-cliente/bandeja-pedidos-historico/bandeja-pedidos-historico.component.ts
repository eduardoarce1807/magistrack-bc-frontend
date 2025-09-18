import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { MultiSelectModule } from 'primeng/multiselect';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { DataService } from '../../../services/data.service';
import { ClienteService } from '../../../services/cliente.service';
import { CanalVentaService } from '../../../services/canal-venta.service';
import { TipoPagoService } from '../../../services/tipo-pago.service';
import { EstadoPedidoService } from '../../../services/estado-pedido.service';
import { PedidoService } from '../../../services/pedido.service';
import { PedidoHistoricoService } from '../../../services/pedido-historico.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-bandeja-pedidos-historico',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    MultiSelectModule,
    CalendarModule,
    CardModule
  ],
  templateUrl: './bandeja-pedidos-historico.component.html',
  styleUrl: './bandeja-pedidos-historico.component.scss'
})
export class BandejaPedidosHistoricoComponent implements OnInit {

  // Filtros
  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;
  clientesSeleccionados: number[] = [];
  canalesVentaSeleccionados: number[] = [];
  metodosPagoSeleccionados: number[] = [];
  estadosPedidoSeleccionados: number[] = [];

  // Opciones para los multiselect
  clientes: any[] = [];
  canalesVenta: any[] = [];
  metodosPago: any[] = [];
  estadosPedido: any[] = [];

  // Datos de la tabla
  pedidosHistorico: any[] = [];
  loadingTable = false;
  loadingPDF: { [key: string]: boolean } = {};

  // Configuraciones de la tabla
  first = 0;
  rows = 10;

  constructor(
    private router: Router,
    private dataService: DataService,
    private clienteService: ClienteService,
    private canalVentaService: CanalVentaService,
    private tipoPagoService: TipoPagoService,
    private estadoPedidoService: EstadoPedidoService,
    private pedidoService: PedidoService,
    private pedidoHistoricoService: PedidoHistoricoService
  ) {}

  ngOnInit(): void {
    this.establecerFechasPorDefecto();
    this.cargarDatosIniciales();
    this.aplicarFiltros(); // Cargar datos iniciales con fechas por defecto
  }

  // Establecer fechas por defecto (últimos 7 días hasta hoy)
  establecerFechasPorDefecto(): void {
    const hoy = new Date();
    this.fechaFin = hoy;
    
    // Fecha inicio: 7 días atrás
    const fechaInicio = new Date();
    fechaInicio.setDate(hoy.getDate() - 6); // 6 días atrás + hoy = 7 días
    this.fechaInicio = fechaInicio;
  }

  cargarDatosIniciales(): void {
    // Cargar clientes (excluyendo roles específicos)
    this.clienteService.getClientesMenosRoles([1, 6, 7, 8, 9, 10]).subscribe(
      (clientes) => {
        this.clientes = clientes.map(cliente => ({
          label: `${cliente.nombres} ${cliente.apellidos} - ${cliente.numeroDocumento}`,
          value: cliente.idCliente
        }));
      },
      (error) => console.error('Error al cargar clientes:', error)
    );

    // Cargar canales de venta
    this.canalVentaService.getCanalesVenta().subscribe(
      (canales: any[]) => {
        this.canalesVenta = canales.map((canal: any) => ({
          label: canal.descripcion,
          value: canal.idCanalVenta
        }));
      },
      (error: any) => console.error('Error al cargar canales de venta:', error)
    );

    // Cargar métodos de pago
    this.tipoPagoService.getTiposPago().subscribe(
      (tiposPago: any[]) => {
        this.metodosPago = tiposPago.map((tipo: any) => ({
          label: tipo.descripcion,
          value: tipo.idTipoPago
        }));
      },
      (error: any) => console.error('Error al cargar métodos de pago:', error)
    );

    // Cargar estados de pedido
    this.estadoPedidoService.getEstadosPedido().subscribe(
      (estados: any[]) => {
        this.estadosPedido = estados.map((estado: any) => ({
          label: estado.descripcion,
          value: estado.idEstadoPedido
        }));
      },
      (error: any) => console.error('Error al cargar estados de pedido:', error)
    );
  }

  aplicarFiltros(): void {
    // Validar que las fechas estén definidas
    if (!this.fechaInicio || !this.fechaFin) {
      Swal.fire({
        icon: 'warning',
        title: 'Fechas requeridas',
        text: 'Debe seleccionar fecha de inicio y fecha fin'
      });
      return;
    }

    this.loadingTable = true;
    
    // Preparar filtros con el nuevo formato
    const filtros = {
      fechaInicio: this.formatearFecha(this.fechaInicio),
      fechaFin: this.formatearFecha(this.fechaFin),
      clientesIds: this.clientesSeleccionados || [],
      canalesVentaIds: this.canalesVentaSeleccionados || [],
      metodosPagoIds: this.metodosPagoSeleccionados || [],
      estadoPedidoIds: this.estadosPedidoSeleccionados || []
    };

    console.log('Filtros aplicados:', filtros);
    console.log('clientesSeleccionados:', this.clientesSeleccionados);
    console.log('canalesVentaSeleccionados:', this.canalesVentaSeleccionados);
    console.log('metodosPagoSeleccionados:', this.metodosPagoSeleccionados);
    console.log('estadosPedidoSeleccionados:', this.estadosPedidoSeleccionados);

    // Llamar al endpoint real
    this.pedidoHistoricoService.buscarPedidosHistorico(filtros).subscribe(
      (response: any) => {
        if (response.success) {
          this.pedidosHistorico = response.data.content;
          console.log('Pedidos histórico cargados:', this.pedidosHistorico);
        } else {
          console.error('Error en la respuesta:', response.message);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: response.message || 'Error al cargar los pedidos histórico',
            confirmButtonText: 'Aceptar'
          });
        }
        this.loadingTable = false;
      },
      (error: any) => {
        console.error('Error al cargar pedidos histórico:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los pedidos histórico. Verifique su conexión.',
          confirmButtonText: 'Aceptar'
        });
        this.loadingTable = false;
      }
    );
  }

  private formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  limpiarFiltros(): void {
    this.establecerFechasPorDefecto(); // Restablecer fechas por defecto
    this.clientesSeleccionados = [];
    this.canalesVentaSeleccionados = [];
    this.metodosPagoSeleccionados = [];
    this.estadosPedidoSeleccionados = [];
    this.aplicarFiltros();
  }

  // Métodos para los botones de acción
  verPedido(idPedido: string): void {
    this.router.navigate(['/pages/atencion-cliente/registro-pedido', idPedido]);
  }

  verTrazabilidad(idPedido: string): void {
    this.router.navigate(['/pages/atencion-cliente/trazabilidad-pedido', idPedido]);
  }

  imprimirHojaPedido(idPedido: string): void {
    // Validar que el pedido no esté en estado Borrador
    const pedido = this.pedidosHistorico.find(p => p.idPedido === idPedido);
    if (pedido && pedido.estado === 'Borrador') {
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'No se puede imprimir la hoja de un pedido en estado Borrador.',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    // Activar estado de carga
    this.loadingPDF[idPedido] = true;
    
    // Primero obtener los datos del pedido para verificar el tipoPedido
    this.pedidoService.getPedidoById(idPedido).subscribe({
      next: (pedidoCompleto) => {
        console.log('Datos del pedido:', pedidoCompleto);
        
        // Verificar que los datos del pedido existan
        if (!pedidoCompleto) {
          throw new Error('No se pudieron obtener los datos del pedido');
        }
        
        // Determinar qué request hacer según el tipoPedido
        let productosRequest;
        if (pedidoCompleto.tipoPedido === 'PREPARADO_MAGISTRAL') {
          // Para preparados magistrales
          productosRequest = this.pedidoService.getPreparadosMagistralesByIdPedido(idPedido);
        } else {
          // Para productos regulares (tipoPedido === 'PRODUCTO' o cualquier otro valor)
          productosRequest = this.pedidoService.getProductosByPedidoId(idPedido);
        }
        
        // Ejecutar el request correspondiente
        productosRequest.subscribe({
          next: (items) => {
            console.log('Items del pedido:', items);
            
            // Verificar que los items existan
            if (!items) {
              throw new Error('No se pudieron obtener los items del pedido');
            }
            
            // Generar el HTML del PDF
            const htmlContent = this.generarHTMLHojaPedido(pedidoCompleto, items);
            
            // Crear una ventana para imprimir
            const printWindow = window.open('', '_blank', 'width=800,height=600');
            if (printWindow) {
              printWindow.document.write(htmlContent);
              printWindow.document.close();
              printWindow.focus();
              setTimeout(() => {
                printWindow.print();
                printWindow.close();
                // Desactivar estado de carga después de que se abre la ventana de impresión
                this.loadingPDF[idPedido] = false;
              }, 500);
            } else {
              // Si no se pudo abrir la ventana, desactivar estado de carga
              this.loadingPDF[idPedido] = false;
            }
          },
          error: (error) => {
            console.error('Error al obtener items del pedido:', error);
            // Desactivar estado de carga en caso de error
            this.loadingPDF[idPedido] = false;
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudieron obtener los items del pedido para generar la hoja.',
              confirmButtonText: 'Aceptar'
            });
          }
        });
      },
      error: (error) => {
        console.error('Error al obtener datos del pedido:', error);
        // Desactivar estado de carga en caso de error
        this.loadingPDF[idPedido] = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron obtener los datos del pedido para generar la hoja.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  private generarHTMLHojaPedido(pedido: any, items: any[]): string {
    const fechaPedido = new Date(pedido.fechaPedido).toLocaleDateString('es-PE');
    const esPreparadoMagistral = pedido.tipoPedido === 'PREPARADO_MAGISTRAL';
    
    let itemsHTML = '';
    items.forEach(item => {
      if (esPreparadoMagistral) {
        // Para preparados magistrales
        const precioTotal = item.precio * item.cantidad;
        itemsHTML += `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${item.nombre} x ${item.cantidad}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${item.presentacion} ${item.tipoPresentacion}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">S/ ${precioTotal.toFixed(2)}</td>
          </tr>
        `;
      } else {
        // Para productos regulares
        const precioTotal = item.precio * item.cantidad;
        itemsHTML += `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${item.nombre} x ${item.cantidad}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${item.presentacion} ${item.tipoPresentacion}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">S/ ${precioTotal.toFixed(2)}</td>
          </tr>
        `;
      }
    });

    const tipoItemTexto = esPreparadoMagistral ? 'PREPARADOS MAGISTRALES' : 'PRODUCTOS';

    return `
      <html>
        <head>
          <title>Hoja de Pedido - ${pedido.idPedido}</title>
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
            .section {
              margin-bottom: 15px;
            }
            .section-title {
              font-weight: bold;
              margin-bottom: 5px;
              color: #333;
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
            }
            td {
              padding: 8px;
              border: 1px solid #ddd;
            }
            .total {
              font-weight: bold;
              font-size: 14px;
              text-align: right;
              margin-top: 10px;
            }
            .tipo-pedido {
              background-color: ${esPreparadoMagistral ? '#e3f2fd' : '#f3e5f5'};
              padding: 5px 10px;
              border-radius: 5px;
              display: inline-block;
              font-weight: bold;
              color: ${esPreparadoMagistral ? '#1976d2' : '#7b1fa2'};
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>HOJA DE PEDIDO</h1>
            <h2>${pedido.idPedido}</h2>
            <div class="tipo-pedido">${pedido.tipoPedido || 'PRODUCTO'}</div>
          </div>

          <div class="section">
            <div class="section-title">Cliente:</div>
            ${pedido.cliente?.nombres || ''} ${pedido.cliente?.apellidos || ''}
          </div>

          <div class="section">
            <div class="section-title">DNI:</div>
            ${pedido.cliente?.numeroDocumento || 'No especificado'}
          </div>

          <div class="section">
            <div class="section-title">Correo:</div>
            ${pedido.cliente?.correo || 'No especificado'}
          </div>

          <div class="section">
            <div class="section-title">Número de pedido:</div>
            ${pedido.idPedido}
          </div>

          <div class="section">
            <div class="section-title">Fecha:</div>
            ${fechaPedido}
          </div>

          <div class="section">
            <div class="section-title">Total:</div>
            S/ ${pedido.montoTotal.toFixed(2)}
          </div>

          <div class="section">
            <div class="section-title">Método de pago:</div>
            ${pedido.tipoPago?.descripcion || 'No especificado'}
          </div>

          <div class="section">
            <div class="section-title">Método de entrega:</div>
            ${pedido.metodoEntrega?.descripcion || 'No especificado'}
          </div>

          <div class="section">
            <div class="section-title">Dirección:</div>
            ${pedido.direccion?.direccion || 'No especificada'} - ${pedido.direccion?.distrito?.nombre || ''} - ${pedido.direccion?.provincia?.nombre || ''} - ${pedido.direccion?.departamento?.nombre || ''}
          </div>

          <div class="section">
            <div class="section-title">DETALLES DEL PEDIDO - ${tipoItemTexto}</div>
            <table>
              <thead>
                <tr>
                  <th>${esPreparadoMagistral ? 'Preparado Magistral' : 'Producto'}</th>
                  <th>Presentación</th>
                  <th>Precio</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>
          </div>

          <div class="total">
            TOTAL: S/ ${pedido.montoTotal.toFixed(2)}
          </div>
        </body>
      </html>
    `;
  }
}