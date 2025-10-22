import { Component, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { PedidoService } from '../../../services/pedido.service';
import { BulkModel } from '../../../model/bulkModel';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import JsBarcode from 'jsbarcode';

@Component({
  selector: 'app-gestor-bulks',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule,
    CardModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    DropdownModule,
    FormsModule,
    ProgressSpinnerModule,
    MessageModule
  ],
  templateUrl: './gestor-bulks.component.html',
  styleUrl: './gestor-bulks.component.scss'
})
export class GestorBulksComponent implements OnInit {
  bulks: BulkModel[] = [];
  filteredBulks: BulkModel[] = [];
  loading: boolean = false;
  globalFilterValue: string = '';
  selectedState: any = null;

  // Para funcionalidad de código de barras
  @ViewChild('codigoBarraIndividual', { static: true }) codigoBarraIndividual: TemplateRef<any> | null = null;
  @ViewChild('codigoBarrasMasivo', { static: true }) codigoBarrasMasivo: TemplateRef<any> | null = null;
  itemCodigoBarras: BulkModel | null = null;
  
  // Para códigos de barras masivos
  productosDelBulk: any[] = [];
  bulkSeleccionado: BulkModel | null = null;
  loadingProductos: boolean = false;
  errorCargandoProductos: string = '';
  
  private modalService = inject(NgbModal);

  stateOptions = [
    { label: 'Todos los Estados', value: null },
    { label: 'En producción', value: 3 },
    { label: 'En calidad', value: 4 },
    { label: 'En envasado', value: 5 }
  ];

  constructor(private pedidoService: PedidoService) {}

  ngOnInit(): void {
    this.loadBulks();
  }

