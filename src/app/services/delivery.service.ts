import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  TarifaDelivery,
  CrearTarifaDelivery,
  CalculoDeliveryRequest,
  CalculoDeliveryResponse,
  FiltrosBusquedaTarifas,
  RespuestaGenerica,
  TipoReglaDelivery,
  obtenerDescripcionRegla,
  Departamento,
  Provincia,
  Distrito
} from '../model/deliveryModel';
import { UbigeoService } from './ubigeo.service';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {

  private baseUrl = `${environment.apiUrl}/tarifa-delivery`;
  private calculoUrl = `${environment.apiUrl}/delivery/calcular`;

  constructor(
    private http: HttpClient,
    private ubigeoService: UbigeoService
  ) { }

  // ==================== MANTENEDOR DE TARIFAS (NUEVA API) ====================
  
  /**
   * Obtiene todas las tarifas de delivery
   */
  listarTarifas(): Observable<TarifaDelivery[]> {
    return this.http.get<any[]>(`${this.baseUrl}`).pipe(
      map((tarifas: any[]) => tarifas.map(tarifa => this.mapearTarifaDesdeBackend(tarifa)))
    );
  }

  /**
   * Obtiene todas las tarifas de delivery activas
   */
  listarTarifasActivas(): Observable<TarifaDelivery[]> {
    return this.http.get<any[]>(`${this.baseUrl}/activas`).pipe(
      map((tarifas: any[]) => tarifas.map(tarifa => this.mapearTarifaDesdeBackend(tarifa)))
    );
  }

  /**
   * Obtiene una tarifa por su ID
   */
  obtenerTarifaPorId(id: number): Observable<TarifaDelivery> {
    return this.http.get<TarifaDelivery>(`${this.baseUrl}/${id}`);
  }

  /**
   * Busca tarifas por tipo de regla
   */
  buscarTarifasPorTipo(tipoRegla: TipoReglaDelivery | string): Observable<TarifaDelivery[]> {
    return this.http.get<TarifaDelivery[]>(`${this.baseUrl}/tipo/${tipoRegla}`);
  }

  /**
   * Crea una nueva tarifa de delivery
   */
  crearTarifa(tarifa: CrearTarifaDelivery): Observable<TarifaDelivery> {
    return this.http.post<TarifaDelivery>(`${this.baseUrl}`, tarifa);
  }

  /**
   * Actualiza una tarifa existente
   */
  actualizarTarifa(id: number, tarifa: CrearTarifaDelivery): Observable<TarifaDelivery> {
    return this.http.put<TarifaDelivery>(`${this.baseUrl}/${id}`, tarifa);
  }

  /**
   * Elimina una tarifa
   */
  eliminarTarifa(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  // ==================== CÁLCULO DE DELIVERY (NUEVA API) ====================

  /**
   * Calcula el costo de delivery usando la nueva API simplificada
   */
  calcularDelivery(request: CalculoDeliveryRequest): Observable<CalculoDeliveryResponse> {
    return this.http.post<CalculoDeliveryResponse>(this.calculoUrl, request);
  }

  // ==================== MÉTODOS AUXILIARES (NUEVA API) ====================

  /**
   * Verifica qué tipos de regla únicos ya existen
   */
  verificarReglasUnicasExistentes(): Observable<{[key: string]: boolean}> {
    return this.listarTarifas().pipe(
      map((tarifas: TarifaDelivery[]) => {
        const existentes: {[key: string]: boolean} = {};
        
        // Verificar cada tipo único
        existentes[TipoReglaDelivery.ENVIO_GRATIS_NACIONAL] = 
          tarifas.some(t => t.tipoRegla === TipoReglaDelivery.ENVIO_GRATIS_NACIONAL);
        
        existentes[TipoReglaDelivery.ENVIO_GRATIS_LIMA] = 
          tarifas.some(t => t.tipoRegla === TipoReglaDelivery.ENVIO_GRATIS_LIMA);
        
        existentes[TipoReglaDelivery.LIMA_GENERAL] = 
          tarifas.some(t => t.tipoRegla === TipoReglaDelivery.LIMA_GENERAL);
        
        existentes[TipoReglaDelivery.PROVINCIA] = 
          tarifas.some(t => t.tipoRegla === TipoReglaDelivery.PROVINCIA);
        
        return existentes;
      })
    );
  }

  /**
   * Valida si una tarifa es válida para crear/actualizar
   */
  validarTarifa(tarifa: CrearTarifaDelivery): string[] {
    const errores: string[] = [];

    if (tarifa.precio < 0) {
      errores.push('El precio debe ser mayor o igual a 0');
    }

    if (!tarifa.tipoRegla) {
      errores.push('Debe seleccionar un tipo de regla');
    }

    // Validar que las reglas de envío gratis tengan precio 0
    if (tarifa.tipoRegla === TipoReglaDelivery.ENVIO_GRATIS_NACIONAL || 
        tarifa.tipoRegla === TipoReglaDelivery.ENVIO_GRATIS_LIMA) {
      if (tarifa.precio !== 0) {
        errores.push('Las reglas de envío gratis deben tener precio S/ 0.00');
      }
      
      // Validar que tengan monto mínimo configurado
      if (!tarifa.montoMinimoAplicacion || tarifa.montoMinimoAplicacion <= 0) {
        errores.push('Las reglas de envío gratis requieren un monto mínimo mayor a 0');
      }
    }

    // Validar que distrito específico requiera idDistrito
    if (tarifa.tipoRegla === TipoReglaDelivery.DISTRITO_ESPECIFICO && !tarifa.idDistrito) {
      errores.push('Debe seleccionar un distrito para tarifas específicas');
    }

    // Validar que otras reglas no tengan distrito
    if (tarifa.tipoRegla !== TipoReglaDelivery.DISTRITO_ESPECIFICO && tarifa.idDistrito) {
      errores.push('Solo las tarifas específicas por distrito pueden tener distrito asignado');
    }

    // Las validaciones de monto mínimo ahora son dinámicas y se manejan en el frontend

    return errores;
  }

  /**
   * Formatea la ubicación para mostrar
   */
  formatearUbicacionCompleta(tarifa: TarifaDelivery): string {
    switch (tarifa.tipoRegla) {
      case TipoReglaDelivery.ENVIO_GRATIS_NACIONAL:
        return `Todo el país (>= S/ ${tarifa.montoMinimoAplicacion || 0})`;
      case TipoReglaDelivery.ENVIO_GRATIS_LIMA:
        return `Lima (>= S/ ${tarifa.montoMinimoAplicacion || 0})`;
      case TipoReglaDelivery.DISTRITO_ESPECIFICO:
        return tarifa.distrito?.nombre || 'Distrito no especificado';
      case TipoReglaDelivery.LIMA_GENERAL:
        return 'Lima (todos los distritos)';
      case TipoReglaDelivery.PROVINCIA:
        return 'Provincias (fuera de Lima)';
      default:
        return 'No definida';
    }
  }

  /**
   * Obtiene la descripción de la regla
   */
  formatearResumenCondiciones(tarifa: TarifaDelivery): string {
    return obtenerDescripcionRegla(tarifa.tipoRegla);
  }

  /**
   * Obtiene el color del badge según el tipo de regla
   */
  obtenerColorTipoRegla(tipoRegla: TipoReglaDelivery | string): string {
    switch (tipoRegla) {
      case TipoReglaDelivery.ENVIO_GRATIS_NACIONAL:
      case TipoReglaDelivery.ENVIO_GRATIS_LIMA:
        return 'success'; // Verde para envío gratis
      case TipoReglaDelivery.DISTRITO_ESPECIFICO:
        return 'primary'; // Azul para específicos
      case TipoReglaDelivery.LIMA_GENERAL:
        return 'info'; // Celeste para Lima
      case TipoReglaDelivery.PROVINCIA:
        return 'warning'; // Amarillo para provincia
      default:
        return 'secondary'; // Gris por defecto
    }
  }

  /**
   * Formatea el precio para mostrar
   */
  formatearPrecio(precio: number | undefined): string {
    if (precio === undefined || precio === null) {
      return 'N/A';
    }
    return precio === 0 ? 'GRATIS' : `S/ ${precio.toFixed(2)}`;
  }

  /**
   * Verifica si una tarifa es de envío gratis
   */
  esEnvioGratis(tipoRegla: TipoReglaDelivery | string): boolean {
    return tipoRegla === TipoReglaDelivery.ENVIO_GRATIS_NACIONAL || 
           tipoRegla === TipoReglaDelivery.ENVIO_GRATIS_LIMA;
  }

  /**
   * Obtiene el texto del estado activo/inactivo
   */
  getTextoEstado(activo: boolean): string {
    return activo ? 'Activa' : 'Inactiva';
  }

  /**
   * Obtiene la clase CSS para el estado
   */
  getClaseEstado(activo: boolean): string {
    return activo ? 'text-success' : 'text-danger';
  }

  // ==================== MÉTODOS DE UBICACIÓN (NUEVA FUNCIONALIDAD) ====================

  /**
   * Obtiene solo los departamentos permitidos: Lima (15) y Callao (7)
   */
  getDepartamentosPermitidos(): Observable<Departamento[]> {
    return this.ubigeoService.getDepartamentos().pipe(
      map((departamentos: any[]) => {
        return departamentos
          .filter(dep => dep.idDepartamento === 15 || dep.idDepartamento === 7)
          .map(dep => ({
            idDepartamento: dep.idDepartamento,
            nombre: dep.nombre
          }));
      })
    );
  }

  /**
   * Obtiene las provincias de un departamento específico
   */
  getProvinciasPorDepartamento(idDepartamento: number): Observable<Provincia[]> {
    return this.ubigeoService.getProvincias(idDepartamento).pipe(
      map((provincias: any[]) => {
        return provincias.map(prov => ({
          idProvincia: prov.idProvincia,
          nombre: prov.nombre,
          departamento: {
            idDepartamento: idDepartamento,
            nombre: idDepartamento === 15 ? 'Lima' : 'Callao'
          }
        }));
      })
    );
  }

  /**
   * Obtiene los distritos de una provincia específica
   */
  getDistritosPorProvincia(idProvincia: number): Observable<Distrito[]> {
    return this.ubigeoService.getDistritos(idProvincia).pipe(
      map((distritos: any[]) => {
        return distritos.map(dist => ({
          idDistrito: dist.idDistrito,
          nombre: dist.nombre,
          provincia: {
            idProvincia: idProvincia,
            nombre: '' // Se puede llenar si se necesita
          }
        }));
      })
    );
  }

  /**
   * Obtiene la información completa de un distrito por su ID
   */
  getDistritoPorId(idDistrito: number): Observable<Distrito | null> {
    // Este método puede requerir un endpoint específico en el backend
    // Por ahora devolvemos null y se puede implementar más tarde si se necesita
    return new Observable(observer => {
      observer.next(null);
      observer.complete();
    });
  }

  // ==================== MÉTODOS PRIVADOS DE MAPEO ====================

  /**
   * Mapea la respuesta del backend al modelo frontend
   */
  private mapearTarifaDesdeBackend(backendData: any): TarifaDelivery {
    return {
      idTarifaDelivery: backendData.idTarifaDelivery,
      id: backendData.idTarifaDelivery, // Para compatibilidad
      tipoRegla: backendData.tipoRegla,
      tipoReglaDescripcion: backendData.tipoReglaDescripcion,
      distrito: backendData.distrito,
      ubicacionCompleta: backendData.ubicacionCompleta,
      precio: backendData.precio,
      tarifa: backendData.precio, // Mapeo del campo precio a tarifa
      montoMinimoAplicacion: backendData.montoMinimoAplicacion,
      puntoEncuentro: backendData.puntoEncuentro,
      descripcion: backendData.descripcion,
      activo: backendData.activo,
      fechaCreacion: backendData.fechaCreacion,
      fechaActualizacion: backendData.fechaActualizacion,
      descripcionRegla: backendData.tipoReglaDescripcion || this.formatearResumenCondiciones({
        tipoRegla: backendData.tipoRegla,
        distrito: backendData.distrito,
        precio: backendData.precio
      } as TarifaDelivery)
    };
  }
}