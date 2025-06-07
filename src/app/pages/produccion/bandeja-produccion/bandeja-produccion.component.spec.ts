import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BandejaProduccionComponent } from './bandeja-produccion.component';

describe('BandejaProduccionComponent', () => {
  let component: BandejaProduccionComponent;
  let fixture: ComponentFixture<BandejaProduccionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BandejaProduccionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BandejaProduccionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
