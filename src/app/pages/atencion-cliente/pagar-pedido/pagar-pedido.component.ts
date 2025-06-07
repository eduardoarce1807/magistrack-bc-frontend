import { AfterViewInit, ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
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

@Component({
  selector: 'app-pagar-pedido',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './pagar-pedido.component.html',
  styleUrl: './pagar-pedido.component.scss'
})
export class PagarPedidoComponent implements OnInit, AfterViewInit {

  idPedido: string | null = null;
  pedido: any;
  private routeSubscription: Subscription | null = null;

  tarjetaForm: FormGroup;
  message = "";

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private fb: FormBuilder,
    private pedidoService: PedidoService,
    private dataService: DataService,
    private emailService: EmailService,
    private chRef: ChangeDetectorRef,
    private http: HttpClient,
    private pedidoAuditoriaService: PedidoAuditoriaService,
    private ngZone: NgZone
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
      }
      console.log('ID del Pedido:', this.idPedido);
    });
  }

  getPedidoById(idPedido: string): void {
    this.pedidoService.getPedidoById(idPedido).subscribe(
      (pedido) => {
        if(pedido) {
          this.pedido = pedido;
          if(this.pedido.estadoPedido.idEstadoPedido == 1){
            const endpoint = 'https://static.micuentaweb.pe/'
            const publicKey = '44817432:testpublickey_0zbgYcUgjHHC8b1T9d13huPOs2N9mXcBuLiE5XW4VK9iP'
            let formToken = 'DEMO-TOKEN-TO-BE-REPLACED'

            const observable = this.http.post(
              'http://localhost:8080/api/izipay/createPayment',
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
          }else{
            this.router.navigate(['/pages/atencion-cliente/bandeja-pedidos'])
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

  private onSubmit = (paymentData: KRPaymentResponse) => {
    this.http
      .post('http://localhost:8080/api/izipay/validate', paymentData, {
        responseType: 'text'
      })
      .subscribe((response: any) => {
        if (response) {
          this.onPagar();
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
              location.href = 'http://localhost:4200/pages/atencion-cliente/registro-pedido/' + this.pedido.idPedido;
              // this.ngZone.run(() => {
              //   this.router.navigate(['/pages/atencion-cliente/registro-pedido', this.pedido.idPedido]);
              // });
            } else if (result.dismiss === Swal.DismissReason.cancel) {
              if(this.dataService.getLoggedUser().rol.idRol === 1) {
                location.href = 'http://localhost:4200/pages/atencion-cliente/bandeja-pedidos-administrador';
                //this.router.navigate(['/pages/atencion-cliente/bandeja-pedidos-administrador']);
              }
              else{
                location.href = 'http://localhost:4200/pages/atencion-cliente/bandeja-pedidos';
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

}
