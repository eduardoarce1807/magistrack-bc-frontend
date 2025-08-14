import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PedidoService } from '../../../services/pedido.service';
import { ProductoPersonalizadoService } from '../../../services/producto-personalizado.service';
import { ProductoService } from '../../../services/producto.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { MateriaPrimaService } from '../../../services/materia-prima.service';
import { BaseProductoService } from '../../../services/base-producto.service';
import { PorcentajeInputDirective } from '../../../directives/porcentaje-input.directive';

interface ProductoPersonalizadoRequest {
  idPedido: string;
  idProducto: string;
  nombrePersonalizado: string;
  descripcionPersonalizada: string;
  detallesPersonalizacion: string;
  precioPersonalizado: number;
}

@Component({
  selector: 'app-calculadora-maestra',
  standalone: true,
  imports: [CommonModule, FormsModule, PorcentajeInputDirective],
  templateUrl: './calculadora-maestra.component.html',
  styleUrl: './calculadora-maestra.component.scss'
})
export class CalculadoraMaestraComponent implements OnInit {

  idPedido: string | null = null;
  idProducto: string | null = null;
  private routeSubscription: Subscription | null = null;
  isStandaloneMode: boolean = false; // Flag para identificar acceso directo sin parámetros

  nombrePersonalizado: string = '';
  descripcionPersonalizada: string = '';
  detallePersonalizacion: string = '';

  presentacion = 30;
  envase = 2;
  maquila = 7.5;
  totalCosto = 0;
  gananciaBC = 2;
  precioNeto = 0;
  igv = 0.18;
  precioVentaFinal = 0;
  precioVentaFinalRedondeado = 0;

  bases: any[] = [
    // { id: 1, nombre: 'Base 1', porcentaje: 0.1 },
    // { id: 2, nombre: 'Base 2', porcentaje: 0.2 },
    // { id: 3, nombre: 'Base 3', porcentaje: 0.12 }
  ];

  materiasPrimas: any[] = [
    // { id: 1, nombre: 'Materia Prima 1', costoGramo: 0.1 },
    // { id: 2, nombre: 'Base', costoGramo: 0.2 },
    // { id: 3, nombre: 'Materia Prima 3', costoGramo: 0.12 },
    // { id: 4, nombre: 'Materia Prima 4', costoGramo: 0.15 },
    // { id: 5, nombre: 'Materia Prima 5', costoGramo: 0.18 }
  ];

  componentes : any[] = [
    // { id: 1, idMateriaPrima: 1, costoGramo: 0, porcentaje: 0.1, gramoPorPresentacion: 0.45, costoPorPorcentaje: 0.3 },
    // { id: 2, idMateriaPrima: 2, costoGramo: 0, porcentaje: 0.9, gramoPorPresentacion: 0.5, costoPorPorcentaje: 0.9 },
  ];

  IdBase: number = 1;
  base: any;

  pedidoProducto: any;

