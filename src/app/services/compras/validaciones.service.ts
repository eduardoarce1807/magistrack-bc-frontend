import { Injectable } from '@angular/core';
import {ValidacionOrden} from "../../model/ordencompraModel";
import {Observable} from "rxjs";
import {Response_Generico} from "../../model/reponseGeneric";
import {environment} from "../../../environments/environment";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class ValidacionesService {

	private baseUrl = `${environment.apiUrl}/validacion`;

	constructor(private http: HttpClient) {}
	registrarvalidaciomProveedor(validaciones:ValidacionOrden[]): Observable<Response_Generico<any>> {
		return this.http.post<Response_Generico<any>>(`${this.baseUrl}/procesar`, validaciones);
	}
}
