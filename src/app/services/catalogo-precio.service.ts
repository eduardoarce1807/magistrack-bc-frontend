import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CatalogoProductoDTO {
  idCatalogoProducto: number;
  producto: any; // o un interface específica si deseas
  costo: number;
  margen: number;
  precio: number;
}

export interface RolDTO {
  idRol: number;
  nombre: string;
}

export interface CatalogoPrecioResponseDTO {
  idCatalogo: number;
  nombre: string;
  rol: RolDTO;
  fechaCreacion: string;
  productos: CatalogoProductoDTO[];
}

export interface CatalogoPrecioRequestDTO {
  nombre: string;
  idRol: number;
}

export interface ResponseDTO {
  idResultado: number;
  resultado: string;
}

@Injectable({
  providedIn: 'root'
})
export class CatalogoPrecioService {

  private url = `${environment.apiUrl}/catalogo-precio`;

  constructor(private http: HttpClient) {}

  obtenerCatalogoPorRol(idRol: number): Observable<CatalogoPrecioResponseDTO> {
    return this.http.get<CatalogoPrecioResponseDTO>(`${this.url}/por-rol/${idRol}`);
  }

  crearCatalogo(request: CatalogoPrecioRequestDTO): Observable<ResponseDTO> {
    return this.http.post<ResponseDTO>(`${this.url}`, request);
  }
}
