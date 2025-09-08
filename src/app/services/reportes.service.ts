import { Injectable } from '@angular/core';
import {environment} from "../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {ordencompraPeriodo} from "../model/ordencompraModel";
import {kardexPeriodo} from "../model/kardexModel";

@Injectable({
  providedIn: 'root'
})
export class ReportesService {

	private baseUrl = `${environment.apiUrl}/requerimientos`;
	private baseUrlcompra = `${environment.apiUrl}/ordenescompra`;
	private baseUrlkardex = `${environment.apiUrl}/kardex`;

	constructor(private http: HttpClient) {}

	imprimirRequerimientos() {
		const url = `${this.baseUrl}/imprimir-listado-requerimientos`;
		return this.http.get(url, { responseType: "blob" });
	}
	imprimirseguimientoRequerimientos( id_requerimiento:string) {
		const url = `${this.baseUrl}/imprimir-requerimiento/${id_requerimiento}`;
		return this.http.get(url, { responseType: "blob" });
	}

	imprimirordencompraProveedor(orden: ordencompraPeriodo) {
		const url = `${this.baseUrlcompra}/imprimir-listado-proveedor-x-periodo`;
		return this.http.post(url, orden, { responseType: "blob" });
	}
	imprimirmateriaprimaProveedor(tipomateria:number,idproveedor:string) {
		const url = `${this.baseUrlkardex}/imprimir-listado-kardex-tipomateria/${tipomateria}/${idproveedor}`;
		return this.http.get(url, { responseType: "blob" });
	}
	imprimirkardexPeriodo(kardex: kardexPeriodo) {
		const url = `${this.baseUrlkardex}/imprimir-listado-kardex-x-periodo`;
		return this.http.post(url, kardex, { responseType: "blob" });
	}
}
