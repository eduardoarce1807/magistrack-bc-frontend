import { TestBed } from '@angular/core/testing';

import { QuejasReclamosService } from './quejas-reclamos.service';

describe('QuejasReclamosService', () => {
  let service: QuejasReclamosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuejasReclamosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});