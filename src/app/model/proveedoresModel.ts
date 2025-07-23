export class proveedorModel {
	idproveedor:string|null=null;
	descripcion: string|null=null;
	representante: string|null=null;
	celular: string|null=null;
	correo: string|null=null;
	ruc: string|null=null;
	direccion: string|null=null;
	detalle:ListaMateriaModel[]=[]
}

export class ListaMateriaModel {
	id_materia_prima:number=0;
	nombre: string|null=null;
	costo_gramo:number=0;
	stock_materia:number=0;
	stock_referencia:number=0;

}
export class soloproveedorModel {
	idproveedor:string|null=null;
	descripcion: string|null=null;
	representante: string|null=null;
	celular: string|null=null;
	correo: string|null=null;
	ruc: string|null=null;
	direccion: string|null=null;
}

export class materiaxproveedorModel {
	id_materia_prima:number=0;
	id_proveedor: string|null=null;
	precio_prov:number=0;
	estado:string|null=null;

}
