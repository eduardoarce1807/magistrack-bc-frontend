import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BaseProductoService {

  private baseUrl = 'http://localhost:8080/api/base-producto';
    
    constructor(private http: HttpClient) {}
  
    getBasesProductos(): Observable<any[]> {
      return this.http.get<any[]>(this.baseUrl);
    }
}
