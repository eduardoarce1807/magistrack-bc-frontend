import { TestBed } from '@angular/core/testing';

import { TipoPresentacionService } from './tipo-presentacion.service';

describe('TipoPresentacionService', () => {
  let service: TipoPresentacionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TipoPresentacionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
