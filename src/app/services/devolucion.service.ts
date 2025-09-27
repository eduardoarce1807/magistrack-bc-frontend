import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  DevolucionListadoResponse,
  DevolucionDetalle,
  DevolucionRequest,
  DevolucionUpdateRequest,
  EstadoUpdateRequest,
  DevolucionFiltros,
  DevolucionCatalogos,
  DevolucionSimple,
  TopMotivoReporte
} from '../model/devolucionesModel';
import { Response_Generico } from '../model/reponseGeneric';

@Injectable({
  providedIn: 'root'
})
export class DevolucionService {
  private baseUrl = `${environment.apiUrl}/devoluciones`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener listado paginado de devoluciones con filtros
   */
  obtenerDevoluciones(filtros: DevolucionFiltros = {}): Observable<DevolucionListadoResponse> {
    let params = new HttpParams();
    
    if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
    if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
    if (filtros.query) params = params.set('query', filtros.query);
    if (filtros.idEstadoDevolucion) params = params.set('idEstadoDevolucion', filtros.idEstadoDevolucion.toString());
    if (filtros.idAccionDevolucion) params = params.set('idAccionDevolucion', filtros.idAccionDevolucion.toString());
    if (filtros.page !== undefined) params = params.set('page', filtros.page.toString());
    if (filtros.size !== undefined) params = params.set('size', filtros.size.toString());
    if (filtros.sort) params = params.set('sort', filtros.sort);
    if (filtros.direction) params = params.set('direction', filtros.direction);

    return this.http.get<DevolucionListadoResponse>(this.baseUrl, { params });
  }

  /**
   * Obtener devolución por ID
   */
  obtenerDevolucionPorId(id: string): Observable<Response_Generico<DevolucionDetalle>> {
    return this.http.get<Response_Generico<DevolucionDetalle>>(`${this.baseUrl}/${id}`);
  }

  /**
   * Crear nueva devolución
   */
  crearDevolucion(devolucion: DevolucionRequest): Observable<Response_Generico<any>> {
    const formData = new FormData();
    
    formData.append('idPedido', devolucion.idPedido);
    formData.append('idMotivoDevolucion', devolucion.idMotivoDevolucion.toString());
    formData.append('idAccionDevolucion', devolucion.idAccionDevolucion.toString());
    
    if (devolucion.fechaDevolucion) formData.append('fechaDevolucion', devolucion.fechaDevolucion);
    if (devolucion.descripcion) formData.append('descripcion', devolucion.descripcion);
    if (devolucion.manifiesto) formData.append('manifiesto', devolucion.manifiesto);
    if (devolucion.montoDevolucion !== undefined) formData.append('montoDevolucion', devolucion.montoDevolucion.toString());
    if (devolucion.observaciones) formData.append('observaciones', devolucion.observaciones);
    if (devolucion.usuarioRegistro) formData.append('usuarioRegistro', devolucion.usuarioRegistro);
    if (devolucion.archivo) formData.append('archivo', devolucion.archivo);

    return this.http.post<Response_Generico<any>>(this.baseUrl, formData);
  }

  /**
   * Actualizar devolución existente
   */
  actualizarDevolucion(id: string, devolucion: DevolucionUpdateRequest): Observable<Response_Generico<any>> {
    const formData = new FormData();
    
    if (devolucion.idMotivoDevolucion !== undefined) formData.append('idMotivoDevolucion', devolucion.idMotivoDevolucion.toString());
    if (devolucion.idAccionDevolucion !== undefined) formData.append('idAccionDevolucion', devolucion.idAccionDevolucion.toString());
    if (devolucion.idEstadoDevolucion !== undefined) formData.append('idEstadoDevolucion', devolucion.idEstadoDevolucion.toString());
    if (devolucion.fechaDevolucion) formData.append('fechaDevolucion', devolucion.fechaDevolucion);
    if (devolucion.descripcion) formData.append('descripcion', devolucion.descripcion);
    if (devolucion.manifiesto) formData.append('manifiesto', devolucion.manifiesto);
    if (devolucion.montoDevolucion !== undefined) formData.append('montoDevolucion', devolucion.montoDevolucion.toString());
    if (devolucion.observaciones) formData.append('observaciones', devolucion.observaciones);
    if (devolucion.usuarioGestion) formData.append('usuarioGestion', devolucion.usuarioGestion);
    if (devolucion.archivo) formData.append('archivo', devolucion.archivo);
    if (devolucion.eliminarArchivo !== undefined) formData.append('eliminarArchivo', devolucion.eliminarArchivo.toString());

    return this.http.put<Response_Generico<any>>(`${this.baseUrl}/${id}`, formData);
  }

  /**
   * Cambiar estado de devolución
   */
  cambiarEstado(id: string, estadoRequest: EstadoUpdateRequest): Observable<Response_Generico<any>> {
    const formData = new FormData();
    formData.append('idEstadoDevolucion', estadoRequest.idEstadoDevolucion.toString());
    if (estadoRequest.usuarioGestion) formData.append('usuarioGestion', estadoRequest.usuarioGestion);
    if (estadoRequest.observaciones) formData.append('observaciones', estadoRequest.observaciones);

    return this.http.post<Response_Generico<any>>(`${this.baseUrl}/${id}/estado`, formData);
  }

  /**
   * Eliminar devolución
   */
  eliminarDevolucion(id: string, usuarioGestion?: string): Observable<Response_Generico<any>> {
    let params = new HttpParams();
    if (usuarioGestion) params = params.set('usuarioGestion', usuarioGestion);

    return this.http.delete<Response_Generico<any>>(`${this.baseUrl}/${id}`, { params });
  }

  /**
   * Obtener catálogos y estadísticas
   */
  obtenerCatalogos(): Observable<DevolucionCatalogos> {
    return this.http.get<DevolucionCatalogos>(`${this.baseUrl}/catalogos`);
  }

  /**
   * Obtener devoluciones por cliente
   */
  obtenerDevolucionesPorCliente(idCliente: number): Observable<Response_Generico<DevolucionSimple[]>> {
    return this.http.get<Response_Generico<DevolucionSimple[]>>(`${this.baseUrl}/cliente/${idCliente}`);
  }

  /**
   * Obtener reporte de top motivos
   */
  obtenerReporteMotivos(fechaInicio?: string, fechaFin?: string): Observable<Response_Generico<[string, number][]>> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
    if (fechaFin) params = params.set('fechaFin', fechaFin);

    return this.http.get<Response_Generico<[string, number][]>>(`${this.baseUrl}/reportes/motivos`, { params });
  }

  /**
   * Health check del módulo
   */
  healthCheck(): Observable<Response_Generico<any>> {
    return this.http.get<Response_Generico<any>>(`${this.baseUrl}/health`);
  }

  /**
   * Obtener información de un pedido para la devolución
   */
  buscarPedido(idPedido: string): Observable<any> {
    // Este endpoint podría necesitar ser implementado en el backend
    // o usar el servicio de pedidos existente
    return this.http.get<any>(`${environment.apiUrl}/pedido/${idPedido}`);
  }
}