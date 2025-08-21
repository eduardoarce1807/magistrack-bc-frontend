import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ClienteService } from '../../../services/cliente.service';
import { TipoDocumentoService } from '../../../services/tipo-documento.service';
import { MedioContactoService } from '../../../services/medio-contacto.service';
import { RolService } from '../../../services/rol.service';
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
  tiposDocumento: any[] = [];
  mediosContacto: any[] = [];
  roles: any[] = [];
  isCodigoReferidoValid: boolean | undefined = undefined;
  isEditing: boolean = false;
  passwordTouched: boolean = false;
  isSubmitting: boolean = false;

  private routeSubscription: Subscription | null = null;
  showPassword: any;

  titleText: string = 'Registro de Cliente';

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private tipoDocumentoService: TipoDocumentoService,
    private medioContactoService: MedioContactoService,
    private rolService: RolService,
    private route: ActivatedRoute,
    public router: Router,
    private emailService: EmailService
  ) {
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;

    this.clienteForm = this.fb.group({
      usuario: ['', Validators.required],
      password: ['', [
      Validators.required,
      Validators.pattern(passwordPattern)
      ]],
      rol: ['', Validators.required],
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
    }, { validators: (form: FormGroup) => this.correosIgualesValidator(form) });

    
  }

  correosIgualesValidator(form: FormGroup) {
    // Skip validation during editing mode
    if (this.isEditing === true) {
      return null;
    }
    
    const correo = form.get('correo')?.value;
    const confirmCorreo = form.get('confirmCorreo')?.value;
    
    // Only validate if both fields have values
    if (!correo || !confirmCorreo) {
      return null;
    }
    
    return correo !== confirmCorreo ? { correosNoCoinciden: true } : null;
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
            // Map idRol to rol field for form compatibility
            if (cliente.idRol) {
              cliente.rol = cliente.idRol;
            }
            
            this.clienteForm.patchValue(cliente);
            this.clienteForm.get('usuario')?.disable();
            this.clienteForm.get('referidoPor')?.disable();
            this.clienteForm.get('confirmCorreo')?.disable();
            this.clienteForm.get('correo')?.disable();
            
            // Remove confirmCorreo validation requirement when editing
            this.clienteForm.get('confirmCorreo')?.clearValidators();
            this.clienteForm.get('confirmCorreo')?.updateValueAndValidity();
            
            // Check if password meets current requirements and show warning if not
            const passwordControl = this.clienteForm.get('password');
            if (passwordControl?.invalid) {
              // Mark as touched to show validation message immediately
              passwordControl.markAsTouched();
              this.passwordTouched = true;
            }
            
            // Track when password field is touched during editing
            this.clienteForm.get('password')?.valueChanges.subscribe(() => {
              this.passwordTouched = true;
            });
          }
        );
      }
    });

    this.cargarTiposDocumento();
    this.cargarMediosContacto();
    this.cargarRoles();
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

  cargarRoles(): void {
    this.rolService.getRoles().subscribe(
      (roles: any[]) => (this.roles = roles),
      (error: any) => console.error('Error al cargar roles', error)
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

    this.isSubmitting = true;

    const formValues = this.clienteForm.value;
    const clienteData = {
      usuario: this.clienteForm.get('usuario')?.value,
      password: formValues.password,
      idRol: +formValues.rol,
      nombres: formValues.nombres,
      apellidos: formValues.apellidos,
      tipoDocumento: +formValues.tipoDocumento,
      numeroDocumento: formValues.numeroDocumento,
      telefono: formValues.telefono,
      telefono2: formValues.telefono2,
      correo: this.clienteForm.get('correo')?.value, // Get value directly from control, even if disabled
      empresaAsociada: formValues.empresaAsociada,
      direccion: formValues.direccion,
      fechaNacimiento: formValues.fechaNacimiento,
      medioContacto: +formValues.medioContacto,
      profesion: formValues.profesion,
      observaciones: formValues.observaciones,
      colegioProfesional: formValues.colegioProfesional,
      numeroColegiatura: formValues.numeroColegiatura,
      referidoPor: this.clienteForm.get('referidoPor')?.value,
      archivoBase64: this.archivoBase64 || '',
      nombreArchivo: this.nombreArchivo || '',
      extensionArchivo: this.extensionArchivo || '',
    };

    console.log('Datos del cliente:', clienteData);

    if(!this.isEditing) {
      this.clienteService.createClienteUsuario(clienteData).subscribe(
        (data) => {
          this.isSubmitting = false;
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
          this.isSubmitting = false;
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
          this.isSubmitting = false;
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
          this.isSubmitting = false;
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

  archivoBase64: string = '';
  nombreArchivo: string = '';
  extensionArchivo: string = '';
  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file: File | undefined = input?.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;

        // Armar la request completa
        this.archivoBase64 = base64; // Incluye "data:application/pdf;base64,..." o similar
        this.nombreArchivo = file.name.split('.').slice(0, -1).join('.');
        this.extensionArchivo = file.name.split('.').pop()!;
      };
      reader.readAsDataURL(file); // genera base64 completo con encabezado
    }
  }
}
