import { Component, TemplateRef, ViewContainerRef, ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { LdIfDirective } from '../../lib/directives/ld-if.directive';
import { LaunchDarklyService } from '../../lib/services/launchdarkly.service';

describe('LdIfDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let mockLdService: jasmine.SpyObj<LaunchDarklyService>;
  let mockTemplateRef: jasmine.SpyObj<TemplateRef<any>>;
  let mockViewContainer: jasmine.SpyObj<ViewContainerRef>;
  let mockCdr: jasmine.SpyObj<ChangeDetectorRef>;

  beforeEach(async () => {
    mockLdService = jasmine.createSpyObj('LaunchDarklyService', ['variation$']);
    mockTemplateRef = jasmine.createSpyObj('TemplateRef', ['createEmbeddedView']);
    mockViewContainer = jasmine.createSpyObj('ViewContainerRef', ['createEmbeddedView', 'clear']);
    mockCdr = jasmine.createSpyObj('ChangeDetectorRef', ['markForCheck']);

    // Set up default mock behavior
    mockLdService.variation$.and.returnValue(of(false));

    await TestBed.configureTestingModule({
      declarations: [TestComponent, LdIfDirective],
      providers: [
        { provide: LaunchDarklyService, useValue: mockLdService },
        { provide: TemplateRef, useValue: mockTemplateRef },
        { provide: ViewContainerRef, useValue: mockViewContainer },
        { provide: ChangeDetectorRef, useValue: mockCdr }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show content when flag is truthy', () => {
    mockLdService.variation$.and.returnValue(of(true));
    
    const directive = new LdIfDirective(mockTemplateRef, mockViewContainer, mockLdService, mockCdr);
    directive.ldIf = 'test-flag';
    directive.ldIfFallback = false;
    
    directive.ngOnInit();
    
    expect(mockViewContainer.createEmbeddedView).toHaveBeenCalledWith(mockTemplateRef);
    expect(mockCdr.markForCheck).toHaveBeenCalled();
  });

  it('should hide content when flag is falsy', () => {
    mockLdService.variation$.and.returnValue(of(false));
    
    const directive = new LdIfDirective(mockTemplateRef, mockViewContainer, mockLdService, mockCdr);
    directive.ldIf = 'test-flag';
    directive.ldIfFallback = false;
    
    directive.ngOnInit();
    
    expect(mockViewContainer.clear).toHaveBeenCalled();
    expect(mockCdr.markForCheck).toHaveBeenCalled();
  });

  it('should show content when flag matches specific value', () => {
    mockLdService.variation$.and.returnValue(of('premium'));
    
    const directive = new LdIfDirective(mockTemplateRef, mockViewContainer, mockLdService, mockCdr);
    directive.ldIf = 'user-tier';
    directive.ldIfFallback = 'basic';
    directive.ldIfValue = 'premium';
    
    directive.ngOnInit();
    
    expect(mockViewContainer.createEmbeddedView).toHaveBeenCalledWith(mockTemplateRef);
  });

  it('should hide content when flag does not match specific value', () => {
    mockLdService.variation$.and.returnValue(of('basic'));
    
    const directive = new LdIfDirective(mockTemplateRef, mockViewContainer, mockLdService, mockCdr);
    directive.ldIf = 'user-tier';
    directive.ldIfFallback = 'basic';
    directive.ldIfValue = 'premium';
    
    directive.ngOnInit();
    
    expect(mockViewContainer.clear).toHaveBeenCalled();
  });

  it('should unsubscribe on destroy', () => {
    const subscription = jasmine.createSpyObj('Subscription', ['unsubscribe']);
    mockLdService.variation$.and.returnValue(subscription);
    
    const directive = new LdIfDirective(mockTemplateRef, mockViewContainer, mockLdService, mockCdr);
    directive.ldIf = 'test-flag';
    directive.ngOnInit();
    directive.ngOnDestroy();
    
    expect(subscription.unsubscribe).toHaveBeenCalled();
  });

  it('should update subscription when inputs change', () => {
    const subscription = jasmine.createSpyObj('Subscription', ['unsubscribe']);
    mockLdService.variation$.and.returnValue(subscription);
    
    const directive = new LdIfDirective(mockTemplateRef, mockViewContainer, mockLdService, mockCdr);
    directive.ldIf = 'test-flag';
    directive.ngOnInit();
    
    directive.ldIfFallback = 'new-fallback';
    
    expect(subscription.unsubscribe).toHaveBeenCalled();
  });
});

@Component({
  template: `
    <div *ldIf="'test-flag'; fallback: false">Test Content</div>
  `
})
class TestComponent {}
