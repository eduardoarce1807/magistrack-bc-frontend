import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService } from '../../../services/usuario.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  loginForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router, private usuarioService: UsuarioService) {
    this.loginForm = this.fb.group({
      usuario: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { usuario, password } = this.loginForm.value;

      this.usuarioService.login({ usuario, password }).subscribe(
        (response: any) => {
          const token = response.token;
          localStorage.setItem('jwt-magistrack-bc', token);  // Guarda el token en el almacenamiento local
          localStorage.setItem('usuario-magistrack-bc', JSON.stringify(response.usuario)); // Guarda el usuario en el almacenamiento local
          console.log('Login exitoso', token);
          this.router.navigate(['/pages/home']);
        },
        error => {
          console.error('Error de login', error);
          Swal.fire({
            icon: 'error',
            title: 'Oops!',
            text: error.error.message || 'Usuario o contraseña incorrectos',
            showConfirmButton: true
          }).then(() => {
            this.loginForm.get('password')?.reset();
          }
          );
        }
      );
    }
  }

}
