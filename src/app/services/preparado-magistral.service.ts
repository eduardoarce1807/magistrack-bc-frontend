import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PreparadoMagistralService {
  private baseUrl = `${environment.apiUrl}/preparado-magistral`;

  constructor(private http: HttpClient) {}

  crearPreparadoMagistral(data: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, data);
  }

  actualizarPreparadoMagistral(idPreparadoMagistral: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${idPreparadoMagistral}`, data);
  }

  getPreparadoMagistralById(idPreparadoMagistral: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${idPreparadoMagistral}`);
  }
}
