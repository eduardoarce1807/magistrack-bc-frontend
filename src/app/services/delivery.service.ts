import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  TarifaDelivery,
  CrearTarifaDelivery,
  CalculoDeliveryConDireccion,
  CalculoDeliveryConUbicacion,
  RespuestaCalculoDelivery,
  RespuestaRecalculoDelivery,
  FiltrosBusquedaTarifas,
  RespuestaGenerica
} from '../model/deliveryModel';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {

  private baseUrl = `${environment.apiUrl}/delivery`;

  constructor(private http: HttpClient) { }

  // ==================== MANTENEDOR DE TARIFAS ====================
  
  /**
   * Obtiene todas las tarifas de delivery activas
   */
  listarTarifasActivas(): Observable<TarifaDelivery[]> {
    return this.http.get<TarifaDelivery[]>(`${this.baseUrl}/tarifas`);
  }

  /**
   * Crea una nueva tarifa de delivery
   */
  crearTarifa(tarifa: CrearTarifaDelivery): Observable<TarifaDelivery> {
    return this.http.post<TarifaDelivery>(`${this.baseUrl}/tarifas`, tarifa);
  }

  /**
   * Actualiza una tarifa existente
   */
  actualizarTarifa(id: number, tarifa: CrearTarifaDelivery): Observable<TarifaDelivery> {
    return this.http.put<TarifaDelivery>(`${this.baseUrl}/tarifas/${id}`, tarifa);
  }

  /**
   * Elimina (desactiva) una tarifa
   */
  eliminarTarifa(id: number): Observable<RespuestaGenerica> {
    return this.http.delete<RespuestaGenerica>(`${this.baseUrl}/tarifas/${id}`);
  }

  /**
   * Obtiene una tarifa por su ID
   */
  obtenerTarifaPorId(id: number): Observable<TarifaDelivery> {
    return this.http.get<TarifaDelivery>(`${this.baseUrl}/tarifas/${id}`);
  }

  // ==================== BÚSQUEDAS POR UBICACIÓN ====================

  /**
   * Busca tarifas por departamento
   */
  buscarTarifasPorDepartamento(idDepartamento: number): Observable<TarifaDelivery[]> {
    return this.http.get<TarifaDelivery[]>(`${this.baseUrl}/tarifas/departamento/${idDepartamento}`);
  }

  /**
   * Busca tarifas por provincia
   */
  buscarTarifasPorProvincia(idProvincia: number): Observable<TarifaDelivery[]> {
    return this.http.get<TarifaDelivery[]>(`${this.baseUrl}/tarifas/provincia/${idProvincia}`);
  }

  /**
   * Busca tarifas por distrito
   */
  buscarTarifasPorDistrito(idDistrito: number): Observable<TarifaDelivery[]> {
    return this.http.get<TarifaDelivery[]>(`${this.baseUrl}/tarifas/distrito/${idDistrito}`);
  }

  /**
   * Busca tarifas con filtros múltiples
   */
  buscarTarifasConFiltros(filtros: FiltrosBusquedaTarifas): Observable<TarifaDelivery[]> {
    let params = new HttpParams();
    
    if (filtros.idDepartamento) {
      params = params.set('idDepartamento', filtros.idDepartamento.toString());
    }
    if (filtros.idProvincia) {
      params = params.set('idProvincia', filtros.idProvincia.toString());
    }
    if (filtros.idDistrito) {
      params = params.set('idDistrito', filtros.idDistrito.toString());
    }
    if (filtros.activo !== undefined) {
      params = params.set('activo', filtros.activo.toString());
    }
    if (filtros.tipoFechaEntrega) {
      params = params.set('tipoFechaEntrega', filtros.tipoFechaEntrega);
    }

    return this.http.get<TarifaDelivery[]>(`${this.baseUrl}/tarifas/buscar`, { params });
  }

  // ==================== CÁLCULO DE DELIVERY ====================

  /**
   * Calcula el costo de delivery usando dirección
   */
  calcularDeliveryConDireccion(calculo: CalculoDeliveryConDireccion): Observable<RespuestaCalculoDelivery> {
    return this.http.post<RespuestaCalculoDelivery>(`${this.baseUrl}/calcular`, calculo);
  }

  /**
   * Calcula el costo de delivery usando ubicación directa
   */
  calcularDeliveryConUbicacion(calculo: CalculoDeliveryConUbicacion): Observable<RespuestaCalculoDelivery> {
    return this.http.post<RespuestaCalculoDelivery>(`${this.baseUrl}/calcular`, calculo);
  }

  // ==================== GESTIÓN DE DELIVERY EN PEDIDOS ====================

  /**
   * Recalcula el delivery de un pedido específico
   */
  recalcularDeliveryPedido(idPedido: string): Observable<RespuestaRecalculoDelivery> {
    return this.http.put<RespuestaRecalculoDelivery>(`${environment.apiUrl}/pedido/${idPedido}/recalcular-delivery`, {});
  }

  /**
   * Calcula el delivery de un pedido sin guardarlo
   */
  calcularDeliveryPedido(idPedido: string): Observable<RespuestaCalculoDelivery> {
    return this.http.get<RespuestaCalculoDelivery>(`${environment.apiUrl}/pedido/${idPedido}/calcular-delivery`);
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Valida si una tarifa es válida para crear/actualizar
   */
  validarTarifa(tarifa: CrearTarifaDelivery): string[] {
    const errores: string[] = [];

    if (tarifa.precio < 0) {
      errores.push('El precio debe ser mayor o igual a 0');
    }

    if (tarifa.montoMinimoPedido && tarifa.montoMaximoPedido) {
      if (tarifa.montoMinimoPedido >= tarifa.montoMaximoPedido) {
        errores.push('El monto mínimo debe ser menor al monto máximo');
      }
    }

    if (tarifa.montoMinimoPedido && tarifa.montoMinimoPedido < 0) {
      errores.push('El monto mínimo debe ser mayor o igual a 0');
    }

    if (tarifa.montoMaximoPedido && tarifa.montoMaximoPedido < 0) {
      errores.push('El monto máximo debe ser mayor o igual a 0');
    }

    if (tarifa.costoAgencia && tarifa.costoAgencia < 0) {
      errores.push('El costo de agencia debe ser mayor o igual a 0');
    }

    if (tarifa.aplicaCostoAgenciaSiMenosDe && tarifa.aplicaCostoAgenciaSiMenosDe < 0) {
      errores.push('El monto para aplicar costo de agencia debe ser mayor o igual a 0');
    }

    if (tarifa.prioridad < 1 || tarifa.prioridad > 10) {
      errores.push('La prioridad debe estar entre 1 y 10');
    }

    return errores;
  }

  /**
   * Formatea el texto de ubicación completa
   */
  formatearUbicacionCompleta(tarifa: TarifaDelivery): string {
    const partes: string[] = [];
    
    if (tarifa.departamento?.nombre) {
      partes.push(tarifa.departamento.nombre);
    }
    
    if (tarifa.provincia?.nombre) {
      partes.push(tarifa.provincia.nombre);
    }
    
    if (tarifa.distrito?.nombre) {
      partes.push(tarifa.distrito.nombre);
    }

    if (partes.length === 0) {
      return 'Nacional';
    }

    return partes.join(', ');
  }

  /**
   * Formatea el resumen de condiciones
   */
  formatearResumenCondiciones(tarifa: TarifaDelivery): string {
    const condiciones: string[] = [];

    // Tipo de entrega
    if (tarifa.tipoFechaEntregaDescripcion) {
      condiciones.push(`Entrega: ${tarifa.tipoFechaEntregaDescripcion}`);
    }

    // Punto de encuentro
    if (tarifa.puntoEncuentro) {
      condiciones.push(`Punto: ${tarifa.puntoEncuentro}`);
    }

    // Rango de montos
    if (tarifa.montoMinimoPedido || tarifa.montoMaximoPedido) {
      let rango = 'Pedidos: ';
      if (tarifa.montoMinimoPedido && tarifa.montoMaximoPedido) {
        rango += `S/ ${tarifa.montoMinimoPedido} - S/ ${tarifa.montoMaximoPedido}`;
      } else if (tarifa.montoMinimoPedido) {
        rango += `desde S/ ${tarifa.montoMinimoPedido}`;
      } else if (tarifa.montoMaximoPedido) {
        rango += `hasta S/ ${tarifa.montoMaximoPedido}`;
      }
      condiciones.push(rango);
    }

    // Costo de agencia
    if (tarifa.costoAgencia && tarifa.aplicaCostoAgenciaSiMenosDe) {
      condiciones.push(`Agencia: S/ ${tarifa.costoAgencia} si < S/ ${tarifa.aplicaCostoAgenciaSiMenosDe}`);
    }

    return condiciones.length > 0 ? condiciones.join(' | ') : 'Sin condiciones especiales';
  }

  /**
   * Obtiene el texto descriptivo del tipo de fecha de entrega
   */
  obtenerDescripcionTipoEntrega(tipo: string): string {
    switch (tipo) {
      case 'MISMO_DIA':
        return 'Mismo día';
      case 'DE_UN_DIA_PARA_OTRO':
        return 'De un día para otro';
      default:
        return tipo;
    }
  }

  /**
   * Obtiene el color del badge según la prioridad
   */
  obtenerColorPrioridad(prioridad: number): string {
    switch (prioridad) {
      case 1:
        return 'danger'; // Rojo para alta prioridad
      case 2:
        return 'warning'; // Amarillo para media prioridad
      case 3:
        return 'info'; // Azul para baja prioridad
      default:
        return 'secondary'; // Gris para muy baja/mínima prioridad
    }
  }
}