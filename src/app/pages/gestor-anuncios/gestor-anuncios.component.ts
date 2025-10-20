import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AnuncioService } from '../../services/anuncio.service';
import { 
  AnuncioModel, 
  AnuncioRequest, 
  AnuncioUpdateRequest,
  LoginBackgroundModel,
  LoginBackgroundRequest,
  LoginBackgroundUpdateRequest
} from '../../model/anunciosModel';
import { ANUNCIO_CONSTANTS } from '../../util/anuncio.constants';
import { GoogleDriveImagePipe } from '../../pipes/google-drive-image.pipe';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-gestor-anuncios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, GoogleDriveImagePipe],
  templateUrl: './gestor-anuncios.component.html',
  styleUrls: ['./gestor-anuncios.component.scss']
})
export class GestorAnunciosComponent implements OnInit {
  // Control de pestañas
  activeTab: 'anuncios' | 'login-background' = 'anuncios';

  // Propiedades para anuncios
  anuncios: AnuncioModel[] = [];
  anuncioForm: FormGroup;
  editMode = false;
  selectedAnuncio: AnuncioModel | null = null;
  selectedFile: File | null = null;
  anuncioImagePreview: string | null = null;
  isLoadingAnuncios = false;

  // Propiedades para background del login
  loginBackgrounds: LoginBackgroundModel[] = [];
  backgroundForm: FormGroup;
  editModeBackground = false;
  selectedBackground: LoginBackgroundModel | null = null;
  selectedBackgroundFile: File | null = null;
  backgroundImagePreview: string | null = null;
  isLoadingBackground = false;
  activeBackground: LoginBackgroundModel | null = null;

  posiciones = ANUNCIO_CONSTANTS.POSICIONES;

  constructor(
    private fb: FormBuilder,
    private anuncioService: AnuncioService
  ) {
    // Form para anuncios
    this.anuncioForm = this.fb.group({
      nombre: ['', [
        Validators.required, 
        Validators.minLength(ANUNCIO_CONSTANTS.NOMBRE_MIN_LENGTH), 
        Validators.maxLength(ANUNCIO_CONSTANTS.NOMBRE_MAX_LENGTH)
      ]],
      descripcion: ['', [Validators.maxLength(ANUNCIO_CONSTANTS.DESCRIPCION_MAX_LENGTH)]],
      posicion: [1, [Validators.required]],
      activo: [true, [Validators.required]]
    });

    // Form para background del login
    this.backgroundForm = this.fb.group({
      nombre: ['', [
        Validators.required, 
        Validators.minLength(3), 
        Validators.maxLength(100)
      ]],
      descripcion: ['', [Validators.maxLength(255)]]
    });
  }

  ngOnInit(): void {
    this.cargarAnuncios();
    this.cargarLoginBackgrounds();
  }

  // ==================== MÉTODOS DE CONTROL DE PESTAÑAS ====================

  setActiveTab(tab: 'anuncios' | 'login-background'): void {
    this.activeTab = tab;
    if (tab === 'login-background' && this.loginBackgrounds.length === 0) {
      this.cargarLoginBackgrounds();
    }
  }

  // ==================== MÉTODOS PARA ANUNCIOS ====================

  cargarAnuncios(): void {
    this.isLoadingAnuncios = true;
    this.anuncioService.getAnuncios().subscribe({
      next: (response) => {
        if (response.success) {
          this.anuncios = response.data.sort((a, b) => a.posicion - b.posicion);
        } else {
          Swal.fire('Error', response.message, 'error');
        }
        this.isLoadingAnuncios = false;
      },
      error: (error) => {
        console.error('Error al cargar anuncios:', error);
        Swal.fire('Error', 'Error al cargar los anuncios', 'error');
        this.isLoadingAnuncios = false;
      }
    });
  }

  onAnuncioFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const validation = this.anuncioService.validateImageFile(file);
      
      if (!validation.valid) {
        Swal.fire('Error', validation.message, 'error');
        this.clearAnuncioFileSelection();
        return;
      }

      this.selectedFile = file;
      
