import { TestBed } from '@angular/core/testing';

import { CanalVentaService } from './canal-venta.service';

describe('CanalVentaService', () => {
  let service: CanalVentaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CanalVentaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
