import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private baseUrl = `${environment.apiUrl}/cliente`;

  constructor(private http: HttpClient) {}

  getClientes(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  getClienteById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  createCliente(cliente: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, cliente);
  }

  createClienteUsuario(clienteUsuario: any): Observable<any>{
    let url = this.baseUrl + '/usuario/registrar';
    return this.http.post<any>(url, clienteUsuario);
  }

  updateCliente(id: number, cliente: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, cliente);
  }

  deleteCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  validarCodigoReferido(codigo: string): Observable<any> {
    let url = `${this.baseUrl}/validar-codigo-referido`;
    return this.http.get<any>(url, { params: { codigo } });
  }
}
