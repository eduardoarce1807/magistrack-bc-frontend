import { Injectable } from '@angular/core';
import {environment} from "../../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {RequeremientossaveModel, respuestaGuardaModel} from "../../model/requerimientosModel";
import {Response_Generico} from "../../model/reponseGeneric";
import {Response_Generico_Read} from "../../model/responseGenericRead";

@Injectable({
  providedIn: 'root'
})
export class RequerimientosService {

	private baseUrl = `${environment.apiUrl}/requerimientos`;

	constructor(private http: HttpClient) {}

	getRequerimientos(): Observable<Response_Generico<Response_Generico_Read<RequeremientossaveModel>>> {
		return this.http.get<Response_Generico<Response_Generico_Read<RequeremientossaveModel>>>(`${this.baseUrl}/listado`);
	}
	registrarRequerimientos(requerimiento:RequeremientossaveModel,op:number): Observable<Response_Generico<respuestaGuardaModel>> {
		return this.http.post<Response_Generico<respuestaGuardaModel>>(`${this.baseUrl}/registrar/${op}`, requerimiento);
	}
}
