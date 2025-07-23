import { Injectable } from '@angular/core';
import {environment} from "../../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {Response_Generico} from "../../model/reponseGeneric";
import {proveedorModel, soloproveedorModel} from "../../model/proveedoresModel";
import {Response_Generico_Read} from "../../model/responseGenericRead";
import {cotizacionModel} from "../../model/cotizacionesModel";

@Injectable({
  providedIn: 'root'
})
export class CotizacionesService {

	private baseUrl = `${environment.apiUrl}/cotizaciones`;

	constructor(private http: HttpClient) {}

	// getProveedor(): Observable<Response_Generico<soloproveedorModel[]>> {
	// 	return this.http.get<Response_Generico<soloproveedorModel[]>>(`${this.baseUrl}/listado`);
	// }
	getCotizacionesxProveedor(idproveedor:string): Observable<Response_Generico<Response_Generico_Read<cotizacionModel>>> {
		return this.http.get<Response_Generico<Response_Generico_Read<cotizacionModel>>>(`${this.baseUrl}/cotizaciones-x-proveedor/${idproveedor}`);
	}
	registrarCotizacion(cotizacion:cotizacionModel,op:number): Observable<Response_Generico<any>> {
		return this.http.post<Response_Generico<any>>(`${this.baseUrl}/registrar/${op}`, cotizacion);
	}
}
