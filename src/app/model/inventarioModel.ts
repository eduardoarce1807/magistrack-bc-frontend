export class MateriaprimaModel {
	id_materia_prima: number=0;
	nombre:           string='';
	costo_gramo:      number=0;
	stock_materia:    number=0;
	stock_referencia: number=0;
	umbral_min:       number=0;
	abreviado:		  string='';
	observaciones:	  string='';
	id_unimed:		  number=0;
	id_requerimiento_stock:		  string='';
	estadorequerimiento:string=''
	id_fabricante:number=1;
	id_tipomovimiento: string='';
	ficha_tecnica:     string='';
	fecha_vencimiento: string='';
	pureza:            number=0;
	lote:              string='';
	peso_bruto:        number=0;
	peso_neto:         number=0;
	id_tipomateria:	number=0;

}
export class UnidadmedModel {
	observaciones:	  string='';
	id_unimed:		  number=1;
	descripcion:	  string=''
}
export class FabricanteModel {
	id_fabricante:		  number=1;
	fabricante:	  string=''
}

export class TipomateriaModel {
	id_tipomateria:		  number=1;
	tipomateria:	  string=''
}