  constructor(private productoService: ProductoService,
    private pedidoService: PedidoService,
    private materiaPrimaService: MateriaPrimaService,
    private baseProductoService: BaseProductoService,
    private route: ActivatedRoute, public router: Router, private productoPersonalizadoService: ProductoPersonalizadoService) {

  }

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.idPedido = params.get('idPedido');
      this.idProducto = params.get('idProducto');
      if(this.idPedido && this.idProducto) {
        this.productoPersonalizadoService.getProductoPersonalizadoByIdPedidoIdProducto(this.idPedido || '', this.idProducto || '').subscribe(
          (productoPersonalizado: any) => {
            if (productoPersonalizado) {
              this.nombrePersonalizado = productoPersonalizado.nombrePersonalizado;
              this.descripcionPersonalizada = productoPersonalizado.descripcionPersonalizada;
              this.detallePersonalizacion = productoPersonalizado.detallesPersonalizacion;
              this.getMateriasPrimas();
              this.getBasesProductos();
              this.getPedidoProductoById();
            }
          },
          (error) => {
            console.error('Error al cargar el producto personalizado', error);
          }
        );
      }else{
        // Acceso directo sin parámetros de pedido/producto
        this.isStandaloneMode = true;
        this.getMateriasPrimas();
        this.getBasesProductos();
        this.getPedidoProductoById();
      }
    });
  }

  getMateriasPrimas(): void {
    this.materiaPrimaService.getMateriasPrimas().subscribe(
      (data: any[]) => {
        this.materiasPrimas = data;
      },
      (error) => {
        console.error('Error al obtener las materias primas', error);
      }
    );
  }

  getBasesProductos(): void {
    this.baseProductoService.getBasesProductos().subscribe(
      (data: any[]) => {
        this.bases = data;
        this.base = this.bases[4]; // Asignar la primera base como predeterminada
        console.log('Bases de productos:', this.bases);
      },
      (error) => {
        console.error('Error al obtener las bases de productos', error);
      }
    );
  }

  getPedidoProductoById(): void {
    if (this.idPedido && this.idProducto) {
      this.pedidoService.getPedidoProductoByIds(this.idPedido, this.idProducto).subscribe(
        (data: any) => {
          if (data) {
            this.pedidoProducto = data;
          }
        },
        (error) => {
          console.error('Error al obtener el pedido producto', error);
        }
      );
    }
  }

  onBasePorcentajeChange($event: Event) {
    const target = $event.target as HTMLSelectElement | null;
    if (target) {
      this.base.porcentaje = target.value;
    }
  }


  onBaseChange(event: any): void {
    const baseId = event.target.value;
    this.base = this.bases.find(base => base.idBaseProducto === parseInt(baseId));
    this.IdBase = this.base.idBaseProducto;
    this.updatePrecios();
  }

  onChangeMateriaPrimaComponente(index: number, idMateriaPrima: number): void {
    const factor = Math.pow(10, 4);
    const factorCostoPorcentaje = Math.pow(10, 5);
    let indexx = this.materiasPrimas.findIndex(materia => materia.idMateriaPrima == idMateriaPrima);
    console.log('Materia prima seleccionada:', idMateriaPrima);
    this.componentes[index].costoGramo = Math.round((this.materiasPrimas[indexx].costoGramo) * factor) / factor;
    this.componentes[index].costoPorPorcentaje = Math.round((this.componentes[index].gramoPorPresentacion * this.componentes[index].costoGramo) * factorCostoPorcentaje) / factorCostoPorcentaje;
    this.updatePrecios();
  }

  onChangePorcentajeComponente(index: number): void {
    const factor = Math.pow(10, 4);
    const factorCostoPorcentaje = Math.pow(10, 5);
    this.componentes[index].gramoPorPresentacion = Math.round(((this.componentes[index].porcentaje * this.presentacion) * 1.5) * factor) / factor;
    this.componentes[index].costoPorPorcentaje = Math.round((this.componentes[index].gramoPorPresentacion * this.componentes[index].costoGramo) * factorCostoPorcentaje) / factorCostoPorcentaje;
    this.updatePrecios();
  }

  onPorcentajeComponenteInput($event: Event, index: number) {
    const target = $event.target as HTMLInputElement | null;
    if (target) {
      console.log(target.value)
      console.log(this.componentes[index]);
    }
  }

  onPorcentajeComponenteInput2($event: number | undefined , index: number) {
    if ($event) {
      this.componentes[index].porcentaje = $event;
      this.onChangePorcentajeComponente(index);
      console.log(this.componentes[index].porcentaje);
    }
  }

  onPorcentajeGananciaBCInput($event: number | undefined){
    if ($event) {
      this.gananciaBC = $event;
      this.updatePrecios();
    }
  }

  updatePrecios(): void {
    const factor = Math.pow(10, 2);
    const factorPrecioVentaFinal = Math.pow(10, 2);
    const factorPrecioVentaFinalRedondeado = Math.pow(10, 0);
    let sumaCostoPorcentaje = 0;
    this.componentes.forEach(componente => {
      sumaCostoPorcentaje += componente.costoPorPorcentaje;
    });
    this.totalCosto = this.envase + this.maquila + sumaCostoPorcentaje;
    this.precioNeto = this.totalCosto + (this.totalCosto * this.gananciaBC);

    this.totalCosto = Math.round((this.totalCosto) * factor) / factor;
    this.precioNeto = Math.round((this.precioNeto) * factor) / factor;

    let precioConIgv = this.precioNeto + (this.precioNeto * this.igv);

    this.precioVentaFinal = precioConIgv + (precioConIgv * this.base.porcentaje);
    this.precioVentaFinal = Math.round((this.precioVentaFinal) * factorPrecioVentaFinal) / factorPrecioVentaFinal;
    this.precioVentaFinalRedondeado = Math.round((this.precioVentaFinal) * factorPrecioVentaFinalRedondeado) / factorPrecioVentaFinalRedondeado;
  }

  agregarComponente(): void {
    const sumaPorcentajes = this.componentes.reduce((acc, comp) => acc + comp.porcentaje, 0);
    if (sumaPorcentajes >= 1) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'La suma de los porcentajes no puede exceder el 100%',
        confirmButtonText: 'Aceptar'
      });
      return;
    }
    const factor = Math.pow(10, 4);
    const nuevoComponente = {
      id: this.componentes.length + 1,
      idMateriaPrima: this.materiasPrimas[0].idMateriaPrima,
      costoGramo: this.materiasPrimas[0].costoGramo,
      porcentaje: Math.round((1 - sumaPorcentajes) * factor) / factor,
      gramoPorPresentacion: Math.round((((Math.round((1 - sumaPorcentajes) * factor) / factor) * this.presentacion) * 1.5) * factor) / factor,
      costoPorPorcentaje: Math.round(((Math.round((((Math.round((1 - sumaPorcentajes) * factor) / factor) * this.presentacion) * 1.5) * factor) / factor) * this.materiasPrimas[0].costoGramo) * factor) / factor
    };
    this.componentes.push(nuevoComponente);
  }

  borrarComponente(index: number){
    this.componentes.splice(index, 1);
    this.updatePrecios();
  }

  redondearDecimales(index: number, propiedad: keyof (typeof this.componentes)[0], maxDecimales: number = 4): void {
    const componente = this.componentes[index];
    if (componente && componente[propiedad] !== undefined && componente[propiedad] !== null) {
      const valor = parseFloat(componente[propiedad]);
      const factor = Math.pow(10, maxDecimales);
      const redondeado = Math.round(valor * factor) / factor;
      this.componentes[index][propiedad] = redondeado;
    }
  }

  guardarProductoPersonalizado(): void {
    const productoPersonalizado = {
      idPedido: this.idPedido,
      idProducto: this.idProducto,
      cantidad: this.pedidoProducto.cantidad,
      personalizado: true
    };

  }

  savePrecioPersonalizado(): void {
  
      let request: ProductoPersonalizadoRequest = {
        idPedido: this.idPedido || '',
        idProducto: this.idProducto || '',
        nombrePersonalizado: this.nombrePersonalizado,
        descripcionPersonalizada: this.descripcionPersonalizada,
        detallesPersonalizacion: this.detallePersonalizacion,
        precioPersonalizado: this.precioVentaFinalRedondeado
      }
  
      this.productoPersonalizadoService.saveProductoPersonalizado(request).subscribe(
        (producto) => {
          if(producto) {
            Swal.fire({
              icon: 'success',
              title: '¡Listo!',
              text: 'El precio personalizado del producto ha sido guardado.',
              confirmButtonText: 'Aceptar'
            }).then((result) => {
              this.router.navigate(['/pages/atencion-cliente/bandeja-personalizacion'])
            });
          }
        },
        (error) => {
          console.error('Error al guardar el precio personalizado', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo guardar el precio personalizado.',
            confirmButtonText: 'Aceptar'
          });
        }
      );
    }

}
