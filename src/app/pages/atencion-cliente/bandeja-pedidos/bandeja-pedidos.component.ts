import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PedidoService } from '../../../services/pedido.service';
import { DataService } from '../../../services/data.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bandeja-pedidos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bandeja-pedidos.component.html',
  styleUrl: './bandeja-pedidos.component.scss'
})
export class BandejaPedidosComponent implements OnInit {
  pedidos: any[] = [];

  constructor(
    private pedidoService: PedidoService, public router: Router, public dataService: DataService){
    }

  ngOnInit(): void {
    this.cargarPedidos();
  }

  cargarPedidos(): void {
    let idCliente = this.dataService.getLoggedUser().cliente.idCliente;
    if(idCliente) {
      this.pedidoService.getPedidosByIdCliente(idCliente).subscribe(
        (pedidos) => (this.pedidos = pedidos),
        (error) => console.error('Error al cargar pedidos', error)
      );
    }else {
      console.error('Error: idCliente no encontrado');
    }
  }

  borrarPedido(idPedido: string): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Una vez eliminado, no podrás recuperar este pedido.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.pedidoService.deletePedido(idPedido).subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: '¡Listo!',
              text: 'El pedido ha sido eliminado correctamente.',
              showConfirmButton: true
            }).then(() => {
                this.cargarPedidos();
              }
            );
          },
          error: (error) => {
            console.error('Error al eliminar el pedido', error);
            Swal.fire({
              icon: 'error',
              title: 'Oops!',
              text: 'No se pudo eliminar el pedido, inténtelo de nuevo.',
              showConfirmButton: true
            });
          }
        });
      }
    });
  }
}
