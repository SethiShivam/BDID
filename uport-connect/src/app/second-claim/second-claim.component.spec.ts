import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SecondClaimComponent } from './second-claim.component';

describe('SecondClaimComponent', () => {
  let component: SecondClaimComponent;
  let fixture: ComponentFixture<SecondClaimComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SecondClaimComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SecondClaimComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
