import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { DeliveryService } from './delivery.service';
import { environment } from '../../environments/environment';
import {
  TarifaDelivery,
  CrearTarifaDelivery,
  TipoFechaEntrega,
  CalculoDeliveryConDireccion,
  CalculoDeliveryConUbicacion
} from '../model/deliveryModel';

describe('DeliveryService', () => {
  let service: DeliveryService;
  let httpMock: HttpTestingController;

  const mockTarifa: TarifaDelivery = {
    idTarifarioDelivery: 1,
    departamento: { idDepartamento: 15, nombre: 'LIMA' },
    provincia: { idProvincia: 128, nombre: 'LIMA' },
    distrito: { idDistrito: 1801, nombre: 'VILLA EL SALVADOR' },
    puntoEncuentro: null,
    tipoFechaEntrega: TipoFechaEntrega.DE_UN_DIA_PARA_OTRO,
    tipoFechaEntregaDescripcion: 'DE UN DIA PARA OTRO',
    precio: 15.00,
    montoMinimoPedido: null,
    montoMaximoPedido: null,
    costoAgencia: null,
    aplicaCostoAgenciaSiMenosDe: null,
    descripcionCondicion: 'Tarifa estándar para Lima Metropolitana',
    activo: true,
    prioridad: 1,
    fechaCreacion: '2025-10-23T10:00:00',
    fechaActualizacion: null,
    ubicacionCompleta: 'LIMA, LIMA, VILLA EL SALVADOR',
    resumenCondiciones: 'Entrega: DE UN DIA PARA OTRO'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DeliveryService]
    });
    service = TestBed.inject(DeliveryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Mantenedor de Tarifas', () => {
    it('should list active tarifas', () => {
      const mockTarifas = [mockTarifa];

      service.listarTarifasActivas().subscribe(tarifas => {
        expect(tarifas).toEqual(mockTarifas);
        expect(tarifas.length).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/delivery/tarifas`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTarifas);
    });

    it('should create a new tarifa', () => {
      const nuevaTarifa: CrearTarifaDelivery = {
        idDepartamento: 15,
        idProvincia: 128,
        idDistrito: 1801,
        tipoFechaEntrega: TipoFechaEntrega.MISMO_DIA,
        precio: 18.00,
        activo: true,
        prioridad: 1
      };

      service.crearTarifa(nuevaTarifa).subscribe(tarifa => {
        expect(tarifa).toEqual(mockTarifa);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/delivery/tarifas`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(nuevaTarifa);
      req.flush(mockTarifa);
    });

    it('should update an existing tarifa', () => {
      const id = 1;
      const tarifaActualizada: CrearTarifaDelivery = {
        ...mockTarifa,
        precio: 20.00
      };

      service.actualizarTarifa(id, tarifaActualizada).subscribe(tarifa => {
        expect(tarifa.precio).toBe(20.00);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/delivery/tarifas/${id}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(tarifaActualizada);
      req.flush({ ...mockTarifa, precio: 20.00 });
    });

    it('should delete a tarifa', () => {
      const id = 1;
      const response = { idResultado: 1, mensaje: 'Tarifa eliminada exitosamente' };

      service.eliminarTarifa(id).subscribe(result => {
        expect(result).toEqual(response);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/delivery/tarifas/${id}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(response);
    });
  });

  describe('Búsquedas por Ubicación', () => {
    it('should search tarifas by departamento', () => {
      const idDepartamento = 15;
      const mockTarifas = [mockTarifa];

      service.buscarTarifasPorDepartamento(idDepartamento).subscribe(tarifas => {
        expect(tarifas).toEqual(mockTarifas);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/delivery/tarifas/departamento/${idDepartamento}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTarifas);
    });

    it('should search tarifas by provincia', () => {
      const idProvincia = 128;
      const mockTarifas = [mockTarifa];

      service.buscarTarifasPorProvincia(idProvincia).subscribe(tarifas => {
        expect(tarifas).toEqual(mockTarifas);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/delivery/tarifas/provincia/${idProvincia}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTarifas);
    });

    it('should search tarifas by distrito', () => {
      const idDistrito = 1801;
      const mockTarifas = [mockTarifa];

      service.buscarTarifasPorDistrito(idDistrito).subscribe(tarifas => {
        expect(tarifas).toEqual(mockTarifas);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/delivery/tarifas/distrito/${idDistrito}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTarifas);
    });
  });

  describe('Cálculo de Delivery', () => {
    it('should calculate delivery with address', () => {
      const calculo: CalculoDeliveryConDireccion = {
        idDireccion: 123,
        montoPedido: 350.00,
        metodoPago: 'EFECTIVO',
        esExpress: false
      };

      const response = {
        costoDelivery: 15.00,
        aplicaDelivery: true,
        metodoCalculoDelivery: 'Tarifa base: S/ 15.00',
        mensaje: 'Cálculo de delivery exitoso',
        costoBase: 15.00,
        costosAdicionales: 0.00,
        descuentos: 0.00,
        ubicacionDetectada: 'LIMA, LIMA, VILLA EL SALVADOR',
        condicionesAplicadas: []
      };

      service.calcularDeliveryConDireccion(calculo).subscribe(result => {
        expect(result).toEqual(response);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/delivery/calcular`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(calculo);
      req.flush(response);
    });

    it('should calculate delivery with direct location', () => {
      const calculo: CalculoDeliveryConUbicacion = {
        idDepartamento: 15,
        idProvincia: 128,
        idDistrito: 1801,
        montoPedido: 350.00,
        metodoPago: 'EFECTIVO',
        esExpress: false
      };

      const response = {
        costoDelivery: 15.00,
        aplicaDelivery: true,
        metodoCalculoDelivery: 'Tarifa base: S/ 15.00',
        mensaje: 'Cálculo de delivery exitoso',
        costoBase: 15.00,
        costosAdicionales: 0.00,
        descuentos: 0.00,
        ubicacionDetectada: 'LIMA, LIMA, VILLA EL SALVADOR',
        condicionesAplicadas: []
      };

      service.calcularDeliveryConUbicacion(calculo).subscribe(result => {
        expect(result).toEqual(response);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/delivery/calcular`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(calculo);
      req.flush(response);
    });
  });

  describe('Gestión de Delivery en Pedidos', () => {
    it('should recalculate pedido delivery', () => {
      const idPedido = 'PED20250027';
      const response = {
        idResultado: 1,
        mensaje: 'Delivery recalculado exitosamente. Aplica delivery: true, Costo: S/ 15.00, Monto total: S/ 165.00'
      };

      service.recalcularDeliveryPedido(idPedido).subscribe(result => {
        expect(result).toEqual(response);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/pedido/${idPedido}/recalcular-delivery`);
      expect(req.request.method).toBe('PUT');
      req.flush(response);
    });

    it('should calculate pedido delivery without saving', () => {
      const idPedido = 'PED20250027';
      const response = {
        costoDelivery: 15.00,
        aplicaDelivery: true,
        metodoCalculoDelivery: 'Tarifa base: S/ 15.00',
        mensaje: 'Cálculo de delivery exitoso',
        ubicacionDetectada: 'LIMA, LIMA, VILLA EL SALVADOR',
        condicionesAplicadas: [],
        costoBase: 15.00,
        costosAdicionales: 0.00,
        descuentos: 0.00
      };

      service.calcularDeliveryPedido(idPedido).subscribe(result => {
        expect(result).toEqual(response);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/pedido/${idPedido}/calcular-delivery`);
      expect(req.request.method).toBe('GET');
      req.flush(response);
    });
  });

  describe('Métodos Auxiliares', () => {
    it('should validate tarifa correctly', () => {
      const tarifaValida: CrearTarifaDelivery = {
        precio: 15.00,
        tipoFechaEntrega: TipoFechaEntrega.MISMO_DIA,
        activo: true,
        prioridad: 1
      };

      const errores = service.validarTarifa(tarifaValida);
      expect(errores).toEqual([]);
    });

    it('should detect validation errors', () => {
      const tarifaInvalida: CrearTarifaDelivery = {
        precio: -5.00, // Error: precio negativo
        montoMinimoPedido: 100.00,
        montoMaximoPedido: 50.00, // Error: mínimo mayor que máximo
        tipoFechaEntrega: TipoFechaEntrega.MISMO_DIA,
        activo: true,
        prioridad: 15 // Error: prioridad fuera de rango
      };

      const errores = service.validarTarifa(tarifaInvalida);
      expect(errores.length).toBeGreaterThan(0);
      expect(errores).toContain('El precio debe ser mayor o igual a 0');
      expect(errores).toContain('El monto mínimo debe ser menor al monto máximo');
      expect(errores).toContain('La prioridad debe estar entre 1 y 10');
    });

    it('should format location correctly', () => {
      const ubicacion = service.formatearUbicacionCompleta(mockTarifa);
      expect(ubicacion).toBe('LIMA, LIMA, VILLA EL SALVADOR');
    });

    it('should format national location', () => {
      const tarifaNacional: TarifaDelivery = {
        ...mockTarifa,
        departamento: undefined,
        provincia: undefined,
        distrito: undefined
      };

      const ubicacion = service.formatearUbicacionCompleta(tarifaNacional);
      expect(ubicacion).toBe('Nacional');
    });

    it('should get correct priority color', () => {
      expect(service.obtenerColorPrioridad(1)).toBe('danger');
      expect(service.obtenerColorPrioridad(2)).toBe('warning');
      expect(service.obtenerColorPrioridad(3)).toBe('info');
      expect(service.obtenerColorPrioridad(5)).toBe('secondary');
    });

    it('should get correct delivery type description', () => {
      expect(service.obtenerDescripcionTipoEntrega('MISMO_DIA')).toBe('Mismo día');
      expect(service.obtenerDescripcionTipoEntrega('DE_UN_DIA_PARA_OTRO')).toBe('De un día para otro');
      expect(service.obtenerDescripcionTipoEntrega('CUSTOM')).toBe('CUSTOM');
    });
  });
});