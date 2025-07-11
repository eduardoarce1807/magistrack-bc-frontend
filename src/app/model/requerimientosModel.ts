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

export class ObsevacionesReqModel {
	item: string|null=null;
	observaciones:string|null=null;
	path_img:string|null=null;
}


