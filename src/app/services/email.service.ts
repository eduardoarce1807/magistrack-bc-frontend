import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  private baseUrl = `${environment.apiUrl}/email`;

  constructor(private http: HttpClient) {}

  sendEmail(data: any): Observable<any[]> {
    return this.http.post<any>(this.baseUrl, data);
  }

  sendEmailBienvenida(data: any): Observable<any[]> {
    return this.http.post<any>(`${this.baseUrl}/bienvenida`, data);
  }

}
