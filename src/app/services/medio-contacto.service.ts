import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MedioContactoService {

  private baseUrl = 'http://localhost:8080/api/medio-contacto';

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
