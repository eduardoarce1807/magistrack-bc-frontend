import { AfterViewInit, ChangeDetectorRef, Component, inject, NgZone, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { PedidoService } from '../../../services/pedido.service';
import { DataService } from '../../../services/data.service';
import { EmailService } from '../../../services/email.service';
import KRGlue from '@lyracom/embedded-form-glue'
import { firstValueFrom } from 'rxjs'
import { HttpClient } from '@angular/common/http';
import { PedidoAuditoriaService } from '../../../services/pedido-auditoria.service';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TipoPagoService } from '../../../services/tipo-pago.service';
import { PagoPedidoService } from '../../../services/pago-pedido.service';
import { BancoService } from '../../../services/banco.service';

interface PagoManual {
  idTipoPago: number;
  idCliente: number;
  idBanco: number | null;
  idPedido: string;
  numeroOperacion: string | null;
  fechaPago: string;
}

@Component({
  selector: 'app-pagar-pedido',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './pagar-pedido.component.html',
  styleUrl: './pagar-pedido.component.scss'
})
export class PagarPedidoComponent implements OnInit, AfterViewInit {

  idPedido: string | null = null;
  pedido: any;
  private routeSubscription: Subscription | null = null;

  tarjetaForm: FormGroup;
  message = "";

  private modalService = inject(NgbModal);

  lstTiposPago: any[] = [];
  lstBancos: any[] = [];

