import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductosVentaRapidaComponent } from './productos-venta-rapida.component';

describe('ProductosVentaRapidaComponent', () => {
  let component: ProductosVentaRapidaComponent;
  let fixture: ComponentFixture<ProductosVentaRapidaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductosVentaRapidaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProductosVentaRapidaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
