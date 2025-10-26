// Modelos para el sistema de tarifario de delivery

// Tipos de fecha de entrega
export enum TipoFechaEntrega {
  MISMO_DIA = 'MISMO_DIA',
  DE_UN_DIA_PARA_OTRO = 'DE_UN_DIA_PARA_OTRO'
}

// Interfaz para departamento
export interface Departamento {
  idDepartamento: number;
  nombre: string;
}

// Interfaz para provincia
export interface Provincia {
  idProvincia: number;
  nombre: string;
}

// Interfaz para distrito
export interface Distrito {
  idDistrito: number;
  nombre: string;
}

// Interfaz principal para tarifa de delivery
export interface TarifaDelivery {
  idTarifarioDelivery?: number;
  departamento?: Departamento;
  provincia?: Provincia;
  distrito?: Distrito;
  puntoEncuentro?: string | null;
  tipoFechaEntrega: TipoFechaEntrega | string;
  tipoFechaEntregaDescripcion?: string;
  precio: number;
  montoMinimoPedido?: number | null;
  montoMaximoPedido?: number | null;
  costoAgencia?: number | null;
  aplicaCostoAgenciaSiMenosDe?: number | null;
  descripcionCondicion?: string;
  activo: boolean;
  prioridad: number;
  fechaCreacion?: string;
  fechaActualizacion?: string | null;
  ubicacionCompleta?: string;
  resumenCondiciones?: string;
}

// Interfaz para crear/actualizar tarifa
export interface CrearTarifaDelivery {
  idDepartamento?: number | null;
  idProvincia?: number | null;
  idDistrito?: number | null;
  puntoEncuentro?: string | null;
  tipoFechaEntrega: TipoFechaEntrega | string;
  precio: number;
  montoMinimoPedido?: number | null;
  montoMaximoPedido?: number | null;
  costoAgencia?: number | null;
  aplicaCostoAgenciaSiMenosDe?: number | null;
  descripcionCondicion?: string;
  activo: boolean;
  prioridad: number;
}

// Interfaz para cálculo de delivery con dirección
export interface CalculoDeliveryConDireccion {
  idDireccion: number;
  montoPedido: number;
  metodoPago: string;
  esExpress: boolean;
}

// Interfaz para cálculo de delivery con ubicación directa
export interface CalculoDeliveryConUbicacion {
  idDepartamento: number;
  idProvincia: number;
  idDistrito: number;
  montoPedido: number;
  metodoPago: string;
  esExpress: boolean;
}

// Interfaz para tarifa aplicada en cálculo
export interface TarifaAplicada {
  idTarifarioDelivery: number;
  precio: number;
  tipoFechaEntrega: string;
  ubicacionCompleta: string;
}

// Interfaz para respuesta de cálculo de delivery
export interface RespuestaCalculoDelivery {
  costoDelivery: number;
  aplicaDelivery: boolean;
  metodoCalculoDelivery: string;
  tarifaAplicada?: TarifaAplicada;
  condicionesAplicadas: string[];
  mensaje: string;
  costoBase: number;
  costosAdicionales: number;
  descuentos: number;
  ubicacionDetectada: string;
}

// Interfaz para información de delivery en pedidos
export interface DeliveryEnPedido {
  costoDelivery?: number;
  aplicaDelivery?: boolean;
  metodoCalculoDelivery?: string;
  notaDelivery?: string;
}

// Interfaz para respuesta de recálculo de delivery
export interface RespuestaRecalculoDelivery {
  idResultado: number;
  mensaje: string;
}

// Interfaz para filtros de búsqueda de tarifas
export interface FiltrosBusquedaTarifas {
  idDepartamento?: number;
  idProvincia?: number;
  idDistrito?: number;
  activo?: boolean;
  tipoFechaEntrega?: TipoFechaEntrega | string;
}

// Interfaz para respuesta genérica del sistema
export interface RespuestaGenerica {
  success: boolean;
  mensaje: string;
  data?: any;
}

