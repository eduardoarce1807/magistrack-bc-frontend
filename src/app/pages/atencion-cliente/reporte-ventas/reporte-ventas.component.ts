import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbTypeaheadModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { PagoPedidoService } from '../../../services/pago-pedido.service';
import { UtilDate } from '../../../util/util-date';
import { CanalVentaService } from '../../../services/canal-venta.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reporte-ventas',
  standalone: true,
  imports: [FormsModule, NgbTypeaheadModule, NgbPaginationModule, CommonModule],
  templateUrl: './reporte-ventas.component.html',
  styleUrl: './reporte-ventas.component.scss'
})
export class ReporteVentasComponent implements OnInit {

  pagos: any[] = [];
  pagosTable: any[] = [];
  page = 1;
  pageSize = 5;
  collectionSize = this.pagos.length;

  // Usar UtilDate para obtener la fecha actual en la zona horaria de Perú (UTC-5)
  fechaInicio: string = UtilDate.toPeruIsoString(new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }))).slice(0, 10);
  fechaFin: string = UtilDate.toPeruIsoString(new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }))).slice(0, 10);

  lstPagosSeleccionados: string[] = [];

  idCanalVenta: number = 0;

  tiposCanalVenta: any[] = [];

  constructor(public router: Router, private pagoPedidoService: PagoPedidoService, private canalVentaService: CanalVentaService) {

  }

  ngOnInit(): void {
    this.getCanalesVenta();
    this.cargarPagos();
  }

  getCanalesVenta(){
    this.canalVentaService.getCanalesVenta().subscribe((data) => {
      if(data) {
        this.tiposCanalVenta = data;
      }
    });
  }

  cargarPagos() {
    this.pagoPedidoService.listarPagosPorFechas(this.fechaInicio, this.fechaFin).subscribe((data: any[]) => {
      this.pagos = data;
      this.pagosTable = data;
      this.collectionSize = data.length;
      this.refreshPagos();
    });
  }

  refreshPagos() {
    this.pagos = this.pagosTable
      .map((pago, i) => ({ id: i + 1, ...pago }))
      .slice(
        (this.page - 1) * this.pageSize,
        (this.page - 1) * this.pageSize + this.pageSize
      );
  }

}
