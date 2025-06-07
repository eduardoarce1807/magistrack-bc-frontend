import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BandejaDespachoComponent } from './bandeja-despacho.component';

describe('BandejaDespachoComponent', () => {
  let component: BandejaDespachoComponent;
  let fixture: ComponentFixture<BandejaDespachoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BandejaDespachoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BandejaDespachoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
