// Interfaces para el módulo de devoluciones

export interface EstadoDevolucion {
  idEstadoDevolucion: number;
  descripcion: string;
  color: string;
}

export interface AccionDevolucion {
  idAccionDevolucion: number;
  descripcion: string;
}

export interface MotivoDevolucion {
  idMotivoDevolucion: number;
  descripcion: string;
}

export interface DevolucionEstadisticas {
  totalDevoluciones: number;
  devolucionesRegistradas: number;
  devolucionesEnProceso: number;
  devolucionesCompletadas: number;
  devolucionesCanceladas: number;
  devolucionesDelMes: number;
}

export interface DevolucionCatalogos {
  estados: EstadoDevolucion[];
  acciones: AccionDevolucion[];
  motivos: MotivoDevolucion[];
  estadisticas: DevolucionEstadisticas;
}

export interface DevolucionListado {
  idDevolucion: string;
  fechaRegistro: string;
  fechaDevolucion: string | null;
  idPedido: string;
  fechaPedido: string;
  montoPedido: number;
  nombreCliente: string;
  numeroDocumentoCliente: string;
  telefonoCliente: string;
  correoCliente: string;
  motivoDevolucion: string;
  accionDevolucion: string;
  estadoDevolucion: string;
  colorEstado: string;
  descripcion: string;
  montoDevolucion: number;
  usuarioRegistro: string;
  fechaActualizacion: string;
}

export interface DevolucionDetalle {
  idDevolucion: string;
  fechaRegistro: string;
  fechaDevolucion: string | null;
  idPedido: string;
  fechaPedido: string;
  montoPedido: number;
  idCliente: number;
  nombreCliente: string;
  numeroDocumentoCliente: string;
  telefonoCliente: string;
  correoCliente: string;
  direccionCliente: string;
  idMotivoDevolucion: number;
  motivoDevolucion: string;
  idAccionDevolucion: number;
  accionDevolucion: string;
  idEstadoDevolucion: number;
  estadoDevolucion: string;
  colorEstado: string;
  descripcion: string;
  manifiesto: string;
  urlAdjunto: string | null;
  montoDevolucion: number;
  observaciones: string | null;
  usuarioRegistro: string;
  usuarioGestion: string | null;
  fechaActualizacion: string;
  activo: boolean;
}

export interface DevolucionListadoResponse {
  devoluciones: DevolucionListado[];
  totalElementos: number;
  totalPaginas: number;
  paginaActual: number;
  elementosPorPagina: number;
  esUltimaPagina: boolean;
  esPrimeraPagina: boolean;
}

export interface DevolucionRequest {
  idPedido: string;
  idMotivoDevolucion: number;
  idAccionDevolucion: number;
  fechaDevolucion?: string;
  descripcion?: string;
  manifiesto?: string;
  montoDevolucion?: number;
  observaciones?: string;
  usuarioRegistro?: string;
  archivo?: File;
}

export interface DevolucionUpdateRequest {
  idMotivoDevolucion?: number;
  idAccionDevolucion?: number;
  idEstadoDevolucion?: number;
  fechaDevolucion?: string;
  descripcion?: string;
  manifiesto?: string;
  montoDevolucion?: number;
  observaciones?: string;
  usuarioGestion?: string;
  archivo?: File;
  eliminarArchivo?: boolean;
}

export interface EstadoUpdateRequest {
  idEstadoDevolucion: number;
  usuarioGestion?: string;
  observaciones?: string;
}

export interface DevolucionFiltros {
  fechaInicio?: string;
  fechaFin?: string;
  query?: string;
  idEstadoDevolucion?: number;
  idAccionDevolucion?: number;
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'ASC' | 'DESC';
}

export interface TopMotivoReporte {
  motivo: string;
  cantidad: number;
}

export interface DevolucionSimple {
  idDevolucion: string;
  fechaRegistro: string;
  pedido: {
    idPedido: string;
  };
  estadoDevolucion: {
    descripcion: string;
  };
}