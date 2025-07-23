import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormArray, FormsModule } from '@angular/forms';
import { ClienteService } from '../../../services/cliente.service';
import { MedioContactoService } from '../../../services/medio-contacto.service';
import { TipoDocumentoService } from '../../../services/tipo-documento.service';
import { CommonModule } from '@angular/common';
import { TipoPresentacionService } from '../../../services/tipo-presentacion.service';
import { MateriaPrimaService } from '../../../services/materia-prima.service';
import { ProductoService } from '../../../services/producto.service';
import Swal from 'sweetalert2';
import { StepperModule } from 'primeng/stepper';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';

export interface Producto {
  nombre: string;
  descripcion: string;
  phDefinidoMin: number | null;
  phDefinidoMax: number | null;
  estado: boolean;
  ingredientes: Ingrediente[];
  procedimientos: Procedimiento[];
  presentaciones: Presentacion[];
  elementosSeguridadPersonal: string;
  utillaje: string;
  controlCalidad: string;
  tipoEnvase: string;
  colorEtiqueta: string;
  indicacionesPosologia: string;
  conservacion: string;
  reaccionesAdversas: string;
  precaucionesContraindicaciones: string;
  observaciones: string;
  bibliografia: string;
}

export interface Ingrediente {
  idMateriaPrima: number;
  cantidad: number;
}

export interface Procedimiento {
  orden: number;
  descripcion: string;
}

export interface Presentacion {
  idTipoPresentacion: number;
  presentacion: number | null;
  precio: number | null;
  estado: boolean;
}

@Component({
	selector: 'app-registro-producto',
	standalone: true,
	imports: [CommonModule, FormsModule, ReactiveFormsModule, StepperModule, ButtonModule, DividerModule, TableModule],
	templateUrl: './registro-producto.component.html',
	styleUrl: './registro-producto.component.scss',
})
export class RegistroProductoComponent implements OnInit {

  tiposPresentacion: any[] = [];
  materiasPrimas: any[] = [];

  currentStep = 0;

  @ViewChild('productoStepper') productoStepper: any;

  producto: Producto = {
    nombre: '',
    descripcion: '',
    phDefinidoMin: null,
    phDefinidoMax: null,
    estado: true,
    ingredientes: [{
      idMateriaPrima: 0,
      cantidad: 0
    }],
    procedimientos: [
      { orden: 1, descripcion: '' }
    ],
    presentaciones: [
      { idTipoPresentacion: 1, presentacion: null, precio: null, estado: true }
    ],
    elementosSeguridadPersonal: '',
    utillaje: '',
    controlCalidad: '',
    tipoEnvase: '',
    colorEtiqueta: '',
    indicacionesPosologia: '',
    conservacion: '',
    reaccionesAdversas: '',
    precaucionesContraindicaciones: '',
    observaciones: '',
    bibliografia: ''
  };

  events: any[];

	constructor(
		private productoService: ProductoService,
    private tipoPresentacionService: TipoPresentacionService,
    private materiaPrimaService: MateriaPrimaService,
	) {
    this.events = [
            { status: 'Ordered', date: '15/10/2020 10:30', icon: 'pi pi-shopping-cart', color: '#9C27B0', image: 'game-controller.jpg' },
            { status: 'Processing', date: '15/10/2020 14:00', icon: 'pi pi-cog', color: '#673AB7' },
            { status: 'Shipped', date: '15/10/2020 16:15', icon: 'pi pi-shopping-cart', color: '#FF9800' },
            { status: 'Delivered', date: '16/10/2020 10:00', icon: 'pi pi-check', color: '#607D8B' }
        ];
	}

	ngOnInit(): void {
    this.cargarTiposPresentacion();
    this.cargarMateriasPrimas();
	}

  cargarTiposPresentacion(): void {
    this.tipoPresentacionService.getTiposPresentacion().subscribe(
      (tipos) => (this.tiposPresentacion = tipos),
      (error) => console.error('Error al cargar tipos de presentación', error)
    );
  }

  cargarMateriasPrimas(): void {
    this.materiaPrimaService.getMateriasPrimas().subscribe(
      (materias) => (this.materiasPrimas = materias),
      (error) => console.error('Error al cargar materias primas', error)
    );
  }

