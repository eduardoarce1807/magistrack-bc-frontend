import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class BaseProductoService {

  private baseUrl = `${environment.apiUrl}/base-producto`;

  constructor(private http: HttpClient) {}

    getBasesProductos(): Observable<any[]> {
      return this.http.get<any[]>(this.baseUrl);
    }
}
