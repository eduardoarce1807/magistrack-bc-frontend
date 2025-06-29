import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisualizadorPagosComponent } from './visualizador-pagos.component';

describe('VisualizadorPagosComponent', () => {
  let component: VisualizadorPagosComponent;
  let fixture: ComponentFixture<VisualizadorPagosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisualizadorPagosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VisualizadorPagosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
