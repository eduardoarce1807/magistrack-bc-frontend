import {Directive, HostListener} from '@angular/core';
import {NgControl} from "@angular/forms";

@Directive({
  selector: '[appUppercase]',
  standalone: true
})
export class UppercaseDirective {

	constructor(private ngControl: NgControl) {}

	@HostListener("input", ["$event"]) onInput(event: InputEvent) {
		const inputElement = event.target as HTMLInputElement;
		let value = inputElement.value;
		const selectionStart = inputElement.selectionStart;
		const selectionEnd = inputElement.selectionEnd;

		// Convert the input value to uppercase
		value = value.toUpperCase();

		// Remove null characters
		const cleanValue = value.replace(/\u0000/g, "");

		// Update the form control value without emitting an event
		this.ngControl.control?.setValue(cleanValue, { emitEvent: false });

		// Restore the cursor position
		if (selectionStart !== null && selectionEnd !== null) {
			setTimeout(() => {
				inputElement.setSelectionRange(selectionStart, selectionEnd);
			}, 0);
		}
	}

}
