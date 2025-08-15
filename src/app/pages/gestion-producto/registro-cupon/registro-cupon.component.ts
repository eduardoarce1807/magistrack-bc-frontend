import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { ProductoService } from '../../../services/producto.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { ClienteService } from '../../../services/cliente.service';
import { CuponService } from '../../../services/cupon.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

interface CuponRequest {
  codigoCupon: string;
  descripcion: string;
  descuento: number;
  montoMinimo: number;
  stock: number;
  fechaInicio: string; // formato YYYY-MM-DD
  fechaFin: string;
  idClientes: number[];
  idProductos: string[];
}

@Component({
  selector: 'app-registro-cupon',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgMultiSelectDropDownModule],
  templateUrl: './registro-cupon.component.html',
  styleUrl: './registro-cupon.component.scss'
})
export class RegistroCuponComponent implements OnInit {

  ddsClientes = {};
  ddsProductos = {};
  clientes: any[] = [];
  productos: any[] = [];

  clientesSeleccionados: any[] = [];
  productosSeleccionados: any[] = [];

  cupon: CuponRequest = {
    codigoCupon: '',
    descripcion: '',
    descuento: 0.0,
    montoMinimo: 0.0,
    stock: 0,
    fechaInicio: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
    fechaFin: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
    idClientes: [],
    idProductos: []
  }

  constructor(
    private productoService: ProductoService,
    private clienteService: ClienteService,
    private cuponService: CuponService,
    private route: ActivatedRoute,
    public router: Router,
  ) {
  }