      // Crear preview de la imagen
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.anuncioImagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  clearAnuncioFileSelection(): void {
    this.selectedFile = null;
    this.anuncioImagePreview = null;
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onSubmitAnuncio(): void {
    if (this.anuncioForm.valid) {
      if (this.editMode) {
        this.actualizarAnuncio();
      } else {
        this.crearAnuncio();
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  crearAnuncio(): void {
    if (!this.selectedFile) {
      Swal.fire('Error', 'Debe seleccionar una imagen', 'error');
      return;
    }

    const formData: AnuncioRequest = {
      nombre: this.anuncioForm.get('nombre')?.value,
      descripcion: this.anuncioForm.get('descripcion')?.value,
      posicion: this.anuncioForm.get('posicion')?.value,
      activo: this.anuncioForm.get('activo')?.value,
      imagen: this.selectedFile
    };

    this.isLoadingAnuncios = true;
    this.anuncioService.createAnuncio(formData).subscribe({
      next: (response) => {
        if (response.success) {
          Swal.fire('Éxito', ANUNCIO_CONSTANTS.SUCCESS_MESSAGES.CREATE, 'success');
          this.resetForm();
          this.cargarAnuncios();
        } else {
          Swal.fire('Error', response.message, 'error');
        }
        this.isLoadingAnuncios = false;
      },
      error: (error) => {
        console.error('Error al cargar anuncios:', error);
        Swal.fire('Error', 'Error al cargar los anuncios', 'error');
        this.isLoadingAnuncios = false;
      }
    });
  }

  actualizarAnuncio(): void {
    if (!this.selectedAnuncio) return;

    const updateData: AnuncioUpdateRequest = {
      idAnuncio: this.selectedAnuncio.idAnuncio!,
      nombre: this.anuncioForm.get('nombre')?.value,
      descripcion: this.anuncioForm.get('descripcion')?.value,
      posicion: this.anuncioForm.get('posicion')?.value,
      activo: this.anuncioForm.get('activo')?.value
    };

    if (this.selectedFile) {
      updateData.imagen = this.selectedFile;
    }

    this.isLoadingAnuncios = true;
    this.anuncioService.updateAnuncio(updateData).subscribe({
      next: (response) => {
        if (response.success) {
          Swal.fire('Éxito', ANUNCIO_CONSTANTS.SUCCESS_MESSAGES.UPDATE, 'success');
          this.resetForm();
          this.cargarAnuncios();
        } else {
          Swal.fire('Error', response.message, 'error');
        }
        this.isLoadingAnuncios = false;
      },
      error: (error) => {
        console.error('Error al crear anuncio:', error);
        Swal.fire('Error', 'Error al crear el anuncio', 'error');
        this.isLoadingAnuncios = false;
      }
    });
  }

  editarAnuncio(anuncio: AnuncioModel): void {
    this.editMode = true;
    this.selectedAnuncio = anuncio;
    
    this.anuncioForm.patchValue({
      nombre: anuncio.nombre,
      descripcion: anuncio.descripcion,
      posicion: anuncio.posicion,
      activo: anuncio.activo
    });

    this.anuncioImagePreview = anuncio.urlImagen;
  }

  eliminarAnuncio(id: number): void {
    Swal.fire({
      title: '¿Está seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.anuncioService.deleteAnuncio(id).subscribe({
          next: (response) => {
            if (response.success) {
              Swal.fire('Eliminado', 'Anuncio eliminado correctamente', 'success');
              this.cargarAnuncios();
            } else {
              Swal.fire('Error', response.message, 'error');
            }
          },
          error: (error) => {
            console.error('Error al eliminar anuncio:', error);
            Swal.fire('Error', 'Error al eliminar el anuncio', 'error');
          }
        });
      }
    });
  }

  toggleEstado(anuncio: AnuncioModel): void {
    const nuevoEstado = !anuncio.activo;
    
    this.anuncioService.toggleEstadoAnuncio(anuncio.idAnuncio!, nuevoEstado).subscribe({
      next: (response) => {
        if (response.success) {
          anuncio.activo = nuevoEstado;
          const mensaje = nuevoEstado ? 'Anuncio activado' : 'Anuncio desactivado';
          Swal.fire('Éxito', mensaje, 'success');
        } else {
          Swal.fire('Error', response.message, 'error');
        }
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
        Swal.fire('Error', 'Error al cambiar el estado del anuncio', 'error');
      }
    });
  }

  resetForm(): void {
    this.editMode = false;
    this.selectedAnuncio = null;
    this.anuncioForm.reset({
      nombre: '',
      descripcion: '',
      posicion: 1,
      activo: true
    });
    this.clearAnuncioFileSelection();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.anuncioForm.controls).forEach(key => {
      this.anuncioForm.get(key)?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.anuncioForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.anuncioForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} es requerido`;
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['maxlength']) return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
    }
    return '';
  }

  getPosicionLabel(posicion: number): string {
    const pos = this.posiciones.find(p => p.value === posicion);
    return pos ? pos.label : `Posición ${posicion}`;
  }

  getAnunciosActivos(): AnuncioModel[] {
    return this.anuncios.filter(anuncio => anuncio.activo);
  }

  trackByAnuncio(index: number, anuncio: AnuncioModel): number {
    return anuncio.idAnuncio || index;
  }

  // ==================== MÉTODOS PARA BACKGROUND DEL LOGIN ====================

  cargarLoginBackgrounds(): void {
    this.isLoadingBackground = true;
    this.anuncioService.getLoginBackgrounds().subscribe({
      next: (response) => {
        if (response.success) {
          this.loginBackgrounds = response.data;
          this.activeBackground = response.data.find(bg => bg.activo) || null;
        } else {
          Swal.fire('Error', response.message, 'error');
        }
        this.isLoadingBackground = false;
      },
      error: (error) => {
        console.error('Error al cargar backgrounds:', error);
        Swal.fire('Error', 'Error al cargar los fondos del login', 'error');
        this.isLoadingBackground = false;
      }
    });
  }

  onBackgroundFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const validation = this.anuncioService.validateLoginBackgroundFile(file);
      
      if (!validation.valid) {
        Swal.fire('Error', validation.message, 'error');
        this.clearBackgroundFileSelection();
        return;
      }

      // Mostrar recomendación si está disponible
      if (validation.recommendation) {
        Swal.fire('Información', validation.recommendation, 'info');
      }

      this.selectedBackgroundFile = file;
      
      // Crear preview de la imagen
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.backgroundImagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  clearBackgroundFileSelection(): void {
    this.selectedBackgroundFile = null;
    this.backgroundImagePreview = null;
    const fileInput = document.getElementById('backgroundFileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onSubmitBackground(): void {
    if (this.backgroundForm.valid) {
      if (this.editModeBackground) {
        this.actualizarBackground();
      } else {
        this.crearBackground();
      }
    } else {
      this.markBackgroundFormGroupTouched();
    }
  }

  crearBackground(): void {
    if (!this.selectedBackgroundFile) {
      Swal.fire('Error', 'Debe seleccionar una imagen para el fondo', 'error');
      return;
    }

    const formData: LoginBackgroundRequest = {
      nombre: this.backgroundForm.get('nombre')?.value,
      descripcion: this.backgroundForm.get('descripcion')?.value,
      imagen: this.selectedBackgroundFile
    };

    this.isLoadingBackground = true;
    this.anuncioService.createLoginBackground(formData).subscribe({
      next: (response) => {
        if (response.success) {
          Swal.fire('Éxito', 'Fondo del login creado correctamente', 'success');
          this.resetBackgroundForm();
          this.cargarLoginBackgrounds();
        } else {
          Swal.fire('Error', response.message, 'error');
        }
        this.isLoadingBackground = false;
      },
      error: (error) => {
        console.error('Error al crear background:', error);
        Swal.fire('Error', 'Error al crear el fondo del login', 'error');
        this.isLoadingBackground = false;
      }
    });
  }

  actualizarBackground(): void {
    if (!this.selectedBackground) return;

    const updateData: LoginBackgroundUpdateRequest = {
      idBackground: this.selectedBackground.idBackground!,
      nombre: this.backgroundForm.get('nombre')?.value,
      descripcion: this.backgroundForm.get('descripcion')?.value
    };

    if (this.selectedBackgroundFile) {
      updateData.imagen = this.selectedBackgroundFile;
    }

    this.isLoadingBackground = true;
    this.anuncioService.updateLoginBackground(updateData).subscribe({
      next: (response) => {
        if (response.success) {
          Swal.fire('Éxito', 'Fondo del login actualizado correctamente', 'success');
          this.resetBackgroundForm();
          this.cargarLoginBackgrounds();
        } else {
          Swal.fire('Error', response.message, 'error');
        }
        this.isLoadingBackground = false;
      },
      error: (error) => {
        console.error('Error al actualizar background:', error);
        Swal.fire('Error', 'Error al actualizar el fondo del login', 'error');
        this.isLoadingBackground = false;
      }
    });
  }

  editarBackground(background: LoginBackgroundModel): void {
    this.editModeBackground = true;
    this.selectedBackground = background;
    
    this.backgroundForm.patchValue({
      nombre: background.nombre,
      descripcion: background.descripcion
    });

    this.backgroundImagePreview = background.urlImagen;
  }

  eliminarBackground(id: number): void {
    Swal.fire({
      title: '¿Está seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.anuncioService.deleteLoginBackground(id).subscribe({
          next: (response) => {
            if (response.success) {
              Swal.fire('Eliminado', 'Fondo eliminado correctamente', 'success');
              this.cargarLoginBackgrounds();
            } else {
              Swal.fire('Error', response.message, 'error');
            }
          },
          error: (error) => {
            console.error('Error al eliminar background:', error);
            Swal.fire('Error', 'Error al eliminar el fondo', 'error');
          }
        });
      }
    });
  }

  activarBackground(id: number): void {
    this.anuncioService.activarLoginBackground(id).subscribe({
      next: (response) => {
        if (response.success) {
          Swal.fire('Éxito', 'Fondo del login activado correctamente', 'success');
          this.cargarLoginBackgrounds();
        } else {
          Swal.fire('Error', response.message, 'error');
        }
      },
      error: (error) => {
        console.error('Error al activar background:', error);
        Swal.fire('Error', 'Error al activar el fondo del login', 'error');
      }
    });
  }

  activarPatronPorDefecto(): void {
    Swal.fire({
      title: '¿Usar patrón por defecto?',
      text: 'Se desactivarán todos los fondos personalizados',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, usar patrón',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.anuncioService.desactivarLoginBackgrounds().subscribe({
          next: (response) => {
            if (response.success) {
              Swal.fire('Éxito', 'Patrón por defecto activado', 'success');
              this.cargarLoginBackgrounds();
            } else {
              Swal.fire('Error', response.message, 'error');
            }
          },
          error: (error) => {
            console.error('Error al activar patrón por defecto:', error);
            Swal.fire('Error', 'Error al activar el patrón por defecto', 'error');
          }
        });
      }
    });
  }

  resetBackgroundForm(): void {
    this.editModeBackground = false;
    this.selectedBackground = null;
    this.backgroundForm.reset({
      nombre: '',
      descripcion: ''
    });
    this.clearBackgroundFileSelection();
  }

  private markBackgroundFormGroupTouched(): void {
    Object.keys(this.backgroundForm.controls).forEach(key => {
      this.backgroundForm.get(key)?.markAsTouched();
    });
  }

  isBackgroundFieldInvalid(fieldName: string): boolean {
    const field = this.backgroundForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getBackgroundFieldError(fieldName: string): string {
    const field = this.backgroundForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} es requerido`;
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['maxlength']) return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
    }
    return '';
  }

  getActiveBackgroundPreview(): string | null {
    if (this.activeBackground) {
      return `url('${this.activeBackground.urlImagen}')`;
    }
    // Retornar null para usar la clase CSS del patrón por defecto
    return null;
  }

  trackByBackground(index: number, background: LoginBackgroundModel): number {
    return background.idBackground || index;
  }
}