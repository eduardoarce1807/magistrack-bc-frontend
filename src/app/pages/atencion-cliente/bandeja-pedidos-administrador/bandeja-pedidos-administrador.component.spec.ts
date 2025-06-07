import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BandejaPedidosAdministradorComponent } from './bandeja-pedidos-administrador.component';

describe('BandejaPedidosAdministradorComponent', () => {
  let component: BandejaPedidosAdministradorComponent;
  let fixture: ComponentFixture<BandejaPedidosAdministradorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BandejaPedidosAdministradorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BandejaPedidosAdministradorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
