import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { LaunchDarklyService } from './launchdarkly.service';

/**
 * Structural directive that conditionally renders content based on a LaunchDarkly feature flag.
 * 
 * @example
 * ```html
 * <!-- Simple boolean flag -->
 * <div *ldIf="'new-feature'; fallback: false">New feature content</div>
 * 
 * <!-- String flag with specific value -->
 * <div *ldIf="'user-tier'; fallback: 'basic'; value: 'premium'">Premium content</div>
 * 
 * <!-- Number flag -->
 * <div *ldIf="'max-items'; fallback: 5; value: 10">Show 10 items</div>
 * ```
 */
@Directive({
  selector: '[ldIf]'
})
export class LdIfDirective implements OnInit, OnDestroy {
  private subscription?: Subscription;
  private currentFlagKey?: string;
  private currentFallback?: any;
  private currentValue?: any;
  private instanceId = Math.random().toString(36).substr(2, 9);

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private ldService: LaunchDarklyService,
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * The feature flag key to evaluate
   */
  @Input() set ldIf(flagKey: string) {
    this.currentFlagKey = flagKey;
    this.updateSubscription();
  }

  /**
   * The fallback value to use if the flag is not available or evaluation fails
   */
  @Input() set ldIfFallback(fallback: any) {
    this.currentFallback = fallback;
    this.updateSubscription();
  }

  /**
   * The specific value to check for. If provided, content is shown only if flag equals this value.
   * If not provided, content is shown if flag is truthy.
   */
  @Input() set ldIfValue(value: any) {
    this.currentValue = value;
    this.updateSubscription();
  }

  ngOnInit() {
    this.updateSubscription();
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  private updateSubscription() {
    // Clean up existing subscription
    this.subscription?.unsubscribe();

    // Only create subscription if we have a flag key
    if (!this.currentFlagKey) {
      return;
    }

    // Subscribe to flag changes
    this.subscription = this.ldService.variation$(this.currentFlagKey, this.currentFallback)
      .subscribe(flagValue => {
        const shouldShow = this.shouldShowContent(flagValue);
        this.updateView(shouldShow);
      });
  }

  private shouldShowContent(flagValue: any): boolean {
    // If a specific value is provided, check for exact match
    if (this.currentValue !== undefined) {
      return flagValue === this.currentValue;
    }
    
    // Otherwise, check if flag value is truthy
    return Boolean(flagValue);
  }

  private updateView(shouldShow: boolean) {
    if (shouldShow) {
      // Create and insert the view
      if (this.viewContainer.length === 0) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.cdr.markForCheck();
      }
    } else {
      // Clear the view
      this.viewContainer.clear();
      this.cdr.markForCheck();
    }
  }
}
