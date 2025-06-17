import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TipoDocumentoService {

  private baseUrl = `${environment.apiUrl}/tipo-documento`;

  constructor(private http: HttpClient) {}

  getTiposDocumento(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  getTipoDocumentoById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  createTipoDocumento(tipoDocumento: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, tipoDocumento);
  }

  updateTipoDocumento(id: number, tipoDocumento: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, tipoDocumento);
  }

  deleteTipoDocumento(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