  isEditing = false;
  titleText = 'Registrar Cupón';
  private routeSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.listarClientes();
    this.listarProductos();

    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const codigoCupon = params.get('codigoCupon');
      if (codigoCupon) {
        this.isEditing = true;
        this.titleText = 'Actualizar Cupón';
        this.cuponService.obtenerCuponPorCodigoDetallado(codigoCupon).subscribe(
          (cupon: any) => {
            this.cupon = {
              codigoCupon: cupon.codigo,
              descripcion: cupon.descripcion,
              descuento: cupon.descuento,
              montoMinimo: cupon.montoMinimo,
              stock: cupon.stock,
              fechaInicio: cupon.fechaInicio,
              fechaFin: cupon.fechaFin,
              idClientes: cupon.clientes.map((cliente: any) => cliente.idCliente),
              idProductos: cupon.productos.map((producto: any) => producto.idProducto)
            };

          },
          (error) => {
            console.error('Error al obtener cupón', error);
            Swal.fire({
              title: 'Error',
              text: 'No se pudo cargar el cupón. Por favor, intente nuevamente.',
              icon: 'error'
            });
          }
        );
      }
    });

    this.ddsClientes = {
      singleSelection: false,
      idField: 'idCliente',
      textField: 'nombreCompleto',
      selectAllText: 'Seleccionar Todo',
      unSelectAllText: 'Deseleccionar Todo',
      itemsShowLimit: 3,
      allowSearchFilter: false
    };
    this.ddsProductos = {
      singleSelection: false,
      idField: 'idProducto',
      textField: 'nombre',
      selectAllText: 'Seleccionar Todo',
      unSelectAllText: 'Deseleccionar Todo',
      itemsShowLimit: 3,
      allowSearchFilter: false
    };
  }

  onItemSelect(item: any) {
    console.log(item);
  }

  onSelectAll(items: any) {
    console.log(items);
  }

  onDeSelectAll(items: any) {
    console.log(items);
  }

  onItemDeSelect(item: any) {
    console.log(item);
  }

  listarClientes(): void {
    this.clienteService.getClientes().subscribe(
      (clientes) => {
        console.log('Clientes originales:', clientes); // Debug
        this.clientes = clientes.map(cliente => ({
          ...cliente,
          nombreCompleto: (cliente.nombres || '') + ' ' + (cliente.apellidos || '')
        }));
        console.log('Clientes mapeados:', this.clientes); // Debug
        
        // Si estamos editando, filtrar los clientes seleccionados después de cargar la lista
        if (this.isEditing && this.cupon.idClientes.length > 0) {
          this.clientesSeleccionados = this.clientes.filter(cliente => 
            this.cupon.idClientes.includes(cliente.idCliente)
          );
        }
      },
      (error) => console.error('Error al cargar clientes', error)
    );
  }

  listarProductos(): void {
    this.productoService.getProductos().subscribe(
      (productos) => {
        this.productos = productos.map(producto => ({
          idProducto: producto.idProducto,
          nombre: producto.productoMaestro.nombre + ' - ' + producto.presentacion + ' ' + producto.tipoPresentacion.descripcion
        }));

        // Si estamos editando, filtrar los productos seleccionados después de cargar la lista
        if (this.isEditing && this.cupon.idProductos.length > 0) {
          this.productosSeleccionados = this.productos.filter(producto => 
            this.cupon.idProductos.includes(producto.idProducto)
          );
        }
      },
      (error) => console.error('Error al cargar productos', error)
    );
  }

  registrarCupon(): void {

    this.cupon.idClientes = this.clientesSeleccionados.map(cliente => cliente.idCliente);
    this.cupon.idProductos = this.productosSeleccionados.map(producto => producto.idProducto);

    //Si la lista de clientes seleccionados es igual a la lista completa de clientes, se vacía
    if(this.cupon.idClientes.length === this.clientes.length) {
      this.cupon.idClientes = [];
    }

    //Si la lista de productos seleccionados es igual a la lista completa de productos, se vacía
    if(this.cupon.idProductos.length === this.productos.length) {
      this.cupon.idProductos = [];
    }

    this.cuponService.registrarCupon(this.cupon).subscribe(
      (response) => {
        this.limpiarCampos();
        Swal.fire({
          title: '¡Listo!',
          text: 'Cupón registrado con éxito',
          icon: 'success'
        });
      },
      (error) => {
        console.error('Error al registrar cupón', error);
        Swal.fire({
          title: 'Oops',
          text: 'No se pudo registrar el cupón. Por favor, intente nuevamente.',
          icon: 'error'
        });
      }
    );
  }

  actualizarCupon(): void {
    this.cupon.idClientes = this.clientesSeleccionados.map(cliente => cliente.idCliente);
    this.cupon.idProductos = this.productosSeleccionados.map(producto => producto.idProducto);

    //Si la lista de clientes seleccionados es igual a la lista completa de clientes, se vacía
    if(this.cupon.idClientes.length === this.clientes.length) {
      this.cupon.idClientes = [];
    }

    //Si la lista de productos seleccionados es igual a la lista completa de productos, se vacía
    if(this.cupon.idProductos.length === this.productos.length) {
      this.cupon.idProductos = [];
    }

    this.cuponService.actualizarCupon(this.cupon).subscribe(
      (response) => {
        this.limpiarCampos();
        Swal.fire({
          title: '¡Listo!',
          text: 'Cupón actualizado con éxito',
          icon: 'success',
          allowEscapeKey: false,
          allowOutsideClick: false
        }).then(() => {
          // Redirigir a la lista de cupones después de actualizar
          this.router.navigate(['/pages/gestion-producto/listado-cupones']);
        });
      },
      (error) => {
        console.error('Error al actualizar cupón', error);
        Swal.fire({
          title: 'Oops',
          text: 'No se pudo actualizar el cupón. Por favor, intente nuevamente.',
          icon: 'error'
        });
      }
    );
  }

  limpiarCampos(): void {
    this.cupon = {
      codigoCupon: '',
      descripcion: '',
      descuento: 0.0,
      montoMinimo: 0.0,
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: new Date().toISOString().split('T')[0],
      idClientes: [],
      idProductos: [],
      stock: 0
    };
    this.clientesSeleccionados = [];
    this.productosSeleccionados = [];
  }

}
