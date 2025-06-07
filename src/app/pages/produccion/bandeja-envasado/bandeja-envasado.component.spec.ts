import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BandejaEnvasadoComponent } from './bandeja-envasado.component';

describe('BandejaEnvasadoComponent', () => {
  let component: BandejaEnvasadoComponent;
  let fixture: ComponentFixture<BandejaEnvasadoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BandejaEnvasadoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BandejaEnvasadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
