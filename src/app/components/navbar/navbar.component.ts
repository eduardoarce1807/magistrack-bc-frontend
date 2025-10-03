import { Component } from '@angular/core';
import {NgbDropdown, NgbDropdownMenu, NgbDropdownToggle} from "@ng-bootstrap/ng-bootstrap";
import {Router, RouterModule} from "@angular/router";
import {DataService} from "../../services/data.service";
import {PanelMenuModule} from "primeng/panelmenu";
import {ButtonModule} from "primeng/button";
import {MenuItem} from "primeng/api";

@Component({
  selector: 'app-navbar',
  standalone: true,
    imports: [
        NgbDropdown,
        NgbDropdownMenu,
        NgbDropdownToggle,
        RouterModule,
    ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
	constructor(private router: Router, public dataService: DataService) {

	}


	cerrarSesion(): void {
		// Aquí puedes agregar la lógica para limpiar el token de sesión o cerrar la sesión
		// alert('Sesión cerrada');
		this.dataService.clearLoggedUser();
		this.router.navigate(['/login']);

	}
}
