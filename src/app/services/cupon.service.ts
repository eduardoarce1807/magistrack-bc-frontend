import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface CuponRequest {
  codigoCupon: string;
  descripcion: string;
  descuento: number;
  montoMinimo: number;
  stock: number;
  fechaInicio: string; // formato YYYY-MM-DD
  fechaFin: string;
  idClientes: number[];
  idProductos: string[];
}

export interface Cupon {
  idCupon: number;
  codigo: string;
  descripcion: string;
  descuento: number;
  montoMinimo: number;
  stock: number;
  fechaInicio: string;
  fechaFin: string;
  estado: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CuponService {
  private baseUrl = `${environment.apiUrl}/cupon`;

  constructor(private http: HttpClient) {}

  registrarCupon(request: CuponRequest) {
    return this.http.post<Cupon>(`${this.baseUrl}/registrar`, request);
  }

  actualizarCupon(request: CuponRequest) {
    return this.http.put<Cupon>(`${this.baseUrl}/actualizar`, request);
  }

  listarCupones() {
    return this.http.get<Cupon[]>(`${this.baseUrl}`);
  }

  listarCuponesDetallado(){
    return this.http.get<Cupon[]>(`${this.baseUrl}/detallado`);
  }

  obtenerCuponPorId(id: number) {
    return this.http.get<Cupon>(`${this.baseUrl}/${id}`);
  }

  obtenerCuponPorCodigoDetallado(codigo: string) {
    return this.http.get<Cupon>(`${this.baseUrl}/detallado/${codigo}`);
  }

  desactivarCupon(id: number) {
    return this.http.put(`${this.baseUrl}/desactivar/${id}`, {});
  }

  activarCupon(id: number) {
    return this.http.put(`${this.baseUrl}/activar/${id}`, {});
  }

  eliminarCupon(id: number) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  validarCupon(codigo: string) {
    return this.http.get(`${this.baseUrl}/validar/${codigo}`);
  }

  // Nuevos métodos para manejo de clientes
  asignarCliente(idCupon: number, idCliente: number) {
    return this.http.post(`${this.baseUrl}/asignar-cliente`, { idCupon, idCliente });
  }

  removerCliente(idCupon: number, idCliente: number) {
    return this.http.post(`${this.baseUrl}/remover-cliente`, { idCupon, idCliente });
  }

  obtenerCuponesDisponiblesPorCliente(idCliente: number) {
    return this.http.get(`${this.baseUrl}/cliente/${idCliente}/disponibles`);
  }

  verificarAccesoCupon(codigoCupon: string, idCliente: number) {
    return this.http.get(`${this.baseUrl}/verificar-acceso`, { 
      params: { codigoCupon, idCliente: idCliente.toString() } 
    });
  }
}
