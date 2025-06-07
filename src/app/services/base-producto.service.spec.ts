import { TestBed } from '@angular/core/testing';

import { BaseProductoService } from './base-producto.service';

describe('BaseProductoService', () => {
  let service: BaseProductoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BaseProductoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
