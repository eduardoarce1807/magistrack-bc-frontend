export interface AnuncioModel {
  idAnuncio?: number;
  nombre: string;
  descripcion: string;
  urlImagen: string;
  posicion: number; // 1, 2, 3, 4 para las 4 secciones del home
  activo: boolean;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

// Nuevo modelo para el fondo del login
export interface LoginBackgroundModel {
  idBackground?: number;
  nombre: string;
  descripcion?: string;
  urlImagen: string;
  activo: boolean;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface AnuncioRequest {
  nombre: string;
  descripcion: string;
  imagen: File;
  posicion: number;
  activo: boolean;
}

export interface AnuncioUpdateRequest {
  idAnuncio: number;
  nombre?: string;
  descripcion?: string;
  imagen?: File;
  posicion?: number;
  activo?: boolean;
}

// Requests para background del login
export interface LoginBackgroundRequest {
  nombre: string;
  descripcion?: string;
  imagen: File;
}

export interface LoginBackgroundUpdateRequest {
  idBackground: number;
  nombre?: string;
  descripcion?: string;
  imagen?: File;
  activo?: boolean;
}

export interface AnuncioResponse {
  success: boolean;
  message: string;
  data: AnuncioModel;
}

export interface AnunciosListResponse {
  success: boolean;
  message: string;
  data: AnuncioModel[];
}

// Responses para background del login
export interface LoginBackgroundResponse {
  success: boolean;
  message: string;
  data: LoginBackgroundModel;
}

export interface LoginBackgroundListResponse {
  success: boolean;
  message: string;
  data: LoginBackgroundModel[];
}

export interface LoginBackgroundConfigResponse {
  success: boolean;
  message: string;
  data: {
    backgroundActivo: LoginBackgroundModel | null;
    usarPatternPorDefecto: boolean;
  };
}

export interface ConfiguracionHome {
  anunciosActivos: AnuncioModel[];
  layoutConfig: {
    mostrarSeccion1: boolean;
    mostrarSeccion2: boolean;
    mostrarSeccion3: boolean;
    mostrarSeccion4: boolean;
  };
}