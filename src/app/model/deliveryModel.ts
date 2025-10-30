// Modelos para el sistema de delivery simplificado

// Tipos de regla para el sistema dinámico configurable
export enum TipoReglaDelivery {
  ENVIO_GRATIS_NACIONAL = 'ENVIO_GRATIS_NACIONAL',
  ENVIO_GRATIS_LIMA = 'ENVIO_GRATIS_LIMA',
  DISTRITO_ESPECIFICO = 'DISTRITO_ESPECIFICO',
  LIMA_GENERAL = 'LIMA_GENERAL',
  PROVINCIA = 'PROVINCIA'
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
  departamento?: Departamento;
}

// Interfaz para distrito
export interface Distrito {
  idDistrito: number;
  nombre: string;
  provincia?: Provincia;
}

// Nueva interfaz simplificada para tarifa de delivery (ajustada a la respuesta del backend)
export interface TarifaDelivery {
  idTarifaDelivery?: number; // Campo del backend
  id?: number; // Para compatibilidad con frontend
  tipoRegla: TipoReglaDelivery | string;
  tipoReglaDescripcion?: string; // Campo del backend
  distrito?: Distrito | null;
  ubicacionCompleta?: string; // Campo del backend
  precio?: number; // Campo del backend (precio)
  tarifa?: number; // Para compatibilidad con frontend
  montoMinimoAplicacion?: number | null; // Campo del backend
  puntoEncuentro?: string | null; // Campo del backend
  descripcion?: string; // Campo del backend
  activo: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string | null;
  // Propiedades calculadas para compatibilidad con componentes existentes
  descripcionRegla?: string;
}

// Interfaz para crear/actualizar tarifa (nueva estructura del backend)
export interface CrearTarifaDelivery {
  tipoRegla: TipoReglaDelivery | string;
  precio: number;                        // ⚠️ OBLIGATORIO (no puede ser null) - cambió de 'tarifa' a 'precio'
  idDistrito?: number | null;            // Opcional (solo para DISTRITO_ESPECIFICO)
  montoMinimoAplicacion?: number | null; // NUEVO: Campo configurable para envío gratis
  puntoEncuentro?: string | null;        // Opcional
  descripcion?: string | null;           // Opcional
  activo?: boolean;                      // Opcional (default: true)
}

// Interfaz para cálculo de delivery (nueva estructura simplificada)
export interface CalculoDeliveryRequest {
  totalPedido: number;
  idDistrito: number;
}

// Nueva interfaz para respuesta de cálculo de delivery
export interface CalculoDeliveryResponse {
  tarifa: number;
  reglaAplicada: TipoReglaDelivery | string;
  descripcion: string;
  esGratis: boolean;
}

// Interfaz para información de delivery en pedidos
export interface DeliveryEnPedido {
  costoDelivery?: number;
  aplicaDelivery?: boolean;
  metodoCalculoDelivery?: string;
  notaDelivery?: string;
}

// Interfaz para filtros de búsqueda de tarifas (simplificado)
export interface FiltrosBusquedaTarifas {
  tipoRegla?: TipoReglaDelivery | string;
  idDistrito?: number;
  activo?: boolean;
}

// Interfaz para respuesta genérica del sistema
export interface RespuestaGenerica {
  success: boolean;
  mensaje: string;
  data?: any;
}

// Nueva clase modelo para formulario dinámico configurable
export class TarifaDeliveryFormModel {
  id: number | null = null;
  tipoRegla: TipoReglaDelivery | string = TipoReglaDelivery.DISTRITO_ESPECIFICO;
  precio: number = 0;
  montoMinimoAplicacion: number | null = null; // NUEVO: Campo configurable
  
  // Campos para la selección en cascada de ubicación
  idDepartamento: number | null = null;
  idProvincia: number | null = null;
  idDistrito: number | null = null;
  
  // Campo editable para descripción
  descripcion: string = '';
  
  activo: boolean = true;

  constructor() {}

