export class RequeremientosModel {
	codigo?: number;
	fecha: Date = new Date();
	origen: string|null=null;
	estado: string|null=null;
	totalestimado: number=0;
	motivo: string|null=null;
	detalle:DetalleReqModel[]=[]
}

export class DetalleReqModel {
	descripcion: string|null=null;
	cantidad: number=0;
	unidad:string|null=null;
	subtotal:number=0;
}
export class RequeremientossaveModel {
	id_requerimiento: string|null=null;
	glosa: string|null=null;
	fecha: string|null=null;
	estadorequerimiento:string|null=null;
	imptotal: number=0;
	impigv: number=0;
	responsable:string|null=null;
	areasolicitante:string|null=null;
	idproveedor:string|null=null;
	condicion_adicional:string|null=null;
	iterequerimiento:iterequerimientoModel[]=[]
}

export class iterequerimientoModel {
	itemitereq: number=0;
	cantidad_requerida: number=0;
	impsubtotal:number=0;
	impigv: number=0;
	id_materia_prima: number=0;
	desmateriaprima:string|null=null;
	costo_gramo: number=0;
	cantidad_cotizada_total: number=0;
	diasentrega:number=0
	condicion_adicional:string|null=null

}

export class ObsevacionesReqModel {
	item: string|null=null;
	observaciones:string|null=null;
	path_img:string|null=null;
}

export class respuestaGuardaModel{
	id_cotizacion:string|null=null;
	id_orden_compra:string|null=null;
	id_requerimiento:string|null=null;
	mensaje:string|null=null;
}

