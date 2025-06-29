import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ClienteService } from '../../../services/cliente.service';
import { TipoDocumentoService } from '../../../services/tipo-documento.service';
import { MedioContactoService } from '../../../services/medio-contacto.service';
import Swal from 'sweetalert2';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { EmailService } from '../../../services/email.service';

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
  isEditing: boolean = false;

  private routeSubscription: Subscription | null = null;
  showPassword: any;

  titleText: string = 'Registro de Cliente';

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private tipoDocumentoService: TipoDocumentoService,
    private medioContactoService: MedioContactoService,
    private route: ActivatedRoute,
    private router: Router,
    private emailService: EmailService
  ) {
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;

    this.clienteForm = this.fb.group({
      usuario: ['', Validators.required],
      password: ['', [
      Validators.required,
      Validators.pattern(passwordPattern)
      ]],
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      tipoDocumento: ['', Validators.required],
      numeroDocumento: ['', Validators.required],
      telefono: ['', Validators.required],
      telefono2: [''],
      correo: ['', [Validators.required, Validators.email]],
      confirmCorreo: ['', [Validators.required, Validators.email]],
      empresaAsociada: [''],
      direccion: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      medioContacto: [null],
      profesion: [''],
      observaciones: [null],
      colegioProfesional: [null],
      numeroColegiatura: [null],
      documentoAdicional: [null],
      referidoPor: ['']
    }, { validators: this.correosIgualesValidator });

    
  }

  correosIgualesValidator(form: FormGroup) {
    const correo = form.get('correo')?.value;
    const confirmCorreo = form.get('confirmCorreo')?.value;
    return correo && confirmCorreo && correo !== confirmCorreo ? { correosNoCoinciden: true } : null;
  }

  onTelefonoInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (!input) return;
    let sanitized = (input.value || '').replace(/[^0-9]/g, '');
    if (sanitized.length > 9) {
      sanitized = sanitized.slice(0, 9);
    }
    input.value = sanitized;
    this.clienteForm.get('telefono')?.setValue(sanitized, { emitEvent: false });
    // Opcional: marcar el campo como inválido si no tiene exactamente 9 dígitos
    if (sanitized.length !== 9) {
      this.clienteForm.get('telefono')?.setErrors({ length: true });
    } else {
      this.clienteForm.get('telefono')?.setErrors(null);
    }
  }

  onTelefono2Input(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (!input) return;
    let sanitized = (input.value || '').replace(/[^0-9]/g, '');
    if (sanitized.length > 9) {
      sanitized = sanitized.slice(0, 9);
    }
    input.value = sanitized;
    this.clienteForm.get('telefono2')?.setValue(sanitized, { emitEvent: false });
    // Opcional: marcar el campo como inválido si no tiene exactamente 9 dígitos
    if (sanitized.length !== 9) {
      this.clienteForm.get('telefono2')?.setErrors({ length: true });
    } else {
      this.clienteForm.get('telefono2')?.setErrors(null);
    }
  }

  ngOnInit(): void {

    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const idCliente = Number(params.get('idCliente'));
      if (!isNaN(idCliente) && idCliente > 0) {
        this.isEditing = true;
        this.titleText = 'Actualizar Cliente';
        this.clienteService.getClienteCompleto(idCliente).subscribe(
          (cliente) => {
            this.clienteForm.patchValue(cliente);
            this.clienteForm.get('usuario')?.disable();
            this.clienteForm.get('referidoPor')?.disable();
            this.clienteForm.get('confirmCorreo')?.disable();
          }
        );
      }
    });

    this.cargarTiposDocumento();
    this.cargarMediosContacto();
  }

  onNombreInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const control = this.clienteForm.get('nombres');
    if (control && input) {
      control.setValue(input.value.toUpperCase(), { emitEvent: false });
    }
  }

  onApellidoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const control = this.clienteForm.get('apellidos');
    if (control && input) {
      control.setValue(input.value.toUpperCase(), { emitEvent: false });
    }
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
      usuario: this.clienteForm.get('usuario')?.value,
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
      referidoPor: this.clienteForm.get('referidoPor')?.value
    };

    console.log('Datos del cliente:', clienteData);

    if(!this.isEditing) {
      this.clienteService.createClienteUsuario(clienteData).subscribe(
        (data) => {
          if(data && data.idResultado == 1){
            let emailRequest = {
              para: this.clienteForm.get('correo')?.value,
              asunto: 'BELLACURET | Bienvenido a Bellacuret',
              mensaje: ``,
              usuario: this.clienteForm.get('usuario')?.value,
            }

            this.emailService.sendEmailBienvenida(emailRequest).subscribe(
              (response) => {
                console.log('Email enviado:', response);
              },
              (error) => {
                console.error('Error al enviar email:', error);
              }
            );
            Swal.fire({
              icon: 'success',
              title: '¡Listo!',
              text: data.mensaje,
              showConfirmButton: true,
              allowEscapeKey: false,
              allowOutsideClick: false,
            }).then(() => {
              this.clienteForm.reset();
              this.router.navigate(['/pages/atencion-cliente/mantenimiento-clientes']);
            });
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
    }else{
      this.clienteService.updateClienteUsuario(clienteData).subscribe(
        (data) => {
          if(data && data.idResultado == 1){
            Swal.fire({
              icon: 'success',
              title: '¡Listo!',
              text: data.mensaje,
              showConfirmButton: true,
              allowEscapeKey: false,
              allowOutsideClick: false,
            }).then(() => {
              this.router.navigate(['/pages/atencion-cliente/mantenimiento-clientes']);
            }
            );
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
