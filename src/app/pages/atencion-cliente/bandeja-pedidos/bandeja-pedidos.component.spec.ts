import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BandejaPedidosComponent } from './bandeja-pedidos.component';

describe('BandejaPedidosComponent', () => {
  let component: BandejaPedidosComponent;
  let fixture: ComponentFixture<BandejaPedidosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BandejaPedidosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BandejaPedidosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
