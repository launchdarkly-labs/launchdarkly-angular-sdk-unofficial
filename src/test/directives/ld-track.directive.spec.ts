import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { LdTrackDirective } from '../../lib/directives/ld-track.directive';
import { LaunchDarklyService } from '../../lib/services/launchdarkly.service';
import { setupLaunchDarklyServiceWithMockedClient } from '../mocks/launchdarkly.mock';

describe('LdTrackDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let ldService: LaunchDarklyService;

  beforeEach(async () => {
    // Set up service with mocked client
    const setup = setupLaunchDarklyServiceWithMockedClient();

    await TestBed.configureTestingModule({
      declarations: [TestComponent, LdTrackDirective],
      providers: setup.providers
    }).compileComponents();

    // Get the real service with mocked client
    ldService = TestBed.inject(LaunchDarklyService);
    
    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    
    // Trigger change detection to initialize directives
    fixture.detectChanges();
  });

  describe('Directive Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should create directive instances', () => {
      const directives = fixture.debugElement.queryAll(By.directive(LdTrackDirective));
      expect(directives.length).toBe(8);
      
      directives.forEach(directive => {
        expect(directive.injector.get(LdTrackDirective)).toBeTruthy();
      });
    });

    it('should have correct directive properties', () => {
      const directive = fixture.debugElement.query(By.directive(LdTrackDirective)).injector.get(LdTrackDirective);
      
      // The directive should be created and have the expected properties
      expect(directive).toBeTruthy();
      expect(typeof directive.ngOnInit).toBe('function');
      expect(typeof directive.ngOnDestroy).toBe('function');
    });
  });

  describe('Basic Click Tracking', () => {
    it('should track events when clicked', () => {
      // Spy on the service track method
      spyOn(ldService, 'track');
      
      // Get the first button and click it
      const button = fixture.debugElement.query(By.css('#basic-click-button'));
      expect(button).toBeTruthy();
      button.nativeElement.click();
      
      // Verify that track was called with correct parameters
      expect(ldService.track).toHaveBeenCalledWith(
        'button-clicked',
        jasmine.objectContaining({
          element: jasmine.objectContaining({
            tagName: 'button',
            id: 'basic-click-button',
            className: ''
          }),
          eventType: 'click'
        }),
        undefined
      );
    });

    it('should track events with custom data when clicked', () => {
      // Spy on the service track method
      spyOn(ldService, 'track');
      
      // Get the purchase button and click it
      const button = fixture.debugElement.query(By.css('#purchase-button'));
      expect(button).toBeTruthy();
      button.nativeElement.click();
      
      // Verify that track was called with correct parameters
      expect(ldService.track).toHaveBeenCalledWith(
        'purchase',
        jasmine.objectContaining({
          product: 'premium',
          price: 29.99,
          element: jasmine.objectContaining({
            tagName: 'button',
            id: 'purchase-button'
          }),
          eventType: 'click'
        }),
        undefined
      );
    });

    it('should track events with metric value when clicked', () => {
      // Spy on the service track method
      spyOn(ldService, 'track');
      
      // Get the conversion button and click it
      const button = fixture.debugElement.query(By.css('#conversion-button'));
      expect(button).toBeTruthy();
      button.nativeElement.click();
      
      // Verify that track was called with correct parameters
      expect(ldService.track).toHaveBeenCalledWith(
        'conversion',
        jasmine.objectContaining({
          element: jasmine.objectContaining({
            tagName: 'button',
            id: 'conversion-button'
          }),
          eventType: 'click'
        }),
        29.99
      );
    });
  });

  describe('Custom Event Tracking', () => {
    it('should track mouseenter events', () => {
      // Spy on the service track method
      spyOn(ldService, 'track');
      
      // Get the hover element and trigger mouseenter
      const element = fixture.debugElement.query(By.css('#hover-element'));
      expect(element).toBeTruthy();
      element.nativeElement.dispatchEvent(new Event('mouseenter'));
      
      // Verify that track was called
      expect(ldService.track).toHaveBeenCalledWith(
        'hover-detected',
        jasmine.objectContaining({
          element: jasmine.objectContaining({
            tagName: 'div',
            id: 'hover-element'
          }),
          eventType: 'mouseenter'
        }),
        undefined
      );
    });

    it('should track focus events', () => {
      // Spy on the service track method
      spyOn(ldService, 'track');
      
      // Get the input and trigger focus
      const input = fixture.debugElement.query(By.css('#focus-input'));
      expect(input).toBeTruthy();
      input.nativeElement.dispatchEvent(new Event('focus'));
      
      // Verify that track was called
      expect(ldService.track).toHaveBeenCalledWith(
        'focus-gained',
        jasmine.objectContaining({
          element: jasmine.objectContaining({
            tagName: 'input',
            id: 'focus-input'
          }),
          eventType: 'focus'
        }),
        undefined
      );
    });

    it('should track keydown events', () => {
      // Spy on the service track method
      spyOn(ldService, 'track');
      
      // Get the keydown button and trigger keydown
      const button = fixture.debugElement.query(By.css('#keydown-button'));
      expect(button).toBeTruthy();
      button.nativeElement.dispatchEvent(new Event('keydown'));
      
      // Verify that track was called
      expect(ldService.track).toHaveBeenCalledWith(
        'key-pressed',
        jasmine.objectContaining({
          element: jasmine.objectContaining({
            tagName: 'button',
            id: 'keydown-button'
          }),
          eventType: 'keydown'
        }),
        undefined
      );
    });

    it('should track submit events', () => {
      // Spy on the service track method
      spyOn(ldService, 'track');
      
      // Get the form and trigger submit
      const form = fixture.debugElement.query(By.css('#submit-form'));
      expect(form).toBeTruthy();
      form.nativeElement.dispatchEvent(new Event('submit'));
      
      // Verify that track was called
      expect(ldService.track).toHaveBeenCalledWith(
        'form-submitted',
        jasmine.objectContaining({
          element: jasmine.objectContaining({
            tagName: 'form',
            id: 'submit-form'
          }),
          eventType: 'submit'
        }),
        undefined
      );
    });

    it('should track custom events', () => {
      // Spy on the service track method
      spyOn(ldService, 'track');
      
      // Get the video and trigger play
      const video = fixture.debugElement.query(By.css('#video-element'));
      expect(video).toBeTruthy();
      video.nativeElement.dispatchEvent(new Event('play'));
      
      // Verify that track was called
      expect(ldService.track).toHaveBeenCalledWith(
        'video-played',
        jasmine.objectContaining({
          element: jasmine.objectContaining({
            tagName: 'video',
            id: 'video-element'
          }),
          eventType: 'play'
        }),
        undefined
      );
    });
  });

  describe('Edge Cases', () => {
    it('should not track when event key is empty', () => {
      // Use the existing service spy from the main test setup
      spyOn(ldService, 'track');
      
      const testFixture = TestBed.createComponent(TestComponentEmptyKey);
      testFixture.detectChanges();
      
      const button = testFixture.debugElement.query(By.css('#empty-key-button'));
      button.nativeElement.click();
      
      // Should not track anything
      expect(ldService.track).not.toHaveBeenCalled();
    });
  });

  describe('Directive Lifecycle', () => {
    it('should clean up event listeners on destroy', () => {
      const testFixture = TestBed.createComponent(TestComponent);
      testFixture.detectChanges();
      
      const directive = testFixture.debugElement.query(By.directive(LdTrackDirective)).injector.get(LdTrackDirective);
      
      // Spy on the removeEventListener method
      spyOn(directive as unknown as { removeEventListener: () => void }, 'removeEventListener');
      
      // Destroy the component
      testFixture.destroy();
      
      // Should have called removeEventListener
      expect((directive as unknown as { removeEventListener: jasmine.Spy }).removeEventListener).toHaveBeenCalled();
    });
  });
});

@Component({
  template: `
    <button id="basic-click-button" [ldTrack]="'button-clicked'">Click me</button>
    <button id="purchase-button" [ldTrack]="'purchase'" [ldTrackData]="{product: 'premium', price: 29.99}">Buy</button>
    <button id="conversion-button" [ldTrack]="'conversion'" [ldTrackValue]="29.99">Convert</button>
    <div id="hover-element" [ldTrack]="'hover-detected'" [ldTrackEvent]="'mouseenter'">Hover me</div>
    <input id="focus-input" [ldTrack]="'focus-gained'" [ldTrackEvent]="'focus'">
    <button id="keydown-button" [ldTrack]="'key-pressed'" [ldTrackEvent]="'keydown'">Press key</button>
    <form id="submit-form" [ldTrack]="'form-submitted'" [ldTrackEvent]="'submit'">
      <button type="submit">Submit</button>
    </form>
    <video id="video-element" [ldTrack]="'video-played'" [ldTrackEvent]="'play'">Video</video>
  `
})
class TestComponent {}

@Component({
  template: `
    <button id="empty-key-button" [ldTrack]="eventKey">Click me</button>
  `
})
class TestComponentEmptyKey {
  eventKey = '';
}
