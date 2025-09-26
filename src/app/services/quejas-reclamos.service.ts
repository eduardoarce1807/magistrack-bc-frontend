import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class QuejasReclamosService {

  private baseUrl = `${environment.apiUrl}/quejas-reclamos`;

  constructor(private http: HttpClient) {}

  getProximoId(tipo: 'QJ' | 'REC'): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/proximo-id/${tipo}`);
  }

  procesarQuejaReclamo(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/procesar`, data);
  }
}