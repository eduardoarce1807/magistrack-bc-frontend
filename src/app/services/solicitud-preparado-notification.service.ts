import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { DataService } from './data.service';
import { environment } from '../../environments/environment';

export interface SolicitudPreparadoMagistral {
  id: number;
  idCliente: string;
  descripcion: string;
  urlAdjunto: string;
  fechaCreacion: string;
  atendido: boolean;
  idPedido: string;
}

@Injectable({
  providedIn: 'root'
})
export class SolicitudPreparadoNotificationService {
  
  private pollingSubscription?: Subscription;
  private previousSolicitudes: SolicitudPreparadoMagistral[] = [];
  private isFirstRequest = true;
  private isPollingActive = false;
  
  // Audio element para el sonido
  private audioElement?: HTMLAudioElement;
  
  // BehaviorSubject para notificar nuevas solicitudes
  private nuevasSolicitudes$ = new BehaviorSubject<SolicitudPreparadoMagistral[]>([]);
  
  // Configuración del polling
  private readonly POLLING_INTERVAL = 3000; // 3 segundos
  private readonly SOUND_PATH = 'assets/mp3/sound_solicitud_preparado.mp3';
  private readonly TITLE_BLINK_DURATION = 3000; // 3 segundos parpadeando
  private readonly API_URL = `${environment.apiUrl}/solicitud-preparado-magistral`;
  
  constructor(
    private http: HttpClient,
    private dataService: DataService
  ) {
    this.initializeAudio();
  }
  
  /**
   * Inicializar el elemento de audio
   */
  private initializeAudio(): void {
    this.audioElement = new Audio();
    this.audioElement.src = this.SOUND_PATH;
    this.audioElement.preload = 'auto';
    this.audioElement.volume = 0.8; // Volumen al 80%
    
    // Manejar errores de carga
    this.audioElement.onerror = (error) => {
      console.warn('Error al cargar el archivo de audio para solicitudes de preparado:', error);
    };
  }
  
  /**
   * Validar si el usuario actual tiene rol permitido para recibir notificaciones
   * Roles permitidos: Admin (1) e Investigación y Desarrollo (15)
   */
  private isUserAuthorizedForNotifications(): boolean {
    try {
      const user = this.dataService.getLoggedUser();
      
      if (!user) {
        console.log('🚫 Usuario no logueado - notificaciones de solicitudes deshabilitadas');
        return false;
      }
      
      if (!user.rol || !user.rol.idRol) {
        console.log('🚫 Información de rol no disponible - notificaciones de solicitudes deshabilitadas');
        return false;
      }
      
      const userRole = user.rol.idRol;
      const allowedRoles = [1, 15]; // Admin (1) e Investigación y Desarrollo (15)
      
      const isAuthorized = allowedRoles.includes(Number(userRole));
      
      if (!isAuthorized) {
        console.log(`🚫 Usuario con rol ${userRole} no autorizado para notificaciones de solicitudes - Solo roles Admin (1) e I+D (15)`);
      } else {
        console.log(`✅ Usuario con rol ${userRole} autorizado para recibir notificaciones de solicitudes`);
      }
      
      return isAuthorized;
    } catch (error) {
      console.error('Error al validar rol del usuario para solicitudes:', error);
      return false;
    }
  }
  
  /**
   * Iniciar el polling de solicitudes
   */
  startPolling(): void {
    if (this.isPollingActive) {
      console.log('El polling de solicitudes ya está activo');
      return;
    }
    
    // Validar que el usuario tenga rol autorizado
    if (!this.isUserAuthorizedForNotifications()) {
      console.log('🚫 Polling de solicitudes no iniciado - Usuario sin permisos para notificaciones');
      return;
    }
    
    console.log('✅ Iniciando polling de notificaciones de solicitudes de preparados magistrales');
    this.isPollingActive = true;
    this.isFirstRequest = true;
    
    // Realizar primera consulta inmediatamente
    this.checkSolicitudesPreparado();
    
    // Configurar polling cada X segundos
    this.pollingSubscription = interval(this.POLLING_INTERVAL)
      .pipe(
        switchMap(() => {
          // Validar permisos en cada iteración del polling
          if (!this.isUserAuthorizedForNotifications()) {
            console.log('🚫 Deteniendo polling de solicitudes - Usuario perdió permisos para notificaciones');
            this.stopPolling();
            return of([]);
          }
          return this.http.get<SolicitudPreparadoMagistral[]>(this.API_URL);
        }),
        catchError(error => {
          console.error('Error en polling de solicitudes de preparado:', error);
          return of([]); // Continuar con array vacío en caso de error
        })
      )
      .subscribe({
        next: (solicitudes) => {
          this.procesarRespuestaSolicitudes(solicitudes);
        },
        error: (error) => {
          console.error('Error en suscripción de polling de solicitudes:', error);
        }
      });
  }
  
