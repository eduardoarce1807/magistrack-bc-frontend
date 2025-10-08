export class kardexModel {
	fecha:            string='';
	documento:        string='';
	cant_entrada:     number=0;
	cant_salida:      number=0;
	cant_actual:	  number=0;
	impunit:          number=0;
	id_materia_prima:string='';
	observaciones:    string='';
	id_movimiento:    number=0;
	archivobase64:    string='';
	path_kardex:      string='';
	extensiondoc:     string='';
	ficha_tecnica:     string='';
	fecha_vencimiento: any='';
	pureza:            number=0;
	lote:              string='';
	peso_bruto:        number=0;
	peso_neto:         number=0;
	impsubtotalentrada:number=0;
	impsubtotalsalida:number=0
}
export class TipomovimientoModel {
	id_tipomovimiento: string='';
	descripcion:           string='';
}
export class MovimientoModel {
	id_tipomovimiento: string='';
	movimiento:           string='';
	id_movimiento:      number=0;
}
export class movimientoKardexTipo {
	idproveedor:string|null=null
	fechainicial:string|null=null
	fechafinal:string|null=null
	id_tipomateria:number=0;
}
export class kardexPeriodo {
	fechainicial:string|null=null
	fechafinal:string|null=null
}
