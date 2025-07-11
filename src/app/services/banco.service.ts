import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BancoService {

  private baseUrl = `${environment.apiUrl}/banco`;

  constructor(private http: HttpClient) {}

  getBancos(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  getBancoById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  createBanco(banco: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, banco);
  }

  updateBanco(id: number, banco: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, banco);
  }

  deleteBanco(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
