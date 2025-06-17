import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MedioContactoService {

  private baseUrl = `${environment.apiUrl}/medio-contacto`;

  constructor(private http: HttpClient) {}

  getMediosContacto(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  getMedioContactoById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  createMedioContacto(medioContacto: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, medioContacto);
  }

  updateMedioContacto(id: number, medioContacto: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, medioContacto);
  }

  deleteMedioContacto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
