import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  // Enlaces de redes sociales
  socialLinks = {
    facebook: 'https://web.facebook.com/profile.php?id=100063737790965',
    instagram: 'https://www.instagram.com/dermofarmacia.bellacuret/',
    tiktok: 'https://www.tiktok.com/@bellacuret'
  };

  // Información de contacto
  contactInfo = {
    address: 'Av. Petit Thouars 4373 A, Miraflores, Lima',
    addressLink: 'https://www.google.com/maps/place/Av.+Petit+Thouars+4373a,+Miraflores+15046/@-12.1059841,-77.0300362,3a,75y,127.68h,95.87t/data=!3m6!1e1!3m4!1s3xJjbVPz4pLy9ZyNRdjILQ!2e0!7i16384!8i8192!4m7!3m6!1s0x9105c86b1a0bffff:0x6ac40a7708676736!8m2!3d-12.1060351!4d-77.0298417!10e5!16s%2Fg%2F11r_mhgy21',
    email: 'ventas@bellacuret.com',
    phone: '+51 923 088 747',
    whatsappLink: 'https://wa.me/51923088747'
  };

  openLink(url: string): void {
    window.open(url, '_blank');
  }

  sendEmail(): void {
    window.location.href = `mailto:${this.contactInfo.email}`;
  }
}