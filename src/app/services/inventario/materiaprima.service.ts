import { Injectable } from '@angular/core';
import {environment} from "../../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {Response_Generico} from "../../model/reponseGeneric";
import {FabricanteModel, MateriaprimaModel, TipomateriaModel, UnidadmedModel} from "../../model/inventarioModel";

@Injectable({
  providedIn: 'root'
})
export class MateriaprimaService {

	private baseUrl = `${environment.apiUrl}/materia-prima`;

	constructor(private http: HttpClient) {}

	getMateriaprima(): Observable<Response_Generico<MateriaprimaModel[]>> {
		return this.http.get<Response_Generico<MateriaprimaModel[]>>(`${this.baseUrl}/listado`);
	}
	registrarMateriaprima(materia:MateriaprimaModel,op:number): Observable<Response_Generico<any>> {
		return this.http.post<Response_Generico<any>>(`${this.baseUrl}/registrar/${op}`, materia);
	}
	getUnidadmedida(): Observable<Response_Generico<UnidadmedModel[]>> {
		return this.http.get<Response_Generico<UnidadmedModel[]>>(`${this.baseUrl}/listado-unidad-medida`);
	}
	getFabricanteMateriaprima(): Observable<Response_Generico<FabricanteModel[]>> {
		return this.http.get<Response_Generico<FabricanteModel[]>>(`${this.baseUrl}/lista-fabricante`);
	}
	getTipoMateriaprima(): Observable<Response_Generico<TipomateriaModel[]>> {
		return this.http.get<Response_Generico<TipomateriaModel[]>>(`${this.baseUrl}/lista-tipomateria`);
	}
	registrarFabricante(fabricante:FabricanteModel,op:number): Observable<Response_Generico<any>> {
		return this.http.post<Response_Generico<any>>(`${this.baseUrl}/registrar-fabricante/${op}`, fabricante);
	}
}
