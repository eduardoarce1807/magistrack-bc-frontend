import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PagoPedidoService {

  private baseUrl = `${environment.apiUrl}/pago-pedido`;

  constructor(private http: HttpClient) {}

    savePago(pago: any): Observable<any> {
      let url = `${this.baseUrl}`;
      return this.http.post<any>(url, pago);
    }

    listarPagos(): Observable<any[]> {
      let url = `${this.baseUrl}`;
      return this.http.get<any[]>(url);
    }

    listarPagosPorFechas(fechaInicio: string, fechaFin: string): Observable<any[]> {
        let url = `${this.baseUrl}/filtrar-por-fecha`;
        return this.http.get<any[]>(url, { params: { fechaInicio, fechaFin } });
    }

}
