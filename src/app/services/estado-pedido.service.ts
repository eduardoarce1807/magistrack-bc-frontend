import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EstadoPedido {
  idEstadoPedido: number;
  descripcion: string;
}

@Injectable({
  providedIn: 'root'
})
export class EstadoPedidoService {

  private baseUrl = `${environment.apiUrl}/estado-pedido`;

  constructor(private http: HttpClient) {}

  getEstadosPedido(): Observable<EstadoPedido[]> {
    return this.http.get<EstadoPedido[]>(this.baseUrl);
  }
}
