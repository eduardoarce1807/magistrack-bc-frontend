import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {

  private baseUrl = `${environment.apiUrl}/reporte`;

  constructor(private http: HttpClient) {}

  getReporteVentas(filtros: any): Observable<any[]> {
    return this.http.post<any[]>(`${this.baseUrl}/ventas`, filtros);
  }

  getReporteCumplimientoFee(filtros: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/cumplimiento-fee`, filtros);
  }

  getReporteDespacho(filtros: any): Observable<any[]> {
    return this.http.post<any[]>(`${this.baseUrl}/despacho`, filtros);
  }

}