  pagoManual: PagoManual = {
    idTipoPago: 0,
    idCliente: 0,
    idBanco: null,
    idPedido: '',
    numeroOperacion: '',
    fechaPago: ''
  };

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private fb: FormBuilder,
    private pedidoService: PedidoService,
    public dataService: DataService,
    private emailService: EmailService,
    private chRef: ChangeDetectorRef,
    private http: HttpClient,
    private pedidoAuditoriaService: PedidoAuditoriaService,
    private ngZone: NgZone,
    private tipoPagoService: TipoPagoService,
    private pagoPedidoService: PagoPedidoService,
    private bancoService: BancoService
  ) {
    this.tarjetaForm = this.fb.group({
      numeroTarjeta: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      nombreTitular: ['', [Validators.required, Validators.minLength(3)]],
      fechaVencimiento: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]],
    });
  }

  ngOnInit(): void {

    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.idPedido = params.get('idPedido');
      if (this.idPedido) {
        this.getPedidoById(this.idPedido);
        this.getTiposPago();
        this.getBancos();
      }
      console.log('ID del Pedido:', this.idPedido);
    });
  }

  getTiposPago() {
    this.tipoPagoService.getTiposPago().subscribe( (data: any) => {
      if(data){
        this.lstTiposPago = data;
      }
    })
  }

  getBancos() {
    this.bancoService.getBancos().subscribe( (data: any) => {
      if(data){
        this.lstBancos = data;
      }
    })
  }

  @ViewChild('pagoIzipay', { static: true }) pagoIzipay: TemplateRef<any> | null = null;
  openModalIziPay(content: TemplateRef<any>) {
    this.modalService.dismissAll(); // Cierra cualquier modal abierto antes de abrir uno nuevo
    this.modalService.open(content, {backdrop: 'static', keyboard: false});
    this.iniciarPagoIziPay();
  }

  openModal(content: TemplateRef<any>) {
    this.modalService.dismissAll(); // Cierra cualquier modal abierto antes de abrir uno nuevo
    this.modalService.open(content, {backdrop: 'static', keyboard: false});
  }

  cancelarPagoIziPay() {
    document.getElementById('krtoolbar')?.remove();
  }

  getPedidoById(idPedido: string): void {
    this.pedidoService.getPedidoById(idPedido).subscribe(
      (pedido) => {
        if(pedido) {
          this.pedido = pedido;
          if(this.pedido.estadoPedido.idEstadoPedido == 1){
            //this.openModalIziPay(this.pagoIzipay!);
          }else{
            if(this.dataService.getLoggedUser().rol.idRol === 1) {
              this.router.navigate(['/pages/atencion-cliente/bandeja-pedidos-administrador']);
            }else{
              this.router.navigate(['/pages/atencion-cliente/bandeja-pedidos']);
            }
          }
        }
        console.log('Pedido:', pedido);
      },
      (error) => {
        console.error('Error al cargar el pedido', error);
      }
    );
  }

  ngAfterViewInit() {
    
  }

  iniciarPagoIziPay(){

    const endpoint = 'https://static.micuentaweb.pe/'
    const publicKey = '44817432:testpublickey_0zbgYcUgjHHC8b1T9d13huPOs2N9mXcBuLiE5XW4VK9iP'
    let formToken = 'DEMO-TOKEN-TO-BE-REPLACED'

    const observable = this.http.post(
      `${environment.apiUrl}/izipay/createPayment`,
      {amount: this.pedido.montoTotal * 100, currency: 'PEN', orderId: this.pedido.idPedido, customer: {email:this.dataService.getLoggedUser().cliente.correo}},
    )
    firstValueFrom(observable)
      .then((resp: any) => {
        //console.log('Response from server:', resp)
        formToken = resp.answer.formToken
        //console.log('formToken', formToken)
        return KRGlue.loadLibrary(
          endpoint,
          publicKey
        ) /* Load the remote library */
      })
      .then(({ KR }) =>
        KR.setFormConfig({
          /* set the minimal configuration */
          formToken: formToken,
          'kr-language': 'es-PE', /* to update initialization parameter */
        })
      )
      .then(({ KR }) => KR.onSubmit(this.onSubmit))
      .then(({ KR }) =>
        KR.renderElements('#myPaymentForm')
      ) /* Render the payment form into the specified selector*/
      .catch(error => {
        this.message = error.message + ' (see console for more details)'
      });
  }

  private onSubmit = (paymentData: KRPaymentResponse) => {
    this.http
      .post(`${environment.apiUrl}/izipay/validate`, paymentData, {
        responseType: 'text'
      })
      .subscribe((response: any) => {
        if (response) {
          this.modalService.dismissAll();
          this.onPagarIzipay();
          this.message = 'Payment successful!'
          this.chRef.detectChanges()
        }
      })
  }

  onPagar(): void {

    this.pedidoService.updateEstadoPedido(this.pedido.idPedido, 2).subscribe(
      (response) => {
        if(response){

          this.pedidoAuditoriaService
            .saveAuditoria({
              idPedido: this.pedido.idPedido,
              fecha: new Date(),
              idEstadoPedido: 2,
              accionRealizada:
                'Pedido pagado',
              idCliente: this.dataService.getLoggedUser().cliente.idCliente,
              observacion: ''
            })
            .subscribe(
              () => {
                console.log('Auditoría guardada');
              }
            );

          this.pedidoService.updateEstadoClientePedido(this.pedido.idPedido, 2).subscribe();

          let emailRequest = {
            para: this.dataService.getLoggedUser().cliente.correo,
            asunto: 'BELLACURET | Confirmación de pago',
            mensaje: ``,
            idPedido: this.idPedido
          }

          this.emailService.sendEmail(emailRequest).subscribe(
            (response) => {
              console.log('Email enviado:', response);
            }
          );
          Swal.fire({
            title: 'Pago realizado con éxito',
            html:
              '<div>Tu pago ha sido procesado correctamente. Puedes revisar el estado de tu pedido en la sección de Bandeja de Pedidos.</div><br>' +
              `<strong>Número de pedido: ${this.pedido.idPedido}</strong><br>` +
              `<div>Fecha de entrega estimada: ${this.pedido.fechaEstimadaEntrega}</div>`,
            icon: 'success',
            showCancelButton: true,
            confirmButtonText: 'Ver pedido',
            cancelButtonText: 'Regresar a bandeja de pedidos',
            customClass: {
              confirmButton: 'btn btn-dark',
              cancelButton: 'btn btn-primary',
            },
            allowOutsideClick: false,
            allowEscapeKey: false,
          }).then((result) => {
            if (result.isConfirmed) {
              location.href = `${environment.frontUrl}/pages/atencion-cliente/registro-pedido/${this.pedido.idPedido}`;
              // this.ngZone.run(() => {
              //   this.router.navigate(['/pages/atencion-cliente/registro-pedido', this.pedido.idPedido]);
              // });
            } else if (result.dismiss === Swal.DismissReason.cancel) {
              if(this.dataService.getLoggedUser().rol.idRol === 1) {
                location.href = `${environment.frontUrl}/pages/atencion-cliente/bandeja-pedidos-administrador`;
                //this.router.navigate(['/pages/atencion-cliente/bandeja-pedidos-administrador']);
              }
              else{
                location.href = `${environment.frontUrl}/pages/atencion-cliente/bandeja-pedidos`;
                //this.router.navigate(['/pages/atencion-cliente/bandeja-pedidos']);
              }
            }
          });
        }
      },
      (error) => {
        console.error('Error al actualizar el estado del pedido', error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo procesar el pago. Por favor, inténtalo de nuevo más tarde.',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          customClass: {
            confirmButton: 'btn btn-primary',
          },
        });
      }
    );
  }

  onPagarIzipay(): void {
    
    const fecha = new Date();
    this.pagoManual.fechaPago = fecha.toISOString();
    this.pagoManual.numeroOperacion = null;
    this.pagoManual.idTipoPago = 1;
    this.pagoManual.idPedido = this.idPedido || '';
    this.pagoManual.idCliente = this.dataService.getLoggedUser().cliente.idCliente || this.pedido.cliente.idCliente;

    //console.log('Pago manual:', this.pagoManual);

    this.pagoPedidoService.savePago(this.pagoManual).subscribe(
      (response) => {
        if (response) {
          this.modalService.dismissAll();
          this.onPagar();
        }
        else {
          Swal.fire({
            icon: 'error',
            title: 'Error al procesar el pago',
            text: response.mensaje || 'Ocurrió un error al procesar el pago manual. Por favor, inténtalo de nuevo.',
            confirmButtonText: 'Aceptar',
            customClass: {
              confirmButton: 'btn btn-primary',
            },
          });
        }
      },
      (error) => {
        console.error('Error al guardar el pago manual', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al procesar el pago',
          text: 'Ocurrió un error al procesar el pago manual. Por favor, inténtalo de nuevo.',
          confirmButtonText: 'Aceptar',
          customClass: {
            confirmButton: 'btn btn-primary',
          },
        });
      }
    );

  }

  onPagarManual(): void {
    if (this.pagoManual.idTipoPago === 0 || !this.pagoManual.numeroOperacion || !this.pagoManual.fechaPago) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor, complete todos los campos requeridos.',
        confirmButtonText: 'Aceptar',
        customClass: {
          confirmButton: 'btn btn-primary',
        },
      });
      return;
    }
    this.pagoManual.idPedido = this.idPedido || '';
    this.pagoManual.idCliente = this.dataService.getLoggedUser().cliente.idCliente || this.pedido.cliente.idCliente;
    this.pagoManual.idBanco = this.pagoManual.idTipoPago == 3 ? this.pagoManual.idBanco : null;

    //console.log('Pago manual:', this.pagoManual);

    this.pagoPedidoService.savePago(this.pagoManual).subscribe(
      (response) => {
        if (response) {
          this.modalService.dismissAll();
          this.onPagar();
        }
        else {
          Swal.fire({
            icon: 'error',
            title: 'Error al procesar el pago',
            text: response.mensaje || 'Ocurrió un error al procesar el pago manual. Por favor, inténtalo de nuevo.',
            confirmButtonText: 'Aceptar',
            customClass: {
              confirmButton: 'btn btn-primary',
            },
          });
        }
      },
      (error) => {
        console.error('Error al guardar el pago manual', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al procesar el pago',
          text: 'Ocurrió un error al procesar el pago manual. Por favor, inténtalo de nuevo.',
          confirmButtonText: 'Aceptar',
          customClass: {
            confirmButton: 'btn btn-primary',
          },
        });
      }
    );
  }

  nombreArchivo: string = '';
  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const documentoAdicional = input.files[0];
      this.nombreArchivo = documentoAdicional.name;
    }
  }

}
