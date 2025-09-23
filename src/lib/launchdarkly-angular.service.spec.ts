import { TestBed } from '@angular/core/testing';

import { LaunchdarklyAngularService } from './launchdarkly-angular.service';

describe('LaunchdarklyAngularService', () => {
  let service: LaunchdarklyAngularService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LaunchdarklyAngularService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
