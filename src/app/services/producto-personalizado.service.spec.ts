import { TestBed } from '@angular/core/testing';

import { ProductoPersonalizadoService } from './producto-personalizado.service';

describe('ProductoPersonalizadoService', () => {
  let service: ProductoPersonalizadoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductoPersonalizadoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
