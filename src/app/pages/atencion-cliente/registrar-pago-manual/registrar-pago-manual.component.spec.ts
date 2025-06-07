import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarPagoManualComponent } from './registrar-pago-manual.component';

describe('RegistrarPagoManualComponent', () => {
  let component: RegistrarPagoManualComponent;
  let fixture: ComponentFixture<RegistrarPagoManualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarPagoManualComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RegistrarPagoManualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
