import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { 
  AnuncioModel, 
  AnuncioRequest, 
  AnuncioUpdateRequest, 
  AnuncioResponse, 
  AnunciosListResponse,
  ConfiguracionHome,
  LoginBackgroundModel,
  LoginBackgroundRequest,
  LoginBackgroundUpdateRequest,
  LoginBackgroundResponse,
  LoginBackgroundListResponse,
  LoginBackgroundConfigResponse
} from '../model/anunciosModel';

@Injectable({
  providedIn: 'root'
})
export class AnuncioService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todos los anuncios
  getAnuncios(): Observable<AnunciosListResponse> {
    return this.http.get<AnunciosListResponse>(`${this.apiUrl}/anuncios`);
  }

  // Obtener anuncio por ID
  getAnuncioById(id: number): Observable<AnuncioResponse> {
    return this.http.get<AnuncioResponse>(`${this.apiUrl}/anuncios/${id}`);
  }

  // Obtener anuncios activos para el home
  getAnunciosActivos(): Observable<AnunciosListResponse> {
    return this.http.get<AnunciosListResponse>(`${this.apiUrl}/anuncios/activos`);
  }

  // Obtener configuración del home (anuncios activos organizados)
  getConfiguracionHome(): Observable<ConfiguracionHome> {
    return this.http.get<ConfiguracionHome>(`${this.apiUrl}/anuncios/configuracion-home`);
  }

  // Crear nuevo anuncio
  createAnuncio(anuncioData: AnuncioRequest): Observable<AnuncioResponse> {
    const formData = new FormData();
    formData.append('nombre', anuncioData.nombre);
    formData.append('descripcion', anuncioData.descripcion);
    formData.append('posicion', anuncioData.posicion.toString());
    formData.append('activo', anuncioData.activo.toString());
    formData.append('imagen', anuncioData.imagen);

    return this.http.post<AnuncioResponse>(`${this.apiUrl}/anuncios`, formData);
  }

  // Actualizar anuncio
  updateAnuncio(anuncioData: AnuncioUpdateRequest): Observable<AnuncioResponse> {
    const formData = new FormData();
    formData.append('idAnuncio', anuncioData.idAnuncio.toString());
    
    if (anuncioData.nombre) formData.append('nombre', anuncioData.nombre);
    if (anuncioData.descripcion) formData.append('descripcion', anuncioData.descripcion);
    if (anuncioData.posicion) formData.append('posicion', anuncioData.posicion.toString());
    if (anuncioData.activo !== undefined) formData.append('activo', anuncioData.activo.toString());
    if (anuncioData.imagen) formData.append('imagen', anuncioData.imagen);

    return this.http.put<AnuncioResponse>(`${this.apiUrl}/anuncios/${anuncioData.idAnuncio}`, formData);
  }

  // Eliminar anuncio
  deleteAnuncio(id: number): Observable<AnuncioResponse> {
    return this.http.delete<AnuncioResponse>(`${this.apiUrl}/anuncios/${id}`);
  }

  // Cambiar estado activo/inactivo
  toggleEstadoAnuncio(id: number, activo: boolean): Observable<AnuncioResponse> {
    return this.http.patch<AnuncioResponse>(`${this.apiUrl}/anuncios/${id}/estado`, { activo });
  }

  // Cambiar posición de anuncio
  cambiarPosicionAnuncio(id: number, nuevaPosicion: number): Observable<AnuncioResponse> {
    return this.http.patch<AnuncioResponse>(`${this.apiUrl}/anuncios/${id}/posicion`, { posicion: nuevaPosicion });
  }

  // ==================== MÉTODOS PARA BACKGROUND DEL LOGIN ====================

  // Obtener todos los backgrounds del login
  getLoginBackgrounds(): Observable<LoginBackgroundListResponse> {
    return this.http.get<LoginBackgroundListResponse>(`${this.apiUrl}/login-background`);
  }

  // Obtener background del login por ID
  getLoginBackgroundById(id: number): Observable<LoginBackgroundResponse> {
    return this.http.get<LoginBackgroundResponse>(`${this.apiUrl}/login-background/${id}`);
  }

  // Obtener configuración actual del background del login (público)
  getLoginBackgroundConfig(): Observable<LoginBackgroundConfigResponse> {
    return this.http.get<LoginBackgroundConfigResponse>(`${this.apiUrl}/public/login-background/config`);
  }

  // Crear nuevo background del login
  createLoginBackground(backgroundData: LoginBackgroundRequest): Observable<LoginBackgroundResponse> {
    const formData = new FormData();
    formData.append('nombre', backgroundData.nombre);
    if (backgroundData.descripcion) formData.append('descripcion', backgroundData.descripcion);
    formData.append('imagen', backgroundData.imagen);

    return this.http.post<LoginBackgroundResponse>(`${this.apiUrl}/login-background`, formData);
  }

  // Actualizar background del login
  updateLoginBackground(backgroundData: LoginBackgroundUpdateRequest): Observable<LoginBackgroundResponse> {
    const formData = new FormData();
    formData.append('idBackground', backgroundData.idBackground.toString());
    
    if (backgroundData.nombre) formData.append('nombre', backgroundData.nombre);
    if (backgroundData.descripcion) formData.append('descripcion', backgroundData.descripcion);
    if (backgroundData.activo !== undefined) formData.append('activo', backgroundData.activo.toString());
    if (backgroundData.imagen) formData.append('imagen', backgroundData.imagen);

    return this.http.put<LoginBackgroundResponse>(`${this.apiUrl}/login-background/${backgroundData.idBackground}`, formData);
  }

  // Eliminar background del login
  deleteLoginBackground(id: number): Observable<LoginBackgroundResponse> {
    return this.http.delete<LoginBackgroundResponse>(`${this.apiUrl}/login-background/${id}`);
  }

  // Activar background del login (solo uno puede estar activo)
  activarLoginBackground(id: number): Observable<LoginBackgroundResponse> {
    return this.http.patch<LoginBackgroundResponse>(`${this.apiUrl}/login-background/${id}/activar`, {});
  }

  // Desactivar todos los backgrounds (volver al patrón por defecto)
  desactivarLoginBackgrounds(): Observable<LoginBackgroundResponse> {
    return this.http.patch<LoginBackgroundResponse>(`${this.apiUrl}/login-background/desactivar-todos`, {});
  }

  // ==================== MÉTODOS DE VALIDACIÓN ====================

  // Validar archivo de imagen para anuncios
  validateImageFile(file: File): { valid: boolean; message: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 4 * 1024 * 1024; // 4MB en bytes

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        message: 'Solo se permiten archivos JPG, JPEG y PNG'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        message: 'El archivo no debe superar los 4MB'
      };
    }

    return {
      valid: true,
      message: 'Archivo válido'
    };
  }

  // Validar archivo de imagen para background del login
  validateLoginBackgroundFile(file: File): { valid: boolean; message: string; recommendation?: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 4 * 1024 * 1024; // 4MB en bytes
    const recommendedDimensions = "1920x1080 (Full HD) o 2560x1440 (2K)";

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        message: 'Solo se permiten archivos JPG, JPEG y PNG'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        message: 'El archivo no debe superar los 4MB'
      };
    }

    return {
      valid: true,
      message: 'Archivo válido para background del login',
      recommendation: `Para mejores resultados, use imágenes con resolución ${recommendedDimensions} y formato landscape (horizontal).`
    };
  }

  // Método privado para manejar errores
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      
      // Crear respuesta de error personalizada
      const errorResponse = {
        success: false,
        message: error.error?.message || 'Error en la operación',
        data: result as T
      };
      
      return of(errorResponse as T);
    };
  }
}