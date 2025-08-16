import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalculadoraProductosComponent } from './calculadora-productos.component';

describe('CalculadoraProductosComponent', () => {
  let component: CalculadoraProductosComponent;
  let fixture: ComponentFixture<CalculadoraProductosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalculadoraProductosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CalculadoraProductosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
