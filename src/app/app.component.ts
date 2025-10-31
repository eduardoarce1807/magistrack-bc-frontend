import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { DataService } from './services/data.service';
import { PrimeNGConfig } from 'primeng/api';
import { WhatsappFloatComponent } from './components/whatsapp-float/whatsapp-float.component';
import { PedidoNotificationService, PedidoPago } from './services/pedido-notification.service';
import { SolicitudPreparadoNotificationService, SolicitudPreparadoMagistral } from './services/solicitud-preparado-notification.service';
import { NotificationManagerService } from './services/notification-manager.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, WhatsappFloatComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'magistrack-bc-frontend';
  
  private inactivityTimer: any;
  private readonly INACTIVITY_TIME = 60 * 60 * 1000; // 1 hora en milisegundos
  private readonly CHECK_INTERVAL = 30 * 1000; // Verificar cada 30 segundos
  private lastActivity: number = Date.now();

  // Detectar actividad del usuario
  @HostListener('document:mousedown', ['$event'])
  @HostListener('document:mousemove', ['$event'])
  @HostListener('document:keypress', ['$event'])
  @HostListener('document:scroll', ['$event'])
  @HostListener('document:touchstart', ['$event'])
  @HostListener('document:click', ['$event'])
  resetInactivityTimer(): void {
    this.lastActivity = Date.now();
  }

  constructor(
    private auth: AuthService, 
    private router: Router, 
    private dataService: DataService,
    private primengConfig: PrimeNGConfig,
    private pedidoNotificationService: PedidoNotificationService,
    private solicitudPreparadoNotificationService: SolicitudPreparadoNotificationService,
    private notificationManager: NotificationManagerService
  ) {
    this.initInactivityMonitoring();
  }

  ngOnInit() {
    // Inicializar sistemas globales de notificaciones usando el manager centralizado
    this.notificationManager.initializeNotifications();
    
    this.primengConfig.setTranslation({
      accept: 'Aceptar',
      reject: 'Rechazar',
      choose: 'Elegir',
      upload: 'Subir',
      cancel: 'Cancelar',
      clear: 'Limpiar',
      dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
      dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
      dayNamesMin: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'],
      monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
      monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
      today: 'Hoy',
      weekHeader: 'Sm',
      firstDayOfWeek: 1,
      dateFormat: 'dd/mm/yy',
      weak: 'Débil',
      medium: 'Medio',
      strong: 'Fuerte',
      passwordPrompt: 'Introduce una contraseña',
      emptyFilterMessage: 'No se encontraron resultados',
      searchMessage: '{0} resultados disponibles',
      selectionMessage: '{0} elementos seleccionados',
      emptySelectionMessage: 'Ningún elemento seleccionado',
      emptySearchMessage: 'No se encontraron resultados',
      emptyMessage: 'No hay opciones disponibles',
      matchAll: 'Coincidir con todos',
      matchAny: 'Coincidir con cualquiera',
      addRule: 'Agregar regla',
      removeRule: 'Eliminar regla',
      contains: 'Contiene',
      notContains: 'No contiene',
      startsWith: 'Comienza con',
      endsWith: 'Termina con',
      equals: 'Igual',
      notEquals: 'No igual',
      lt: 'Menor que',
      lte: 'Menor o igual que',
      gt: 'Mayor que',
      gte: 'Mayor o igual que',
      apply: 'Aplicar',
      noFilter: 'Sin filtro',
      is: 'Es',
      isNot: 'No es',
      before: 'Antes',
      after: 'Después',
      dateIs: 'La fecha es',
      dateIsNot: 'La fecha no es',
      dateBefore: 'La fecha es anterior',
      dateAfter: 'La fecha es posterior'
    });
  }

  ngOnDestroy(): void {
    // Detener el sistema de inactividad
    if (this.inactivityTimer) {
      clearInterval(this.inactivityTimer);
    }
    
    // Detener los sistemas globales de notificaciones
    this.pedidoNotificationService.stopPolling();
    this.solicitudPreparadoNotificationService.stopPolling();
  }

  /**
   * Inicializar el monitoreo de inactividad
   */
  private initInactivityMonitoring(): void {
    this.lastActivity = Date.now();
    
    // Verificar inactividad cada 30 segundos
    this.inactivityTimer = setInterval(() => {
      this.checkInactivity();
    }, this.CHECK_INTERVAL);
  }

  /**
   * Verificar si el usuario ha estado inactivo por más de 1 hora
   */
  private checkInactivity(): void {
    const currentTime = Date.now();
    const timeSinceLastActivity = currentTime - this.lastActivity;
    
    // Lista de rutas públicas que no requieren autenticación
    const publicRoutes = ['/auth/login', '/registro-publico'];
    const currentUrl = this.router.url;
    
    // Solo verificar inactividad si no estamos en una ruta pública
    const isPublicRoute = publicRoutes.some(route => currentUrl.includes(route));
    
    if (!isPublicRoute && this.auth.isAuthenticated()) {
      // Si ha pasado más de 1 hora sin actividad, cerrar sesión
      if (timeSinceLastActivity >= this.INACTIVITY_TIME) {
        console.log('Sesión cerrada por inactividad de 1 hora');
        this.logoutDueToInactivity();
      }
    }
  }

  /**
   * Cerrar sesión por inactividad
   */
  private logoutDueToInactivity(): void {
    this.dataService.clearLoggedUser();
    
    // Resetear el estado de notificaciones al cerrar sesión
    this.notificationManager.reset();
    
    this.router.navigate(['/auth/login'], { 
      queryParams: { reason: 'inactivity' } 
    });
    
    // Opcional: Mostrar notificación al usuario
    // Puedes usar SweetAlert2 o cualquier sistema de notificaciones que tengas
    alert('Su sesión ha expirado por inactividad. Por favor, inicie sesión nuevamente.');
  }

  // ==================== SISTEMA GLOBAL DE NOTIFICACIONES DE PEDIDOS ====================

  /**
   * Inicializar el sistema global de notificaciones de pedidos pagados
   * Este sistema funcionará en toda la aplicación, no solo en componentes específicos
   */
  private initGlobalPedidoNotifications(): void {
    // Solo inicializar si el usuario está autenticado
    if (this.auth.isAuthenticated()) {
      console.log('🔔 Iniciando sistema global de notificaciones de pedidos pagados');
      
      // Verificar rol del usuario antes de iniciar
      const user = this.dataService.getLoggedUser();
      const userRole = user?.rol?.idRol;
      const allowedRoles = [1, 5]; // Admin (1) y Ventas (5)
      
      if (userRole && allowedRoles.includes(Number(userRole))) {
        console.log(`✅ Usuario con rol ${userRole} autorizado - Iniciando notificaciones`);
        
        // Iniciar el polling del servicio
        this.pedidoNotificationService.startPolling();

        // Suscribirse a las notificaciones de nuevos pedidos pagados
        this.pedidoNotificationService.getNuevosPedidosPagados().subscribe({
          next: (nuevosPedidos) => {
            if (nuevosPedidos.length > 0) {
              this.onGlobalNuevosPedidosPagados(nuevosPedidos);
            }
          },
          error: (error) => {
            console.error('Error en notificaciones globales de pedidos:', error);
          }
        });
      } else {
        console.log(`🚫 Usuario con rol ${userRole} no autorizado para notificaciones - Solo Admin (1) y Ventas (5)`);
      }
    }
  }

  /**
   * Manejar la detección global de nuevos pedidos pagados
   */
  private onGlobalNuevosPedidosPagados(nuevosPedidos: PedidoPago[]): void {
    console.log('🎉 Nuevos pedidos pagados detectados globalmente:', nuevosPedidos);
    
    // Aquí puedes agregar lógica adicional global si es necesario
    // Por ejemplo, mostrar una notificación toast, actualizar contadores globales, etc.
    
    // El sonido y el cambio de título ya se manejan automáticamente en el servicio
    // Pero podrías agregar aquí notificaciones visuales adicionales
  }

  /**
   * Inicializar el sistema global de notificaciones de solicitudes de preparado magistral
   * Este sistema funcionará en toda la aplicación para roles Admin (1) e I+D (15)
   */
  private initGlobalSolicitudPreparadoNotifications(): void {
    // Solo inicializar si el usuario está autenticado
    if (this.auth.isAuthenticated()) {
      console.log('🧪 Iniciando sistema global de notificaciones de solicitudes de preparado magistral');
      
      // Verificar rol del usuario antes de iniciar
      const user = this.dataService.getLoggedUser();
      const userRole = user?.rol?.idRol;
      const allowedRoles = [1, 15]; // Admin (1) e Investigación y Desarrollo (15)
      
      if (userRole && allowedRoles.includes(Number(userRole))) {
        console.log(`✅ Usuario con rol ${userRole} autorizado - Iniciando notificaciones de solicitudes`);
        
        // Iniciar el polling del servicio
        this.solicitudPreparadoNotificationService.startPolling();

        // Suscribirse a las notificaciones de nuevas solicitudes
        this.solicitudPreparadoNotificationService.getNuevasSolicitudes().subscribe({
          next: (nuevasSolicitudes) => {
            if (nuevasSolicitudes.length > 0) {
              this.onGlobalNuevasSolicitudesPreparado(nuevasSolicitudes);
            }
          },
          error: (error) => {
            console.error('Error en notificaciones globales de solicitudes:', error);
          }
        });
      } else {
        console.log(`🚫 Usuario con rol ${userRole} no autorizado para notificaciones de solicitudes - Solo Admin (1) e I+D (15)`);
      }
    }
  }

  /**
   * Manejar la detección global de nuevas solicitudes de preparado magistral
   */
  private onGlobalNuevasSolicitudesPreparado(nuevasSolicitudes: SolicitudPreparadoMagistral[]): void {
    console.log('🧪 Nuevas solicitudes de preparado magistral detectadas globalmente:', nuevasSolicitudes);
    
    // Aquí puedes agregar lógica adicional global si es necesario
    // Por ejemplo, mostrar una notificación toast, actualizar contadores globales, etc.
    
    // El sonido y el cambio de título ya se manejan automáticamente en el servicio
    // Pero podrías agregar aquí notificaciones visuales adicionales
  }
}
