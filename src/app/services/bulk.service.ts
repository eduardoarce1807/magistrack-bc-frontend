import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BulkService {

  private baseUrl = `${environment.apiUrl}/bulk`;

  constructor(private http: HttpClient) { }

  // Asignar bulk a usuario manualmente
  asignarBulkAUsuario(data: { idBulk?: string, idBulkPreparadoMagistral?: string, idUsuario: number }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/asignar-usuario`, data);
  }

  // Obtener todas las asignaciones de un usuario
  getBulksAsignadosAUsuario(idUsuario: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/asignaciones/${idUsuario}`);
  }

  // Obtener solo IDs de bulks de productos asignados a usuario
  getBulksProductosAsignados(idUsuario: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/asignaciones/${idUsuario}/productos`);
  }

  // Obtener solo IDs de bulks de preparados magistrales asignados a usuario
  getBulksPreparadosAsignados(idUsuario: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/asignaciones/${idUsuario}/preparados-magistrales`);
  }
}