import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroDespachoComponent } from './registro-despacho.component';

describe('RegistroDespachoComponent', () => {
  let component: RegistroDespachoComponent;
  let fixture: ComponentFixture<RegistroDespachoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroDespachoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RegistroDespachoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
