import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbTypeaheadModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { ClienteService } from '../../../services/cliente.service';
import { CuponService } from '../../../services/cupon.service';
import { PedidoService } from '../../../services/pedido.service';
import { CatalogoPrecioService } from '../../../services/catalogo-precio.service';
import { RolService } from '../../../services/rol.service';

@Component({
  selector: 'app-catalogo-precios',
  standalone: true,
  imports: [FormsModule, NgbTypeaheadModule, NgbPaginationModule, CommonModule],
  templateUrl: './catalogo-precios.component.html',
  styleUrl: './catalogo-precios.component.scss'
})
export class CatalogoPreciosComponent implements OnInit {

  catalogos: any[] = [];
  catalogosTable: any[] = [];
  page = 1;
  pageSize = 5;
  collectionSize = this.catalogos.length;

  lstCuponesSeleccionados: string[] = [];

  roles: any[] = [];

  catalogo: any = null;
  nombreCatalogo: string = '';
  idRol: number = 3;

  constructor(
    private rolService: RolService,
    public router: Router,
    private catalogoPrecioService: CatalogoPrecioService
  ) {}

  ngOnInit(): void {
    this.listarRoles();
    this.cargarCatalogosPrecio();
  }

  listarRoles(): void {
    this.rolService.getRoles().subscribe(
      (roles) => {
        this.roles = roles;
      },
      (error) => console.error('Error al cargar roles', error)
    );
  }

  cargarCatalogosPrecio(): void {
    this.catalogoPrecioService.obtenerCatalogoPorRol(this.idRol).subscribe(
      (catalogo) => {
        if(catalogo) {
          this.catalogo = catalogo;
          this.nombreCatalogo = catalogo.nombre;
          this.catalogosTable = catalogo.productos || [];
          this.collectionSize = this.catalogosTable.length;
          this.refreshCatalogos();
        }else{
          this.catalogo = null;
          this.catalogos = [];
          this.catalogosTable = [];
          let rol = this.roles.find(r => r.idRol == this.idRol);
          this.nombreCatalogo = "";
          
        }
      },
      (error) => console.error('Error al cargar catalogos', error)
    );
  }

  refreshCatalogos() {
    this.catalogos = this.catalogosTable
      .map((catalogo, i) => ({ id: i + 1, ...catalogo }))
      .slice(
        (this.page - 1) * this.pageSize,
        (this.page - 1) * this.pageSize + this.pageSize
      );
  }

  crearCatalogo() {

    if(this.nombreCatalogo.trim() === '') {
      Swal.fire('Error', 'El nombre del catálogo es obligatorio', 'error');
      return;
    }

    let rol = this.roles.find(r => r.idRol == this.idRol);

    Swal.fire({
      title: 'Crear Catálogo',
      html: `¿Estás seguro de que deseas crear un nuevo catálogo para el tipo de cliente <span style="font-weight: bold;">"${rol?.nombre}"</span>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, crear',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.catalogoPrecioService.crearCatalogo({ nombre: this.nombreCatalogo, idRol: this.idRol }).subscribe(
          (response) => {
            Swal.fire('Éxito', 'Catálogo creado exitosamente', 'success');
            this.cargarCatalogosPrecio();
          },
          (error) => {
            Swal.fire('Error', 'No se pudo crear el catálogo', 'error');
          }
        );
      }
    });
  }

}
