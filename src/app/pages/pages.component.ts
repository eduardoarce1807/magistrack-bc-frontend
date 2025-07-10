import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import {SidebarComponent} from "../components/sidebar/sidebar.component";
import {NavbarComponent} from "../components/navbar/navbar.component";

@Component({
  selector: 'app-home',
  standalone: true,
	imports: [CommonModule, RouterModule, SidebarComponent, NavbarComponent],
  templateUrl: './pages.component.html',
  styleUrls: ['./pages.component.scss']
})
export class PagesComponent {

}
