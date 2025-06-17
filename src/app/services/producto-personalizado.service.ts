import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

interface ProductoPersonalizado {
  idProductoPersonalizado: number;
  nombrePersonalizado: string;
  descripcionPersonalizada: string;
  detallesPersonalizacion: string;
  pedido: any;
  producto: any;
}

@Injectable({
  providedIn: 'root'
})
export class ProductoPersonalizadoService {

  private baseUrl = `${environment.apiUrl}/producto-personalizado`;

  constructor(private http: HttpClient) { }

  getProductosPersonalizados(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  saveProductoPersonalizado(productoPersonalizado: any): Observable<any> {
    let url = `${this.baseUrl}/guardar`;
    return this.http.post<any>(url, productoPersonalizado);
  }

  getProductoPersonalizadoByIdPedidoIdProducto(idPedido: string, idProducto: string): Observable<ProductoPersonalizado> {
    let url = `${this.baseUrl}/${idPedido}/${idProducto}`;
    return this.http.get<ProductoPersonalizado>(url);
  }
}
