import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PedidoHistoricoService {

  private baseUrl = `${environment.apiUrl}/pedido`;

  constructor(private http: HttpClient) {}

  buscarPedidosHistorico(filtros: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/historico/buscar`, filtros);
  }
}