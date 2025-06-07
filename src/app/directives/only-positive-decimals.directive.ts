import { Directive, HostListener, Input, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appOnlyPositiveDecimal]',
  standalone: true
})
export class OnlyPositiveDecimalDirective {
  private control = inject(NgControl);

  @HostListener('input', ['$event'])
  onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Solo números con decimales
    const regex = /^\d{0,3}(\.\d{0,2})?$/;

    if (!regex.test(value)) {
      // Revertir al valor anterior válido si hay un error
      value = value.slice(0, -1);
    }

    let numValue = parseFloat(value);

    // Validación de rango
    if (isNaN(numValue) || numValue < 0.01 || numValue > 100) {
      value = '';
      numValue = NaN;
    }

    input.value = value;
    this.control.control?.setValue(value ? parseFloat(value).toFixed(2) : '');
  }
}
