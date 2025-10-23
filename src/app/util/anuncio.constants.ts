// Constantes para el gestor de anuncios

export const ANUNCIO_CONSTANTS = {
  // Validaciones de archivo
  MAX_FILE_SIZE: 4 * 1024 * 1024, // 4MB en bytes
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/jpg', 'image/png'],
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/jpg', 'image/png'],
  
  // Posiciones disponibles
  POSICIONES: [
    { value: 1, label: 'Sección 1 (Superior Izquierda)', description: 'Zona principal superior izquierda' },
    { value: 2, label: 'Sección 2 (Superior Derecha)', description: 'Zona principal superior derecha' },
    { value: 3, label: 'Sección 3 (Inferior Izquierda)', description: 'Zona secundaria inferior izquierda' },
    { value: 4, label: 'Sección 4 (Inferior Derecha)', description: 'Zona secundaria inferior derecha' }
  ],
  
  // Límites de campos
  NOMBRE_MIN_LENGTH: 3,
  NOMBRE_MAX_LENGTH: 50,
  DESCRIPCION_MAX_LENGTH: 200,
  
  // Mensajes de error
  ERROR_MESSAGES: {
    FILE_TYPE: 'Solo se permiten archivos JPG, JPEG y PNG',
    FILE_SIZE: 'El archivo no debe superar los 4MB',
    FILE_REQUIRED: 'Debe seleccionar una imagen',
    NOMBRE_REQUIRED: 'El nombre es requerido',
    NOMBRE_MIN_LENGTH: `Mínimo ${3} caracteres`,
    NOMBRE_MAX_LENGTH: `Máximo ${50} caracteres`,
    DESCRIPCION_MAX_LENGTH: `Máximo ${200} caracteres`,
    POSICION_REQUIRED: 'Debe seleccionar una posición'
  },
  
  // Mensajes de éxito
  SUCCESS_MESSAGES: {
    CREATE: 'Anuncio creado correctamente',
    UPDATE: 'Anuncio actualizado correctamente',
    DELETE: 'Anuncio eliminado correctamente',
    STATUS_CHANGE: 'Estado del anuncio actualizado',
    POSITION_CHANGE: 'Posición del anuncio actualizada'
  },
  
  // Configuración de UI
  IMAGE_PREVIEW_MAX_HEIGHT: '200px',
  LOADING_TIMEOUT: 30000, // 30 segundos
  
  // Roles permitidos
  ALLOWED_ROLES: [1] // Solo administradores
};

export const ANUNCIO_VALIDATION_PATTERNS = {
  NOMBRE: /^[a-zA-Z0-9\sáéíóúüñÁÉÍÓÚÜÑ\-_.]{3,50}$/,
  DESCRIPCION: /^[a-zA-Z0-9\sáéíóúüñÁÉÍÓÚÜÑ\-_.,!?()]{0,200}$/
};

export const ANUNCIO_CSS_CLASSES = {
  CARD_HOVER: 'anuncio-card-hover',
  IMAGE_LOADING: 'anuncio-image-loading',
  FORM_INVALID: 'anuncio-form-invalid',
  PREVIEW_CONTAINER: 'anuncio-preview-container'
};