import { TestBed } from '@angular/core/testing';

import { MetodoEntregaService } from './metodo-entrega.service';

describe('MetodoEntregaService', () => {
  let service: MetodoEntregaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MetodoEntregaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