  /**
   * Detener el polling
   */
  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = undefined;
      this.isPollingActive = false;
      console.log('Polling de solicitudes de preparado detenido');
    }
  }
  
  /**
   * Verificar solicitudes manualmente (primera consulta)
   */
  private checkSolicitudesPreparado(): void {
    // Validar permisos antes de hacer la consulta
    if (!this.isUserAuthorizedForNotifications()) {
      console.log('🚫 Consulta de solicitudes cancelada - Usuario sin permisos');
      return;
    }
    
    this.http.get<SolicitudPreparadoMagistral[]>(this.API_URL).subscribe({
      next: (solicitudes: SolicitudPreparadoMagistral[]) => {
        this.procesarRespuestaSolicitudes(solicitudes);
      },
      error: (error: any) => {
        console.error('Error al verificar solicitudes de preparado:', error);
      }
    });
  }
  
  /**
   * Procesar la respuesta de solicitudes y detectar nuevas
   */
  private procesarRespuestaSolicitudes(solicitudes: SolicitudPreparadoMagistral[]): void {
    if (!Array.isArray(solicitudes)) {
      console.warn('Respuesta de solicitudes no es un array válido:', solicitudes);
      return;
    }

    console.log(`📋 Procesando ${solicitudes.length} solicitudes de preparado (primera consulta: ${this.isFirstRequest})`);
    
    if (this.isFirstRequest) {
      // Primera consulta - solo guardar la lista actual como referencia
      this.previousSolicitudes = [...solicitudes];
      this.isFirstRequest = false;
      console.log('🔄 Primera consulta de solicitudes completada. Lista base establecida.');
      return;
    }

    // Detectar nuevas solicitudes comparando con la consulta anterior
    const nuevasSolicitudes = this.detectarNuevasSolicitudes(solicitudes);
    
    if (nuevasSolicitudes.length > 0) {
      console.log('🆕 Nuevas solicitudes de preparado detectadas:', nuevasSolicitudes);
      
      // Ejecutar alertas (sonido y parpadeo de título)
      this.ejecutarAlertaSolicitudes(nuevasSolicitudes);
      
      // Emitir notificación
      this.nuevasSolicitudes$.next(nuevasSolicitudes);
    }

    // Actualizar la lista de referencia para la próxima comparación
    this.previousSolicitudes = [...solicitudes];
  }
  
  /**
   * Detectar nuevas solicitudes comparando con la lista anterior
   */
  private detectarNuevasSolicitudes(solicitudesActuales: SolicitudPreparadoMagistral[]): SolicitudPreparadoMagistral[] {
    // Obtener IDs de solicitudes anteriores
    const idsAnteriores = this.previousSolicitudes.map(s => s.id);
    
    // Filtrar solicitudes que no estaban en la lista anterior
    const nuevasSolicitudes = solicitudesActuales.filter(solicitud => 
      !idsAnteriores.includes(solicitud.id)
    );
    
    console.log(`🔍 Comparación: ${this.previousSolicitudes.length} anteriores vs ${solicitudesActuales.length} actuales = ${nuevasSolicitudes.length} nuevas`);
    
    return nuevasSolicitudes;
  }
  
  /**
   * Ejecutar alertas de audio y visual para nuevas solicitudes
   */
  private ejecutarAlertaSolicitudes(nuevasSolicitudes: SolicitudPreparadoMagistral[]): void {
    try {
      console.log('🔊 Ejecutando alerta de solicitudes de preparado...');
      
      // Reproducir sonido
      this.reproducirSonidoSolicitud();
      
      // Hacer parpadear el título de la página
      this.blinkPageTitle(nuevasSolicitudes.length);
      
    } catch (error) {
      console.error('Error al ejecutar alerta de solicitudes:', error);
    }
  }
  
  /**
   * Reproducir sonido de notificación para solicitudes
   */
  private reproducirSonidoSolicitud(): void {
    if (this.audioElement) {
      this.audioElement.currentTime = 0; // Reiniciar desde el principio
      
      const playPromise = this.audioElement.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('🔊 Sonido de solicitud de preparado reproducido correctamente');
          })
          .catch(error => {
            console.warn('Error al reproducir sonido de solicitud:', error);
            // Silenciar el error ya que puede ser por restricciones del navegador
          });
      }
    } else {
      console.warn('Elemento de audio no inicializado para solicitudes');
    }
  }
  
  /**
   * Hacer parpadear el título de la página
   */
  private blinkPageTitle(cantidadSolicitudes: number): void {
    const originalTitle = document.title;
    const newTitle = cantidadSolicitudes === 1 ? '🧪 ¡Nueva Solicitud!' : `🧪 ¡${cantidadSolicitudes} Nuevas Solicitudes!`;
    
    let blinkCount = 0;
    const maxBlinks = 6; // 3 segundos de parpadeo (500ms x 6)
    
    const blinkInterval = setInterval(() => {
      document.title = blinkCount % 2 === 0 ? newTitle : originalTitle;
      blinkCount++;
      
      if (blinkCount >= maxBlinks) {
        clearInterval(blinkInterval);
        document.title = originalTitle; // Restaurar título original
      }
    }, 500);
  }
  
  /**
   * Obtener observable de nuevas solicitudes
   */
  getNuevasSolicitudes() {
    return this.nuevasSolicitudes$.asObservable();
  }
  
  /**
   * Método público para verificar si el usuario actual está autorizado para notificaciones
   */
  public canReceiveNotifications(): boolean {
    return this.isUserAuthorizedForNotifications();
  }

  /**
   * Obtener información sobre los roles autorizados
   */
  public getAuthorizedRoles(): { roles: number[], descriptions: string[] } {
    return {
      roles: [1, 15],
      descriptions: ['Admin (1)', 'Investigación y Desarrollo (15)']
    };
  }

  /**
   * Destruir el servicio y limpiar recursos
   */
  ngOnDestroy(): void {
    this.stopPolling();
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }
  }
}