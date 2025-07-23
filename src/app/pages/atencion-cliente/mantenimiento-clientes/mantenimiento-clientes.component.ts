import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbTypeaheadModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ClienteService } from '../../../services/cliente.service';
import { PedidoService } from '../../../services/pedido.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mantenimiento-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbTypeaheadModule, NgbPaginationModule, TableModule, ButtonModule, IconFieldModule, InputIconModule, InputTextModule],
  templateUrl: './mantenimiento-clientes.component.html',
  styleUrl: './mantenimiento-clientes.component.scss'
})
export class MantenimientoClientesComponent implements OnInit {

  clientes: any[] = [];
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
}
