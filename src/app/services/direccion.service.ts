import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DireccionService {

  private baseUrl = 'http://localhost:8080/api/direccion';

  constructor(private http: HttpClient) {}

  getDirecciones(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  getDireccionById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  createDireccion(direccion: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, direccion);
  }

  updateDireccion(id: number, direccion: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, direccion);
  }

  deleteDireccion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getDireccionesByClienteId(idCliente: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/cliente/${idCliente}`);
  }

  getDireccionesByTiendaId(idTienda: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/tienda/${idTienda}`);
  }
}
