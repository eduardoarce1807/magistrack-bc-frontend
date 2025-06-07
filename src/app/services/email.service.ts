import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  private baseUrl = 'http://localhost:8080/api/email';
    
    constructor(private http: HttpClient) {}
  
    sendEmail(data: any): Observable<any[]> {
      return this.http.post<any>(this.baseUrl, data);
    }
}
