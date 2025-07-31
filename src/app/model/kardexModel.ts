export class kardexModel {
	fecha:            string='';
	documento:        string='';
	cant_entrada:     number=0;
	cant_salida:      number=0;
	impunit:          number=0;
	id_materia_prima: number=0;
	observaciones:    string='';
	id_movimiento:    number=0;
	archivobase64:    string='';
	path_kardex:      string='';
	extensiondoc:     string='';
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
