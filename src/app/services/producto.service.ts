import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  private baseUrl = `${environment.apiUrl}/producto`;

  constructor(private http: HttpClient) { }

  getProductos(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  getProductosMaestros(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/maestros`);
  }

  getProductoMaestroCompleto(idProductoMaestro: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/completo/${idProductoMaestro}`);
  }

  getCatalogoProductosByCliente(idCliente: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/por-cliente?idCliente=${idCliente}`);
  }

  getCatalogoProductosByRol(idRol: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/por-rol?idRol=${idRol}`);
  }

  getBuscarProductos(idCliente: number, nombre: string): Observable<any[]> {
    let url = `${this.baseUrl}/buscar-por-cliente`;
    return this.http.get<any[]>(url, { params: { idCliente, nombre } });
  }

  getBuscarProductosByRol(idRol: number, nombre: string): Observable<any[]> {
    let url = `${this.baseUrl}/buscar-por-rol`;
    return this.http.get<any[]>(url, { params: { idRol, nombre } });
  }

  getProductoById(idProducto: string): Observable<any> {
    let url = `${this.baseUrl}/${idProducto}`;
    return this.http.get<any>(url);
  }

  getBandejaProduccion(idUsuario: number): Observable<any[]> {
    let url = `${this.baseUrl}/bandeja-produccion?idUsuario=${idUsuario}`;
    return this.http.get<any[]>(url);
  }

  updateEstadoProducto(data: any): Observable<any> {
    let url = `${this.baseUrl}/estado-producto`;
    return this.http.post<any>(url, data);
  }

  updateEstadoProductoMaestro(data: any): Observable<any> {
    let url = `${this.baseUrl}/estado-producto-maestro`;
    return this.http.post<any>(url, data);
  }

  updateEstadoPreparadoMagistral(data: any): Observable<any> {
    let url = `${this.baseUrl}/estado-preparado-magistral`;
    return this.http.post<any>(url, data);
  }

  updateEstadoProductoPedidoMasivo(data: any): Observable<any> {
    let url = `${this.baseUrl}/estado-masivo`;
    return this.http.post<any>(url, data);
  }

  updateEstadoProductoPedidoMasivoMaestro(data: any): Observable<any> {
    let url = `${this.baseUrl}/estado-masivo-maestro`;
    return this.http.post<any>(url, data);
  }

  updatePedidoProducto(data: any): Observable<any> {
    let url = `${this.baseUrl}/pedido-producto`;
    return this.http.put<any>(url, data);
  }

  updatePedidoProductoMaestro(data: any): Observable<any> {
    let url = `${this.baseUrl}/pedido-producto-maestro`;
    return this.http.put<any>(url, data);
  }

  updatePreparadoMagistralCalidad(data: any): Observable<any> {
    let url = `${this.baseUrl}/preparado-magistral-calidad`;
    return this.http.put<any>(url, data);
  }

  getHojaProduccion(idProductoMaestro: string): Observable<any> {
    let url = `${this.baseUrl}/hoja-produccion-maestro/${idProductoMaestro}`;
    return this.http.get<any>(url);
  }

  getHojaProduccionPreparadoMagistral(idPreparadoMagistral: string): Observable<any> {
    let url = `${this.baseUrl}/hoja-produccion-preparado-magistral/${idPreparadoMagistral}`;
    return this.http.get<any>(url);
  }

  saveProducto(producto: any): Observable<any> {
    let url = `${this.baseUrl}/guardar`;
    return this.http.post<any>(url, producto);
  }

  updateProductoMaestro(producto: any): Observable<any> {
    let url = `${this.baseUrl}/actualizar`;
    return this.http.put<any>(url, producto);
  }

  updateEstadoProductoMaestroById(idProductoMaestro: number, estado: boolean): Observable<any> {
    let url = `${this.baseUrl}/estado-producto-maestro/${idProductoMaestro}`;
    return this.http.put<any>(url, null, { params: { estado: estado.toString() } });
  }

  updateEstadoProductoBulk(data: any): Observable<any> {
    let url = `${this.baseUrl}/estado-producto-bulk`;
    return this.http.post<any>(url, data);
  }

  updateEstadoPreparadoMagistralBulk(data: any): Observable<any> {
    let url = `${this.baseUrl}/estado-preparado-magistral-bulk`;
    return this.http.post<any>(url, data);
  }

  updateEstadoPreparadoMagistralSingle(data: any): Observable<any> {
    let url = `${this.baseUrl}/estado-preparado-magistral-single`;
    return this.http.post<any>(url, data);
  }

  updateEstadoPreparadoMagistralMasivo(data: any): Observable<any> {
    let url = `${this.baseUrl}/estado-preparado-magistral-masivo`;
    return this.http.post<any>(url, data);
  }
}
