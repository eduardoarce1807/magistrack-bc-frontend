export class proveedorModel {
	codigo?: number;
	descripcion: string|null=null;
	representante: string|null=null;
	celular: string|null=null;
	correo: string|null=null;
	ruc: string|null=null;
	direccion: string|null=null;
	detalle:ListaMateriaModel[]=[]
}

export class ListaMateriaModel {
	codigo: string|null=null;
	descripcion: string|null=null;
	unidad:string|null=null;
	subtotal:number=0;
}
