import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-whatsapp-float',
  standalone: true,
  imports: [CommonModule, NgbTooltipModule],
  templateUrl: './whatsapp-float.component.html',
  styleUrl: './whatsapp-float.component.scss'
})
export class WhatsappFloatComponent {
  whatsappUrl = 'https://wa.me/51923088747?text=Hola%2C%20solicito%20m%C3%A1s%20informaci%C3%B3n';

  openWhatsApp(): void {
    window.open(this.whatsappUrl, '_blank');
  }
}