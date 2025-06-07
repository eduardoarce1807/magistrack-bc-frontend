import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalizacionProductoComponent } from './personalizacion-producto.component';

describe('PersonalizacionProductoComponent', () => {
  let component: PersonalizacionProductoComponent;
  let fixture: ComponentFixture<PersonalizacionProductoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalizacionProductoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PersonalizacionProductoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
