import { CommonModule } from '@angular/common';
import { Component, effect, EventEmitter, inject, OnDestroy, OnInit, Output, signal, TemplateRef, ViewChild } from '@angular/core';
import { ProductoService } from '../../../services/producto.service';
import Swal from 'sweetalert2';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PedidoService } from '../../../services/pedido.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DataService } from '../../../services/data.service';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../../services/toast.service';
import { ToastsContainer } from '../../../shared/components/toasts-container/toasts-container.component';
import { MetodoEntregaService } from '../../../services/metodo-entrega.service';
import { DireccionService } from '../../../services/direccion.service';

interface PedidoRequest {
  idCliente: number;
  fechaPedido: string;
  idEstadoPedido: number;
  idTipoPago: number;
  observaciones: string;
  fechaEstimadaEntrega: string;
  montoTotal: number;
  idCanalVenta: number;
}

interface Producto {
  idProducto: string;
  nombre: string;
  descripcion: string;
  precio: number;
  presentacion: string;
}

interface PedidoProducto {
  idProducto: string;
  nombre: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  subtotal: number;
  personalizado: boolean;
  precioPersonalizado: boolean;
}

interface PedidoProductoRequest {
  idPedido: string;
  idProducto: string;
  cantidad: number;
  personalizado: boolean;
}

@Component({
  selector: 'app-registro-pedido',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbTooltipModule, ToastsContainer],
  templateUrl: './registro-pedido.component.html',
  styleUrl: './registro-pedido.component.scss'
})
export class RegistroPedidoComponent implements OnInit, OnDestroy {

  @ViewChild('successTpl', { static: false }) successTpl!: TemplateRef<any>;
  toastService = inject(ToastService);

  idRol: number = 0;

  productoSeleccionado: any;

  query = '';
  cantidad = 1;
  productosBusqueda: Producto[] = [];
  productosPedido: PedidoProducto[] = [];
  timeoutId: any;
  private updateTimeout: any;

  idPedido: string | null = null;
  pedido: any;
  private routeSubscription: Subscription | null = null;

  isLoading: boolean = false;
  disabledPagar: boolean = false;

