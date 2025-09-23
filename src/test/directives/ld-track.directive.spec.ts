import { Component, TemplateRef, ViewContainerRef, ChangeDetectorRef, ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { LdTrackDirective } from '../../lib/directives/ld-track.directive';
import { LaunchDarklyService } from '../../lib/services/launchdarkly.service';

describe('LdTrackDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let mockLdService: jasmine.SpyObj<LaunchDarklyService>;
  let mockElementRef: jasmine.SpyObj<ElementRef>;

  beforeEach(async () => {
    mockLdService = jasmine.createSpyObj('LaunchDarklyService', ['track']);
    mockElementRef = jasmine.createSpyObj('ElementRef', [], {
      nativeElement: {
        tagName: 'BUTTON',
        id: 'test-button',
        className: 'btn btn-primary'
      }
    });

    await TestBed.configureTestingModule({
      declarations: [TestComponent, LdTrackDirective],
      providers: [
        { provide: LaunchDarklyService, useValue: mockLdService },
        { provide: ElementRef, useValue: mockElementRef }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should track click events by default', () => {
    const directive = new LdTrackDirective(mockElementRef, mockLdService);
    directive.ldTrack = 'button-clicked';
    
    directive.ngOnInit();
    directive.onClick(new Event('click'));
    
    expect(mockLdService.track).toHaveBeenCalledWith('button-clicked', {
      element: {
        tagName: 'button',
        id: 'test-button',
        className: 'btn btn-primary'
      },
      eventType: 'click'
    }, undefined);
  });

  it('should track events with custom data', () => {
    const directive = new LdTrackDirective(mockElementRef, mockLdService);
    directive.ldTrack = 'purchase';
    directive.ldTrackData = { product: 'premium', price: 29.99 };
    
    directive.ngOnInit();
    directive.onClick(new Event('click'));
    
    expect(mockLdService.track).toHaveBeenCalledWith('purchase', {
      product: 'premium',
      price: 29.99,
      element: {
        tagName: 'button',
        id: 'test-button',
        className: 'btn btn-primary'
      },
      eventType: 'click'
    }, undefined);
  });

  it('should track events with metric value', () => {
    const directive = new LdTrackDirective(mockElementRef, mockLdService);
    directive.ldTrack = 'conversion';
    directive.ldTrackValue = 29.99;
    
    directive.ngOnInit();
    directive.onClick(new Event('click'));
    
    expect(mockLdService.track).toHaveBeenCalledWith('conversion', {
      element: {
        tagName: 'button',
        id: 'test-button',
        className: 'btn btn-primary'
      },
      eventType: 'click'
    }, 29.99);
  });

  it('should track mouseenter events', () => {
    const directive = new LdTrackDirective(mockElementRef, mockLdService);
    directive.ldTrack = 'hover-detected';
    directive.ldTrackEvent = 'mouseenter';
    
    directive.ngOnInit();
    directive.onMouseEnter(new Event('mouseenter'));
    
    expect(mockLdService.track).toHaveBeenCalledWith('hover-detected', {
      element: {
        tagName: 'button',
        id: 'test-button',
        className: 'btn btn-primary'
      },
      eventType: 'mouseenter'
    }, undefined);
  });

  it('should track focus events', () => {
    const directive = new LdTrackDirective(mockElementRef, mockLdService);
    directive.ldTrack = 'focus-gained';
    directive.ldTrackEvent = 'focus';
    
    directive.ngOnInit();
    directive.onFocus(new Event('focus'));
    
    expect(mockLdService.track).toHaveBeenCalledWith('focus-gained', {
      element: {
        tagName: 'button',
        id: 'test-button',
        className: 'btn btn-primary'
      },
      eventType: 'focus'
    }, undefined);
  });

  it('should track keydown events', () => {
    const directive = new LdTrackDirective(mockElementRef, mockLdService);
    directive.ldTrack = 'key-pressed';
    directive.ldTrackEvent = 'keydown';
    
    directive.ngOnInit();
    directive.onKeyDown(new KeyboardEvent('keydown'));
    
    expect(mockLdService.track).toHaveBeenCalledWith('key-pressed', {
      element: {
        tagName: 'button',
        id: 'test-button',
        className: 'btn btn-primary'
      },
      eventType: 'keydown'
    }, undefined);
  });

  it('should track submit events', () => {
    const directive = new LdTrackDirective(mockElementRef, mockLdService);
    directive.ldTrack = 'form-submitted';
    directive.ldTrackEvent = 'submit';
    
    directive.ngOnInit();
    directive.onSubmit(new Event('submit'));
    
    expect(mockLdService.track).toHaveBeenCalledWith('form-submitted', {
      element: {
        tagName: 'button',
        id: 'test-button',
        className: 'btn btn-primary'
      },
      eventType: 'submit'
    }, undefined);
  });

  it('should not track events without event key', () => {
    const directive = new LdTrackDirective(mockElementRef, mockLdService);
    directive.ngOnInit();
    directive.onClick(new Event('click'));
    
    expect(mockLdService.track).not.toHaveBeenCalled();
  });

  it('should warn when no event key is provided', () => {
    spyOn(console, 'warn');
    const directive = new LdTrackDirective(mockElementRef, mockLdService);
    directive.ngOnInit();
    
    expect(console.warn).toHaveBeenCalledWith('[LdTrackDirective] No event key provided. Use [ldTrack]="event-name"');
  });

  it('should warn when trying to track without event key', () => {
    spyOn(console, 'warn');
    const directive = new LdTrackDirective(mockElementRef, mockLdService);
    // Access private method for testing
    (directive as any).trackEvent(new Event('click'));
    
    expect(console.warn).toHaveBeenCalledWith('[LdTrackDirective] Cannot track event: no event key provided');
  });
});

@Component({
  template: `
    <button [ldTrack]="'button-clicked'">Click me</button>
  `
})
class TestComponent {}