  // Método para convertir a objeto para envío
  toCreateRequest(): CrearTarifaDelivery {
    return {
      tipoRegla: this.tipoRegla,
      precio: this.precio,
      idDistrito: this.idDistrito,
      montoMinimoAplicacion: this.montoMinimoAplicacion, // Usar el valor configurado
      puntoEncuentro: null,                   // Por ahora null, se puede agregar al formulario después
      descripcion: this.descripcion || this.getDescripcionSegunRegla(), // Usar la descripción editada o la por defecto
      activo: this.activo
    };
  }

  // Método auxiliar para obtener el monto mínimo por defecto según la regla (para compatibilidad)
  private getMontoMinimoDefectoSegunRegla(): number | null {
    switch (this.tipoRegla) {
      case TipoReglaDelivery.ENVIO_GRATIS_NACIONAL:
        return 500.00; // Valor por defecto, pero ahora es configurable
      case TipoReglaDelivery.ENVIO_GRATIS_LIMA:
        return 350.00; // Valor por defecto, pero ahora es configurable
      default:
        return null;
    }
  }

  // Método auxiliar para obtener descripción según la regla
  private getDescripcionSegunRegla(): string | null {
    const opcion = TIPOS_REGLA_OPTIONS.find(o => o.value === this.tipoRegla);
    return opcion?.descripcion || null;
  }

  // Método para cargar datos desde una tarifa existente
  fromTarifa(tarifa: TarifaDelivery): void {
    this.id = tarifa.idTarifaDelivery || tarifa.id || null;
    this.tipoRegla = tarifa.tipoRegla;
    this.precio = tarifa.precio || tarifa.tarifa || 0;
    this.montoMinimoAplicacion = tarifa.montoMinimoAplicacion || null;
    
    // Extraer IDs de ubicación desde la estructura anidada
    if (tarifa.distrito) {
      this.idDistrito = tarifa.distrito.idDistrito;
      
      if (tarifa.distrito.provincia) {
        this.idProvincia = tarifa.distrito.provincia.idProvincia;
        
        if (tarifa.distrito.provincia.departamento) {
          this.idDepartamento = tarifa.distrito.provincia.departamento.idDepartamento;
        }
      }
    }
    
    this.descripcion = tarifa.descripcion || this.getDescripcionSegunRegla() || '';
    this.activo = tarifa.activo;
  }

  // Método para limpiar el formulario
  reset(): void {
    this.id = null;
    this.tipoRegla = TipoReglaDelivery.DISTRITO_ESPECIFICO;
    this.precio = 0;
    this.montoMinimoAplicacion = null;
    this.idDepartamento = null;
    this.idProvincia = null;
    this.idDistrito = null;
    this.descripcion = '';
    this.activo = true;
  }

  // Método para limpiar la selección de ubicación
  resetUbicacion(): void {
    this.idDepartamento = null;
    this.idProvincia = null;
    this.idDistrito = null;
  }

  // Método para limpiar provincias y distritos cuando cambia el departamento
  resetProvinciaYDistrito(): void {
    this.idProvincia = null;
    this.idDistrito = null;
  }

  // Método para limpiar solo el distrito cuando cambia la provincia
  resetDistrito(): void {
    this.idDistrito = null;
  }

  // Validar si requiere distrito
  requiereDistrito(): boolean {
    return this.tipoRegla === TipoReglaDelivery.DISTRITO_ESPECIFICO;
  }

  // Verificar si es una regla de envío gratis
  esEnvioGratis(): boolean {
    return this.tipoRegla === TipoReglaDelivery.ENVIO_GRATIS_NACIONAL || 
           this.tipoRegla === TipoReglaDelivery.ENVIO_GRATIS_LIMA;
  }

  // Nuevo método para verificar si requiere monto mínimo configurable
  requiereMontoMinimo(): boolean {
    return this.esEnvioGratis();
  }
}

