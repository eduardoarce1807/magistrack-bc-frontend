import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BandejaEtiquetadoComponent } from './bandeja-etiquetado.component';

describe('BandejaEtiquetadoComponent', () => {
  let component: BandejaEtiquetadoComponent;
  let fixture: ComponentFixture<BandejaEtiquetadoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BandejaEtiquetadoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BandejaEtiquetadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
