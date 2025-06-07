import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BandejaCalidadComponent } from './bandeja-calidad.component';

describe('BandejaCalidadComponent', () => {
  let component: BandejaCalidadComponent;
  let fixture: ComponentFixture<BandejaCalidadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BandejaCalidadComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BandejaCalidadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