  agregarIngrediente(): void {
    const sumaActual = this.producto.ingredientes.reduce((acc, ing) => acc + (ing.cantidad || 0), 0);
    const cantidadRestante = 100 - sumaActual;

    if (cantidadRestante <= 0) {
      Swal.fire({
        icon: 'warning',
        title: '¡Atención!',
        text: 'Ya se completó el 100% en la suma de las cantidades de los ingredientes.',
      });
      return;
    }

    this.producto.ingredientes.push({ idMateriaPrima: 0, cantidad: cantidadRestante });
  }

  eliminarIngrediente(index: number): void {
    this.producto.ingredientes.splice(index, 1);
  }

  agregarProcedimiento(): void {
    const nuevoProcedimiento: Procedimiento = { orden: this.producto.procedimientos.length + 1, descripcion: '' };
    this.producto.procedimientos.push(nuevoProcedimiento);
  }

  eliminarProcedimiento(index: number): void {
    if (this.producto.procedimientos.length > 1) {
      this.producto.procedimientos.splice(index, 1);
      // Reasignar el orden después de eliminar
      this.producto.procedimientos.forEach((proc, i) => proc.orden = i + 1);
    }
  }

  agregarPresentacion(): void {
    const nuevaPresentacion: Presentacion = { idTipoPresentacion: 1, presentacion: null, precio: null, estado: true };
    this.producto.presentaciones.push(nuevaPresentacion);
  }

  eliminarPresentacion(index: number): void {
    if (this.producto.presentaciones.length > 1) {
      this.producto.presentaciones.splice(index, 1);
    }
  }

  get presentacionesInvalidas(): boolean {
    return (
        !this.producto.presentaciones ||
        this.producto.presentaciones.length < 1 ||
        this.producto.presentaciones.some(
            (p: any) => !p.presentacion || !p.precio
        )
    );
  }

  get ingredientesInvalidos(): boolean {
    if (
      !this.producto.ingredientes ||
      this.producto.ingredientes.length < 1
    ) {
      return true;
    }

    // Todos los ingredientes deben tener idMateriaPrima distinto de 0 y cantidad > 0
    const algunIngredienteInvalido = this.producto.ingredientes.some(
      (i: any) => !i.idMateriaPrima || !i.cantidad
    );
    if (algunIngredienteInvalido) {
      return true;
    }

    // La suma de las cantidades debe ser exactamente 100
    const suma = this.producto.ingredientes.reduce((acc, ing) => acc + (ing.cantidad || 0), 0);
    if (suma !== 100) {
      return true;
    }

    return false;
  }

  productosCreados = [];
  guardarProducto(callback: any): void {
    // Aquí puedes implementar la lógica para guardar el producto
    console.log('Producto a guardar:', this.producto);
    
    this.productoService.saveProducto(this.producto).subscribe(
      (data) => {
        if(data && data.productoMaestro) {
          this.productosCreados = data.productos;
          callback.emit();
          // Swal.fire({
          //   icon: 'success',
          //   title: '¡Listo!',
          //   text: 'Producto registrado correctamente.',
          // });
        }else{
          Swal.fire({
            icon: 'error',
            title: '¡Error!',
            text: 'Ha ocurrido un error al registrar el producto.',
          });
        }
      },
      (error) => {
        Swal.fire({
          icon: 'error',
          title: '¡Error!',
          text: 'Ha ocurrido un error al registrar el producto.',
        });
      }
    );
  }

  limpiarFormulario(): void {
    this.producto = {
      nombre: '',
      descripcion: '',
      phDefinidoMin: null,
      phDefinidoMax: null,
      estado: true,
      ingredientes: [{ idMateriaPrima: 0, cantidad: 0 }],
      procedimientos: [{ orden: 1, descripcion: '' }],
      presentaciones: [{ idTipoPresentacion: 1, presentacion: null, precio: null, estado: true }],
      elementosSeguridadPersonal: '',
      utillaje: '',
      controlCalidad: '',
      tipoEnvase: '',
      colorEtiqueta: '',
      indicacionesPosologia: '',
      conservacion: '',
      reaccionesAdversas: '',
      precaucionesContraindicaciones: '',
      observaciones: '',
      bibliografia: ''
    };
    this.tiposPresentacion = [];
    this.materiasPrimas = [];
    this.currentStep = 0;
  }

}
