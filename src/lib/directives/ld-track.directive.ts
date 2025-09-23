import { Directive, Input, ElementRef, Renderer2, OnInit, OnDestroy, OnChanges, SimpleChanges, inject } from '@angular/core';
import { LaunchDarklyService } from '../services/launchdarkly.service';

/**
 * Directive that automatically tracks events when users interact with elements.
 * Supports tracking on click, hover, focus, and other DOM events.
 * 
 * ## Parameters
 * 
 * ### ldTrack (required)
 * - **Type**: `string`
 * - **Description**: The event key/name to track
 * - **Example**: `'button-clicked'`, `'purchase'`, `'conversion'`, `'hover-detected'`
 * 
 * ### ldTrackData (optional)
 * - **Type**: `any`
 * - **Description**: Custom data to associate with the event
 * - **Default**: `undefined`
 * - **Example**: `{product: 'premium', price: 29.99}`, `{section: 'hero'}`, `{userId: '123'}`
 * 
 * ### ldTrackValue (optional)
 * - **Type**: `number`
 * - **Description**: Numeric metric value for the event (useful for conversions)
 * - **Default**: `undefined`
 * - **Example**: `29.99`, `100`, `1`
 * 
 * ### ldTrackEvent (optional)
 * - **Type**: `string`
 * - **Description**: The DOM event to listen for
 * - **Default**: `'click'`
 * - **Example**: `'click'`, `'mouseenter'`, `'focus'`, `'submit'`
 * 
 * ## Supported Events
 * 
 * The directive supports any DOM event that can be listened to on the target element.
 * Common events include:
 * - `'click'` - When element is clicked
 * - `'mouseenter'` - When user hovers over element
 * - `'mouseleave'` - When user stops hovering
 * - `'focus'` - When element receives focus
 * - `'blur'` - When element loses focus
 * - `'keydown'` - When user presses a key
 * - `'submit'` - When form is submitted
 * - `'play'` - When video/audio starts playing
 * - `'pause'` - When video/audio is paused
 * - `'load'` - When element finishes loading
 * - `'error'` - When element encounters an error
 * - `'scroll'` - When element is scrolled
 * - `'resize'` - When element is resized
 * - Any other valid DOM event name
 * 
 * ## Usage Examples
 * 
 * ### Basic Click Tracking
 * ```html
 * <!-- Simple click tracking -->
 * <button [ldTrack]="'button-clicked'" class="btn btn-primary">
 *   Click me
 * </button>
 * 
 * <!-- Track button clicks with element info -->
 * <button [ldTrack]="'cta-clicked'" class="btn btn-success">
 *   Get Started
 * </button>
 * ```
 * 
 * ### E-commerce Tracking
 * ```html
 * <!-- Track product purchases -->
 * <button [ldTrack]="'purchase'" 
 *         [ldTrackData]="{product: 'premium', price: 29.99, category: 'subscription'}"
 *         [ldTrackValue]="29.99"
 *         class="btn btn-success">
 *   Buy Premium - $29.99
 * </button>
 * 
 * <!-- Track add to cart -->
 * <button [ldTrack]="'add-to-cart'" 
 *         [ldTrackData]="{productId: 'abc123', productName: 'Widget', price: 19.99}"
 *         class="btn btn-primary">
 *   Add to Cart
 * </button>
 * 
 * <!-- Track checkout completion -->
 * <button [ldTrack]="'checkout-completed'" 
 *         [ldTrackData]="{orderId: 'order-123', total: 49.98, items: 2}"
 *         [ldTrackValue]="49.98"
 *         class="btn btn-success">
 *   Complete Order
 * </button>
 * ```
 * 
 * ### User Interaction Tracking
 * ```html
 * <!-- Track hover events -->
 * <div [ldTrack]="'hover-detected'" 
 *      [ldTrackEvent]="'mouseenter'" 
 *      [ldTrackData]="{section: 'hero', element: 'banner'}"
 *      class="hero-banner">
 *   Hover me to see tracking
 * </div>
 * 
 * <!-- Track focus events -->
 * <input [ldTrack]="'input-focused'" 
 *        [ldTrackEvent]="'focus'" 
 *        [ldTrackData]="{field: 'email', form: 'signup'}"
 *        type="email" 
 *        placeholder="Enter your email">
 * 
 * <!-- Track form submissions -->
 * <form [ldTrack]="'form-submitted'" 
 *       [ldTrackEvent]="'submit'" 
 *       [ldTrackData]="{formName: 'contact', fields: 3}">
 *   <input type="text" placeholder="Name">
 *   <input type="email" placeholder="Email">
 *   <textarea placeholder="Message"></textarea>
 *   <button type="submit">Send Message</button>
 * </form>
 * ```
 * 
 * ### Feature Usage Tracking
 * ```html
 * <!-- Track feature usage -->
 * <button [ldTrack]="'feature-used'" 
 *         [ldTrackData]="{feature: 'export', format: 'pdf', userId: 'user123'}"
 *         class="btn btn-outline">
 *   Export as PDF
 * </button>
 * 
 * <!-- Track navigation -->
 * <a [ldTrack]="'navigation-clicked'" 
 *   [ldTrackData]="{destination: 'dashboard', source: 'sidebar'}"
 *   href="/dashboard">
 *   Go to Dashboard
 * </a>
 * 
 * <!-- Track search -->
 * <button [ldTrack]="'search-performed'" 
 *         [ldTrackData]="{query: 'angular', results: 25, filters: ['tutorial']}"
 *         class="btn btn-primary">
 *   Search
 * </button>
 * ```
 * 
 * ### A/B Testing Tracking
 * ```html
 * <!-- Track A/B test interactions -->
 * <button [ldTrack]="'ab-test-clicked'" 
 *         [ldTrackData]="{test: 'button-color', variant: 'red', userId: 'user123'}"
 *         class="btn btn-danger">
 *   Red Button (A/B Test)
 * </button>
 * 
 * <button [ldTrack]="'ab-test-clicked'" 
 *         [ldTrackData]="{test: 'button-color', variant: 'blue', userId: 'user123'}"
 *         class="btn btn-primary">
 *   Blue Button (A/B Test)
 * </button>
 * ```
 * 
 * ### User Journey Tracking
 * ```html
 * <!-- Track user journey steps -->
 * <div [ldTrack]="'journey-step'" 
 *      [ldTrackData]="{step: 1, journey: 'onboarding', action: 'welcome-viewed'}"
 *      class="welcome-step">
 *   Welcome to our app!
 * </div>
 * 
 * <button [ldTrack]="'journey-step'" 
 *         [ldTrackData]="{step: 2, journey: 'onboarding', action: 'profile-created'}"
 *         class="btn btn-primary">
 *   Create Profile
 * </button>
 * 
 * <button [ldTrack]="'journey-step'" 
 *         [ldTrackData]="{step: 3, journey: 'onboarding', action: 'first-feature-used'}"
 *         class="btn btn-success">
 *   Try First Feature
 * </button>
 * ```
 * 
 * ### Error and Performance Tracking
 * ```html
 * <!-- Track error occurrences -->
 * <button [ldTrack]="'error-encountered'" 
 *         [ldTrackData]="{error: 'network-timeout', component: 'user-list', userId: 'user123'}"
 *         class="btn btn-warning">
 *   Report Error
 * </button>
 * 
 * <!-- Track performance metrics -->
 * <div [ldTrack]="'performance-metric'" 
 *      [ldTrackData]="{metric: 'page-load', duration: 1250, page: 'dashboard'}"
 *      [ldTrackValue]="1250">
 *   Page loaded in 1.25s
 * </div>
 * ```
 * 
 * ### Media Event Tracking
 * ```html
 * <!-- Track video play events -->
 * <video [ldTrack]="'video-played'" 
 *        [ldTrackEvent]="'play'" 
 *        [ldTrackData]="{videoId: 'intro-video', duration: 120}"
 *        controls>
 *   <source src="intro.mp4" type="video/mp4">
 * </video>
 * 
 * <!-- Track audio pause events -->
 * <audio [ldTrack]="'audio-paused'" 
 *        [ldTrackEvent]="'pause'" 
 *        [ldTrackData]="{trackId: 'background-music'}"
 *        controls>
 *   <source src="music.mp3" type="audio/mpeg">
 * </audio>
 * ```
 * 
 * ### Custom Event Tracking
 * ```html
 * <!-- Track custom events -->
 * <div [ldTrack]="'custom-event'" 
 *      [ldTrackEvent]="'custom-event'" 
 *      [ldTrackData]="{eventType: 'custom', data: 'special-action'}"
 *      class="custom-element">
 *   Custom element
 * </div>
 * ```
 * 
 */
