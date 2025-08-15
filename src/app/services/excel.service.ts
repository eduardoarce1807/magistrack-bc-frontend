import { Injectable } from "@angular/core";
import { CellErrorValue, CellFormulaValue, CellHyperlinkValue, CellRichTextValue, CellSharedFormulaValue,
	ImagePosition,
	Workbook,
	Worksheet
} from "exceljs";
import * as fs from "file-saver";
import {DatePipe} from "@angular/common";

@Injectable({
	providedIn: "root",
})
export class ExcelService {
	private _workbook!: Workbook;
	cabecera: any[] = [];
	_codusu: any;
	imagePath: string = "";
	fecha_hoy: Date = new Date();

	constructor(
		private datePipe: DatePipe
	) {
		this.loadImageFromAssets('assets/img/bella-curet-logotipo.png').then((base64) => {
			this.imagePath = base64;
		});
	}

	formatDatesInData(data: any[]): any[] {
		return data.map((item) => {
			const formattedItem = {...item};

			Object.keys(formattedItem).forEach((key) => {
				const value = formattedItem[key];
				if (
					typeof value === "string" &&
					value.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)
				) {
					// Formato con hora y segundos
					formattedItem[key] = this.datePipe.transform(
						value,
						"dd/MM/yyyy HH:mm:ss"
					);
				} else if (
					typeof value === "string" &&
					value.match(/^\d{4}-\d{2}-\d{2}$/)
				) {
					// Solo fecha
					formattedItem[key] = this.datePipe.transform(value, "dd/MM/yyyy");
				}
			});

			return formattedItem;
		});
	}

	formatDatesInArray(data: string[]): string[] {
		return data.map((item) => {
			return item.replace(/\d{4}-\d{2}-\d{2}/g, (match) => {
				return this.datePipe.transform(match, "dd/MM/yyyy") || match;
			});
		});
	}

	async downloadExcel(
		data: any,
		cabecera: any,
		campos: any,
		titulo: any,
		ancho: any,
		subcabecera: any,
		nombre: any,
		sumarcampos: any,
	) {
		this._workbook = new Workbook();
		this._workbook.creator = "Sysco";
		//const ancho1 = this.calcularAnchoColumnasAutomaticas(data, campos);
		let data1 = this.formatDatesInData(data);
		let subcabecera1 = this.formatDatesInArray(subcabecera);
		// console.log(subcabecera, "subcabecera1");
		await this.crearTabla(
			data1,
			cabecera,
			campos,
			titulo,
			ancho,
			subcabecera1,
			sumarcampos
		);
		this.fecha_hoy = new Date();
		//this._workbook.addWorksheet('solicitud');//agregar hojas
		this._workbook.xlsx.writeBuffer().then((data) => {
			const blob = new Blob([data]);
			fs.saveAs(
				blob,
				nombre +
				this.getFormattedDate(this.fecha_hoy) +
				this.getFormattedTimemin(this.fecha_hoy) +
				".xlsx"
			); //se DEBE REEMPLAZAR EL NOMBRE DEL EXCEL
		});
	}

	private async crearTabla(
		data: any,
		cabecera: any,
		campos: any,
		titulo: any,
		ancho: any,
		subcabecera: any,
		sumarcampos: any,
	) {
		// console.log(data.length, "cantidad de arreglo");
		// console.log(data, "cantidad de arreglo");
		const sheet = this._workbook.addWorksheet("Sysco");
		ancho.forEach((e: number | undefined, index: number) => {
			sheet.getColumn(index + 2).width = e;
		});
		sheet.columns.forEach((column) => {
			column.alignment = {
				vertical: "middle",
				wrapText: true, //texto en el centro y que baje
			};
		});
		this._paintCells(sheet, data, campos);

		const logo = this._workbook.addImage({
			base64: this.imagePath, //export la base 64
			extension: "png",
		});

		const position: ImagePosition = {
			tl: {col: 1.15, row: 1.3}, //padding top-left
			ext: {width: 140, height: 140},
		};
		sheet.addImage(logo, position);

		// Definir la posición inicial y el número de celdas a unir
		const startCell = "C4";
		const startColumn = 3; // 'C' es la tercera columna
		const endColumn = startColumn + cabecera.length - 3; // Ajustar el rango

		// Definir el rango de filas para la unión
		const startRow = 4;
		const endRow = startRow + 1; // Unir hasta tres filas a partir de la fila 5

		// Aplicar el título en la celda inicial
		const titleCell = sheet.getCell(startCell);
		titleCell.value = titulo; // Cambia esto al título que necesitas
		titleCell.font = {bold: true, size: 18};

		// Unir celdas desde C5 hasta el rango calculado
		sheet.mergeCells(startRow, startColumn, endRow, endColumn);

		// Aplicar formato a las celdas unidas
		const mergedCellRange = sheet.getCell(startRow, startColumn);
		mergedCellRange.alignment = {horizontal: "center", vertical: "middle"};

		// Acceso a celdas usando índices numéricos
		const parametro1CellIndex = sheet.getCell(1, cabecera.length - 1); // F = 6
		parametro1CellIndex.value = "Fecha";
		parametro1CellIndex.font = {
			bold: true,
			size: 12,
			color: {argb: "000000"},
		};

		const campo1CellIndex = sheet.getCell(1, cabecera.length);
		campo1CellIndex.value = String(
			this.datePipe.transform(this.fecha_hoy, "dd/MM/yyyy HH:mm:ss")
		);
		campo1CellIndex.font = {
			size: 12,
			color: {argb: "000000"},
		};

		const parametro2CellIndex = sheet.getCell(2, cabecera.length - 1);
		parametro2CellIndex.value = "Hora";
		parametro2CellIndex.font = {
			bold: true,
			size: 12,
		};

		const campo2CellIndex = sheet.getCell(2, cabecera.length);
		campo2CellIndex.value = this.getFormattedTime(this.fecha_hoy);
		campo2CellIndex.font = {
			size: 12,
		};

		const parametro3CellIndex = sheet.getCell(3, cabecera.length);
		parametro3CellIndex.value = this._codusu;
		parametro3CellIndex.font = {
			bold: true,
			size: 12,
		};

		let celdainicio: number = 0;
		const headerRow = sheet.getRow(11);
		headerRow.values = cabecera;
		if (cabecera.length % 2 === 0) {
			celdainicio = (cabecera.length - 1) / 2 - 2;
		} else {
			celdainicio = Math.floor((cabecera.length - 1) / 2) - 3;
		}
		celdainicio < 0 ? (celdainicio = 1) : null;
		// Llena las celdas basándose en la longitud de la cabecera
		// console.log(cabecera,campos,campos.length)
		subcabecera.forEach((e: string | number | boolean | Date | CellErrorValue | CellRichTextValue | CellHyperlinkValue | CellFormulaValue | CellSharedFormulaValue | null | undefined, index: number) => {
			// Determina el número de columnas por fila basado en la longitud de la cabecera
			let columnsPerRow = cabecera.length % 2 == 0 ? 4 : 5;

			// Determina la columna de inicio
			const startCol = Math.floor(celdainicio + (index % columnsPerRow));
			// const startCol = campos.length <= 6 ? 1 : Math.floor(celdainicio + (index % columnsPerRow));
			// Determina la fila basada en el índice y el número de columnas por fila
			let row = 6 + Math.floor(index / columnsPerRow);
			// console.log(`Index: ${index}, ColumnsPerRow: ${columnsPerRow}, StartCol: ${startCol}, Row: ${row}`);
			// Asigna el valor en la celda correspondiente
			const cellsubcabecera = sheet.getCell(row + 1, startCol + 1);
			cellsubcabecera.value = e;
			cellsubcabecera.font = {
				bold: true,
				size: 10,
			};
		});
		cabecera.shift();
		cabecera.forEach((_: any, index: number) => {
			const cell = sheet.getCell(11, index + 2); // fila 11, columna index + 2 (B=2, C=3, etc.)
			cell.font = {
				bold: true,
				size: 12,
				color: { argb: "FFFFFFFF" }, // blanco
			};
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "095279" }, // color de fondo azul oscuro
			};
		});
		// let valor:number=0
		let valor: number = data.length == 1 ? 1 : data.length;
		// data.length==1?valor=2:valor=data.length
		const rowsToInsert = sheet.getRows(12, valor)!; //todas las filas de la data
		for (let index = 0; index < rowsToInsert.length; index++) {
			const itemData = data[index];
			const row = rowsToInsert[index];
			let arreglo: any[] = [];

			// Iterar sobre los nombres de las propiedades y agregar los valores correspondientes
			for (let index = 0; index < campos.length; index++) {
				const campo = campos[index];
				if (itemData[campo] == null) {
					itemData[campo] = "";
				}
				arreglo.push(itemData[campo]);
			}
			row.values = arreglo;
		}

		const lastRowNumber = 11 + valor; // La fila final es la fila del encabezado más la cantidad de datos
		const totalsRow = sheet.getRow(lastRowNumber + 1);
		// Itera sobre cada columnaca
		campos.forEach((_: any, index: number) => {
			if (sumarcampos[index] === 1) {
				const columnValues = data.map((item: { [x: string]: any; }) => item[campos[index]] || 0);
				const total = columnValues.reduce(
					(sum: number, value: any) => sum + (typeof value === "number" ? value : 0),
					0
				);
				totalsRow.getCell(index + 1).value = total;
				totalsRow.getCell(index + 1).font = { bold: true };
			}
		});

		campos.forEach((_: any, index: number) => {
			for (let rowNumber = 11; rowNumber <= lastRowNumber; rowNumber++) {
				const cell = sheet.getCell(rowNumber, index + 2);
				cell.border = {
					top:
						rowNumber === 11
							? { style: "thin", color: { argb: "000000" } }
							: undefined, // Borde superior solo para la fila del encabezado
					left: { style: "thin", color: { argb: "000000" } },
					bottom: { style: "thin", color: { argb: "000000" } },
					right: { style: "thin", color: { argb: "000000" } },
				};
			}
		});
		// Aplicar bordes a la columna A
		for (let rowNumber = 11; rowNumber <= lastRowNumber; rowNumber++) {
			const primeracell = sheet.getCell(rowNumber, 1);
			primeracell.border = {
				top:
					rowNumber === 11
						? { style: "thin", color: { argb: "ffffff" } }
						: undefined,
				left: { style: "thin", color: { argb: "ffffff" } },
				bottom: { style: "thin", color: { argb: "ffffff" } },
				right: { style: "thin", color: { argb: "ffffff" } },
			};
		}

		// Aplicar bordes a la última columna
		for (let rowNumber = 11; rowNumber <= lastRowNumber; rowNumber++) {
			const ultimacell = sheet.getCell(rowNumber, campos.length + 1);
			ultimacell.border = {
				top:
					rowNumber === 11
						? { style: "thin", color: { argb: "ffffff" } }
						: undefined,
				left: { style: "thin", color: { argb: "ffffff" } },
				bottom: { style: "thin", color: { argb: "ffffff" } },
				right: { style: "thin", color: { argb: "ffffff" } },
			};
		}

		for (let colNumber = 1; colNumber <= campos.length + 2; colNumber++) {
			const cell = sheet.getCell(lastRowNumber + 1, colNumber);
			cell.border = {
				top: { style: "thin", color: { argb: "ffffff" } },
				left: { style: "thin", color: { argb: "ffffff" } },
				bottom: { style: "thin", color: { argb: "ffffff" } },
				right: { style: "thin", color: { argb: "ffffff" } },
			};
		}
	}

	private _paintCells(sheet: Worksheet, data: string | any[], campos: any[]) {
		let valor: number = 0;
		data.length == 1 ? (valor = 2) : (valor = data.length);
		const lastRowNumber = 10 + valor; // La fila final es la fila del encabezado más la cantidad de datos

		// Itera sobre cada columna
		// campos.shift()
		campos.forEach((_, index) => {
			for (let rowNumber = 0; rowNumber <= lastRowNumber; rowNumber++) {
				const cell = sheet.getCell(rowNumber, index + 2);
				cell.fill = {
					type: `pattern`,
					pattern: `solid`,
					fgColor: { argb: `ffffff` },
				};
				let primeracell = sheet.getCell(rowNumber, 1);
				primeracell.fill = {
					type: `pattern`,
					pattern: `solid`,
					fgColor: { argb: `ffffff` },
				};
				let ultimacell = sheet.getCell(rowNumber, campos.length + 1);
				ultimacell.fill = {
					type: `pattern`,
					pattern: `solid`,
					fgColor: { argb: `ffffff` },
				};
			}
		});
	}

	// Método para obtener la fecha en formato YYYY-MM-DD
	getFormattedDate(date: Date): string {
		const year = date.getFullYear();
		const month = ("0" + (date.getMonth() + 1)).slice(-2); // Los meses están en 0-11, por lo que se suma 1
		const day = ("0" + date.getDate()).slice(-2);
		return `${year}-${month}-${day}`;
	}

	// Método para obtener la hora en formato HH:mm
	getFormattedTime(date: Date): string {
		const hours = ("0" + date.getHours()).slice(-2);
		const minutes = ("0" + date.getMinutes()).slice(-2);
		return `${hours}:${minutes}`;
	}

	getFormattedTimemin(date: Date): string {
		const hours = ("0" + date.getHours()).slice(-2); // Obtiene las horas con dos dígitos
		const minutes = ("0" + date.getMinutes()).slice(-2); // Obtiene los minutos con dos dígitos
		const seconds = ("0" + date.getSeconds()).slice(-2); // Obtiene los segundos con dos dígitos
		return `${hours}:${minutes}:${seconds}`; // Devuelve el formato HH:mm:ss
	}

	calcularAnchoColumnasAutomaticas(
		datos: any[],
		campos: string[],
		margen: number = 3
	): number[] {
		return campos.map((campo) => {
			// Obtiene la longitud más larga entre el nombre del campo y los valores
			let maxLength = Math.max(
				campo.length,
				...datos.map((item) =>
					item[campo] ? item[campo].toString().length : 0
				)
			);

			// Aplica factores de ajuste para evitar columnas muy angostas
			let anchoFinal = maxLength * 1.4 + margen; // Ajuste dinámico

			// Define un rango de valores mínimos y máximos
			return Math.max(12, Math.min(anchoFinal, 400)); // Mínimo 12, máximo 40
		});
	}

	exportarCSV(data: any[], cabecera: string[], nombre: string): void {
		if (!data.length) {
			console.warn("No hay datos para exportar");
			return;
		}

		// Crear las líneas del CSV
		const filas = [
			cabecera.join(";"), // encabezado
			...data.map((item) =>
				cabecera.map((campo) => `"${item[campo] ?? ""}"`).join(";")
			),
		];

		const contenido = filas.join("\n");
		const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });

		// const nombreArchivo =
		//   nombre +
		//   this.getFormattedDate(this.fecha_hoy) +
		//   this.getFormattedTimemin(this.fecha_hoy) +
		//   ".DBF";

		const nombreArchivo = nombre + ".csv";

		const link = document.createElement("a");
		const url = URL.createObjectURL(blob);
		link.href = url;
		link.setAttribute("download", nombreArchivo);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
	private loadImageFromAssets(path: string): Promise<string> {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.onload = function () {
				const reader = new FileReader();
				reader.onloadend = function () {
					resolve(reader.result as string);
				};
				reader.onerror = reject;
				reader.readAsDataURL(xhr.response);
			};
			xhr.onerror = reject;
			xhr.open('GET', path);
			xhr.responseType = 'blob';
			xhr.send();
		});
	}
}
