import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PartnerHomeComponent } from './partner-home.component';

describe('PartnerHomeComponent', () => {
  let component: PartnerHomeComponent;
  let fixture: ComponentFixture<PartnerHomeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PartnerHomeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PartnerHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
