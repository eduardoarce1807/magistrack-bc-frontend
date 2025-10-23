import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestorBulksComponent } from './gestor-bulks.component';

describe('GestorBulksComponent', () => {
  let component: GestorBulksComponent;
  let fixture: ComponentFixture<GestorBulksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestorBulksComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GestorBulksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});