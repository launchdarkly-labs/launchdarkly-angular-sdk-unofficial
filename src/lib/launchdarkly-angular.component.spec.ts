import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LaunchdarklyAngularComponent } from './launchdarkly-angular.component';

describe('LaunchdarklyAngularComponent', () => {
  let component: LaunchdarklyAngularComponent;
  let fixture: ComponentFixture<LaunchdarklyAngularComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LaunchdarklyAngularComponent]
    });
    fixture = TestBed.createComponent(LaunchdarklyAngularComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
