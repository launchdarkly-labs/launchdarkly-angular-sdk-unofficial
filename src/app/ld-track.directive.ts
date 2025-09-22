import { Directive, Input, HostListener, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { LaunchDarklyService } from './launchdarkly.service';

/**
 * Directive that automatically tracks events when users interact with elements.
 * Supports tracking on click, hover, focus, and other DOM events.
 * 
 * @example
 * ```html
 * <!-- Simple click tracking -->
 * <button [ldTrack]="'button-clicked'">Click me</button>
 * 
 * <!-- Track with custom data -->
 * <button [ldTrack]="'purchase'; data: {product: 'premium', price: 29.99}">Buy Premium</button>
 * 
 * <!-- Track conversion with metric value -->
 * <button [ldTrack]="'conversion'; value: 29.99; data: {product: 'premium'}">Buy Premium</button>
 * 
 * <!-- Track on different events -->
 * <div [ldTrack]="'hover-detected'; event: 'mouseenter'; data: {section: 'hero'}">Hover me</div>
 * ```
 */
@Directive({
  selector: '[ldTrack]'
})
export class LdTrackDirective implements OnInit, OnDestroy {
  private _eventKey?: string;
  private _eventData?: any;
  private _metricValue?: number;
  private _eventType: string = 'click';

  constructor(
    private elementRef: ElementRef,
    private ldService: LaunchDarklyService
  ) {}

  /**
   * The event key/name to track
   */
  @Input() set ldTrack(eventKey: string) {
    this._eventKey = eventKey;
  }

  /**
   * Custom data to associate with the event
   */
  @Input() set ldTrackData(data: any) {
    this._eventData = data;
  }

  /**
   * Numeric metric value for the event (useful for conversions)
   */
  @Input() set ldTrackValue(value: number) {
    this._metricValue = value;
  }

  /**
   * The DOM event to listen for (default: 'click')
   */
  @Input() set ldTrackEvent(event: string) {
    this._eventType = event;
  }

  ngOnInit() {
    // Validate that we have an event key
    if (!this._eventKey) {
      console.warn('[LdTrackDirective] No event key provided. Use [ldTrack]="event-name"');
    }
  }

  ngOnDestroy() {
    // Cleanup handled by Angular's HostListener
  }

  /**
   * Default click handler - tracks the event when element is clicked
   */
  @HostListener('click', ['$event'])
  onClick(event: Event) {
    if (this._eventType === 'click') {
      this.trackEvent(event);
    }
  }

  /**
   * Mouse enter handler - tracks when user hovers over element
   */
  @HostListener('mouseenter', ['$event'])
  onMouseEnter(event: Event) {
    if (this._eventType === 'mouseenter') {
      this.trackEvent(event);
    }
  }

  /**
   * Mouse leave handler - tracks when user stops hovering
   */
  @HostListener('mouseleave', ['$event'])
  onMouseLeave(event: Event) {
    if (this._eventType === 'mouseleave') {
      this.trackEvent(event);
    }
  }

  /**
   * Focus handler - tracks when element receives focus
   */
  @HostListener('focus', ['$event'])
  onFocus(event: Event) {
    if (this._eventType === 'focus') {
      this.trackEvent(event);
    }
  }

  /**
   * Blur handler - tracks when element loses focus
   */
  @HostListener('blur', ['$event'])
  onBlur(event: Event) {
    if (this._eventType === 'blur') {
      this.trackEvent(event);
    }
  }

  /**
   * Keydown handler - tracks when user presses a key
   */
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (this._eventType === 'keydown') {
      this.trackEvent(event);
    }
  }

  /**
   * Submit handler - tracks form submissions
   */
  @HostListener('submit', ['$event'])
  onSubmit(event: Event) {
    if (this._eventType === 'submit') {
      this.trackEvent(event);
    }
  }

  /**
   * Generic event handler that can be used for custom events
   */
  @HostListener('document:custom-event', ['$event'])
  onCustomEvent(event: CustomEvent) {
    if (this._eventType === 'custom-event') {
      this.trackEvent(event);
    }
  }

  private trackEvent(event: Event) {
    if (!this._eventKey) {
      console.warn('[LdTrackDirective] Cannot track event: no event key provided');
      return;
    }

    // Enhance the data with element information
    const enhancedData = {
      ...this._eventData,
      element: {
        tagName: this.elementRef.nativeElement.tagName.toLowerCase(),
        id: this.elementRef.nativeElement.id,
        className: this.elementRef.nativeElement.className,
      },
      eventType: this._eventType
    };

    // Track the event
    this.ldService.track(this._eventKey, enhancedData, this._metricValue);
    
    console.log(`[LdTrackDirective] Tracked event: ${this._eventKey}`, enhancedData);
  }
}
