import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuejasReclamosComponent } from './quejas-reclamos.component';

describe('QuejasReclamosComponent', () => {
  let component: QuejasReclamosComponent;
  let fixture: ComponentFixture<QuejasReclamosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuejasReclamosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuejasReclamosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});