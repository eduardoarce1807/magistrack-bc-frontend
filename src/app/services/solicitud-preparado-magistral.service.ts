import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SolicitudPreparadoMagistralService {
  private baseUrl = `${environment.apiUrl}/solicitud-preparado-magistral`;

  constructor(private http: HttpClient) {}

  crearSolicitud(idCliente: number, descripcion: string, archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('idCliente', idCliente.toString());
    formData.append('descripcion', descripcion);
    formData.append('archivo', archivo);

    return this.http.post<any>(this.baseUrl, formData);
  }

  getSolicitudes(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  asignarPedido(idSolicitud: number, idPedido: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${idSolicitud}/asignar-pedido?idPedido=${idPedido}`, {});
  }
}
