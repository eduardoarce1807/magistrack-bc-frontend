import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'googleDriveImage',
  standalone: true
})
export class GoogleDriveImagePipe implements PipeTransform {
  
  transform(driveUrl: string): string {
    if (!driveUrl) return '';
    
    // Si ya es una URL directa, retornarla
    if (driveUrl.includes('uc?id=') && driveUrl.includes('export=view')) {
      return driveUrl;
    }
    
    // Extraer File ID de diferentes formatos de URL de Google Drive
    const fileId = this.extractFileId(driveUrl);
    
    if (fileId) {
      // Retornar URL directa para mostrar imagen
      return `https://drive.google.com/uc?id=${fileId}&export=view`;
    }
    
    // Si no se puede extraer el ID, retornar la URL original
    return driveUrl;
  }
  
  private extractFileId(url: string): string | null {
    if (!url) return null;
    
    // Patrones comunes de URLs de Google Drive
    const patterns = [
      /[?&]id=([a-zA-Z0-9-_]+)/,              // ?id=FILE_ID o &id=FILE_ID
      /\/file\/d\/([a-zA-Z0-9-_]+)\//,         // /file/d/FILE_ID/
      /\/open\?id=([a-zA-Z0-9-_]+)/,          // /open?id=FILE_ID
      /drive\.google\.com\/.*\/([a-zA-Z0-9-_]+)/, // Cualquier ID en drive.google.com
      /^([a-zA-Z0-9-_]+)$/                    // Solo el ID (si es que se pasa directo)
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }
}