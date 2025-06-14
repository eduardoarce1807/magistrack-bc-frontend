import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MateriaPrimaService {

  private baseUrl = 'http://localhost:8080/api/materia-prima';
  
  constructor(private http: HttpClient) {}

  getMateriasPrimas(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }
}
