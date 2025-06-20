import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TipoPresentacionService {

  private baseUrl = `${environment.apiUrl}/tipo-presentacion`;
  
    constructor(private http: HttpClient) {}
  
    getTiposPresentacion(): Observable<any[]> {
      return this.http.get<any[]>(this.baseUrl);
    }

    getTipoPresentacionById(id: number): Observable<any> {
      return this.http.get<any>(`${this.baseUrl}/${id}`);
    }

    createTipoPresentacion(tipoPresentacion: any): Observable<any> {
      return this.http.post<any>(this.baseUrl, tipoPresentacion);
    }

    updateTipoPresentacion(id: number, tipoPresentacion: any): Observable<any> {
      return this.http.put<any>(`${this.baseUrl}/${id}`, tipoPresentacion);
    }

    deleteTipoPresentacion(id: number): Observable<void> {
      return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
}
