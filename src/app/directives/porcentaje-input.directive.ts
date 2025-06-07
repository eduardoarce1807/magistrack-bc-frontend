import { Directive, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Directive({
  selector: '[appPorcentajeInput]',
  standalone: true,
})
export class PorcentajeInputDirective {
    @Input('appPorcentajeMax') porcentajeMax: number = 100; // Por defecto 100%
  @Output() porcentajeChange = new EventEmitter<number | undefined>();

  private lastValidValue: string = '';

  constructor(private el: ElementRef<HTMLInputElement>) {}

  @HostListener('input', ['$event.target.value'])
  onInput(value: string) {
    // Permitir que el campo esté vacío (no emite nada aún)
    if (value.trim() === '') {
      this.lastValidValue = '';
      this.porcentajeChange.emit(undefined);
      return;
    }

    // Limpiar caracteres inválidos
    value = value.replace(/[^0-9.]/g, '');

    // Evitar más de un punto decimal
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }

    // Validar número sin forzar decimales aún
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      // No forzamos rango ni decimales aquí
      this.lastValidValue = value;
    } else {
      value = this.lastValidValue;
    }

    this.el.nativeElement.value = value;
  }

  @HostListener('blur')
  onBlur() {
    const input = this.el.nativeElement;
    let value = input.value;

    if (value.trim() === '') {
      this.lastValidValue = '';
      this.porcentajeChange.emit(undefined);
      return;
    }

    let numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      input.value = this.lastValidValue;
      return;
    }

    // Aplicar validaciones en blur
    if (numericValue < 0.01) numericValue = 0.01;
    if (numericValue > this.porcentajeMax) numericValue = this.porcentajeMax;

    // Formatear con 2 decimales
    const formatted = numericValue.toFixed(2);

    // Limitar longitud según parte entera
    const integerLength = Math.trunc(numericValue).toString().length;
    let maxLength = 4;
    if (integerLength === 2) maxLength = 5;
    if (integerLength === 3) maxLength = 6;

    const finalValue = formatted.slice(0, maxLength);

    input.value = finalValue;
    this.lastValidValue = finalValue;

    // Emitir el porcentaje como decimal (por ejemplo, 4.00 → 0.04)
    this.porcentajeChange.emit(Number((parseFloat(finalValue) / 100).toFixed(4)));
  }
}
