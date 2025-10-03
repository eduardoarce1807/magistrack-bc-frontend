import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import {SidebarComponent} from "../components/sidebar/sidebar.component";
import {NavbarComponent} from "../components/navbar/navbar.component";
import {FooterComponent} from "../components/footer/footer.component";
import {SidebarModule} from "primeng/sidebar";
import {ButtonModule} from "primeng/button";
import {AnimateModule} from "primeng/animate";

@Component({
  selector: 'app-home',
  standalone: true,
	imports: [CommonModule, RouterModule, SidebarComponent, NavbarComponent, FooterComponent, SidebarModule,ButtonModule],
  templateUrl: './pages.component.html',
  styleUrls: ['./pages.component.scss']
})
export class PagesComponent {
	sidebarVisible:boolean=false
}
