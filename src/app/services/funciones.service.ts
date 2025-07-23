import { Injectable } from '@angular/core';
import {DatePipe} from "@angular/common";

@Injectable({
  providedIn: 'root'
})
export class FuncionesService {

	constructor(private datePipe: DatePipe) {

	}
	convertir_de_bool_a_numero(valor: any): number {
		return valor == true ? 1 : 0;
	}



	convetir_de_fecha_y_hora_a_string(fecha: string): string | null {
		if (fecha) {
			let valorfecha = this.datePipe.transform(
				new Date(fecha),
				"yyyy-MM-dd HH:mm"
			);
			return valorfecha;
		} else {
			return null;
		}
	}
	convetir_de_fecha_y_hora_a_string_d_m_a(fecha: string): string | null {
		if (fecha) {
			let valorfecha = this.datePipe.transform(
				new Date(fecha),
				"dd-MM-yyyy HH:mm"
			);
			return valorfecha;
		} else {
			return null;
		}
	}

	convertir_de_horas_a_string(fecha: string): string | null {
		if (fecha) {
			let valorhora = this.datePipe.transform(new Date(fecha), "HH:mm");
			return valorhora;
		} else {
			return null;
		}
	}

	convertir_de_string_a_date(valor: any): any {
		if (valor != null) {
			return (valor = new Date(valor));
		} else {
			return valor;
		}
	}


	roundTo(value: number, args: number): number {
		const factor = 10 ** args;
		return Math.round(value * factor) / factor;
	}
	redondearConPrecision(numero: number, precision: number): number {
		let factor = Math.pow(10, precision);
		let redondeado = Math.round(numero * factor) / factor;
		return redondeado;
	}

	redondearCortado(numero: number, precision: number): number {
		let factor = Math.pow(10, precision);
		let redondeado = Math.trunc(numero * factor) / factor;
		return redondeado;
	}

	convetir_de_date_a_string(fecha: Date): string | null {
		if (fecha) {
			let valorfecha = this.datePipe.transform(
				new Date(fecha),
				"yyyy-MM-dd HH:mm:ss"
			);
			return valorfecha;
		} else {
			return null;
		}
	}
	convetir_de_date_a_string_fecha(fecha: Date): string | null {
		if (fecha) {
			let valorfecha = this.datePipe.transform(
				new Date(fecha),
				"yyyy-MM-dd"
			);
			return valorfecha;
		} else {
			return null;
		}
	}
}
