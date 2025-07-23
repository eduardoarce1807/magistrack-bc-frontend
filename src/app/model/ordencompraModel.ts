
export class ordencompraModel {
	id_orden_compra:  string='';
	responsable:      string='';
	fechaemision:     string='';
	imptotal:         number=0;
	imptotalfact:     number=0;
	imppagado:        number=0;
	path_firma:       string='';
	estadoord:        string='';
	nrofactura:       string='';
	fechaemisionfact: string='';
	path_factura:     string='';
	estadofact:       string='';
	fecha_pago:		  string='';
	metodo_pago:		  string='';
	nrooperacion:     number=0
	detalleorden:     Detalleorden[]=[];
}

export class Detalleorden {
	item:            number=0;
	itemcotizacion:  number=0;
	cant_total_conf: number=0;
	id_conformidad:  number=0;
	id_validacion:   number=0;
	cantidad:        number=0;
	id_orden_compra: string='';
	estadoconf:      string='';
	estadoval:       string='';
	desmateria:      string='';
	id_proveedor:    string='';
	impsubtotal:     number=0;
	cantidad_conf_total:number=0;
	ph:number=0
	observaciones:string=''
	cumple:number=0
	switchcumple:boolean=false
	impunit:number=0
	respuestaprov:	  string=''
	path_respuesta:   string=''
}
export class ValidacionOrden {
	cumple: number=0;
	id_orden_compra:string=''
	ph:number|null=null
	observaciones:string|null=null
	item:number=0
}
export class FacturaOrden {
	nrofactura:string|null=null
	fechaemisionfact:string|null=null
	imptotalfact: number=0;
	archivobase64:string|null=null
	path_factura:string|null=null
	extensiondoc:string|null=null
}
export class respuestaFacturaModel{
	id_orden_compra:string|null=null
	nrofactura:string|null=null
	path_factura:string|null=null
}
