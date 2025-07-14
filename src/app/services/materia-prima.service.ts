import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {materiasprimasModel} from "../model/materiasprimasModel";

@Injectable({
  providedIn: 'root'
})
export class MateriaPrimaService {

  private baseUrl = `${environment.apiUrl}/materia-prima`;

  constructor(private http: HttpClient) {}

  getMateriasPrimas(): Observable<any[]> {
    return this.http.get<materiasprimasModel[]>(this.baseUrl);
  }
}
