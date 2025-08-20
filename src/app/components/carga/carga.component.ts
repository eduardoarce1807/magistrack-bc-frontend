import { Component } from '@angular/core';
import {ProgressSpinnerModule} from "primeng/progressspinner";

@Component({
  selector: 'app-carga',
  standalone: true,
    imports: [
        ProgressSpinnerModule
    ],
  templateUrl: './carga.component.html',
  styleUrl: './carga.component.scss'
})
export class CargaComponent {

}
