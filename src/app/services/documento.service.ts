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

  sendNotaVenta(idPedido: string): Observable<string> {
  return this.http.get(`${this.baseUrl}/nota-venta/${idPedido}`, {
    responseType: 'text'
  });
}


}
