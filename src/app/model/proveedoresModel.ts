export class proveedorModel {
	codigo?: number;
	proveedor: string|null=null;
	detalle:ListaMateriaModel[]=[]
}

export class ListaMateriaModel {
	codigo: string|null=null;
	descripcion: string|null=null;
	unidad:string|null=null;
	subtotal:number=0;
}
