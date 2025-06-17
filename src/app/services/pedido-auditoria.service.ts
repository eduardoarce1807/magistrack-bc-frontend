import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PedidoAuditoriaService {

  private baseUrl = `${environment.apiUrl}/pedido-auditoria`;

  constructor(private http: HttpClient) {}

    saveAuditoria(pedido: any): Observable<any> {
      let url = `${this.baseUrl}`;
      return this.http.post<any>(url, pedido);
    }

    getAllAuditoriaByIdPedido(idPedido: string): Observable<any[]> {
      let url = `${this.baseUrl}/pedido/${idPedido}`;
      return this.http.get<any[]>(url);
    }
}
