import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrazabilidadPedidoComponent } from './trazabilidad-pedido.component';

describe('TrazabilidadPedidoComponent', () => {
  let component: TrazabilidadPedidoComponent;
  let fixture: ComponentFixture<TrazabilidadPedidoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrazabilidadPedidoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TrazabilidadPedidoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
