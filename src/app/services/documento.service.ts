import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DocumentoService {

  private baseUrl = `${environment.apiUrl}/documentos`;
  
  constructor(private http: HttpClient) {}

  crearDocumento(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/crear`, data);
  }


  sendNotaVenta(idPedido: string): Observable<string> {
    return this.http.get(`${this.baseUrl}/nota-venta/${idPedido}`, {
      responseType: 'text'
    });
  }

  generarBoleta(idPedido: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/boleta/${idPedido}`);
  }

  generarBoletaManual(idPedido: string, dni: string, nombre: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/boleta-manual`, {
      params: { idPedido, dni, nombre }
    });
  }

  generarFactura(idPedido: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/factura/${idPedido}`);
  }

  generarFacturaManual(idPedido: string, ruc: string, razonSocial: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/factura-manual`, {
      params: { idPedido, ruc, razonSocial }
    });
  }

  // Métodos para Guía de Remisión
  crearGuiaRemision(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/guia-remision/crear`, data);
  }

  generarPDFGuiaRemision(idPedido: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/guia-remision/${idPedido}`);
  }
}
