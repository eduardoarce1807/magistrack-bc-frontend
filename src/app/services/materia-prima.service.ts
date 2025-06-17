import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MateriaPrimaService {

  private baseUrl = `${environment.apiUrl}/materia-prima`;

  constructor(private http: HttpClient) {}

  getMateriasPrimas(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }
}
