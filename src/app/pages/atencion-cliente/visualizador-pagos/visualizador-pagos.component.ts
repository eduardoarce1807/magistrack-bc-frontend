import { Component, OnInit, TemplateRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbTypeaheadModule, NgbPaginationModule, NgbTooltipModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PagoPedidoService } from '../../../services/pago-pedido.service';
import { UtilDate } from '../../../util/util-date';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-visualizador-pagos',
  standalone: true,
  imports: [FormsModule, NgbTypeaheadModule, NgbPaginationModule, NgbTooltipModule, CommonModule],
  templateUrl: './visualizador-pagos.component.html',
  styleUrl: './visualizador-pagos.component.scss'
})
export class VisualizadorPagosComponent implements OnInit {

  pagos: any[] = [];
	pagosTable: any[] = [];
	page = 1;
	pageSize = 5;
	collectionSize = this.pagos.length;

  // Usar UtilDate para obtener la fecha actual en la zona horaria de Perú (UTC-5)
  fechaInicio: string = UtilDate.toPeruIsoString(new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }))).slice(0, 10);
  fechaFin: string = UtilDate.toPeruIsoString(new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }))).slice(0, 10);

	lstPagosSeleccionados: string[] = [];

  // Propiedades para el modal de adjunto
  private modalService = inject(NgbModal);
  pagoSeleccionado: any = null;
  archivoSeleccionado: File | null = null;
  errorArchivo: string = '';
  subiendoArchivo: boolean = false;

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

  // Métodos para manejo de archivos adjuntos
  abrirModalAdjunto(item: any, content: TemplateRef<any>) {
    this.pagoSeleccionado = item;
    this.archivoSeleccionado = null;
    this.errorArchivo = '';
    this.subiendoArchivo = false;
    this.modalService.open(content, { size: 'lg', centered: true });
  }

  onArchivoAdjuntoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    this.errorArchivo = '';
    this.archivoSeleccionado = null;

    if (!file) {
      return;
    }

    // Validar tipo de archivo
    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!tiposPermitidos.includes(file.type)) {
      this.errorArchivo = 'Formato de archivo no válido. Solo se permiten archivos JPG, PNG y PDF.';
      input.value = '';
      return;
    }

    // Validar tamaño del archivo (4MB = 4 * 1024 * 1024 bytes)
    const tamanoMaximo = 4 * 1024 * 1024;
    if (file.size > tamanoMaximo) {
      this.errorArchivo = 'El archivo es demasiado grande. El tamaño máximo permitido es 4MB.';
      input.value = '';
      return;
    }

    // Validar nombre del archivo
    if (file.name.length > 100) {
      this.errorArchivo = 'El nombre del archivo es demasiado largo. Máximo 100 caracteres.';
      input.value = '';
      return;
    }

    this.archivoSeleccionado = file;
  }

  formatearTamanoArchivo(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  subirArchivoAdjunto(): void {
    if (!this.archivoSeleccionado || !this.pagoSeleccionado) {
      Swal.fire({
        icon: 'warning',
        title: 'Archivo requerido',
        text: 'Por favor, seleccione un archivo para subir.',
        confirmButtonText: 'Aceptar',
      });
      return;
    }

    this.subiendoArchivo = true;

    // Crear FormData para enviar el archivo
    const formData = new FormData();
    formData.append('idPedido', this.pagoSeleccionado.pedido.idPedido);
    formData.append('archivo', this.archivoSeleccionado);

    this.pagoPedidoService.saveAdjuntoPago(formData).subscribe({
      next: (response) => {
        this.subiendoArchivo = false;
        if (response) {
          Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: `Archivo ${this.pagoSeleccionado.urlArchivo ? 'actualizado' : 'subido'} correctamente.`,
            confirmButtonText: 'Aceptar',
          }).then(() => {
            this.modalService.dismissAll();
            this.cargarPagos(); // Recargar la lista para mostrar el archivo actualizado
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo procesar el archivo. Intente nuevamente.',
            confirmButtonText: 'Aceptar',
          });
        }
      },
      error: (error) => {
        this.subiendoArchivo = false;
        console.error('Error al subir archivo:', error);
        
        let mensajeError = 'Ocurrió un error al subir el archivo. Intente nuevamente.';
        if (error.error?.mensaje) {
          mensajeError = error.error.mensaje;
        } else if (error.message) {
          mensajeError = error.message;
        }

        Swal.fire({
          icon: 'error',
          title: 'Error al subir archivo',
          text: mensajeError,
          confirmButtonText: 'Aceptar',
        });
      }
    });
  }

}