  loadBulks(): void {
    this.loading = true;
    this.pedidoService.getBulksList().subscribe({
      next: (data: BulkModel[]) => {
        this.bulks = data || [];
        this.applyStateFilter();
        this.loading = false;
        console.log('Bulks cargados:', this.bulks);
      },
      error: (error) => {
        console.error('Error al cargar los bulks:', error);
        this.loading = false;
        this.bulks = [];
        this.filteredBulks = [];
        
        // Mostrar error más específico
        let errorMessage = 'No se pudieron cargar los bulks. Por favor, intente nuevamente.';
        if (error.status === 404) {
          errorMessage = 'El endpoint de bulks no fue encontrado. Verifique la configuración del servidor.';
        } else if (error.status === 0) {
          errorMessage = 'No se pudo conectar con el servidor. Verifique su conexión a internet.';
        }
        
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar datos',
          text: errorMessage,
          footer: `Error técnico: ${error.status} - ${error.statusText || 'Error desconocido'}`
        });
      }
    });
  }

  applyStateFilter(): void {
    if (this.selectedState === null) {
      this.filteredBulks = [...this.bulks];
    } else {
      this.filteredBulks = this.bulks.filter(bulk => bulk.idEstadoProducto === this.selectedState);
    }
  }

  onStateChange(): void {
    this.applyStateFilter();
  }

  getSelectedStateLabel(): string {
    const selectedOption = this.stateOptions.find(opt => opt.value === this.selectedState);
    return selectedOption?.label || '';
  }

  getSeverity(estado: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' {
    switch (estado) {
      case 'En producción':
        return 'info';
      case 'En calidad':
        return 'warning';
      case 'En envasado':
        return 'success';
      default:
        return 'secondary';
    }
  }

  clear(table: any): void {
    table.clear();
    this.globalFilterValue = '';
    this.selectedState = null;
    this.applyStateFilter();
  }

  onGlobalFilter(table: any, event: Event): void {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Fecha inválida';
    }
  }

  getTipoBulkIcon(tipoBulk: string | undefined): string {
    switch (tipoBulk?.toUpperCase()) {
      case 'PRODUCTO':
        return 'pi pi-box';
      case 'PREPARADO_MAGISTRAL':
        return 'pi pi-flask';
      default:
        return 'pi pi-tag';
    }
  }

  getTipoBulkLabel(tipoBulk: string | undefined): string {
    switch (tipoBulk?.toUpperCase()) {
      case 'PRODUCTO':
        return 'Producto';
      case 'PREPARADO_MAGISTRAL':
        return 'Prep. Magistral';
      default:
        return tipoBulk || 'Desconocido';
    }
  }

  refreshData(): void {
    this.selectedState = null;
    this.globalFilterValue = '';
    this.loadBulks();
  }

  getTotalBulks(): number {
    return this.bulks.length;
  }

  getFilteredBulksCount(): number {
    return this.filteredBulks.length;
  }

  // Métodos para código de barras
  openModalCodigoBarraIndividual(bulk: BulkModel): void {
    if (!bulk.idBulk) {
      Swal.fire({
        icon: 'warning',
        title: '¡Atención!',
        text: 'Este bulk no tiene un código asignado.',
        showConfirmButton: true,
      });
      return;
    }
    
    this.itemCodigoBarras = bulk;
    if (this.codigoBarraIndividual) {
      this.modalService.open(this.codigoBarraIndividual, { size: 'lg' });
      setTimeout(() => {
        this.initBarcodeIndividual();
      }, 100);
    }
  }

  initBarcodeIndividual(): void {
    if (this.itemCodigoBarras && this.itemCodigoBarras.idBulk) {
      JsBarcode('#barcode-individual', this.itemCodigoBarras.idBulk, {
        width: 2,
        height: 100,
        displayValue: true,
        fontSize: 16
      });
    }
  }

  imprimirCodigoBarraIndividual(divId: string): void {
    const printContents = document.getElementById(divId)?.innerHTML;
    if (!printContents) {
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: 'No se encontró el contenido para imprimir.',
        showConfirmButton: true,
      });
      return;
    }
    
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Código de Barras</title>');
      printWindow.document.write('<style>body{margin:0;padding:20px;text-align:center;} @media print { body { -webkit-print-color-adjust: exact; } }</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write(printContents);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  }

  // Métodos para códigos de barras masivos
  openModalCodigoBarrasMasivo(bulk: BulkModel): void {
    if (!bulk.idBulk) {
      Swal.fire({
        icon: 'warning',
        title: '¡Atención!',
        text: 'Este bulk no tiene un código asignado.',
        showConfirmButton: true,
      });
      return;
    }
    
    this.bulkSeleccionado = bulk;
    this.productosDelBulk = [];
    this.errorCargandoProductos = '';
    
    if (this.codigoBarrasMasivo) {
      this.modalService.open(this.codigoBarrasMasivo, { size: 'xl' });
      this.cargarProductosDelBulk(bulk.idBulk);
    }
  }

  cargarProductosDelBulk(idBulk: string): void {
    this.loadingProductos = true;
    this.errorCargandoProductos = '';
    
    this.pedidoService.getProductosByBulkId(idBulk).subscribe({
      next: (data: any[]) => {
        this.productosDelBulk = data || [];
        this.loadingProductos = false;
        console.log('Productos del bulk cargados:', this.productosDelBulk);
        
        if (this.productosDelBulk.length > 0) {
          // Generar códigos de barras después de un pequeño delay para asegurar que el DOM esté listo
          setTimeout(() => {
            this.initBarcodesMasivos();
          }, 200);
        }
      },
      error: (error) => {
        console.error('Error al cargar productos del bulk:', error);
        this.loadingProductos = false;
        
        let errorMessage = 'No se pudieron cargar los productos del bulk.';
        if (error.status === 404) {
          errorMessage = 'No se encontraron productos para este bulk.';
        } else if (error.status === 0) {
          errorMessage = 'No se pudo conectar con el servidor.';
        }
        
        this.errorCargandoProductos = errorMessage;
      }
    });
  }

  initBarcodesMasivos(): void {
    this.productosDelBulk.forEach((producto, index) => {
      if (producto && producto.id) {
        const barcodeElement = document.getElementById(`barcode-masivo-${index}`);
        if (barcodeElement) {
          JsBarcode(`#barcode-masivo-${index}`, producto.id, {
            width: 2,
            height: 60,
            displayValue: true,
            fontSize: 12,
            margin: 5
          });
        }
      }
    });
  }

  imprimirCodigoBarrasMasivo(divId: string): void {
    const printContents = document.getElementById(divId)?.innerHTML;
    if (!printContents) {
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: 'No se encontró el contenido para imprimir.',
        showConfirmButton: true,
      });
      return;
    }
    
    const printWindow = window.open('', '', 'height=800,width=1200');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Códigos de Barras - Productos del Bulk</title>');
      printWindow.document.write('<style>body{margin:0;padding:20px;} @media print { body { -webkit-print-color-adjust: exact; } div { page-break-inside: avoid; } }</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write(printContents);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  }

  reintentarCargaProductos(): void {
    if (this.bulkSeleccionado?.idBulk) {
      this.cargarProductosDelBulk(this.bulkSeleccionado.idBulk);
    }
  }
}