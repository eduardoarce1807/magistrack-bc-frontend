import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UsuarioService } from '../../../services/usuario.service';
import { AnuncioService } from '../../../services/anuncio.service';
import { GoogleDriveImagePipe } from '../../../pipes/google-drive-image.pipe';
import { NotificationManagerService } from '../../../services/notification-manager.service';
import Swal from 'sweetalert2';

declare const grecaptcha: any;

// Definir función global para el callback
(window as any).onRecaptchaCallback = (token: string) => {
  (window as any).loginComponentInstance?.onRecaptchaSuccess(token);
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {

  loginForm: FormGroup;
  recaptchaToken: string = '';
  showPassword: boolean = false;
  private siteKey = '6Lcm-torAAAAAHUxC-nR_ZsHmb053eoaVhM7szyP';
  private recaptchaId: any;

  // propiedad que contiene el estilo inline para aplicar el background
  backgroundStyle: string | null = null;
  isLoadingBackground = false;

  // instancia local del pipe para convertir URLs de Google Drive a enlace directo
  private googleDrivePipe = new GoogleDriveImagePipe();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private usuarioService: UsuarioService,
    private anuncioService: AnuncioService,
    private notificationManager: NotificationManagerService
  ) {
    this.loginForm = this.fb.group({
      usuario: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
    
    // Asignar instancia global para el callback
    (window as any).loginComponentInstance = this;
  }

  ngOnInit(): void {
    this.initializeRecaptcha();
    // Cargar configuración pública del background del login
    this.loadLoginBackground();
  }

  ngOnDestroy(): void {
    this.recaptchaToken = '';
    (window as any).loginComponentInstance = null;
  }

  private initializeRecaptcha(): void {
    // Esperar a que reCAPTCHA se cargue
    const checkRecaptcha = () => {
      if (typeof grecaptcha !== 'undefined') {
        try {
          this.recaptchaId = grecaptcha.render(document.querySelector('.g-recaptcha'), {
            sitekey: this.siteKey,
            size: 'invisible',
            callback: 'onRecaptchaCallback'
          });
          console.log('reCAPTCHA v2 invisible inicializado correctamente');
        } catch (error) {
          console.error('Error al inicializar reCAPTCHA:', error);
        }
      } else {
        setTimeout(checkRecaptcha, 100);
      }
    };
    checkRecaptcha();
  }

  // Callback que se ejecuta cuando reCAPTCHA se completa exitosamente
  onRecaptchaSuccess(token: string): void {
    this.recaptchaToken = token;
    console.log('reCAPTCHA completado exitosamente');
    // Proceder con el login
    this.submitLogin();
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      try {
        // Ejecutar reCAPTCHA invisible
        grecaptcha.execute(this.recaptchaId);
      } catch (error) {
        console.error('Error al ejecutar reCAPTCHA:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error de verificación',
          text: 'Error al verificar reCAPTCHA. Por favor, recarga la página.',
          showConfirmButton: true
        });
      }
    }
  }

  private submitLogin(): void {
    const { usuario, password } = this.loginForm.value;
    const loginData = {
      usuario,
      password,
      recaptcha_token: this.recaptchaToken
    };

    this.usuarioService.login(loginData).subscribe(
      (response: any) => {
        if (response.success) {
          const token = response.token;
          localStorage.setItem('jwt-magistrack-bc', token);
          localStorage.setItem('usuario-magistrack-bc', JSON.stringify(response.usuario));
          console.log('Login exitoso', token);
          
          // Show success message if reCAPTCHA score is provided
          if (response.recaptcha_score) {
            console.log('reCAPTCHA Score:', response.recaptcha_score);
          }
          
          // Inicializar notificaciones después de un login exitoso
          // El timeout asegura que el localStorage se haya actualizado
          this.notificationManager.initializeNotifications();
          
          this.router.navigate(['/pages/home']);
        } else {
          // Handle unsuccessful login with success: false
          this.handleLoginError(response.message || 'Error en el login');
        }
      },
      error => {
        console.error('Error de login', error);
        const errorMessage = error.error?.message || 'Usuario o contraseña incorrectos';
        this.handleLoginError(errorMessage);
      }
    );
  }

  private loadLoginBackground(): void {
    this.isLoadingBackground = true;
    this.anuncioService.getLoginBackgroundConfig().subscribe(
      (resp: any) => {
        this.isLoadingBackground = false;
        if (resp && resp.success && resp.data) {
          const bg = resp.data.backgroundActivo;
          if (bg && bg.urlImagen) {
            // Convertir URL a formato directo si es necesario y aplicar estilo
            const directUrl = this.googleDrivePipe.transform(bg.urlImagen);
            this.backgroundStyle = `url('${directUrl}')`;
            return;
          }
        }
        // Si no hay fondo activo, limpiar para usar patrón por defecto
        this.backgroundStyle = null;
      },
      error => {
        console.error('Error cargando configuración de background:', error);
        this.isLoadingBackground = false;
        this.backgroundStyle = null;
      }
    );
  }

  private handleLoginError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error de acceso',
      text: message,
      showConfirmButton: true
    }).then(() => {
      this.loginForm.get('password')?.reset();
      // Reset reCAPTCHA para permitir nuevo intento
      this.resetRecaptcha();
    });
  }

  private resetRecaptcha(): void {
    if (typeof grecaptcha !== 'undefined' && this.recaptchaId !== undefined) {
      try {
        grecaptcha.reset(this.recaptchaId);
        this.recaptchaToken = '';
        console.log('reCAPTCHA reseteado');
      } catch (error) {
        console.error('Error al resetear reCAPTCHA:', error);
      }
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  goToRegister(): void {
    this.router.navigate(['/registro-publico']);
  }

}
