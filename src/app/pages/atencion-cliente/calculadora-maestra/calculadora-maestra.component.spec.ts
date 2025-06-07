import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalculadoraMaestraComponent } from './calculadora-maestra.component';

describe('CalculadoraMaestraComponent', () => {
  let component: CalculadoraMaestraComponent;
  let fixture: ComponentFixture<CalculadoraMaestraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalculadoraMaestraComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CalculadoraMaestraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
