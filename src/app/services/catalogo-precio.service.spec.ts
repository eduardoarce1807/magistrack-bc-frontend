import { TestBed } from '@angular/core/testing';

import { CatalogoPrecioService } from './catalogo-precio.service';

describe('CatalogoPrecioService', () => {
  let service: CatalogoPrecioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CatalogoPrecioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
