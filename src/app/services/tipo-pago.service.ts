import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TipoPagoService {

  private baseUrl = 'http://localhost:8080/api/tipo-pago';

  constructor(private http: HttpClient) {}

  getTiposPago(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  getTipoPagoById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  createTipoPago(tipoPago: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, tipoPago);
  }

  updateTipoPago(id: number, tipoPago: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, tipoPago);
  }

  deleteTipoPago(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
