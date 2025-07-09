import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListadoCuponesComponent } from './listado-cupones.component';

describe('ListadoCuponesComponent', () => {
  let component: ListadoCuponesComponent;
  let fixture: ComponentFixture<ListadoCuponesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListadoCuponesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListadoCuponesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
