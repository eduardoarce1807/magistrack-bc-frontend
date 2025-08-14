import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
	providedIn: 'root',
})
export class PedidoService {
	private baseUrl = `${environment.apiUrl}/pedido`;

	constructor(private http: HttpClient) {}

	getPedidoById(idPedido: string): Observable<any> {
		let url = `${this.baseUrl}/${idPedido}`;
		return this.http.get<any>(url);
	}

	getProductosByPedidoId(idPedido: string): Observable<any[]> {
		let url = `${this.baseUrl}/${idPedido}/productos`;
		return this.http.get<any[]>(url);
	}

	getPedidosAll(): Observable<any[]> {
		return this.http.get<any[]>(this.baseUrl);
	}

	getPedidosCompleto(): Observable<any[]> {
		return this.http.get<any[]>(`${this.baseUrl}/listar`);
	}

  getPedidosDespacho(): Observable<any[]> {
    let url = `${this.baseUrl}/bandeja-despacho`;
    return this.http.get<any[]>(url);
  }

	getPedidosByIdCliente(idCliente: number): Observable<any[]> {
		let url = `${this.baseUrl}/buscar`;
		return this.http.get<any[]>(url, { params: { idCliente } });
	}

	createPedido(pedido: any) {
		let url = `${this.baseUrl}`;
		return this.http.post<any>(url, pedido);
	}

	createPedidoVentaRapida(pedido: any) {
		let url = `${this.baseUrl}/venta-rapida`;
		return this.http.post<any>(url, pedido);
	}

	updatePedido(pedido: any) {
		let url = `${this.baseUrl}/${pedido.idPedido}`;
		return this.http.put<any>(url, pedido);
	}

	updatePedidoPago(data: any) {
		let url = `${this.baseUrl}/pago/${data.idPedido}`;
		return this.http.put<any>(url, data);
	}

	updateFechaEstimadaEntrega(idPedido: string, fechaEstimadaEntrega: string): Observable<any> {
		let url = `${this.baseUrl}/fecha-estimada`;
		return this.http.put<any>(url, null, { 
			params: { 
				idPedido: idPedido,
				fechaEstimadaEntrega: fechaEstimadaEntrega
			} 
		});
	}

	getProductosByIdPedido(idPedido: string): Observable<any[]> {
		let url = `${this.baseUrl}/${idPedido}/productos`;
		return this.http.get<any[]>(url);
	}

	saveProductoForPedido(producto: any) {
		let url = `${this.baseUrl}/producto`;
		return this.http.post<any>(url, producto);
	}

	deleteProductoDePedido(idPedido: string, idProducto: string) {
		let url = `${this.baseUrl}/${idPedido}/${idProducto}`;
		return this.http.delete<any>(url);
	}

	updateEstadoPedido(idPedido: string, idEstadoPedido: number) {
		let url = `${this.baseUrl}/estado`;
		return this.http.get<any>(url, {
			params: { idPedido, idEstadoPedido },
		});
	}

  updateDireccionPedido(data: any) {
    let url = `${this.baseUrl}/direccion`;
    return this.http.put<any>(url, data);
  }

	updateEstadoClientePedido(idPedido: string, idEstadoPedidoCliente: number) {
		let url = `${this.baseUrl}/estado-cliente`;
		return this.http.get<any>(url, {
			params: { idPedido, idEstadoPedidoCliente },
		});
	}

	deletePedido(idPedido: string) {
		let url = `${this.baseUrl}/${idPedido}`;
		return this.http.delete<any>(url);
	}

	getPedidoProductoByIds(
		idPedido: string,
		idProducto: string
	): Observable<any> {
		let url = `${this.baseUrl}/${idPedido}/producto/${idProducto}`;
		return this.http.get<any>(url);
	}

	getProductosAll(): Observable<any[]> {
		let url = `${this.baseUrl}/productos`;
		return this.http.get<any[]>(url);
	}

	getProductosCalidad(): Observable<any[]> {
		let url = `${this.baseUrl}/productos/calidad`;
		return this.http.get<any[]>(url);
	}

	getProductoCalidadByIdBulk(idBulk: string): Observable<any> {
		let url = `${this.baseUrl}/productos/calidad/${idBulk}`;
		return this.http.get<any>(url);
	}

	getProductosEnvasado(): Observable<any[]> {
		let url = `${this.baseUrl}/productos/envasado`;
		return this.http.get<any[]>(url);
	}

	getProductosEnvasadoByIdBulk(idBulk: string): Observable<any> {
		let url = `${this.baseUrl}/productos/envasado/${idBulk}`;
		return this.http.get<any>(url);
	}

	getProductosEtiquetado(): Observable<any[]> {
		let url = `${this.baseUrl}/productos/etiquetado`;
		return this.http.get<any[]>(url);
	}

	getProductosEtiquetadoByIdProducto(idProducto: string): Observable<any> {
		let url = `${this.baseUrl}/productos/etiquetado/${idProducto}`;
		return this.http.get<any>(url);
	}

	getProductosDespacho(): Observable<any[]> {
		let url = `${this.baseUrl}/productos/despacho`;
		return this.http.get<any[]>(url);
	}

	getProductosDespachoPorIdPedido(idPedido: string): Observable<any[]> {
		let url = `${this.baseUrl}/productos/despacho/${idPedido}`;
		return this.http.get<any[]>(url);
	}

	saveObservacionPedido(data: any): Observable<any> {
		let url = `${this.baseUrl}/observacion`;
		return this.http.post<any>(url, data);
	}

	updateObservacionPedido(idPedido: string, observacion: string): Observable<any> {
		let url = `${this.baseUrl}/observacion-pedido`;
		return this.http.post<any>(url, null, { 
			params: { 
				idPedido: idPedido, 
				observacion: observacion 
			} 
		});
	}

	updateEstadoPedidoMasivo(data: any): Observable<any> {
		let url = `${this.baseUrl}/estado-masivo`;
		return this.http.post<any>(url, data);
	}

	updateEstadoProductoByPedido(
		idPedido: string,
		idEstadoProducto: number
	): Observable<any> {
		let url = `${this.baseUrl}/${idPedido}/estado-producto`;
		return this.http.get<any>(url, { params: { idEstadoProducto } });
	}

	aplicarCuponPedido(data: any): Observable<any> {
		let url = `${this.baseUrl}/aplicar-cupon`;
		return this.http.post<any>(url, data);
	}

	getReportePedidos(data: any): Observable<any[]> {
		let url = `${this.baseUrl}/filtrar`;
		return this.http.post<any[]>(url, data);
	}

}
