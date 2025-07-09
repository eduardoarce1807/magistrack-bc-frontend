import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CanalVentaService {

  private baseUrl = `${environment.apiUrl}/canal-venta`;
  
  constructor(private http: HttpClient) {}

  getCanalesVenta(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }
}
