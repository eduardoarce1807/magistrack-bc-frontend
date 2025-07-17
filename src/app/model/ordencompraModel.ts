
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
}