@Directive({
  selector: '[ldTrack]'
})
export class LdTrackDirective implements OnInit, OnDestroy, OnChanges {
  private _eventKey?: string;
  private _eventData?: unknown;
  private _metricValue?: number;
  private _eventType = 'click';
  private _eventListener?: () => void;

  private elementRef = inject(ElementRef);
  private renderer = inject(Renderer2);
  private ldService = inject(LaunchDarklyService);

  /**
   * The event key/name to track
   */
  @Input() set ldTrack(eventKey: string) {
    this._eventKey = eventKey;
  }

  /**
   * Custom data to associate with the event
   */
  @Input() set ldTrackData(data: unknown) {
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
    if (this._eventType !== event) {
      this._eventType = event;
      this.updateEventListener();
    }
  }

  ngOnInit() {
    // Validate that we have an event key
    if (!this._eventKey) {
      console.warn('[LdTrackDirective] No event key provided. Use [ldTrack]="event-name"');
    }
    this.updateEventListener();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['ldTrackEvent'] || changes['ldTrack']) {
      this.updateEventListener();
    }
  }

  ngOnDestroy() {
    this.removeEventListener();
  }


  /**
   * Updates the event listener based on the current event type.
   * Removes any existing listener and adds a new one if an event key is provided.
   */
  private updateEventListener() {
    this.removeEventListener();
    
    if (this._eventKey) {
      this._eventListener = this.renderer.listen(
        this.elementRef.nativeElement,
        this._eventType,
        () => this.trackEvent()
      );
    }
  }

  /**
   * Removes the current event listener if one exists.
   */
  private removeEventListener() {
    if (this._eventListener) {
      this._eventListener();
      this._eventListener = undefined;
    }
  }


  /**
   * Internal method that handles the actual event tracking.
   * Enhances the provided data with element information and tracks the event via LaunchDarkly.
   */
  private trackEvent() {
    if (!this._eventKey) {
      console.warn('[LdTrackDirective] Cannot track event: no event key provided');
      return;
    }

    // Enhance the data with element information
    const enhancedData = {
      ...(this._eventData as Record<string, unknown>),
      element: {
        tagName: this.elementRef.nativeElement.tagName.toLowerCase(),
        id: this.elementRef.nativeElement.id,
        className: this.elementRef.nativeElement.className,
      },
      eventType: this._eventType
    };

    // Track the event
    this.ldService.track(this._eventKey!, enhancedData, this._metricValue);
    
  }
}
