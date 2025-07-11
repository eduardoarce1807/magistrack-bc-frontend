import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

interface Producto {
  idProducto: string;
  nombre: string;
  descripcion: string;
  precio: number;
  presentacion: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  private baseUrl = `${environment.apiUrl}/producto`;

  constructor(private http: HttpClient) { }

  getProductos(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  getBuscarProductos(nombre: string): Observable<any[]> {
    let url = `${this.baseUrl}/buscar`;
      return this.http.get<Producto[]>(url, { params: { nombre } });
    }

  getProductoById(idProducto: string): Observable<Producto> {
    let url = `${this.baseUrl}/${idProducto}`;
    return this.http.get<Producto>(url);
  }

  getBandejaProduccion(): Observable<any[]> {
    let url = `${this.baseUrl}/bandeja-produccion`;
    return this.http.get<any[]>(url);
  }

  updateEstadoProducto(data: any): Observable<any> {
    let url = `${this.baseUrl}/estado-producto`;
    return this.http.post<any>(url, data);
  }

  updateEstadoProductoPedidoMasivo(data: any): Observable<any> {
    let url = `${this.baseUrl}/estado-masivo`;
    return this.http.post<any>(url, data);
  }

  updatePedidoProducto(data: any): Observable<any> {
    let url = `${this.baseUrl}/pedido-producto`;
    return this.http.put<any>(url, data);
  }

  getHojaProduccion(idProducto: string): Observable<any> {
    let url = `${this.baseUrl}/hoja-produccion/${idProducto}`;
    return this.http.get<any>(url);
  }

  saveProducto(producto: any): Observable<any> {
    let url = `${this.baseUrl}/guardar`;
    return this.http.post<any>(url, producto);
  }
}
