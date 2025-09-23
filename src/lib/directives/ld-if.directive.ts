import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { LaunchDarklyService } from '../services/launchdarkly.service';

/**
 * Structural directive that conditionally renders content based on a LaunchDarkly feature flag.
 * Similar to Angular's *ngIf, but reactive to LaunchDarkly flag changes.
 * 
 * ## Parameters
 * 
 * ### ldIf (required)
 * - **Type**: `string`
 * - **Description**: The LaunchDarkly feature flag key to evaluate
 * - **Example**: `'new-feature'`, `'user-tier'`, `'max-items'`
 * 
 * ### ldIfFallback (optional)
 * - **Type**: `any`
 * - **Description**: Default value to use if the flag is not available or evaluation fails
 * - **Default**: `undefined`
 * - **Example**: `false`, `'basic'`, `5`, `{}`
 * 
 * ### ldIfValue (optional)
 * - **Type**: `any`
 * - **Description**: Specific value to check for. If provided, content is shown only if flag equals this value.
 *   If not provided, content is shown if flag is truthy.
 * - **Default**: `undefined`
 * - **Example**: `'premium'`, `10`, `true`
 * 
 * ### ldIfElse (optional)
 * - **Type**: `TemplateRef<any>`
 * - **Description**: Template to show when the condition is false
 * - **Default**: `undefined`
 * - **Example**: `#premiumUnavailable`
 * 
 * ## Usage Examples
 * 
 * ### Basic Boolean Flag
 * ```html
 * <!-- Show content when 'new-feature' flag is true -->
 * <div *ldIf="'new-feature'; fallback: false">
 *   <h2>🎉 New Feature Available!</h2>
 *   <p>Check out our latest feature.</p>
 * </div>
 * ```
 * 
 * ### String Flag with Specific Value
 * ```html
 * <!-- Show content only when 'user-tier' equals 'premium' -->
 * <div *ldIf="'user-tier'; fallback: 'basic'; value: 'premium'">
 *   <div class="premium-badge">Premium User</div>
 *   <p>Welcome to premium features!</p>
 * </div>
 * ```
 * 
 * ### Number Flag
 * ```html
 * <!-- Show content when 'max-items' equals 10 -->
 * <div *ldIf="'max-items'; fallback: 5; value: 10">
 *   <p>Showing 10 items (premium limit)</p>
 * </div>
 * ```
 * 
 * ### With Else Template
 * ```html
 * <!-- Show different content based on flag value -->
 * <ng-template [ldIf]="'premium-feature'" [ldIfFallback]="false" [ldIfElse]="premiumUnavailable">
 *   <div class="premium-content">
 *     <h3>Premium Feature</h3>
 *     <p>This is exclusive premium content.</p>
 *   </div>
 * </ng-template>
 * 
 * <ng-template #premiumUnavailable>
 *   <div class="upgrade-prompt">
 *     <h3>Upgrade Required</h3>
 *     <p>This feature is available for premium users only.</p>
 *     <button>Upgrade Now</button>
 *   </div>
 * </ng-template>
 * ```
 * 
 * ### Complex Object Flag
 * ```html
 * <!-- Show content when feature config is enabled -->
 * <div *ldIf="'feature-config'; fallback: {enabled: false}; value: {enabled: true}">
 *   <div class="feature-panel">
 *     <h3>Advanced Features</h3>
 *     <p>Advanced features are now available!</p>
 *   </div>
 * </div>
 * ```
 * 
 * ## Best Practices
 * 
 * 1. **Always provide a fallback**: Use `ldIfFallback` to ensure your app works when LaunchDarkly is unavailable
 * 2. **Provide else templates**: Use `ldIfElse` to show alternative content when conditions aren't met
 */
@Directive({
  selector: '[ldIf]'
})
export class LdIfDirective implements OnInit, OnDestroy {
  private subscription?: Subscription;
  private currentFlagKey?: string;
  private currentFallback?: any;
  private currentValue?: any;
  private elseTemplate?: TemplateRef<any>;
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

  /**
   * Template to show when the condition is false
   */
  @Input() set ldIfElse(template: TemplateRef<any>) {
    this.elseTemplate = template;
    this.updateSubscription();
  }

  ngOnInit() {
    this.updateSubscription();
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  /**
   * Updates the subscription to LaunchDarkly flag changes.
   * Cleans up existing subscription and creates a new one if a flag key is available.
   */
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

  /**
   * Determines whether the content should be shown based on the flag value.
   * 
   * @param flagValue - The current value of the LaunchDarkly flag
   * @returns true if the content should be shown, false otherwise
   */
  private shouldShowContent(flagValue: any): boolean {
    // If a specific value is provided, check for exact match
    if (this.currentValue !== undefined) {
      return flagValue === this.currentValue;
    }
    
    // Otherwise, check if flag value is truthy
    return Boolean(flagValue);
  }

  /**
   * Updates the view based on whether content should be shown.
   * Shows the main template or the else template accordingly.
   * 
   * @param shouldShow - Whether the main content should be displayed
   */
  private updateView(shouldShow: boolean) {
    // Clear existing views
    this.viewContainer.clear();

    if (shouldShow) {
      // Show the main template
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      // Show the else template if provided
      if (this.elseTemplate) {
        this.viewContainer.createEmbeddedView(this.elseTemplate);
      }
    }
    
    this.cdr.markForCheck();
  }
}
