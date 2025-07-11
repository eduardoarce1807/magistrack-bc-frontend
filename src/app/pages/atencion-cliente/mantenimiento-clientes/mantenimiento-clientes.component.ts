import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbTypeaheadModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ClienteService } from '../../../services/cliente.service';
import { PedidoService } from '../../../services/pedido.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-mantenimiento-clientes',
  standalone: true,
  imports: [FormsModule, NgbTypeaheadModule, NgbPaginationModule],
  templateUrl: './mantenimiento-clientes.component.html',
  styleUrl: './mantenimiento-clientes.component.scss'
})
export class MantenimientoClientesComponent implements OnInit {

  clientes: any[] = [];
	clientesTable: any[] = [];
	page = 1;
	pageSize = 5;
	collectionSize = this.clientes.length;

	lstClientesSeleccionados: string[] = [];

  constructor(private clienteService: ClienteService,
              private pedidoService: PedidoService, public router: Router) {}

  ngOnInit(): void {
		this.cargarClientes();
	}

	cargarClientes(): void {
		this.clienteService.getClientes().subscribe(
			(clientes) => {
				this.clientesTable = clientes;
				this.collectionSize = this.clientesTable.length;
				this.refreshClientes();
			},
			(error) => console.error('Error al cargar clientes', error)
		);
	}

	refreshClientes() {
		this.clientes = this.clientesTable
			.map((cliente, i) => ({ id: i + 1, ...cliente }))
			.slice(
				(this.page - 1) * this.pageSize,
				(this.page - 1) * this.pageSize + this.pageSize
			);
	}

  desactivarCliente(clienteId: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.clienteService.desactivarCliente(clienteId).subscribe(
          (data) => {
            if(data && data.idResultado === 1) {
              Swal.fire({
                title: '¡Listo!',
                text: data.resultado,
                icon: 'success'
              });
              this.cargarClientes(); // Recargar la lista de clientes
            } else {
              Swal.fire({
                title: 'Error',
                text: data.resultado,
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
}
