import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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

  private baseUrl = 'http://localhost:8080/api/producto-personalizado';

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
