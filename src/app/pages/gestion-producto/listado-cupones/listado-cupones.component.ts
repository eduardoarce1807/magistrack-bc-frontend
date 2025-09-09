import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbTypeaheadModule, NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { ClienteService } from '../../../services/cliente.service';
import { PedidoService } from '../../../services/pedido.service';
import { CuponService } from '../../../services/cupon.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-listado-cupones',
  standalone: true,
  imports: [FormsModule, NgbTypeaheadModule, NgbPaginationModule, CommonModule, NgbTooltipModule],
  templateUrl: './listado-cupones.component.html',
  styleUrl: './listado-cupones.component.scss'
})
export class ListadoCuponesComponent implements OnInit {

  cupones: any[] = [];
  cuponesTable: any[] = [];
  page = 1;
  pageSize = 5;
  collectionSize = this.cupones.length;

  lstCuponesSeleccionados: string[] = [];

  constructor(private clienteService: ClienteService,
              private pedidoService: PedidoService, public router: Router,
            private cuponService: CuponService) {}

  ngOnInit(): void {
    this.cargarCupones();
  }

  cargarCupones(): void {
    this.cuponService.listarCuponesDetallado().subscribe(
      (cupones) => {
        this.cuponesTable = cupones;
        this.collectionSize = this.cuponesTable.length;
        this.refreshCupones();
      },
      (error) => console.error('Error al cargar cupones', error)
    );
  }

  refreshCupones() {
    this.cupones = this.cuponesTable
      .map((cupon, i) => ({ id: i + 1, ...cupon }))
      .slice(
        (this.page - 1) * this.pageSize,
        (this.page - 1) * this.pageSize + this.pageSize
      );
  }

  desactivarCupon(cuponId: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.cuponService.desactivarCupon(cuponId).subscribe(
          (data: any) => {
            if(data && data.idResultado === 1) {
              Swal.fire({
                title: '¡Listo!',
                text: data.mensaje,
                icon: 'success'
              });
              this.cargarCupones(); // Recargar la lista de cupones
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
              text: 'No se pudo desactivar el cupón.',
              icon: 'error'
            });
          }
          
        );
      }
    });
  }

  activarCupon(cuponId: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Confirmarás la activación de este cupón.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, activar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.cuponService.activarCupon(cuponId).subscribe(
          (data: any) => {
            if(data && data.idResultado === 1) {
              Swal.fire({
                title: '¡Listo!',
                text: data.mensaje,
                icon: 'success'
              });
              this.cargarCupones(); // Recargar la lista de cupones
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
              text: 'No se pudo activar el cupón.',
              icon: 'error'
            });
          }
          
        );
      }
    });
  }
}
