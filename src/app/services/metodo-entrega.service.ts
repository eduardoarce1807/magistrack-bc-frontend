import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MetodoEntregaService {

  private baseUrl = `${environment.apiUrl}/metodo-entrega`;

  constructor(private http: HttpClient) {}

  getMetodosEntrega(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  getMetodoEntregaById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  createMetodoEntrega(metodoEntrega: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, metodoEntrega);
  }

  updateMetodoEntrega(id: number, metodoEntrega: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, metodoEntrega);
  }

  deleteMetodoEntrega(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
