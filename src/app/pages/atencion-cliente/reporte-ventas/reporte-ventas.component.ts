import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbTypeaheadModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { PagoPedidoService } from '../../../services/pago-pedido.service';
import { UtilDate } from '../../../util/util-date';
import { CanalVentaService } from '../../../services/canal-venta.service';
import { CommonModule } from '@angular/common';
import { PedidoService } from '../../../services/pedido.service';

@Component({
  selector: 'app-reporte-ventas',
  standalone: true,
  imports: [FormsModule, NgbTypeaheadModule, NgbPaginationModule, CommonModule],
  templateUrl: './reporte-ventas.component.html',
  styleUrl: './reporte-ventas.component.scss'
})
export class ReporteVentasComponent implements OnInit {

  pedidos: any[] = [];
  pedidosTable: any[] = [];
  page = 1;
  pageSize = 5;
  collectionSize = this.pedidos.length;

  // Usar UtilDate para obtener la fecha actual en la zona horaria de Perú (UTC-5)
  fechaInicio: string = UtilDate.toPeruIsoString(
    new Date(
      new Date(
        new Date().toLocaleString('en-US', { timeZone: 'America/Lima' })
      ).getTime() - 7 * 24 * 60 * 60 * 1000
    )
  ).slice(0, 10);
  fechaFin: string = UtilDate.toPeruIsoString(new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }))).slice(0, 10);

  lstPagosSeleccionados: string[] = [];

  idCanalVenta: number | null = null;

  tiposCanalVenta: any[] = [];

  constructor(public router: Router, private pagoPedidoService: PagoPedidoService, private canalVentaService: CanalVentaService, private pedidoService: PedidoService) {

  }

  ngOnInit(): void {
    this.getCanalesVenta();
    this.cargarPedidos();
  }

  getCanalesVenta(){
    this.canalVentaService.getCanalesVenta().subscribe((data) => {
      if(data) {
        this.tiposCanalVenta = data;
      }
    });
  }

  cargarPedidos(){

    let json = {
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
      idCanalVenta: this.idCanalVenta
    }

    this.pedidoService.getReportePedidos(json).subscribe((data: any[]) => {
      this.pedidos = data;
      this.pedidosTable = data;
      this.collectionSize = data.length;
      this.refreshPedidos();
    });
  }

  refreshPedidos() {
    this.pedidos = this.pedidosTable
      .map((pedido, i) => ({ id: i + 1, ...pedido }))
      .slice(
        (this.page - 1) * this.pageSize,
        (this.page - 1) * this.pageSize + this.pageSize
      );
  }

}
