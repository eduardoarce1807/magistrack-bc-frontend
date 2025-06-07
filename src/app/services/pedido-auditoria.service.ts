import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PedidoAuditoriaService {

  private baseUrl = 'http://localhost:8080/api/pedido-auditoria';
  
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