// Constantes para las opciones de tipo de regla (sistema dinámico configurable)
export const TIPOS_REGLA_OPTIONS = [
  { 
    value: TipoReglaDelivery.ENVIO_GRATIS_NACIONAL, 
    label: 'Envío gratis nacional',
    descripcion: 'Envío gratuito nacional por monto mínimo configurable',
    requiereDistrito: false,
    requiereMontoMinimo: true,
    esUnico: true, // Solo puede existir 1 registro
    tarifaFija: 0
  },
  { 
    value: TipoReglaDelivery.ENVIO_GRATIS_LIMA, 
    label: 'Envío gratis Lima',
    descripcion: 'Envío gratuito Lima por monto mínimo configurable',
    requiereDistrito: false,
    requiereMontoMinimo: true,
    esUnico: true, // Solo puede existir 1 registro
    tarifaFija: 0
  },
  { 
    value: TipoReglaDelivery.DISTRITO_ESPECIFICO, 
    label: 'Tarifa por distrito específico',
    descripcion: 'Tarifa personalizada para un distrito en particular',
    requiereDistrito: true,
    requiereMontoMinimo: false,
    esUnico: false, // Puede existir múltiples registros
    tarifaFija: null
  },
  { 
    value: TipoReglaDelivery.LIMA_GENERAL, 
    label: 'Tarifa general para Lima',
    descripcion: 'Tarifa estándar para todos los distritos de Lima (sin reglas específicas)',
    requiereDistrito: false,
    requiereMontoMinimo: false,
    esUnico: true, // Solo puede existir 1 registro
    tarifaFija: null
  },
  { 
    value: TipoReglaDelivery.PROVINCIA, 
    label: 'Tarifa para provincia',
    descripcion: 'Tarifa estándar para distritos fuera de Lima',
    requiereDistrito: false,
    requiereMontoMinimo: false,
    esUnico: true, // Solo puede existir 1 registro
    tarifaFija: null
  }
];

// Función helper para obtener la descripción de una regla
export function obtenerDescripcionRegla(tipoRegla: TipoReglaDelivery | string): string {
  const opcion = TIPOS_REGLA_OPTIONS.find(o => o.value === tipoRegla);
  return opcion?.descripcion || 'Regla no definida';
}

// Función helper para verificar si una regla requiere distrito
export function reglaRequiereDistrito(tipoRegla: TipoReglaDelivery | string): boolean {
  const opcion = TIPOS_REGLA_OPTIONS.find(o => o.value === tipoRegla);
  return opcion?.requiereDistrito || false;
}

// Función helper para verificar si una regla requiere monto mínimo configurable
export function reglaRequiereMontoMinimo(tipoRegla: TipoReglaDelivery | string): boolean {
  const opcion = TIPOS_REGLA_OPTIONS.find(o => o.value === tipoRegla);
  return opcion?.requiereMontoMinimo || false;
}

// Función helper para verificar si una regla es única (solo 1 registro permitido)
export function reglaEsUnica(tipoRegla: TipoReglaDelivery | string): boolean {
  const opcion = TIPOS_REGLA_OPTIONS.find(o => o.value === tipoRegla);
  return opcion?.esUnico || false;
}

// Función para obtener los tipos de regla únicos
export function obtenerTiposReglaUnicos(): TipoReglaDelivery[] {
  return TIPOS_REGLA_OPTIONS
    .filter(opcion => opcion.esUnico)
    .map(opcion => opcion.value as TipoReglaDelivery);
}

// Función para filtrar opciones disponibles según registros existentes
export function filtrarOpcionesDisponibles(
  tarifasExistentes: TarifaDelivery[], 
  modoEdicion: boolean = false, 
  tarifaEnEdicion?: TarifaDelivery
): typeof TIPOS_REGLA_OPTIONS {
  if (modoEdicion && tarifaEnEdicion) {
    // En modo edición, permitir la misma opción que se está editando
    return TIPOS_REGLA_OPTIONS;
  }

  // En modo creación, filtrar opciones únicas que ya existen
  const tiposExistentes = tarifasExistentes.map(t => t.tipoRegla);
  
  return TIPOS_REGLA_OPTIONS.filter(opcion => {
    if (!opcion.esUnico) {
      // Las reglas no únicas siempre están disponibles (DISTRITO_ESPECIFICO)
      return true;
    }
    
    // Las reglas únicas solo están disponibles si no existen ya
    return !tiposExistentes.includes(opcion.value);
  });
}