import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatalogoPreciosComponent } from './catalogo-precios.component';

describe('CatalogoPreciosComponent', () => {
  let component: CatalogoPreciosComponent;
  let fixture: ComponentFixture<CatalogoPreciosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogoPreciosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CatalogoPreciosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
