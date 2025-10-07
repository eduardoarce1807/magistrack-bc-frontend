import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { QuejasReclamosService } from '../../../services/quejas-reclamos.service';
import { TipoDocumentoService } from '../../../services/tipo-documento.service';
import { DataService } from '../../../services/data.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-quejas-reclamos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './quejas-reclamos.component.html',
  styleUrl: './quejas-reclamos.component.scss'
})
export class QuejasReclamosComponent implements OnInit {
  quejaReclamoForm: FormGroup;
  tiposDocumento: any[] = [];
  correlativoActual: string = '';
  tipoDocumentoActual: string = '';
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private quejasReclamosService: QuejasReclamosService,
    private tipoDocumentoService: TipoDocumentoService,
    private dataService: DataService
  ) {
    this.quejaReclamoForm = this.createForm();
  }

  ngOnInit(): void {
    this.cargarTiposDocumento();
    this.inicializarFormulario();
  }

  createForm(): FormGroup {
    return this.fb.group({
      tipoDocumentoPersona: ['DNI', Validators.required],
      numeroDocumento: ['', Validators.required],
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      tipoDireccion: ['Domicilio', Validators.required],
      direccionDomicilio: ['', Validators.required],
      correoElectronico: ['', [Validators.required, Validators.email]],
      numeroTelefono: ['', Validators.required],
      tipoQuejaReclamo: ['QJ', Validators.required],
      detalleQuejaReclamo: ['', Validators.required]
    });
  }

  cargarTiposDocumento(): void {
    this.tipoDocumentoService.getTiposDocumento().subscribe({
      next: (tipos) => {
        this.tiposDocumento = tipos;
      },
      error: (error) => {
        console.error('Error al cargar tipos de documento:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los tipos de documento.'
        });
      }
    });
  }

  inicializarFormulario(): void {
    const loggedUser = this.dataService.getLoggedUser();
    if (loggedUser && loggedUser.cliente) {
      const cliente = loggedUser.cliente;
      
      this.quejaReclamoForm.patchValue({
        tipoDocumentoPersona: cliente.tipoDocumento?.nombre || 'DNI',
        numeroDocumento: cliente.numeroDocumento || '',
        nombres: cliente.nombres || '',
        apellidos: cliente.apellidos || '',
        correoElectronico: cliente.correoElectronico || '',
        numeroTelefono: cliente.telefono || '',
        tipoDireccion: 'Domicilio',
        tipoQuejaReclamo: 'QJ'
      });
    } else {
      // Si no hay usuario logueado, establecer valores por defecto
      this.quejaReclamoForm.patchValue({
        tipoDocumentoPersona: 'DNI',
        tipoDireccion: 'Domicilio',
        tipoQuejaReclamo: 'QJ'
      });
    }

    // Cargar el próximo ID por defecto (Queja)
    this.onTipoQuejaReclamoChange();
  }

  onTipoQuejaReclamoChange(): void {
    const tipoSeleccionado = this.quejaReclamoForm.get('tipoQuejaReclamo')?.value;
    this.cargarProximoId(tipoSeleccionado);
  }

  cargarProximoId(tipo: 'QJ' | 'REC'): void {
    this.quejasReclamosService.getProximoId(tipo).subscribe({
      next: (response) => {
        if (response.exitoso) {
          this.correlativoActual = response.correlativoGenerado;
          this.tipoDocumentoActual = response.tipoDocumento;
        }
      },
      error: (error) => {
        console.error('Error al obtener próximo ID:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo obtener el correlativo.'
        });
      }
    });
  }

  onSubmit(): void {
    if (this.quejaReclamoForm.valid) {
      this.isLoading = true;
      
      const formData = this.quejaReclamoForm.value;
      
      this.quejasReclamosService.procesarQuejaReclamo(formData).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.exitoso) {
            Swal.fire({
              icon: 'success',
              title: '¡Éxito!',
              text: `${response.mensaje}`,
              html: `
                <p>${response.mensaje}</p>
                <p><strong>Correlativo generado:</strong> ${response.correlativoGenerado}</p>
                <p>Pronto atenderemos su solicitud por correo y vía WhatsApp.</p>
              `,
              showConfirmButton: true
            }).then(() => {
              this.resetForm();
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: response.mensaje || 'Ocurrió un error al procesar la solicitud.'
            });
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error al procesar queja/reclamo:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo procesar la solicitud. Inténtelo de nuevo.'
          });
        }
      });
    } else {
      this.markFormGroupTouched();
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor, complete todos los campos obligatorios.'
      });
    }
  }

  resetForm(): void {
    this.quejaReclamoForm.reset({
      tipoDocumentoPersona: 'DNI',
      numeroDocumento: '',
      nombres: '',
      apellidos: '',
      tipoDireccion: 'Domicilio',
      direccionDomicilio: '',
      correoElectronico: '',
      numeroTelefono: '',
      tipoQuejaReclamo: 'QJ',
      detalleQuejaReclamo: ''
    });
    this.inicializarFormulario();
  }

  markFormGroupTouched(): void {
    Object.keys(this.quejaReclamoForm.controls).forEach(key => {
      const control = this.quejaReclamoForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.quejaReclamoForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.quejaReclamoForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return 'Este campo es obligatorio';
      }
      if (field.errors['email']) {
        return 'Ingrese un email válido';
      }
    }
    return '';
  }

  goBack(): void {
    this.router.navigate(['/pages/atencion-cliente/bandeja-pedidos']);
  }
}