// Interfaz para paginación
export interface PaginacionTarifas {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  content: TarifaDelivery[];
}

// Clase modelo para formulario de tarifa
export class TarifaDeliveryFormModel {
  idTarifarioDelivery: number | null = null;
  idDepartamento: number | null = null;
  idProvincia: number | null = null;
  idDistrito: number | null = null;
  puntoEncuentro: string | null = null;
  tipoFechaEntrega: string = TipoFechaEntrega.DE_UN_DIA_PARA_OTRO;
  precio: number = 0;
  montoMinimoPedido: number | null = null;
  montoMaximoPedido: number | null = null;
  costoAgencia: number | null = null;
  aplicaCostoAgenciaSiMenosDe: number | null = null;
  descripcionCondicion: string = '';
  activo: boolean = true;
  prioridad: number = 1;

  constructor() {}

  // Método para convertir a objeto para envío
  toCreateRequest(): CrearTarifaDelivery {
    return {
      idDepartamento: this.idDepartamento,
      idProvincia: this.idProvincia,
      idDistrito: this.idDistrito,
      puntoEncuentro: this.puntoEncuentro,
      tipoFechaEntrega: this.tipoFechaEntrega,
      precio: this.precio,
      montoMinimoPedido: this.montoMinimoPedido,
      montoMaximoPedido: this.montoMaximoPedido,
      costoAgencia: this.costoAgencia,
      aplicaCostoAgenciaSiMenosDe: this.aplicaCostoAgenciaSiMenosDe,
      descripcionCondicion: this.descripcionCondicion,
      activo: this.activo,
      prioridad: this.prioridad
    };
  }

  // Método para cargar datos desde una tarifa existente
  fromTarifa(tarifa: TarifaDelivery): void {
    this.idTarifarioDelivery = tarifa.idTarifarioDelivery || null;
    this.idDepartamento = tarifa.departamento?.idDepartamento || null;
    this.idProvincia = tarifa.provincia?.idProvincia || null;
    this.idDistrito = tarifa.distrito?.idDistrito || null;
    this.puntoEncuentro = tarifa.puntoEncuentro || null;
    this.tipoFechaEntrega = tarifa.tipoFechaEntrega;
    this.precio = tarifa.precio;
    this.montoMinimoPedido = tarifa.montoMinimoPedido || null;
    this.montoMaximoPedido = tarifa.montoMaximoPedido || null;
    this.costoAgencia = tarifa.costoAgencia || null;
    this.aplicaCostoAgenciaSiMenosDe = tarifa.aplicaCostoAgenciaSiMenosDe || null;
    this.descripcionCondicion = tarifa.descripcionCondicion || '';
    this.activo = tarifa.activo;
    this.prioridad = tarifa.prioridad;
  }

  // Método para limpiar el formulario
  reset(): void {
    this.idTarifarioDelivery = null;
    this.idDepartamento = null;
    this.idProvincia = null;
    this.idDistrito = null;
    this.puntoEncuentro = null;
    this.tipoFechaEntrega = TipoFechaEntrega.DE_UN_DIA_PARA_OTRO;
    this.precio = 0;
    this.montoMinimoPedido = null;
    this.montoMaximoPedido = null;
    this.costoAgencia = null;
    this.aplicaCostoAgenciaSiMenosDe = null;
    this.descripcionCondicion = '';
    this.activo = true;
    this.prioridad = 1;
  }
}

// Constantes útiles
export const TIPOS_FECHA_ENTREGA_OPTIONS = [
  { value: TipoFechaEntrega.MISMO_DIA, label: 'Mismo día' },
  { value: TipoFechaEntrega.DE_UN_DIA_PARA_OTRO, label: 'De un día para otro' }
];

export const PRIORIDADES_OPTIONS = [
  { value: 1, label: 'Alta (1)' },
  { value: 2, label: 'Media (2)' },
  { value: 3, label: 'Baja (3)' },
  { value: 4, label: 'Muy baja (4)' },
  { value: 5, label: 'Mínima (5)' }
];