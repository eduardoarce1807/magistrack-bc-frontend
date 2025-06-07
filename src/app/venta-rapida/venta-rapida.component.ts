import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbDropdownModule],
  templateUrl: './venta-rapida.component.html',
  styleUrls: ['./venta-rapida.component.scss']
})
export class VentaRapidaComponent {
    constructor(private router: Router, public dataService: DataService) {}
    irA(ruta: string): void {
        if(ruta == "pages/atencion-cliente/bandeja-pedidos" && localStorage.getItem('usuario-magistrack-bc') != null && JSON.parse(localStorage.getItem('usuario-magistrack-bc')!).rol.idRol == 1){
            ruta = "pages/atencion-cliente/bandeja-pedidos-administrador";
        }
        this.router.navigate([`/${ruta}`]);
    }

    cerrarSesion(): void {
        // Aquí puedes agregar la lógica para limpiar el token de sesión o cerrar la sesión
        // alert('Sesión cerrada');
        this.dataService.clearLoggedUser();
        this.router.navigate(['/login']);
        
    }
}
