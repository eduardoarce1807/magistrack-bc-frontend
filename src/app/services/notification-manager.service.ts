import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { DataService } from './data.service';
import { PedidoNotificationService } from './pedido-notification.service';
import { SolicitudPreparadoNotificationService } from './solicitud-preparado-notification.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationManagerService {

  private isInitialized = false;

  constructor(
    private auth: AuthService,
    private dataService: DataService,
    private pedidoNotificationService: PedidoNotificationService,
    private solicitudPreparadoNotificationService: SolicitudPreparadoNotificationService
  ) {}

  /**
   * Inicializa las notificaciones globales si el usuario está autenticado y autorizado
   * Se puede llamar múltiples veces de forma segura
   */
  initializeNotifications(): void {

    console.log('🧪 Inicializando NotificationManagerService');

    if (this.isInitialized || !this.auth.isAuthenticated()) {
      return;
    }

    // Obtener datos del usuario
    const userData = this.auth.getUsuario();
    if (!userData || !userData.rol) {
      return;
    }

    const userRole = userData.rol.idRol;

    // Verificar si el usuario tiene permisos para notificaciones de pedidos
    if (this.hasPermissionForPedidoNotifications(userRole)) {
      this.initGlobalPedidoNotifications();
    }

    // Verificar si el usuario tiene permisos para notificaciones de solicitudes
    if (this.hasPermissionForSolicitudNotifications(userRole)) {
      this.initGlobalSolicitudPreparadoNotifications();
    }

    this.isInitialized = true;
  }

  /**
   * Resetea el estado de inicialización (útil para logout)
   */
  reset(): void {
    this.isInitialized = false;
  }

  /**
   * Verifica si el usuario tiene permisos para notificaciones de pedidos
   */
  private hasPermissionForPedidoNotifications(role: number): boolean {
    // Admin (1) o Sales (5) pueden recibir notificaciones de pedidos
    return role === 1 || role === 5;
  }

  /**
   * Verifica si el usuario tiene permisos para notificaciones de solicitudes
   */
  private hasPermissionForSolicitudNotifications(role: number): boolean {
    // Admin (1) o I+D (15) pueden recibir notificaciones de solicitudes
    return role === 1 || role === 15;
  }

  /**
   * Inicializa las notificaciones globales de pedidos
   */
  private initGlobalPedidoNotifications(): void {
    if (!this.auth.isAuthenticated()) {
      return;
    }

    // Obtener datos del usuario
    const userData = this.auth.getUsuario();
    if (!userData || !userData.rol) {
      return;
    }

    const userRole = userData.rol.idRol;

    // Verificar si el usuario tiene permisos
    if (!this.hasPermissionForPedidoNotifications(userRole)) {
      return;
    }

    // Iniciar el polling de notificaciones cada 25 segundos
    this.pedidoNotificationService.startPolling();
  }

  /**
   * Inicializa las notificaciones globales de solicitudes de preparado magistral
   */
  private initGlobalSolicitudPreparadoNotifications(): void {
    if (!this.auth.isAuthenticated()) {
      return;
    }

    // Obtener datos del usuario
    const userData = this.auth.getUsuario();
    if (!userData || !userData.rol) {
      return;
    }

    const userRole = userData.rol.idRol;

    // Verificar si el usuario tiene permisos
    if (!this.hasPermissionForSolicitudNotifications(userRole)) {
      return;
    }

    // Iniciar el polling de notificaciones cada 25 segundos
    this.solicitudPreparadoNotificationService.startPolling();
  }
}