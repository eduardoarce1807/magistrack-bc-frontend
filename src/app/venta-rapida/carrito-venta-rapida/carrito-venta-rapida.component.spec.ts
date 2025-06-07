import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarritoVentaRapidaComponent } from './carrito-venta-rapida.component';

describe('CarritoVentaRapidaComponent', () => {
  let component: CarritoVentaRapidaComponent;
  let fixture: ComponentFixture<CarritoVentaRapidaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarritoVentaRapidaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CarritoVentaRapidaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
