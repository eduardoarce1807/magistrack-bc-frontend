import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultaVentasComponent } from './consulta-ventas.component';

describe('ConsultaVentasComponent', () => {
  let component: ConsultaVentasComponent;
  let fixture: ComponentFixture<ConsultaVentasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultaVentasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConsultaVentasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
