import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  getLoggedUser(): any {
    const userData = localStorage.getItem('usuario-magistrack-bc');
    return userData ? JSON.parse(userData) : null;
  }

  setLoggedUser(user: any): void {
    localStorage.setItem('usuario-magistrack-bc', JSON.stringify(user));
  }

  clearLoggedUser(): void {
    localStorage.removeItem('jwt-magistrack-bc'); // Elimina el token del almacenamiento local
    localStorage.removeItem('usuario-magistrack-bc');
  }
}
