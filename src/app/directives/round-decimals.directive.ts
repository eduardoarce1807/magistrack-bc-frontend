import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appRoundDecimals]'
})
export class RoundDecimalsDirective {
  private readonly MAX_DECIMALS = 4;

  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event'])
  onInputChange(event: Event): void {
    const input = this.el.nativeElement;
    let value = input.value;

    // Remueve caracteres no numéricos, excepto el punto
    value = value.replace(/[^0-9.]/g, '');

    // Redondea a 4 decimales
    const numero = parseFloat(value);
    if (!isNaN(numero)) {
      const redondeado = Math.round(numero * Math.pow(10, this.MAX_DECIMALS)) / Math.pow(10, this.MAX_DECIMALS);
      input.value = redondeado.toString();
    } else {
      input.value = '';
    }

    // Actualiza el valor del modelo
    input.dispatchEvent(new Event('input'));
  }
}
