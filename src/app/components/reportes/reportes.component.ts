import {Component, ElementRef, HostListener, ViewChild} from '@angular/core';
import {ToastModule} from "primeng/toast";
import {CargaComponent} from "../carga/carga.component";
import {DomSanitizer, SafeResourceUrl} from "@angular/platform-browser";
import {DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";
import {ReportesService} from "../../services/reportes.service";
import {MessageService} from "primeng/api";

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [ToastModule,CargaComponent],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss',
  providers:[MessageService]
})
export class ReportesComponent {
	carga:number=1

	@ViewChild("iframeRef") iframeRef?: ElementRef<HTMLIFrameElement>;
	urlSafe: SafeResourceUrl| null = null;
	constructor(
		private sanitizer: DomSanitizer,
		private config: DynamicDialogConfig,
		public ref: DynamicDialogRef,
		private reportesService:ReportesService,
		private messageService:MessageService) {
	}
	imprimirIframe(iframe: HTMLIFrameElement) {
		try {
			const win = iframe.contentWindow;
			win?.focus();
			win?.print();
		} catch (e) {
			console.error("No se pudo imprimir el iframe", e);
		}
	}
	@HostListener("window:keydown", ["$event"])
	handleKeyboardEvent(event: KeyboardEvent) {
		// Verifica Ctrl + N
		if (event.key === "Enter" && event.ctrlKey) {
			const iframe = this.iframeRef?.nativeElement;
			if (iframe) {
				this.imprimirIframe(iframe);
				event.preventDefault(); // <- evita el comportamiento por defecto del navegador
			} else {
				console.warn("iframe no disponible aún");
			}
		}
	}

	ngOnInit(): void {
		this.carga = 2;
		//console.log(this.config.data,"respuesta de reporte");
		const {
			tipo_proceso,
			data,
			tipo_reporte
		} = this.config.data;

		switch (tipo_proceso) {
			case "1":
				this.cargarReporte(() =>
					this.reportesService.imprimirRequerimientos(
					)
				);
				break;

			case "2":
				this.cargarReporte(() =>
					this.reportesService.imprimirseguimientoRequerimientos(
						data.id_requerimiento
					)
				);
				break;
			case "listado-compra":
				this.cargarReporte(() =>
					this.reportesService.imprimirordencompraProveedor(
						data.ordencompra
					)
				);
				break;
			case "listado-materia":
				this.cargarReporte(() =>
					this.reportesService.imprimirmateriaprimaProveedor(
						data.tipomateria,
						data.idproveedor
					)
				);
				break;

			default:
				break;
		}
	}

	isDesktop() {
		return window.innerWidth > 1024;
	}
	private cargarReporte(serviceCall: () => any) {
		serviceCall().subscribe(
			(response: any) => {
				// Convertir la respuesta JSON en un Blob
				if (!this.isDesktop()) {
					this.ref!.close();
					this.carga = 1;
					const blob = new Blob([response], { type: "application/pdf" });
					const url = window.URL.createObjectURL(blob);
					window.open(url);
					return;
				}
				const blob = new Blob([response], { type: "application/pdf" });
				this.carga = 1;
				const blobUrl = URL.createObjectURL(blob);
				const sanitizedUrl =
					this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
				this.urlSafe = sanitizedUrl;
			},
			(error:any) => {
				// console.error("Error al obtener el PDF", error);
				this.messageService.add({
					severity: "error",
					summary: "Error",
					detail: "Error al obtener el PDF",
				});
				this.carga = 1;
			}
		);
	}
}
