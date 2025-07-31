import { Injectable } from '@angular/core';
import {environment} from "../../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {Response_Generico} from "../../model/reponseGeneric";
import {MateriaprimaModel, UnidadmedModel} from "../../model/inventarioModel";
import {kardexModel, MovimientoModel, TipomovimientoModel} from "../../model/kardexModel";

@Injectable({
  providedIn: 'root'
})
export class KardexService {

	private baseUrl = `${environment.apiUrl}/kardex`;

	constructor(private http: HttpClient) {}

	registrarKardex(kardex:kardexModel,op:number,check_imagen:number): Observable<Response_Generico<any>> {
		return this.http.post<Response_Generico<any>>(`${this.baseUrl}/registrar/${op}/${check_imagen}`, kardex);
	}
	getTipomovimiento(): Observable<Response_Generico<TipomovimientoModel[]>> {
		return this.http.get<Response_Generico<TipomovimientoModel[]>>(`${this.baseUrl}/listado-tipomovimiento`);
	}
	getMovimiento(id_tipomovimiento:String): Observable<Response_Generico<MovimientoModel[]>> {
		return this.http.get<Response_Generico<MovimientoModel[]>>(`${this.baseUrl}/listado-movimiento/${id_tipomovimiento}`);
	}
	getKardexMateriaPrima(id_materia_prima:Number): Observable<Response_Generico<kardexModel[]>> {
		return this.http.get<Response_Generico<kardexModel[]>>(`${this.baseUrl}/obtener-kardex-x-materiaprima/${id_materia_prima}`);
	}

}
