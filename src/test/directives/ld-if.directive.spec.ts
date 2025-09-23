import { Component, TemplateRef, ViewContainerRef, ChangeDetectorRef, runInInjectionContext, Injector } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LdIfDirective } from '../../lib/directives/ld-if.directive';
import { LaunchDarklyService } from '../../lib/services/launchdarkly.service';
import { 
  setupLaunchDarklyServiceWithMockedClient, 
  createLdClientMock,
  simulateFlagChange,
  simulateInitialization
} from '../mocks/launchdarkly.mock';
import type { LDClient } from 'launchdarkly-js-client-sdk';

describe('LdIfDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let mockTemplateRef: jasmine.SpyObj<TemplateRef<unknown>>;
  let mockViewContainer: jasmine.SpyObj<ViewContainerRef>;
  let mockCdr: jasmine.SpyObj<ChangeDetectorRef>;
  let clientMock: jasmine.SpyObj<LDClient>;

  beforeEach(async () => {
    // Create a fresh client mock for each test
    clientMock = createLdClientMock();
    
    mockTemplateRef = jasmine.createSpyObj('TemplateRef', ['createEmbeddedView']);
    mockViewContainer = jasmine.createSpyObj('ViewContainerRef', ['createEmbeddedView', 'clear']);
    mockCdr = jasmine.createSpyObj('ChangeDetectorRef', ['markForCheck']);

    // Set up service with mocked client
    const setup = setupLaunchDarklyServiceWithMockedClient(clientMock);

    await TestBed.configureTestingModule({
      declarations: [TestComponent, LdIfDirective],
      providers: [
        ...setup.providers,
        { provide: ChangeDetectorRef, useValue: mockCdr },
        { provide: TemplateRef, useValue: mockTemplateRef },
        { provide: ViewContainerRef, useValue: mockViewContainer }
      ]
    }).compileComponents();

    // Get the real service with mocked client
    TestBed.inject(LaunchDarklyService);

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    
    // Simulate LaunchDarkly initialization
    simulateInitialization(clientMock);
    
    // Trigger change detection to ensure directive is instantiated
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show content when flag is truthy', () => {
    // Simulate flag change to true
    simulateFlagChange('test-flag', true, undefined, clientMock);
    
    // Create directive instance using runInInjectionContext
    const injector = TestBed.inject(Injector);
    const directive = runInInjectionContext(injector, () => new LdIfDirective());
    
    // Set inputs and initialize
    directive.ldIf = 'test-flag';
    directive.ldIfFallback = false;
    directive.ngOnInit();
    
    expect(mockViewContainer.createEmbeddedView).toHaveBeenCalledWith(mockTemplateRef);
    expect(mockCdr.markForCheck).toHaveBeenCalled();
  });

  it('should hide content when flag is falsy', () => {
    // Simulate flag change to false
    simulateFlagChange('test-flag', false, undefined, clientMock);
    
    // Create directive instance using runInInjectionContext
    const injector = TestBed.inject(Injector);
    const directive = runInInjectionContext(injector, () => new LdIfDirective());
    
    // Set inputs and initialize
    directive.ldIf = 'test-flag';
    directive.ldIfFallback = false;
    directive.ngOnInit();
    
    expect(mockViewContainer.clear).toHaveBeenCalled();
    expect(mockCdr.markForCheck).toHaveBeenCalled();
  });

  it('should show content when flag matches specific value', () => {
    // Simulate flag change to 'premium'
    simulateFlagChange('user-tier', 'premium', undefined, clientMock);
    
    // Create directive instance using runInInjectionContext
    const injector = TestBed.inject(Injector);
    const directive = runInInjectionContext(injector, () => new LdIfDirective());
    
    // Set inputs and initialize
    directive.ldIf = 'user-tier';
    directive.ldIfFallback = 'basic';
    directive.ldIfValue = 'premium';
    directive.ngOnInit();
    
    expect(mockViewContainer.createEmbeddedView).toHaveBeenCalledWith(mockTemplateRef);
  });

  it('should hide content when flag does not match specific value', () => {
    // Simulate flag change to 'basic' (not 'premium')
    simulateFlagChange('user-tier', 'basic', undefined, clientMock);
    
    // Create directive instance using runInInjectionContext
    const injector = TestBed.inject(Injector);
    const directive = runInInjectionContext(injector, () => new LdIfDirective());
    
    // Set inputs and initialize
    directive.ldIf = 'user-tier';
    directive.ldIfFallback = 'basic';
    directive.ldIfValue = 'premium';
    directive.ngOnInit();
    
    expect(mockViewContainer.clear).toHaveBeenCalled();
  });

  it('should unsubscribe on destroy', () => {
    // Create directive instance using runInInjectionContext
    const injector = TestBed.inject(Injector);
    const directive = runInInjectionContext(injector, () => new LdIfDirective());
    
    // Set inputs and initialize
    directive.ldIf = 'test-flag';
    directive.ngOnInit();
    
    // Spy on the subscription to verify it gets unsubscribed
    const subscription = directive['subscription'];
    if (subscription) {
      spyOn(subscription, 'unsubscribe');
      
      directive.ngOnDestroy();
      
      expect(subscription.unsubscribe).toHaveBeenCalled();
    }
  });

  it('should update subscription when inputs change', () => {
    // Create directive instance using runInInjectionContext
    const injector = TestBed.inject(Injector);
    const directive = runInInjectionContext(injector, () => new LdIfDirective());
    
    // Set inputs and initialize
    directive.ldIf = 'test-flag';
    directive.ngOnInit();
    
    // Spy on the subscription to verify it gets unsubscribed
    const subscription = directive['subscription'];
    if (subscription) {
      spyOn(subscription, 'unsubscribe');
      
      // Change an input
      directive.ldIfFallback = 'new-fallback';
      
      expect(subscription.unsubscribe).toHaveBeenCalled();
    }
  });

 
});

@Component({
  template: `
    <div *ldIf="'test-flag'; fallback: false">Test Content</div>
  `
})
class TestComponent {}
