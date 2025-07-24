import { Injectable } from '@angular/core';
import {environment} from "../../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {conformidadOrden, ValidacionOrden} from "../../model/ordencompraModel";
import {Observable} from "rxjs";
import {Response_Generico} from "../../model/reponseGeneric";

@Injectable({
  providedIn: 'root'
})
export class ConformidadService {

	private baseUrl = `${environment.apiUrl}/conformidad`;

	constructor(private http: HttpClient) {}

	registrarConformidad(op:number, conformidad:conformidadOrden): Observable<Response_Generico<any>> {
		return this.http.post<Response_Generico<any>>(`${this.baseUrl}/procesar/${op}`, conformidad);
	}
}
