import { Component, OnInit } from '@angular/core';
import { ProductoPersonalizadoService } from '../../../services/producto-personalizado.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-bandeja-personalizacion',
  standalone: true,
  imports: [],
  templateUrl: './bandeja-personalizacion.component.html',
  styleUrl: './bandeja-personalizacion.component.scss'
})
export class BandejaPersonalizacionComponent implements OnInit {

  productosPersonalizados: any[] = [];

  constructor(private productoPersonalizado: ProductoPersonalizadoService, public router: Router) { }

  ngOnInit(): void {
    this.cargarProductosPersonalizados();
  }

  cargarProductosPersonalizados(): void {
    this.productoPersonalizado.getProductosPersonalizados().subscribe(
      (productosPersonalizados) => (this.productosPersonalizados = productosPersonalizados),
      (error) => console.error('Error al cargar productosPersonalizados', error)
    );
  }


}
