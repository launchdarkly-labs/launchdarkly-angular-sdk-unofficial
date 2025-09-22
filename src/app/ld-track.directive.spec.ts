import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { LdTrackDirective } from './ld-track.directive';
import { LaunchDarklyService, LD_SERVICE_CONFIG } from './launchdarkly.service';

@Component({
  template: `
    <button [ldTrack]="'test-event'; data: {test: true}" data-testid="track-button">
      Track Event
    </button>
    <button [ldTrack]="'conversion'; value: 29.99; data: {product: 'test'}" data-testid="conversion-button">
      Track Conversion
    </button>
    <div [ldTrack]="'hover-event'; event: 'mouseenter'; data: {section: 'test'}" data-testid="hover-element">
      Hover me
    </div>
  `
})
class TestComponent {}

describe('LdTrackDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let mockLdService: jasmine.SpyObj<LaunchDarklyService>;

  beforeEach(async () => {
    mockLdService = jasmine.createSpyObj('LaunchDarklyService', ['track']);

    await TestBed.configureTestingModule({
      declarations: [TestComponent, LdTrackDirective],
      providers: [
        { provide: LaunchDarklyService, useValue: mockLdService },
        { provide: LD_SERVICE_CONFIG, useValue: { clientId: 'test', context: {} } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should track click events', () => {
    const button = fixture.debugElement.query(By.css('[data-testid="track-button"]'));
    button.nativeElement.click();
    
    expect(mockLdService.track).toHaveBeenCalledWith(
      'test-event',
      jasmine.objectContaining({
        test: true,
        element: jasmine.objectContaining({
          tagName: 'button'
        }),
        timestamp: jasmine.any(String),
        eventType: 'click'
      }),
      undefined
    );
  });

  it('should track conversion events with metric value', () => {
    const button = fixture.debugElement.query(By.css('[data-testid="conversion-button"]'));
    button.nativeElement.click();
    
    expect(mockLdService.track).toHaveBeenCalledWith(
      'conversion',
      jasmine.objectContaining({
        product: 'test',
        element: jasmine.objectContaining({
          tagName: 'button'
        }),
        timestamp: jasmine.any(String),
        eventType: 'click'
      }),
      29.99
    );
  });

  it('should track mouseenter events', () => {
    const element = fixture.debugElement.query(By.css('[data-testid="hover-element"]'));
    element.nativeElement.dispatchEvent(new Event('mouseenter'));
    
    expect(mockLdService.track).toHaveBeenCalledWith(
      'hover-event',
      jasmine.objectContaining({
        section: 'test',
        element: jasmine.objectContaining({
          tagName: 'div'
        }),
        timestamp: jasmine.any(String),
        eventType: 'mouseenter'
      }),
      undefined
    );
  });

  it('should not track events when event type does not match', () => {
    const element = fixture.debugElement.query(By.css('[data-testid="hover-element"]'));
    element.nativeElement.click(); // Click event on element configured for mouseenter
    
    expect(mockLdService.track).not.toHaveBeenCalled();
  });
});
