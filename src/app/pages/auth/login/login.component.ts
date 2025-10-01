import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService } from '../../../services/usuario.service';
import Swal from 'sweetalert2';

declare const grecaptcha: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {

  loginForm: FormGroup;
  recaptchaToken: string = '';
  private siteKey = '6Ld2ItorAAAAACmsXU_lGvFX6eJt05mYLd901s8B';

  constructor(private fb: FormBuilder, private router: Router, private usuarioService: UsuarioService) {
    this.loginForm = this.fb.group({
      usuario: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.initializeRecaptcha();
  }

  ngOnDestroy(): void {
    // Clear token on component destroy
    this.recaptchaToken = '';
  }

  private initializeRecaptcha(): void {
    // Wait for reCAPTCHA to load
    const checkRecaptcha = () => {
      if (typeof grecaptcha !== 'undefined') {
        grecaptcha.ready(() => {
          console.log('reCAPTCHA v3 loaded successfully');
        });
      } else {
        setTimeout(checkRecaptcha, 100);
      }
    };
    checkRecaptcha();
  }

  private executeRecaptcha(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (typeof grecaptcha !== 'undefined') {
        grecaptcha.execute(this.siteKey, { action: 'login' }).then((token: string) => {
          resolve(token);
        }).catch((error: any) => {
          reject(error);
        });
      } else {
        reject('reCAPTCHA not loaded');
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      // Execute reCAPTCHA v3 before submitting
      this.executeRecaptcha()
        .then((token: string) => {
          this.recaptchaToken = token;
          this.submitLogin();
        })
        .catch((error) => {
          console.error('reCAPTCHA error:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error de verificación',
            text: 'Error al verificar reCAPTCHA. Por favor, recarga la página.',
            showConfirmButton: true
          });
        });
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

  private handleLoginError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error de acceso',
      text: message,
      showConfirmButton: true
    }).then(() => {
      this.loginForm.get('password')?.reset();
      // Clear the token for next attempt
      this.recaptchaToken = '';
    });
  }

  goToRegister(): void {
    this.router.navigate(['/registro-publico']);
  }

}
