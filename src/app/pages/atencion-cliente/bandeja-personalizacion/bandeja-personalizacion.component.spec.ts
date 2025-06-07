import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BandejaPersonalizacionComponent } from './bandeja-personalizacion.component';

describe('BandejaPersonalizacionComponent', () => {
  let component: BandejaPersonalizacionComponent;
  let fixture: ComponentFixture<BandejaPersonalizacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BandejaPersonalizacionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BandejaPersonalizacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
