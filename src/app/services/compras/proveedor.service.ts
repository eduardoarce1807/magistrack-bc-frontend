import { Injectable } from '@angular/core';
import {environment} from "../../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {Response_Generico} from "../../model/reponseGeneric";
import {Response_Generico_Read} from "../../model/responseGenericRead";
import {RequeremientossaveModel, respuestaGuardaModel} from "../../model/requerimientosModel";
import {materiaxproveedorModel, proveedorModel, soloproveedorModel} from "../../model/proveedoresModel";
import {ValidacionOrden} from "../../model/ordencompraModel";

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {

	private baseUrl = `${environment.apiUrl}/proveedor`;

	constructor(private http: HttpClient) {}

	getProveedor(): Observable<Response_Generico<soloproveedorModel[]>> {
		return this.http.get<Response_Generico<soloproveedorModel[]>>(`${this.baseUrl}/listado`);
	}
	getProveedorxMateria(): Observable<Response_Generico<Response_Generico_Read<proveedorModel>>> {
		return this.http.get<Response_Generico<Response_Generico_Read<proveedorModel>>>(`${this.baseUrl}/materia-prima-x-proveedor`);
	}
	registrarProveedor(proveedor:soloproveedorModel,op:number): Observable<Response_Generico<any>> {
		return this.http.post<Response_Generico<any>>(`${this.baseUrl}/registrar/${op}`, proveedor);
	}
	registrarmateriaProveedor(idproveedor:String,proveedor:materiaxproveedorModel[]): Observable<Response_Generico<any>> {
		return this.http.post<Response_Generico<any>>(`${this.baseUrl}/registrar-materia-prima/proveedor/${idproveedor}`, proveedor);
	}

}
