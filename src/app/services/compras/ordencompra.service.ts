import { Injectable } from '@angular/core';
import {environment} from "../../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {Response_Generico} from "../../model/reponseGeneric";
import {Response_Generico_Read} from "../../model/responseGenericRead";
import {cotizacionModel} from "../../model/cotizacionesModel";
import {ordencompraModel} from "../../model/ordencompraModel";

@Injectable({
  providedIn: 'root'
})
export class OrdencompraService {

	private baseUrl = `${environment.apiUrl}/ordenescompra`;

	constructor(private http: HttpClient) {}

	// getProveedor(): Observable<Response_Generico<soloproveedorModel[]>> {
	// 	return this.http.get<Response_Generico<soloproveedorModel[]>>(`${this.baseUrl}/listado`);
	// }
	getOrdenesxProveedor(idproveedor:string): Observable<Response_Generico<Response_Generico_Read<ordencompraModel>>> {
		return this.http.get<Response_Generico<Response_Generico_Read<ordencompraModel>>>(`${this.baseUrl}/ordenes-x-proveedor/${idproveedor}`);
	}
}
