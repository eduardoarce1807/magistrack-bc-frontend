import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RolService {

  private baseUrl = `${environment.apiUrl}/rol`;

  constructor(private http: HttpClient) {}

  getRoles(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  getRolById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  createRol(rol: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, rol);
  }

  updateRol(id: number, rol: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, rol);
  }

  deleteRol(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
