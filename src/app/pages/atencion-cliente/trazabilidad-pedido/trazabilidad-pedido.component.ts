import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { DataService } from '../../../services/data.service';
import { PedidoAuditoriaService } from '../../../services/pedido-auditoria.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-trazabilidad-pedido',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trazabilidad-pedido.component.html',
  styleUrl: './trazabilidad-pedido.component.scss'
})
export class TrazabilidadPedidoComponent implements OnInit {
  
  idPedido: string | null = null;
  private routeSubscription: Subscription | null = null;

  trazabilidadPedido: any[] = [];

  constructor(private pedidoAuditoriaService: PedidoAuditoriaService, private route: ActivatedRoute, public router: Router, private dataService: DataService) {
    // Suscribirse a los parámetros de la ruta para obtener el idPedido
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.idPedido = params.get('idPedido');
      if (this.idPedido) {
        this.cargarPedidos();
      }
    });

  } 

  ngOnInit(): void {
    // Aquí puedes cargar los datos iniciales del componente
  }

  // Método para cargar los pedidos
  cargarPedidos(): void {
    this.pedidoAuditoriaService.getAllAuditoriaByIdPedido(this.idPedido || '').subscribe(
      (trazabilidad: any) => {
        if(trazabilidad.length > 0) {
          this.trazabilidadPedido = trazabilidad;
        }else{
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se encontraron registros de trazabilidad para este pedido',
            confirmButtonText: 'Aceptar',
            allowOutsideClick: false,
            allowEscapeKey: false,
          }).then((result) => {
            if(this.dataService.getLoggedUser().rol.idRol === 1) {
              this.router.navigate(['/pages/atencion-cliente/bandeja-pedidos-administrador']);
            } else if(this.dataService.getLoggedUser().rol.idRol === 2) {
              this.router.navigate(['/pages/atencion-cliente/bandeja-pedidos']);
            }
          });
        }
        console.log('Trazabilidad del pedido:', trazabilidad);
      },
      (error) => {
        console.error('Error al cargar la trazabilidad del pedido', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se encontraron registros de trazabilidad para este pedido',
          confirmButtonText: 'Aceptar',
          allowOutsideClick: false,
          allowEscapeKey: false,
        }).then((result) => {
          if(this.dataService.getLoggedUser().rol.idRol === 1) {
            this.router.navigate(['/pages/atencion-cliente/bandeja-pedidos-administrador']);
          } else if(this.dataService.getLoggedUser().rol.idRol === 2) {
            this.router.navigate(['/pages/atencion-cliente/bandeja-pedidos']);
          }
        });
      }
    );
  }

}
