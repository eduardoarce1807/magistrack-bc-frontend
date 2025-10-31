import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { PedidoService } from './pedido.service';
import { DataService } from './data.service';

export interface PedidoPago {
  idPedido: string;
  numeroVenta: string;
  pagoCompleto: boolean;
  fechaPago?: string;
  cliente?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PedidoNotificationService {
  
  private pollingSubscription?: Subscription;
  private previousPedidos: any[] = [];
  private isFirstRequest = true;
  private isPollingActive = false;
  
  // Audio element para el sonido
  private audioElement?: HTMLAudioElement;
  
  // BehaviorSubject para notificar nuevos pedidos pagados
  private nuevosPedidosPagados$ = new BehaviorSubject<PedidoPago[]>([]);
  
  // Configuración del polling
  private readonly POLLING_INTERVAL = 3000; // 3 segundos
  private readonly SOUND_PATH = 'assets/mp3/sound_pedido_pagado.mp3';
  private readonly TITLE_BLINK_DURATION = 3000; // 3 segundos parpadeando
  
  constructor(
    private pedidoService: PedidoService,
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
      console.warn('Error al cargar el archivo de audio:', error);
    };
  }
  
  /**
   * Validar si el usuario actual tiene rol permitido para recibir notificaciones
   * Roles permitidos: Admin (1) y Ventas (5)
   */
  private isUserAuthorizedForNotifications(): boolean {
    try {
      const user = this.dataService.getLoggedUser();
      
      if (!user) {
        console.log('🚫 Usuario no logueado - notificaciones deshabilitadas');
        return false;
      }
      
      if (!user.rol || !user.rol.idRol) {
        console.log('🚫 Información de rol no disponible - notificaciones deshabilitadas');
        return false;
      }
      
      const userRole = user.rol.idRol;
      const allowedRoles = [1, 5]; // Admin (1) y Ventas (5)
      
      const isAuthorized = allowedRoles.includes(Number(userRole));
      
      if (!isAuthorized) {
        console.log(`🚫 Usuario con rol ${userRole} no autorizado para notificaciones - Solo roles Admin (1) y Ventas (5)`);
      } else {
        console.log(`✅ Usuario con rol ${userRole} autorizado para recibir notificaciones`);
      }
      
      return isAuthorized;
    } catch (error) {
      console.error('Error al validar rol del usuario:', error);
      return false;
    }
  }
  
