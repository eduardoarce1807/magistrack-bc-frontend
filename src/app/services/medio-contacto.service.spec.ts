import { TestBed } from '@angular/core/testing';

import { MedioContactoService } from './medio-contacto.service';

describe('MedioContactoService', () => {
  let service: MedioContactoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MedioContactoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
