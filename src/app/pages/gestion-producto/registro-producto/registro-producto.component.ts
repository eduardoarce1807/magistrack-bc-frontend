import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormArray, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  idMateriaPrima: string;
  cantidad: number;
}

export interface Procedimiento {
  orden: number;
  descripcion: string;
}

export interface Presentacion {
  idProducto?: string | null;
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
  
  // Variables para modo edición
  isEditing = false;
  idProductoMaestro: number | null = null;
  productoGuardadoExitosamente = false;

  @ViewChild('productoStepper') productoStepper: any;

  producto: Producto = {
    nombre: '',
    descripcion: '',
    phDefinidoMin: null,
    phDefinidoMax: null,
    estado: true,
    ingredientes: [{
      idMateriaPrima: '',
      cantidad: 0
    }],
    procedimientos: [
      { orden: 1, descripcion: '' }
    ],
    presentaciones: [
      { idProducto: null, idTipoPresentacion: 1, presentacion: null, precio: null, estado: true }
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
    private route: ActivatedRoute,
    private router: Router,
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
    this.verificarModoEdicion();
	}

  verificarModoEdicion(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('idProductoMaestro');
      if (id) {
        this.isEditing = true;
        this.idProductoMaestro = parseInt(id);
        this.cargarProductoMaestro(this.idProductoMaestro);
      }
    });
  }

  cargarProductoMaestro(idProductoMaestro: number): void {
    this.productoService.getProductoMaestroCompleto(idProductoMaestro).subscribe({
      next: (data) => {
        this.setearDatosProducto(data);
      },
      error: (error) => {
        console.error('Error al cargar producto maestro:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar la información del producto maestro',
        });
        this.router.navigate(['/pages/gestion-producto/mantenimiento-producto']);
      }
    });
  }

  setearDatosProducto(data: any): void {
    // Setear datos del producto maestro
    this.producto.nombre = data.productoMaestro.nombre || '';
    this.producto.descripcion = data.productoMaestro.descripcion || '';
    this.producto.phDefinidoMin = data.productoMaestro.phDefinidoMin || null;
    this.producto.phDefinidoMax = data.productoMaestro.phDefinidoMax || null;
    this.producto.estado = data.productoMaestro.estado || true;

    // Setear materias primas (ingredientes)
    if (data.materiasPrimas && data.materiasPrimas.length > 0) {
      this.producto.ingredientes = data.materiasPrimas.map((mp: any) => ({
        idMateriaPrima: mp.idMateriaPrima,
        cantidad: mp.cantidad
      }));
    }

    // Setear procedimientos
    if (data.procedimientos && data.procedimientos.length > 0) {
      this.producto.procedimientos = data.procedimientos.map((proc: any) => ({
        orden: proc.orden,
        descripcion: proc.descripcion
      }));
    }

    // Setear presentaciones
    if (data.presentaciones && data.presentaciones.length > 0) {
      this.producto.presentaciones = data.presentaciones.map((pres: any) => ({
        idProducto: pres.idProducto, // Preservar el ID del producto existente
        idTipoPresentacion: pres.tipoPresentacion.idTipoPresentacion,
        presentacion: pres.presentacion,
        precio: pres.precio,
        estado: pres.estado
      }));
    }

    // Setear datos de producción
    if (data.produccion) {
      this.producto.elementosSeguridadPersonal = data.produccion.elementosSeguridadPersonal || '';
      this.producto.utillaje = data.produccion.utillaje || '';
      this.producto.controlCalidad = data.produccion.controlCalidad || '';
      this.producto.tipoEnvase = data.produccion.tipoEnvase || '';
      this.producto.colorEtiqueta = data.produccion.colorEtiqueta || '';
      this.producto.indicacionesPosologia = data.produccion.indicacionesPosologia || '';
      this.producto.conservacion = data.produccion.conservacion || '';
      this.producto.reaccionesAdversas = data.produccion.reaccionesAdversas || '';
      this.producto.precaucionesContraindicaciones = data.produccion.precaucionesContraindicaciones || '';
      this.producto.observaciones = data.produccion.observaciones || '';
      this.producto.bibliografia = data.produccion.bibliografia || '';
    }
  }

  navegarVolver(): void {
    this.router.navigate(['/pages/gestion-producto/mantenimiento-producto']);
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

    this.producto.ingredientes.push({ idMateriaPrima: '', cantidad: cantidadRestante });
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
    const nuevaPresentacion: Presentacion = { 
      idProducto: null, 
      idTipoPresentacion: 1, 
      presentacion: null, 
      precio: null, 
      estado: true 
    };
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

    // Todos los ingredientes deben tener idMateriaPrima distinto de '' y cantidad > 0
    const algunIngredienteInvalido = this.producto.ingredientes.some(
      (i: any) => !i.idMateriaPrima || i.idMateriaPrima === '' || !i.cantidad
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
    console.log('Producto a guardar:', this.producto);
    
    if (this.isEditing && this.idProductoMaestro) {
      // Modo edición - actualizar producto existente
      const productoParaActualizar = {
        ...this.producto,
        idProductoMaestro: this.idProductoMaestro
      };
      
      this.productoService.updateProductoMaestro(productoParaActualizar).subscribe({
        next: (data) => {
          if (data && data.productoMaestro) {
            this.productosCreados = data.productos || [];
            this.productoGuardadoExitosamente = true;
            callback.emit();
            Swal.fire({
              icon: 'success',
              title: '¡Actualizado!',
              text: 'Producto maestro actualizado correctamente.',
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: '¡Error!',
              text: 'Ha ocurrido un error al actualizar el producto maestro.',
            });
          }
        },
        error: (error) => {
          console.error('Error al actualizar producto:', error);
          Swal.fire({
            icon: 'error',
            title: '¡Error!',
            text: 'Ha ocurrido un error al actualizar el producto maestro.',
          });
        }
      });
    } else {
      // Modo creación - crear nuevo producto
      this.productoService.saveProducto(this.producto).subscribe({
        next: (data) => {
          if (data && data.productoMaestro) {
            this.productosCreados = data.productos || [];
            this.productoGuardadoExitosamente = true;
            callback.emit();
            // Swal.fire({
            //   icon: 'success',
            //   title: '¡Listo!',
            //   text: 'Producto registrado correctamente.',
            // });
          } else {
            Swal.fire({
              icon: 'error',
              title: '¡Error!',
              text: 'Ha ocurrido un error al registrar el producto.',
            });
          }
        },
        error: (error) => {
          console.error('Error al guardar producto:', error);
          Swal.fire({
            icon: 'error',
            title: '¡Error!',
            text: 'Ha ocurrido un error al registrar el producto.',
          });
        }
      });
    }
  }

  limpiarFormulario(): void {
    this.producto = {
      nombre: '',
      descripcion: '',
      phDefinidoMin: null,
      phDefinidoMax: null,
      estado: true,
      ingredientes: [{ idMateriaPrima: '', cantidad: 0 }],
      procedimientos: [{ orden: 1, descripcion: '' }],
      presentaciones: [{ idProducto: null, idTipoPresentacion: 1, presentacion: null, precio: null, estado: true }],
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
    this.productoGuardadoExitosamente = false;
  }

  regresarMantenimiento(): void {
    this.router.navigate(['/pages/gestion-producto/mantenimiento-producto']);
  }

  // Método para prevenir navegación hacia atrás en el stepper cuando está en resumen después de guardar
  onStepChange(event: any): void {
    // Si ya se guardó exitosamente y está en el resumen (step 3), no permitir ir hacia atrás
    if (this.productoGuardadoExitosamente && this.currentStep === 3 && event.index < 3) {
      event.preventDefault();
      return;
    }
    this.currentStep = event.index;
  }

}
