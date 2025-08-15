import {Component, ViewEncapsulation} from '@angular/core';
import {KardexService} from "../../../services/inventario/kardex.service";
import {ActivatedRoute} from "@angular/router";
import {kardexModel} from "../../../model/kardexModel";
import {BadgeModule} from "primeng/badge";
import {Button} from "primeng/button";
import {CargaComponent} from "../../../components/carga/carga.component";
import {IconFieldModule} from "primeng/iconfield";
import {InputIconModule} from "primeng/inputicon";
import {InputTextModule} from "primeng/inputtext";
import {MessageService, PrimeTemplate} from "primeng/api";
import {Table, TableModule} from "primeng/table";
import {TagModule} from "primeng/tag";
import {ToastModule} from "primeng/toast";
import {TooltipModule} from "primeng/tooltip";
import {CommonModule, DatePipe} from "@angular/common";
import {SliderModule} from "primeng/slider";
import {FormsModule} from "@angular/forms";
import {DropdownModule} from "primeng/dropdown";

@Component({
  selector: 'app-kardex-producto',
  standalone: true,
    imports: [
        BadgeModule,
        Button,
        CargaComponent,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        PrimeTemplate,
        TableModule,
        TagModule,
        ToastModule,
        TooltipModule,
        DatePipe,
        SliderModule,
        CommonModule,
        FormsModule,
        DropdownModule
    ],
  templateUrl: './kardex-producto.component.html',
  styleUrl: './kardex-producto.component.scss',
	providers: [MessageService],
	encapsulation: ViewEncapsulation.None,
})
export class KardexProductoComponent {

	id_materia_prima:number=0

	activityValuesEntrada: number[] = [0, 9999];
	activityValuesSalida: number[] = [0, 9999];
	activityValuesActual: number[] = [0, 9999];
	listaKardex:kardexModel[]=[]
	tipoPresentacion:any=[{
		id_presentacion:1,
		presentacion:'Resumen'
	},{
		id_presentacion:2,
		presentacion:'Detallado'
	}]
	cambio_pres:number=1
	spinner:boolean=false
	constructor(private kardexService:KardexService,
				private route: ActivatedRoute) {
	}
	ngOnInit(){
		this.spinner=true
		this.id_materia_prima= Number(this.route.snapshot.paramMap.get('id_materia_prima'));
		this.kardexService.getKardexMateriaPrima(this.id_materia_prima).subscribe({
			next:(data)=>{
				this.spinner=false
				this.listaKardex=data.data
			},error:(err)=>{
				this.spinner=false
			}
		})
	}
	clear(table: Table) {
		table.clear(); // o lo que sea necesario
	}
	getSeverity(estado: string | null | undefined): "success" | "info" | "warning" | "danger" | "secondary" | "contrast" | undefined {
		if (!estado) return undefined;

		switch (estado.toUpperCase()) {
			case 'GENERAR REQUERIMIENTO': return 'danger';
			case 'REQUIERE REPOSICIÓN': return 'warning';
			case 'STOCK SUFICIENTE': return 'success';
			default: return 'secondary';         // Gray (fallback)
		}
	}

	cambiopresentacion(){

	}
}
