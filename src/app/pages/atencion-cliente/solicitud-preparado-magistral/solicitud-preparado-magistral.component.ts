import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SolicitudPreparadoMagistralService } from '../../../services/solicitud-preparado-magistral.service';
import { DataService } from '../../../services/data.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-solicitud-preparado-magistral',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './solicitud-preparado-magistral.component.html',
  styleUrls: ['./solicitud-preparado-magistral.component.scss']
})
export class SolicitudPreparadoMagistralComponent implements OnInit {
  solicitudForm: FormGroup;
  clientes: any[] = [];
  archivoSeleccionado: File | null = null;
  isSubmitting: boolean = false;
  maxFileSize = 4 * 1024 * 1024; // 5MB en bytes

  constructor(
    private fb: FormBuilder,
    private solicitudService: SolicitudPreparadoMagistralService,
    private dataService: DataService
  ) {
    this.solicitudForm = this.fb.group({
      descripcion: ['', Validators.required],
      archivo: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Ya no necesitamos cargar clientes
    // El idCliente se obtiene del usuario logueado
  }

  get idCliente(): number {
    const usuario = this.dataService.getLoggedUser();
    return usuario?.cliente?.idCliente || 0;
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      // Validar tamaño del archivo
      if (file.size > this.maxFileSize) {
        Swal.fire({
          icon: 'error',
          title: 'Archivo muy grande',
          text: 'El archivo no puede ser mayor a 5MB',
          showConfirmButton: true
        });
        
        // Limpiar el input
        input.value = '';
        this.archivoSeleccionado = null;
        this.solicitudForm.get('archivo')?.setValue('');
        return;
      }

      this.archivoSeleccionado = file;
      this.solicitudForm.get('archivo')?.setValue(file.name);
    } else {
      this.archivoSeleccionado = null;
      this.solicitudForm.get('archivo')?.setValue('');
    }
  }

  get isFormValid(): boolean {
    return this.solicitudForm.valid && this.archivoSeleccionado !== null;
  }

  onSubmit(): void {
    if (!this.isFormValid) {
      this.solicitudForm.markAllAsTouched();
      return;
    }

    // Validar que el usuario tenga un cliente asociado
    if (!this.idCliente) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo obtener la información del cliente. Por favor, inicie sesión nuevamente.',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    this.isSubmitting = true;

    // Mostrar loader
    Swal.fire({
      title: 'Enviando solicitud...',
      allowEscapeKey: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const formValues = this.solicitudForm.value;
    const descripcion = formValues.descripcion;

    this.solicitudService.crearSolicitud(this.idCliente, descripcion, this.archivoSeleccionado!).subscribe(
      (response) => {
        this.isSubmitting = false;
        Swal.close();
        
        // Mostrar respuesta exitosa
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: response.mensaje,
          showConfirmButton: true,
          allowEscapeKey: false,
          allowOutsideClick: false,
        }).then(() => {
          this.limpiarFormulario();
        });
      },
      (error) => {
        this.isSubmitting = false;
        Swal.close();
        
        console.error('Error al enviar solicitud', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.mensaje || 'Ocurrió un error al enviar la solicitud',
          showConfirmButton: true
        });
      }
    );
  }

  limpiarFormulario(): void {
    this.solicitudForm.reset();
    this.archivoSeleccionado = null;
    
    // Limpiar el input file
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
}