  /**
   * Iniciar el polling de pedidos
   */
  startPolling(): void {
    if (this.isPollingActive) {
      console.log('El polling ya está activo');
      return;
    }
    
    // Validar que el usuario tenga rol autorizado
    if (!this.isUserAuthorizedForNotifications()) {
      console.log('🚫 Polling no iniciado - Usuario sin permisos para notificaciones');
      return;
    }
    
    console.log('✅ Iniciando polling de notificaciones de pedidos pagados');
    this.isPollingActive = true;
    this.isFirstRequest = true;
    
    // Realizar primera consulta inmediatamente
    this.checkPedidosPagados();
    
    // Configurar polling cada X segundos
    this.pollingSubscription = interval(this.POLLING_INTERVAL)
      .pipe(
        switchMap(() => {
          // Validar permisos en cada iteración del polling
          if (!this.isUserAuthorizedForNotifications()) {
            console.log('🚫 Deteniendo polling - Usuario perdió permisos para notificaciones');
            this.stopPolling();
            return of([]);
          }
          return this.pedidoService.getPedidosCompleto();
        }),
        catchError(error => {
          console.error('Error en polling de pedidos:', error);
          return of([]); // Continuar con array vacío en caso de error
        })
      )
      .subscribe({
        next: (pedidos) => {
          this.procesarRespuestaPedidos(pedidos);
        },
        error: (error) => {
          console.error('Error crítico en polling:', error);
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
    }
    this.isPollingActive = false;
    console.log('Polling de notificaciones detenido');
  }
  
  /**
   * Verificar pedidos pagados manualmente (primera consulta)
   */
  private checkPedidosPagados(): void {
    // Validar permisos antes de hacer la consulta
    if (!this.isUserAuthorizedForNotifications()) {
      console.log('🚫 Consulta de pedidos cancelada - Usuario sin permisos');
      return;
    }
    
    this.pedidoService.getPedidosCompleto().subscribe({
      next: (pedidos: any[]) => {
        this.procesarRespuestaPedidos(pedidos);
      },
      error: (error: any) => {
        console.error('Error al verificar pedidos pagados:', error);
      }
    });
  }
  
  /**
   * Procesar la respuesta de pedidos y detectar nuevos pagos
   */
  private procesarRespuestaPedidos(pedidos: any[]): void {
    try {
      if (!Array.isArray(pedidos)) {
        console.warn('La respuesta de pedidos no es un array válido');
        return;
      }
      
      console.log(`Verificando ${pedidos.length} pedidos (Primera consulta: ${this.isFirstRequest})`);
      
      if (this.isFirstRequest) {
        // Primera consulta: solo guardar la lista inicial
        this.previousPedidos = this.extractPedidosPagados(pedidos);
        this.isFirstRequest = false;
        console.log(`Lista inicial: ${this.previousPedidos.length} pedidos pagados`);
        return;
      }
      
      // Consultas siguientes: comparar y detectar nuevos
      const pedidosActuales = this.extractPedidosPagados(pedidos);
      const nuevosPedidosPagados = this.detectarNuevosPedidosPagados(pedidosActuales);
      
      if (nuevosPedidosPagados.length > 0) {
        console.log(`🔔 Detectados ${nuevosPedidosPagados.length} nuevo(s) pedido(s) pagado(s)!`);
        this.ejecutarAlertaPedidosPagados(nuevosPedidosPagados);
        
        // Emitir evento para componentes suscritos
        this.nuevosPedidosPagados$.next(nuevosPedidosPagados);
      }
      
      // Actualizar lista anterior
      this.previousPedidos = pedidosActuales;
      
    } catch (error) {
      console.error('Error al procesar respuesta de pedidos:', error);
    }
  }
  
  /**
   * Extraer pedidos pagados de la lista completa
   */
  private extractPedidosPagados(pedidos: any[]): PedidoPago[] {
    return pedidos
      .filter(pedido => pedido.pagoCompleto === true)
      .map(pedido => ({
        idPedido: pedido.idPedido || pedido.id,
        numeroVenta: pedido.numeroVenta || pedido.numero || 'N/A',
        pagoCompleto: pedido.pagoCompleto,
        fechaPago: pedido.fechaPago || pedido.fechaActualizacion,
        cliente: this.extractNombreCliente(pedido)
      }));
  }
  
  /**
   * Extraer nombre del cliente del objeto pedido
   */
  private extractNombreCliente(pedido: any): string {
    if (pedido.cliente) {
      if (typeof pedido.cliente === 'string') {
        return pedido.cliente;
      }
      if (pedido.cliente.nombres && pedido.cliente.apellidos) {
        return `${pedido.cliente.nombres} ${pedido.cliente.apellidos}`;
      }
      if (pedido.cliente.nombre) {
        return pedido.cliente.nombre;
      }
    }
    return pedido.nombreCliente || 'Cliente desconocido';
  }
  
  /**
   * Detectar nuevos pedidos pagados comparando con la lista anterior
   */
  private detectarNuevosPedidosPagados(pedidosActuales: PedidoPago[]): PedidoPago[] {
    const idsAnteriores = new Set(this.previousPedidos.map(p => p.idPedido));
    
    return pedidosActuales.filter(pedido => !idsAnteriores.has(pedido.idPedido));
  }
  
  /**
   * Ejecutar alerta visual y sonora para nuevos pedidos pagados
   */
  private ejecutarAlertaPedidosPagados(nuevosPedidos: PedidoPago[]): void {
    // Reproducir sonido
    this.playNotificationSound();
    
    // Parpadear título
    this.blinkPageTitle(nuevosPedidos.length);
    
    // Log para debugging
    nuevosPedidos.forEach(pedido => {
      console.log(`🆕 Nuevo pedido pagado: ${pedido.numeroVenta} - Cliente: ${pedido.cliente}`);
    });
  }
  
  /**
   * Reproducir sonido de notificación
   */
  private playNotificationSound(): void {
    if (this.audioElement) {
      // Reiniciar el audio si ya se está reproduciendo
      this.audioElement.currentTime = 0;
      
      const playPromise = this.audioElement.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('🔊 Sonido de notificación reproducido');
          })
          .catch(error => {
            console.warn('No se pudo reproducir el sonido:', error);
            // Posible problema de permisos del navegador para reproducir audio
          });
      }
    }
  }
  
  /**
   * Hacer parpadear el título de la página
   */
  private blinkPageTitle(cantidadPedidos: number): void {
    const originalTitle = document.title;
    const newTitle = cantidadPedidos === 1 ? '🔔 ¡Nuevo Pedido!' : `🔔 ¡${cantidadPedidos} Nuevos Pedidos!`;
    
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
   * Obtener observable para suscribirse a nuevos pedidos pagados
   */
  getNuevosPedidosPagados() {
    return this.nuevosPedidosPagados$.asObservable();
  }
  
  /**
   * Obtener estado del polling
   */
  isPollingActiveStatus(): boolean {
    return this.isPollingActive;
  }
  
  /**
   * Obtener cantidad de pedidos pagados en la última consulta
   */
  getCantidadPedidosPagados(): number {
    return this.previousPedidos.length;
  }
  
  /**
   * Método público para verificar si el usuario actual está autorizado para notificaciones
   * Útil para componentes que necesiten validar permisos antes de mostrar UI relacionada
   */
  public canReceiveNotifications(): boolean {
    return this.isUserAuthorizedForNotifications();
  }

  /**
   * Obtener información sobre los roles autorizados
   */
  public getAuthorizedRoles(): { roles: number[], descriptions: string[] } {
    return {
      roles: [1, 5],
      descriptions: ['Admin (1)', 'Ventas (5)']
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