import { TestBed } from '@angular/core/testing';

import { PedidoAuditoriaService } from './pedido-auditoria.service';

describe('PedidoAuditoriaService', () => {
  let service: PedidoAuditoriaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PedidoAuditoriaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
