export interface BulkModel {
    idBulk: string;
    tipoBulk: string;
    nombreItem: string;
    descripcionItem: string;
    totalPresentacion: number;
    tipoPresentacion: string;
    idEstadoProducto: number;
    estadoProducto: string;
    fechaCreacion: string;
    idProductoMaestro?: number;
    idPreparadoMagistral?: string;
    phDefinidoMin?: number;
    phDefinidoMax?: number;
    idUsuarioAsignado?: number;
    nombreUsuarioAsignado?: string;
    rolUsuarioAsignado?: string;
}