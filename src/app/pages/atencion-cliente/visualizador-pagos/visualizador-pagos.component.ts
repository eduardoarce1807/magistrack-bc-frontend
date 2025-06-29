import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbTypeaheadModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { PagoPedidoService } from '../../../services/pago-pedido.service';

@Component({
  selector: 'app-visualizador-pagos',
  standalone: true,
  imports: [FormsModule, NgbTypeaheadModule, NgbPaginationModule],
  templateUrl: './visualizador-pagos.component.html',
  styleUrl: './visualizador-pagos.component.scss'
})
export class VisualizadorPagosComponent implements OnInit {

  pagos: any[] = [];
	pagosTable: any[] = [];
	page = 1;
	pageSize = 5;
	collectionSize = this.pagos.length;

  fechaInicio: string = new Date().toISOString().split('T')[0];
  fechaFin: string = new Date().toISOString().split('T')[0];

	lstPagosSeleccionados: string[] = [];

  constructor(public router: Router, private pagoPedidoService: PagoPedidoService) {

  }

  ngOnInit(): void {
    this.cargarPagos();
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
