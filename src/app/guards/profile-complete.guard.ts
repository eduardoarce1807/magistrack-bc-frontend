import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class ProfileCompleteGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    const usuario = this.authService.getUsuario();
    
    // Si no hay usuario autenticado, permitir navegación (será manejado por AuthGuard)
    if (!usuario || !usuario.cliente) {
      return true;
    }

    // Solo aplicar validación a roles 2, 3, 4
    const rolId = usuario.rol?.idRol;
    if (![2, 3, 4].includes(rolId)) {
      return true;
    }

    const cliente = usuario.cliente;
    const datosFaltantes: string[] = [];
    
    // Verificar si faltan datos críticos
    if (!cliente.correo || cliente.correo.trim() === '') {
      datosFaltantes.push('Correo electrónico');
    }
    
    if (!cliente.numeroDocumento || cliente.numeroDocumento.trim() === '') {
      datosFaltantes.push('Número de documento');
    }
    
    if (!cliente.telefono || cliente.telefono.trim() === '') {
      datosFaltantes.push('Teléfono');
    }
    
    // Si faltan datos, mostrar modal y redirigir al perfil
    if (datosFaltantes.length > 0) {
      // Usar setTimeout para evitar problemas de timing con la navegación
      setTimeout(() => {
        Swal.fire({
          icon: 'warning',
          title: 'Datos incompletos',
          html: `<p>Tu perfil está incompleto. Faltan los siguientes datos:</p>
                 <ul style="text-align: left; display: inline-block;">
                   ${datosFaltantes.map(dato => `<li>${dato}</li>`).join('')}
                 </ul>
                 <p><strong>Es necesario completar tu perfil para continuar.</strong></p>`,
          showCancelButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false,
          confirmButtonText: 'Completar Perfil',
          confirmButtonColor: '#3085d6'
        }).then(() => {
          this.router.navigate(['/pages/perfil']);
        });
      }, 100);
      
      return this.router.parseUrl('/pages/perfil');
    }
    
    // Si todos los datos están completos, permitir navegación
    return true;
  }
}