import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { AnuncioService } from '../../services/anuncio.service';
import { ConfiguracionHome, AnuncioModel } from '../../model/anunciosModel';
import { GoogleDriveImagePipe } from '../../pipes/google-drive-image.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, GoogleDriveImagePipe],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  configuracionHome: ConfiguracionHome | null = null;
  anunciosActivos: AnuncioModel[] = [];
  isLoadingAnuncios = true;
  mostrarAnuncios = false;

  constructor(
    private router: Router, 
    public dataService: DataService,
    private anuncioService: AnuncioService
  ) {}

  ngOnInit(): void {
    this.cargarConfiguracionHome();
  }

  cargarConfiguracionHome(): void {
    this.anuncioService.getConfiguracionHome().subscribe({
      next: (config) => {
        this.configuracionHome = config;
        this.anunciosActivos = config.anunciosActivos;
        this.mostrarAnuncios = this.anunciosActivos.length > 0;
        this.isLoadingAnuncios = false;
      },
      error: (error) => {
        console.error('Error al cargar configuración del home:', error);
        // Si hay error, usar fallback sin anuncios
        this.mostrarAnuncios = false;
        this.isLoadingAnuncios = false;
      }
    });
  }

  irA(ruta: string): void {
    this.router.navigate([`/${ruta}`]);
  }

  getAnunciosPorPosicion(posicion: number): AnuncioModel[] {
    return this.anunciosActivos.filter(anuncio => anuncio.posicion === posicion);
  }

  tieneAnunciosEnPosicion(posicion: number): boolean {
    return this.getAnunciosPorPosicion(posicion).length > 0;
  }

}
