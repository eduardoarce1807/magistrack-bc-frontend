export class proveedorModel {
	idproveedor:string|null=null;
	descripcion: string|null=null;
	representante: string|null=null;
	celular: string|null=null;
	correo: string|null=null;
	ruc: string|null=null;
	direccion: string|null=null;
	id_banco: number=0
	id_rubros:number=0
	desbanco: string|null=null;
	desrubro: string|null=null;
	cuenta_soles: string|null=null;
	cuenta_dolares: string|null=null;
	cci: string|null=null;
	detalle:ListaMateriaModel[]=[]
}

export class ListaMateriaModel {
	abreviado:string=''
	id_materia_prima:number=0;
	nombre: string|null=null;
	costo_gramo:number=0;
	stock_materia:number=0;
	stock_referencia:number=0;
	idFabricante:number=0;
	fabricante:string|null=null;


}
export class soloproveedorModel {
	idproveedor:string|null=null;
	descripcion: string|null=null;
	representante: string|null=null;
	celular: string|null=null;
	correo: string|null=null;
	ruc: string|null=null;
	direccion: string|null=null;
	id_banco: number=1
	id_rubros:number=1
	desbanco: string|null=null;
	desrubro: string|null=null;
	cuenta_soles: string|null=null;
	cuenta_dolares: string|null=null;
	cci: string|null=null;
}

export class materiaxproveedorModel {
	id_materia_prima:number=0;
	id_proveedor: string|null=null;
	precio_prov:number=0;
	estado:string|null=null;

}
export class rubrosproveedorModel {
	id_rubros:number=0
	rubro: string|null=null;
}
