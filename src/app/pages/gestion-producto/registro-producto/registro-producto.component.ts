import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormArray, FormsModule } from '@angular/forms';
import { ClienteService } from '../../../services/cliente.service';
import { MedioContactoService } from '../../../services/medio-contacto.service';
import { TipoDocumentoService } from '../../../services/tipo-documento.service';
import { CommonModule } from '@angular/common';
import { TipoPresentacionService } from '../../../services/tipo-presentacion.service';
import { MateriaPrimaService } from '../../../services/materia-prima.service';
import { ProductoService } from '../../../services/producto.service';
import Swal from 'sweetalert2';

export interface Producto {
  nombre: string;
  descripcion: string;
  precio: number | null;
  idTipoPresentacion: number;
  presentacion: number | null;
  phDefinidoMin: number | null;
  phDefinidoMax: number | null;
  estado: number;
  ingredientes: Ingrediente[];
  procedimientos: Procedimiento[];
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

@Component({
	selector: 'app-registro-producto',
	standalone: true,
	imports: [CommonModule, FormsModule, ReactiveFormsModule],
	templateUrl: './registro-producto.component.html',
	styleUrl: './registro-producto.component.scss',
})
export class RegistroProductoComponent implements OnInit {

  tiposPresentacion: any[] = [];
  materiasPrimas: any[] = [];

  producto: Producto = {
    nombre: '',
    descripcion: '',
    precio: null,
    idTipoPresentacion: 1,
    presentacion: null,
    phDefinidoMin: null,
    phDefinidoMax: null,
    estado: 1,
    ingredientes: [{
      idMateriaPrima: 0,
      cantidad: 0
    }],
    procedimientos: [
      { orden: 1, descripcion: '' }
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

	constructor(
		private productoService: ProductoService,
    private tipoPresentacionService: TipoPresentacionService,
    private materiaPrimaService: MateriaPrimaService,
	) {
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
    this.producto.ingredientes.push({idMateriaPrima: 0, cantidad: 0});
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

  guardarProducto(): void {
    // Aquí puedes implementar la lógica para guardar el producto
    console.log('Producto a guardar:', this.producto);
    
    this.productoService.saveProducto(this.producto).subscribe(
      (data) => {
        if(data && data.idResultado === 1) {
          this.limpiarFormulario();
          Swal.fire({
            icon: 'success',
            title: '¡Listo!',
            text: data.mensaje,
          });
        }else{
          Swal.fire({
            icon: 'error',
            title: '¡Error!',
            text: data.mensaje,
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
      precio: null,
      idTipoPresentacion: 1,
      presentacion: null,
      phDefinidoMin: null,
      phDefinidoMax: null,
      estado: 1,
      ingredientes: [{ idMateriaPrima: 0, cantidad: 0 }],
      procedimientos: [{ orden: 1, descripcion: '' }],
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
  }

}
