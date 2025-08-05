import { Injectable } from '@angular/core';
import {environment} from "../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {Response_Generico} from "../model/reponseGeneric";
import {Response_Generico_Read} from "../model/responseGenericRead";
import {cotizacionModel} from "../model/cotizacionesModel";
import {paramaeModel} from "../model/paramaeModel";

@Injectable({
  providedIn: 'root'
})
export class ParamaeService {

	private baseUrl = `${environment.apiUrl}/paramae`;

	constructor(private http: HttpClient) {}

	// getProveedor(): Observable<Response_Generico<soloproveedorModel[]>> {
	// 	return this.http.get<Response_Generico<soloproveedorModel[]>>(`${this.baseUrl}/listado`);
	// }
	getDatosParamae(codpar:string,tippar:string): Observable<Response_Generico<paramaeModel>> {
		return this.http.get<Response_Generico<paramaeModel>>(`${this.baseUrl}/${codpar}/${tippar}`);
	}
}
