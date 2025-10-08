import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MateriaPrimaService } from '../../../services/materia-prima.service';

interface MateriaPrimaCalculadora {
  id: number;
  idMateriaPrima: string;
  nombre: string;
  costoGramo: number;
  cantidad: number;
  costoTotal: number;
}

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
  selector: 'app-calculadora-capsulas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calculadora-capsulas.component.html',
  styleUrl: './calculadora-capsulas.component.scss'
})
export class CalculadoraCapsulaComponent implements OnInit {

  nombreProducto: string = '';
  costoPorU: number = 0;
  
  // Lista de materias primas disponibles desde el servicio
  materiasPrimasDisponibles: any[] = [];
  
  // Lista de materias primas agregadas para el cálculo
  materiasPrimasCalculadora: MateriaPrimaCalculadora[] = [];
  
  filas: FilaCalculadora[] = [];

  constructor(private materiaPrimaService: MateriaPrimaService) {}

  ngOnInit(): void {
    this.cargarMateriasPrimas();
    this.inicializarFilas();
    this.calcularCostoPorU();
  }

  cargarMateriasPrimas(): void {
    this.materiaPrimaService.getMateriasPrimas().subscribe({
      next: (materiasPrimas: any[]) => {
        // Filtrar solo materias primas con costoGramo mayor a 0 y ordenar alfabéticamente
        this.materiasPrimasDisponibles = materiasPrimas
          .filter(mp => mp.costoGramo > 0)
          .sort((a, b) => a.nombre.localeCompare(b.nombre));
        console.log('Materias primas cargadas:', this.materiasPrimasDisponibles.length);
        console.log('Materias primas filtradas (con costo > 0):', this.materiasPrimasDisponibles);
      },
      error: (error) => {
        console.error('Error al cargar materias primas:', error);
        this.materiasPrimasDisponibles = [];
      }
    });
  }

  agregarMateriaPrima(): void {
    if (this.materiasPrimasDisponibles.length > 0) {
      const nuevaMateriaPrima: MateriaPrimaCalculadora = {
        id: this.materiasPrimasCalculadora.length + 1,
        idMateriaPrima: this.materiasPrimasDisponibles[0].idMateriaPrima,
        nombre: this.materiasPrimasDisponibles[0].nombre,
        costoGramo: this.materiasPrimasDisponibles[0].costoGramo,
        cantidad: 0,
        costoTotal: 0
      };
      
      this.materiasPrimasCalculadora.push(nuevaMateriaPrima);
      this.calcularCostoPorU();
    }
  }

  eliminarMateriaPrima(index: number): void {
    this.materiasPrimasCalculadora.splice(index, 1);
    this.calcularCostoPorU();
    this.calcularTodasLasFilas();
  }

  onMateriaPrimaChange(index: number): void {
    console.log('onMateriaPrimaChange called for index:', index);
    console.log('Selected idMateriaPrima:', this.materiasPrimasCalculadora[index].idMateriaPrima);
    console.log('Available materias primas:', this.materiasPrimasDisponibles);
    
    const idSeleccionado = this.materiasPrimasCalculadora[index].idMateriaPrima;
    const materiaPrimaSeleccionada = this.materiasPrimasDisponibles.find(
      mp => mp.idMateriaPrima === idSeleccionado
    );
    
    console.log('Found materia prima:', materiaPrimaSeleccionada);
    
    if (materiaPrimaSeleccionada) {
      this.materiasPrimasCalculadora[index].nombre = materiaPrimaSeleccionada.nombre;
      this.materiasPrimasCalculadora[index].costoGramo = materiaPrimaSeleccionada.costoGramo;
      console.log('Updated costoGramo to:', materiaPrimaSeleccionada.costoGramo);
      this.calcularCostoTotalMateriaPrima(index);
    } else {
      console.log('No materia prima found for id:', idSeleccionado);
    }
  }

  onCantidadChange(index: number): void {
    this.calcularCostoTotalMateriaPrima(index);
  }

  calcularCostoTotalMateriaPrima(index: number): void {
    const mp = this.materiasPrimasCalculadora[index];
    mp.costoTotal = mp.costoGramo * mp.cantidad;
    this.calcularCostoPorU();
    this.calcularTodasLasFilas();
  }

  calcularCostoPorU(): void {
    this.costoPorU = this.materiasPrimasCalculadora.reduce((total, mp) => total + mp.costoTotal, 0);
  }

  inicializarFilas(): void {
    const presentacionesIniciales = [30, 60, 120, 250, 500, 1000];
    
    this.filas = presentacionesIniciales.map(presentacion => ({
      presentacion: presentacion,
      mps: 0,
      envase: 2,
      maquila: 7.5,
      totalNeto: 0,
      ganancia: 500,
      valorBruto: 0,
      igv: 18,
      costoFinal: 0,
      precioFinal: 0
    }));

    this.calcularTodasLasFilas();
  }

  calcularTodasLasFilas(): void {
    this.filas.forEach((fila, index) => {
      this.calcularFila(index);
    });
  }

  calcularFila(index: number): void {
    const fila = this.filas[index];
    
    // MP's = (costo por U * presentación) / 1000
    fila.mps = (this.costoPorU * fila.presentacion);
    
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
