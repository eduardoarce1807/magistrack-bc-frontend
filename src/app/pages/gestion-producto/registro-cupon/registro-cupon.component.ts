import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { MateriaPrimaService } from '../../../services/materia-prima.service';
import { ProductoService } from '../../../services/producto.service';
import { TipoPresentacionService } from '../../../services/tipo-presentacion.service';
import { Producto, Procedimiento } from '../registro-producto/registro-producto.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RolService } from '../../../services/rol.service';
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
  idRoles: number[];
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

  ddsRoles = {};
  ddsProductos = {};
  roles: any[] = [];
  productos: any[] = [];

  rolesSeleccionados: any[] = [];
  productosSeleccionados: any[] = [];

  cupon: CuponRequest = {
    codigoCupon: '',
    descripcion: '',
    descuento: 0.0,
    montoMinimo: 0.0,
    stock: 0,
    fechaInicio: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
    fechaFin: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
    idRoles: [],
    idProductos: []
  }

  constructor(
    private productoService: ProductoService,
    private rolService: RolService,
    private cuponService: CuponService,
    private route: ActivatedRoute,
    public router: Router,
  ) {
  }

  isEditing = false;
  titleText = 'Registrar Cupón';
  private routeSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.listarRoles();
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
              idRoles: cupon.roles.map((rol: any) => rol.idRol),
              idProductos: cupon.productos.map((producto: any) => producto.idProducto)
            };

            if( this.isEditing) {
              this.rolesSeleccionados = this.roles.filter(rol => 
                this.cupon.idRoles.includes(rol.idRol)
              );
            }

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

    this.ddsRoles = {
      singleSelection: false,
      idField: 'idRol',
      textField: 'nombre',
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

  listarRoles(): void {
    this.rolService.getRoles().subscribe(
      (roles) => {
        this.roles = roles;
      },
      (error) => console.error('Error al cargar roles', error)
    );
  }

  listarProductos(): void {
    this.productoService.getProductos().subscribe(
      (productos) => {
        this.productos = productos.map(producto => ({
          idProducto: producto.idProducto,
          nombre: producto.productoMaestro.nombre + ' - ' + producto.presentacion + ' ' + producto.tipoPresentacion.descripcion
        }));

        if( this.isEditing) {
          // Si estamos editando, filtrar los productos seleccionados
          this.productosSeleccionados = this.productos.filter(producto => 
            this.cupon.idProductos.includes(producto.idProducto)
          );
        }
      },
      (error) => console.error('Error al cargar productos', error)
    );
  }

  registrarCupon(): void {

    this.cupon.idRoles = this.rolesSeleccionados.map(rol => rol.idRol);
    this.cupon.idProductos = this.productosSeleccionados.map(producto => producto.idProducto);

    //Si la lista de roles seleccionados es igual a la lista completa de roles, se vacía
    if(this.cupon.idRoles.length === this.roles.length) {
      this.cupon.idRoles = [];
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
    this.cupon.idRoles = this.rolesSeleccionados.map(rol => rol.idRol);
    this.cupon.idProductos = this.productosSeleccionados.map(producto => producto.idProducto);

    //Si la lista de roles seleccionados es igual a la lista completa de roles, se vacía
    if(this.cupon.idRoles.length === this.roles.length) {
      this.cupon.idRoles = [];
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
      idRoles: [],
      idProductos: [],
      stock: 0
    };
    this.rolesSeleccionados = [];
    this.productosSeleccionados = [];
  }

}
