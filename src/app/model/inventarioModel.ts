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

}
export class UnidadmedModel {
	observaciones:	  string='';
	id_unimed:		  number=0;
	descripcion:	  string=''
}

