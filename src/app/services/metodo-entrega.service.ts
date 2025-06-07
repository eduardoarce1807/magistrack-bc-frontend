import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MetodoEntregaService {

  private baseUrl = 'http://localhost:8080/api/metodo-entrega';

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
