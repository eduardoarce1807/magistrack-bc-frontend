import { Injectable } from '@angular/core';
import {environment} from "../../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {Response_Generico} from "../../model/reponseGeneric";
import {Response_Generico_Read} from "../../model/responseGenericRead";
import {RequeremientossaveModel} from "../../model/requerimientosModel";
import {proveedorModel, soloproveedorModel} from "../../model/proveedoresModel";

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
}
