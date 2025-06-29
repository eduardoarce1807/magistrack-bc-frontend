import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UbigeoService {

    private baseUrl = `${environment.apiUrl}/ubigeo`;

    constructor(private http: HttpClient) {}

    getDepartamentos() {
        return this.http.get<any[]>(`${this.baseUrl}/departamento`).pipe(
            map(response => response || [])
        );
    }

    getProvincias(departamentoId: number) {
        let url = `${this.baseUrl}/provincia`;
        return this.http.get<any[]>(url, { params: { idDepartamento: departamentoId } });
    }

    getDistritos(provinciaId: number) {
        let url = `${this.baseUrl}/distrito`;
        return this.http.get<any[]>(url, { params: { idProvincia: provinciaId } });
    }
}
