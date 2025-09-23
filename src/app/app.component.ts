import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { DataService } from './services/data.service';
import { PrimeNGConfig } from 'primeng/api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'magistrack-bc-frontend';

  // src/app/app.component.ts
  constructor(
    private auth: AuthService, 
    private router: Router, 
    private dataService: DataService,
    private primengConfig: PrimeNGConfig
  ) {
    setInterval(() => {
      // Lista de rutas públicas que no requieren autenticación
      const publicRoutes = ['/auth/login', '/registro-publico'];
      const currentUrl = this.router.url;
      
      // Solo verificar autenticación si no estamos en una ruta pública
      const isPublicRoute = publicRoutes.some(route => currentUrl.includes(route));
      
      if (!isPublicRoute && !this.auth.isAuthenticated()) {
        dataService.clearLoggedUser();
        this.router.navigate(['/auth/login']);
      }
    }, 60_000); // cada 60 segundos
  }

  ngOnInit() {
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
}
