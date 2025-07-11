import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroCuponComponent } from './registro-cupon.component';

describe('RegistroCuponComponent', () => {
  let component: RegistroCuponComponent;
  let fixture: ComponentFixture<RegistroCuponComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroCuponComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RegistroCuponComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
