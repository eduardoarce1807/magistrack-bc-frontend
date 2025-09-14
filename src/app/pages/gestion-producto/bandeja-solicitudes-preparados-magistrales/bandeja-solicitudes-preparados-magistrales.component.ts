import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SolicitudPreparadoMagistralService } from '../../../services/solicitud-preparado-magistral.service';
import { ClienteService } from '../../../services/cliente.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

interface SolicitudPreparadoMagistral {
  id: number;
  idCliente: string;
  descripcion: string;
  urlAdjunto: string;
  fechaCreacion: string;
  atendido: boolean;
  clienteNombre?: string;
}

@Component({
  selector: 'app-bandeja-solicitudes-preparados-magistrales',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    FormsModule
  ],
  templateUrl: './bandeja-solicitudes-preparados-magistrales.component.html',
  styleUrls: ['./bandeja-solicitudes-preparados-magistrales.component.scss']
})
export class BandejaSolicitudesPreparadosMagistralesComponent implements OnInit {
  solicitudes: SolicitudPreparadoMagistral[] = [];
  clientes: any[] = [];
  searchValue: string = '';
  pageSize: number = 25;
  collectionSize: number = 0;
  isLoading: boolean = false;

  constructor(
    public router: Router,
    private solicitudService: SolicitudPreparadoMagistralService,
    private clienteService: ClienteService
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.clienteService.getClientes().subscribe(
      (clientes) => {
        this.clientes = clientes;
        this.cargarSolicitudes();
      },
      (error) => {
        console.error('Error al cargar clientes', error);
        this.cargarSolicitudes();
      }
    );
  }

  cargarSolicitudes(): void {
    this.isLoading = true;
    this.solicitudService.getSolicitudes().subscribe(
      (solicitudes) => {
        this.solicitudes = solicitudes.map(solicitud => ({
          ...solicitud,
          clienteNombre: this.obtenerNombreCliente(solicitud.idCliente)
        }));
        this.collectionSize = this.solicitudes.length;
        this.isLoading = false;
      },
      (error) => {
        console.error('Error al cargar solicitudes', error);
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las solicitudes',
          showConfirmButton: true
        });
      }
    );
  }

  obtenerNombreCliente(idCliente: string): string {
    const cliente = this.clientes.find(c => c.idCliente.toString() === idCliente);
    return cliente ? `${cliente.nombres} ${cliente.apellidos}` : `Cliente ${idCliente}`;
  }

  verArchivo(url: string): void {
    if (url) {
      window.open(url, '_blank');
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Sin archivo',
        text: 'Esta solicitud no tiene archivo adjunto',
        showConfirmButton: true
      });
    }
  }

  atenderSolicitud(solicitud: SolicitudPreparadoMagistral): void {
    if (solicitud.atendido) {
      Swal.fire({
        icon: 'info',
        title: 'Solicitud ya atendida',
        text: 'Esta solicitud ya ha sido atendida anteriormente',
        showConfirmButton: true
      });
      return;
    }

    // Navegar a la calculadora maestra con los datos de la solicitud
    this.router.navigate(['/pages/atencion-cliente/calculadora-maestra'], {
      queryParams: {
        idSolicitud: solicitud.id,
        idCliente: solicitud.idCliente,
        descripcion: solicitud.descripcion,
        modo: 'preparado-magistral'
      }
    });
  }

  filtrarTabla(table: any, searchValue: string): void {
    table.filterGlobal(searchValue, 'contains');
  }

  clear(table: any): void {
    table.clear();
    this.searchValue = '';
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEstadoTexto(atendido: boolean): string {
    return atendido ? 'Atendido' : 'Pendiente';
  }

  getEstadoClass(atendido: boolean): string {
    return atendido ? 'badge bg-success' : 'badge bg-warning text-dark';
  }
}
