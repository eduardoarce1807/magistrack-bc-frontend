import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FilaCalculadora {
  presentacion: number;
  mps: number;
  envase: number;
  maquila: number;
  totalNeto: number;
  ganancia: number;
  valorBruto: number;
  igv: number;
  costoFinal: number;
  precioFinal: number;
}

@Component({
  selector: 'app-calculadora-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calculadora-productos.component.html',
  styleUrl: './calculadora-productos.component.scss'
})
export class CalculadoraProductosComponent implements OnInit {

  nombreProducto: string = '';
  factor: number = 0;
  costoPorK: number = 0;
  
  filas: FilaCalculadora[] = [];

  ngOnInit(): void {
    this.inicializarFilas();
    this.calcularCostoPorK();
  }

  inicializarFilas(): void {
    const presentacionesIniciales = [30, 60, 120, 250, 500, 1000];
    
    this.filas = presentacionesIniciales.map(presentacion => ({
      presentacion: presentacion,
      mps: 0,
      envase: 1.5,
      maquila: 7.5,
      totalNeto: 0,
      ganancia: 200,
      valorBruto: 0,
      igv: 18,
      costoFinal: 0,
      precioFinal: 0
    }));

    this.calcularTodasLasFilas();
  }

  onFactorChange(): void {
    this.calcularCostoPorK();
    this.calcularTodasLasFilas();
  }

  calcularCostoPorK(): void {
    this.costoPorK = this.factor * 1000;
  }

  calcularTodasLasFilas(): void {
    this.filas.forEach((fila, index) => {
      this.calcularFila(index);
    });
  }

  calcularFila(index: number): void {
    const fila = this.filas[index];
    
    // MP's = (costo por K * presentación) / 1000
    fila.mps = (this.costoPorK * fila.presentacion) / 1000;
    
    // Total Neto = MP's + Envase + Maquila
    fila.totalNeto = fila.mps + fila.envase + fila.maquila;
    
    // Valor Bruto = (Total Neto * Ganancia%) + Total Neto
    fila.valorBruto = (fila.totalNeto * (fila.ganancia / 100)) + fila.totalNeto;
    
    // Costo Final = Valor Bruto * 1.18 (IGV está fijo en 18%)
    fila.costoFinal = fila.valorBruto * 1.18;
    
    // Precio Final = Costo Final redondeado a enteros
    fila.precioFinal = Math.round(fila.costoFinal);
  }

  onPresentacionChange(index: number): void {
    this.calcularFila(index);
  }

  onMpsChange(index: number): void {
    this.calcularFila(index);
  }

  onEnvaseChange(index: number): void {
    this.calcularFila(index);
  }

  onMaquilaChange(index: number): void {
    this.calcularFila(index);
  }

  onGananciaChange(index: number): void {
    this.calcularFila(index);
  }

  agregarFila(): void {
    const nuevaFila: FilaCalculadora = {
      presentacion: 0,
      mps: 0,
      envase: 1.5,
      maquila: 7.5,
      totalNeto: 0,
      ganancia: 200,
      valorBruto: 0,
      igv: 18,
      costoFinal: 0,
      precioFinal: 0
    };
    
    this.filas.push(nuevaFila);
    this.calcularFila(this.filas.length - 1);
  }

  eliminarFila(index: number): void {
    if (this.filas.length > 1) {
      this.filas.splice(index, 1);
    }
  }
}