  idMetodoEntregaSeleccionado = 0;
  idDireccionSeleccionada = 0;

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.idPedido = params.get('idPedido');
      if (this.idPedido) {
        this.getMetodosEntrega();
        this.onMetodoEntregaChange();
        this.getPedidoById(this.idPedido);
        this.cargarProductosByIdPedido(this.idPedido);
      }else{
        let request: PedidoRequest = {
          idCliente: this.dataService.getLoggedUser().cliente.idCliente,
          fechaPedido: new Date().toISOString(),
          idEstadoPedido: 1,
          idTipoPago: 1,
          observaciones: '',
          fechaEstimadaEntrega: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          montoTotal: 0,
          idCanalVenta: 1
        };
        this.pedidoService.createPedido(request).subscribe((data: any) => {
          if(data){
            this.router.navigate(['/pages/atencion-cliente/registro-pedido', data.idPedido]);
          }
        }, error => {
          console.error('Error al crear pedido', error);
          Swal.fire({
            icon: 'error',
            title: 'Oops!',
            text: 'No se pudo crear el pedido, inténtelo de nuevo.',
            showConfirmButton: true
          });
        });
      }
      console.log('ID del Pedido:', this.idPedido);
    });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    this.toastService.clear();
  }

  constructor(private productoService: ProductoService,
    private pedidoService: PedidoService,
    private route: ActivatedRoute,
    public router: Router,
    private dataService: DataService,
    private metodoEntregaService: MetodoEntregaService,
    private direccionService: DireccionService
  ) {
    this.idRol = this.dataService.getLoggedUser().rol.idRol;
    console.log('ID del Rol:', this.idRol);
  }

  onMetodoEntregaChange() {
    console.log('Método de entrega seleccionado:', this.idMetodoEntregaSeleccionado);
    this.idDireccionSeleccionada = 0; // Reiniciar la dirección seleccionada
    this.lstDirecciones = []; // Limpiar las direcciones
    if (this.idMetodoEntregaSeleccionado === 1) { // Si es "Recojo en tienda"
      this.getDireccionesByTiendaId(1);
    }
    if (this.idMetodoEntregaSeleccionado === 2) { // Si es "Delivery"
      this.getDireccionesByClienteId(this.dataService.getLoggedUser().cliente.idCliente);
    }
  }

  lstMetodosEntrega: any[] = [];
  getMetodosEntrega() {
    this.metodoEntregaService.getMetodosEntrega().subscribe(
      (metodos) => {
        this.lstMetodosEntrega = metodos;
        console.log('Métodos de entrega:', metodos);
      },
      (error) => {
        console.error('Error al obtener métodos de entrega', error);
      }
    );
  }

  lstDirecciones: any[] = [];
  getDireccionesByClienteId(idCliente: number) {
    this.direccionService.getDireccionesByClienteId(idCliente).subscribe(
      (direcciones) => {
        this.lstDirecciones = direcciones;
        this.idDireccionSeleccionada = this.lstDirecciones[0]?.idDireccion || 0; // Seleccionar la primera dirección por defecto
        console.log('Direcciones del cliente:', direcciones);
      },
      (error) => {
        console.error('Error al obtener direcciones del cliente', error);
      }
    );
  }

  getDireccionesByTiendaId(idTienda: number) {
    this.direccionService.getDireccionesByTiendaId(idTienda).subscribe(
      (direcciones) => {
        this.lstDirecciones = direcciones;
        this.idDireccionSeleccionada = this.lstDirecciones[0]?.idDireccion || 0; // Seleccionar la primera dirección por defecto
        console.log('Direcciones de la tienda:', direcciones);
      },
      (error) => {
        console.error('Error al obtener direcciones de la tienda', error);
      }
    );
  }

  guardarEntrega(){
    this.pedidoService.updateDireccionPedido({
      idPedido: this.idPedido,
      idMetodoEntrega: this.idMetodoEntregaSeleccionado,
      idDireccion: this.idDireccionSeleccionada
    }).subscribe(
      (response) => {
        Swal.fire({
          icon: 'success',
          title: '¡Listo!',
          text: 'La dirección de entrega ha sido actualizada correctamente.',
          showConfirmButton: true
        });
      },
      (error) => {
        console.error('Error al actualizar la dirección de entrega', error);
      }
    );
  }


  getPedidoById(idPedido: string): void {
    this.pedidoService.getPedidoById(idPedido).subscribe(
      (pedido) => {
        if(pedido) {
          this.pedido = pedido;
          if(pedido.metodoEntrega && pedido.metodoEntrega.idMetodoEntrega && pedido.metodoEntrega.idMetodoEntrega > 0
            && pedido.direccion && pedido.direccion.idDireccion && pedido.direccion.idDireccion > 0
          ) {
            this.idMetodoEntregaSeleccionado = pedido.metodoEntrega.idMetodoEntrega || 0;
            this.idDireccionSeleccionada = pedido.direccion ? pedido.direccion.idDireccion : 0; // Asignar la dirección del pedido
            this.onMetodoEntregaChange();
          }
        }
        console.log('Pedido:', pedido);
      },
      (error) => {
        console.error('Error al cargar el pedido', error);
      }
    );
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value.trim();
    
    // Limpiamos el timeout anterior
    clearTimeout(this.timeoutId);

    // Iniciamos un nuevo timeout para esperar 1 segundo
    this.timeoutId = setTimeout(() => {
      if (value) {
        this.productoService.getBuscarProductos(value).subscribe((data: any) => {
          this.productosBusqueda = data;
        },
        (error) => {
          console.error('Error al registrar cliente', error);
          Swal.fire({
            icon: 'error',
            title: 'Oops!',
            text: 'No se pudo registrar el cliente, inténtelo de nuevo.',
            showConfirmButton: true
          });
        });
      } else {
        this.productosBusqueda = [];
      }
    }, 1000);
  }

  buscarProducto(){
    if (this.query) {
      this.productoService.getBuscarProductos(this.query).subscribe((data: any) => {
        this.productosBusqueda = data;
      },
      (error) => {
        console.error('Error al registrar cliente', error);
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: 'No se pudo registrar el cliente, inténtelo de nuevo.',
          showConfirmButton: true
        });
      });
    } else {
      this.productosBusqueda = [];
    }
  }

  cargarProductosByIdPedido(idPedido: string) {
    this.pedidoService.getProductosByIdPedido(idPedido).subscribe((data: any) => {
        this.productosPedido = data;
        let checkPersonalizado = this.productosPedido.some((producto: PedidoProducto) => producto.personalizado && !producto.precioPersonalizado);
        if(checkPersonalizado){
          this.disabledPagar = true;
        }
      },
      (error) => {
        console.error('Error al obtener productos del pedido', error);
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: 'No se pudo obtener los productos del pedido "'+this.idPedido+'", inténtelo de nuevo.',
          showConfirmButton: true
        });
      });
  }

  agregarProducto() {

    const productoExistente = this.productosPedido.some(p => p.idProducto === this.productoSeleccionado.idProducto);
    if (productoExistente) {
      Swal.fire({
        icon: 'warning',
        title: 'Oops!',
        text: 'El producto seleccinado ya se encuentra agregado al pedido.',
        showConfirmButton: true
      });
    } else {
      let productoRequest: PedidoProductoRequest = {
        idPedido: this.idPedido!,
        idProducto: this.productoSeleccionado.idProducto,
        cantidad: this.cantidad,
        personalizado: false
      };
      this.pedidoService.saveProductoForPedido(productoRequest).subscribe((data: any) => {
          if(data){
            Swal.fire({
              icon: 'success',
              title: '¡Listo!',
              text: 'El producto ha sido agregado correctamente.',
              showConfirmButton: true
            });
            this.query = '';
            this.cantidad = 1;
            this.cargarProductosByIdPedido(this.idPedido!);
          }
        },
        (error) => {
          console.error('Error al agregar producto al pedido', error);
          Swal.fire({
            icon: 'error',
            title: 'Oops!',
            text: 'No se pudo agregar el producto al pedido, inténtelo de nuevo.',
            showConfirmButton: true
          });
        });
    }

    
  }

  changeCantidad(producto: PedidoProducto, event: Event) {

    this.isLoading = true;

    clearTimeout(this.updateTimeout);
    const cantidad = (event.target as HTMLInputElement).value;
    if (cantidad) {
      const cantidadNumber = parseInt(cantidad, 10);
      if (!isNaN(cantidadNumber) && cantidadNumber > 0) {
        producto.cantidad = cantidadNumber;
        producto.subtotal = producto.precio * producto.cantidad;
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: 'La cantidad debe ser un número positivo.',
          showConfirmButton: true
        });
      }
    } else {
      producto.cantidad = 1;
      producto.subtotal = producto.precio * producto.cantidad;
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: 'La cantidad no puede estar vacía.',
        showConfirmButton: true
      });
    }
      
    // Establece un nuevo temporizador para 1 segundo
    this.updateTimeout = setTimeout(() => {
      const cantidadNumber = parseInt(cantidad, 10);
      if (!isNaN(cantidadNumber) && cantidadNumber > 0) {
        producto.cantidad = cantidadNumber;
        producto.subtotal = producto.precio * producto.cantidad;
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: 'La cantidad debe ser un número positivo.',
          showConfirmButton: true
        });
      }
      let productoRequest: PedidoProductoRequest = {
        idPedido: this.idPedido!,
        idProducto: producto.idProducto,
        cantidad: cantidadNumber,
        personalizado: producto.personalizado
      };
      this.pedidoService.saveProductoForPedido(productoRequest).subscribe((data: any) => {
        if(data){
          this.showSuccess(this.successTpl);
          this.cargarProductosByIdPedido(this.idPedido!);
          this.isLoading = false;
        }
      },
      (error) => {
        console.error('Error al agregar producto al pedido', error);
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: 'No se pudo agregar el producto al pedido, inténtelo de nuevo.',
          showConfirmButton: true
        });
      });
    }, 1000);
    
    
  }

  selectProducto(producto: Producto) {
    this.query = producto.nombre;
    this.productosBusqueda = [];
    this.productoSeleccionado = producto;
  }

  eliminarProducto(producto: PedidoProducto) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás recuperar este producto después de eliminarlo.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.pedidoService.deleteProductoDePedido(this.idPedido!, producto.idProducto).subscribe(
          {
            next: (response) => {
              Swal.fire({
                icon: 'success',
                title: '¡Listo!',
                text: 'El producto ha sido eliminado correctamente.',
                showConfirmButton: true
              });
              this.cargarProductosByIdPedido(this.idPedido!);
            },
            error: (error) => {
              console.error('Error al eliminar producto del pedido', error);
              Swal.fire({
                icon: 'error',
                title: 'Oops!',
                text: 'No se pudo eliminar el producto del pedido, inténtelo de nuevo.',
                showConfirmButton: true
              });
            }
          });
      }
    })
  }

  showStandard(template: TemplateRef<any>) {
		this.toastService.show({ template });
	}

	showSuccess(template: TemplateRef<any>) {
		this.toastService.show({ template, classname: 'bg-success text-light', delay: 10000 });
	}

	showDanger(template: TemplateRef<any>) {
		this.toastService.show({ template, classname: 'bg-danger text-light', delay: 15000 });
	}

}
