export class cotizacionModel {
	id_cotizacion:string|null=null;
	imptotal:number=0;
	impigv:number=0;
	fechacotizacion:string|null=null;
	idproveedor:string|null=null;
	desproveedor:string|null=null;
	id_tipo_ganador:number=0;
	destipogan:string|null=null;
	responsable:string|null=null;
	fechaganador:string|null=null;
	itecotizacion:itecotizacionModel[]=[]
}

export class itecotizacionModel {
	itemcotizacion:number=0;
	id_cotizacion:string|null=null;
	cantidad_cotizada:number=0;
	itemitereq:number=0;
	id_requerimiento:string|null=null;
	estadocoti:string|null=null;
	id_materia_prima:number=0;
	desmateriaprima:string|null=null;
	impsubtotal:number=0;
	cantidad:number=0;
	impunit:number=0;
	diasentrega:number=0;
	condicion_adicional:string|null=null;

}
