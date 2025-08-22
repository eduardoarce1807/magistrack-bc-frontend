import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportesGraficosService {

  private baseUrl = `${environment.apiUrl}/reporte`;

  constructor(private http: HttpClient) {}

  // Método para obtener datos de ventas por producto
  getVentasPorProducto(filtros: FiltrosVentasProducto): Observable<any> {
    return this.http.post(`${this.baseUrl}/ventas-producto`, filtros);
  }

  // Método para obtener datos de ventas por cliente
  getVentasPorCliente(filtros: FiltrosVentasCliente): Observable<any> {
    return this.http.post(`${this.baseUrl}/ventas-cliente`, filtros);
  }

  // Método para obtener datos de ventas por canal
  getVentasPorCanal(filtros: FiltrosVentasCanal): Observable<any> {
    return this.http.post(`${this.baseUrl}/ventas-canal`, filtros);
  }

  // Método para obtener Top N datos
  getTopN(filtros: FiltrosTopN): Observable<any> {
    return this.http.post(`${this.baseUrl}/top-n`, filtros);
  }
}

// Interfaces actualizadas para tipado de datos
export interface FiltrosVentasProducto {
  fechaInicio: string;
  fechaFin: string;
  canalesSeleccionados: number[];
  tiposPagoSeleccionados: number[];
  productosSeleccionados: string[];
  rolesSeleccionados: number[];
}

export interface FiltrosVentasCliente {
  fechaInicio: string;
  fechaFin: string;
  canalesSeleccionados: number[];
  tiposPagoSeleccionados: number[];
  rolesSeleccionados: number[];
  clientesSeleccionados: number[];
}

export interface FiltrosVentasCanal {
  fechaInicio: string;
  fechaFin: string;
  tiposPagoSeleccionados: number[];
}

export interface FiltrosTopN {
  fechaInicio: string;
  fechaFin: string;
  canalesSeleccionados: number[];
  tiposPagoSeleccionados: number[];
  topN: number;
  dimension: string;
}
