import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ClienteService } from '../../../services/cliente.service';
import { TipoDocumentoService } from '../../../services/tipo-documento.service';
import { MedioContactoService } from '../../../services/medio-contacto.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-registro-cliente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registro-cliente.component.html',
  styleUrls: ['./registro-cliente.component.scss']
})
export class RegistroClienteComponent implements OnInit {
  clienteForm: FormGroup;
  nombreArchivo: string = '';
  tiposDocumento: any[] = [];
  mediosContacto: any[] = [];
  isCodigoReferidoValid: boolean | undefined = undefined;

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private tipoDocumentoService: TipoDocumentoService,
    private medioContactoService: MedioContactoService
  ) {
    this.clienteForm = this.fb.group({
      usuario: ['', Validators.required],
      password: ['', Validators.required],
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      tipoDocumento: ['', Validators.required],
      numeroDocumento: ['', Validators.required],
      telefono: ['', Validators.required],
      telefono2: [''],
      correo: ['', [Validators.required, Validators.email]],
      empresaAsociada: [''],
      direccion: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      medioContacto: [''],
      profesion: [''],
      observaciones: [null],
      colegioProfesional: [null],
      numeroColegiatura: [null],
      documentoAdicional: [null],
      referidoPor: ['']
    });
  }

  ngOnInit(): void {
    this.cargarTiposDocumento();
    this.cargarMediosContacto();
  }

  changeCodigoReferido($event: any): void {
    const codigoReferido = $event.target.value;
    console.log('Código referido ingresado:', codigoReferido);
    this.isCodigoReferidoValid = undefined;
  }

  cargarTiposDocumento(): void {
    this.tipoDocumentoService.getTiposDocumento().subscribe(
      (tipos) => (this.tiposDocumento = tipos),
      (error) => console.error('Error al cargar tipos de documento', error)
    );
  }

  cargarMediosContacto(): void {
    this.medioContactoService.getMediosContacto().subscribe(
      (medios: any[]) => (this.mediosContacto = medios),
      (error: any) => console.error('Error al cargar medios de contacto', error)
    );
  }

  validarCodigoReferido(): void {
    const codigoReferido = this.clienteForm.get('referidoPor')?.value;
    if (codigoReferido) {
      this.clienteService.validarCodigoReferido(codigoReferido).subscribe(
        (response) => {
          this.isCodigoReferidoValid = response;
        },
        (error) => {
          console.error('Error al validar código referido', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.error.mensaje,
            showConfirmButton: true
          });
        }
      );
    }
  }

  onSubmit(): void {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      return;
    }

    const formValues = this.clienteForm.value;
    const clienteData = {
      usuario: formValues.usuario,
      password: formValues.password,
      nombres: formValues.nombres,
      apellidos: formValues.apellidos,
      tipoDocumento: +formValues.tipoDocumento,
      numeroDocumento: formValues.numeroDocumento,
      telefono: formValues.telefono,
      telefono2: formValues.telefono2,
      correo: formValues.correo,
      empresaAsociada: formValues.empresaAsociada,
      direccion: formValues.direccion,
      fechaNacimiento: formValues.fechaNacimiento,
      medioContacto: +formValues.medioContacto,
      profesion: formValues.profesion,
      observaciones: formValues.observaciones,
      colegioProfesional: formValues.colegioProfesional,
      numeroColegiatura: formValues.numeroColegiatura,
      documentoAdicional: 'C:/TestArchivos/' + this.nombreArchivo,
      referidoPor: formValues.referidoPor
    };

    console.log('Datos del cliente:', clienteData);

    this.clienteService.createClienteUsuario(clienteData).subscribe(
      (data) => {
        if(data && data.idResultado == 1){
          Swal.fire({
            icon: 'success',
            title: '¡Listo!',
            text: data.mensaje,
            showConfirmButton: true,
            timer: 2000
          });
          this.clienteForm.reset();
        }else{
          Swal.fire({
            icon: 'error',
            title: 'Oops!',
            text: data.mensaje,
            showConfirmButton: true
          });
        }
      },
      (error) => {
        console.error('Error al registrar cliente', error);
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: error.error.mensaje,
          showConfirmButton: true
        });
      }
    );
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const documentoAdicional = input.files[0];
      this.clienteForm.patchValue({ documentoAdicional });
      this.nombreArchivo = documentoAdicional.name;
    }
  }
}
