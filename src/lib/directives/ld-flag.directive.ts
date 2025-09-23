import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { LaunchDarklyService } from '../services/launchdarkly.service';

/**
 * Universal structural directive for LaunchDarkly feature flags.
 * Supports any flag type (boolean, string, number, object) with flexible content injection.
 * The flag value is automatically injected into the template context for use in your template.
 * 
 * ## Parameters
 * 
 * ### ldFlag (required)
 * - **Type**: `string`
 * - **Description**: The LaunchDarkly feature flag key to evaluate
 * - **Example**: `'new-feature'`, `'welcome-message'`, `'user-config'`
 * 
 * ### ldFlagFallback (optional)
 * - **Type**: `any`
 * - **Description**: Default value to use if the flag is not available or evaluation fails
 * - **Default**: `undefined`
 * - **Example**: `false`, `'Welcome!'`, `5`, `{}`
 * 
 * ### ldFlagValue (optional)
 * - **Type**: `any`
 * - **Description**: Specific value to check for. If provided, content is shown only if flag equals this value.
 *   If not provided, the flag value itself is injected into the template context.
 * - **Default**: `undefined`
 * - **Example**: `'premium'`, `10`, `true`
 * 
 * ### ldFlagElse (optional)
 * - **Type**: `TemplateRef<any>`
 * - **Description**: Template to show when the condition is false (only used when 'ldFlagValue' is specified)
 * - **Default**: `undefined`
 * - **Example**: `#premiumUnavailable`
 * 
 * ### ldFlagLoading (optional)
 * - **Type**: `TemplateRef<any>`
 * - **Description**: Template to show while the flag is loading
 * - **Default**: `undefined`
 * - **Example**: `#loadingTemplate`
 * 
 * ## Template Context Variables
 * 
 * The directive automatically injects the following variables into your template context:
 * 
 * - **`$implicit`**: The current flag value (same as `flagValue`)
 * - **`flagValue`**: The current flag value
 * - **`fallback`**: The fallback value you provided
 * - **`isMatch`**: Boolean indicating if the flag value matches the expected value (only when `ldFlagValue` is specified)
 * 
 * ## Usage Examples
 * 
 * ### Boolean Flag with Conditional Rendering
 * ```html
 * <ng-template [ldFlag]="'new-feature'" [ldFlagFallback]="false" let-enabled>
 *   <div *ngIf="enabled" class="new-feature-banner">
 *     <h2>🎉 New Feature Available!</h2>
 *     <p>Check out our latest feature.</p>
 *   </div>
 * </ng-template>
 * ```
 * 
 * ### String Flag with Text Injection
 * ```html
 * <ng-template [ldFlag]="'welcome-message'" [ldFlagFallback]="'Welcome!'" let-message>
 *   <h1 class="welcome-header">{{ message }}</h1>
 * </ng-template>
 * ```
 * 
 * ### Number Flag with Value Display
 * ```html
 * <ng-template [ldFlag]="'max-items'" [ldFlagFallback]="5" let-maxItems>
 *   <div class="items-counter">
 *     <span>Showing {{ maxItems }} items</span>
 *     <progress [value]="maxItems" max="20"></progress>
 *   </div>
 * </ng-template>
 * ```
 * 
 * ### Object Flag with Complex Data
 * ```html
 * <ng-template [ldFlag]="'user-config'" [ldFlagFallback]="{}" let-config>
 *   <div class="user-config" [class.dark-theme]="config.theme === 'dark'">
 *     <h3>User Configuration</h3>
 *     <p>Theme: {{ config.theme || 'default' }}</p>
 *     <p>Language: {{ config.language || 'en' }}</p>
 *     <p>Notifications: {{ config.notifications ? 'Enabled' : 'Disabled' }}</p>
 *   </div>
 * </ng-template>
 * ```
 * 
 * ### With Else Template for Fallback Content
 * ```html
 * <ng-template [ldFlag]="'premium-feature'" [ldFlagFallback]="false" [ldFlagElse]="premiumUnavailable" let-enabled>
 *   <div *ngIf="enabled" class="premium-content">
 *     <h3>Premium Feature</h3>
 *     <p>This is exclusive premium content.</p>
 *   </div>
 * </ng-template>
 * 
 * <ng-template #premiumUnavailable>
 *   <div class="upgrade-prompt">
 *     <h3>Upgrade Required</h3>
 *     <p>This feature is available for premium users only.</p>
 *     <button class="upgrade-btn">Upgrade Now</button>
 *   </div>
 * </ng-template>
 * ```
 * 
 * ### Using Context Variables
 * ```html
 * <ng-template [ldFlag]="'user-data'" [ldFlagFallback]="null" let-userData let-isEmpty="isEmpty" let-isTruthy="isTruthy">
 *   <div class="user-info">
 *     <div *ngIf="!isEmpty && isTruthy">
 *       <h3>Welcome, {{ userData.name }}!</h3>
 *       <p>Email: {{ userData.email }}</p>
 *       <p>Plan: {{ userData.plan }}</p>
 *     </div>
 *     <div *ngIf="isEmpty" class="no-data">
 *       <p>No user data available</p>
 *     </div>
 *   </div>
 * </ng-template>
 * ```
 * 
 * ### Array Flag with Iteration
 * ```html
 * <ng-template [ldFlag]="'feature-list'" [ldFlagFallback]="[]" let-features>
 *   <div class="features-list">
 *     <h3>Available Features</h3>
 *     <ul>
 *       <li *ngFor="let feature of features" class="feature-item">
 *         {{ feature.name }}: {{ feature.description }}
 *       </li>
 *     </ul>
 *   </div>
 * </ng-template>
 * ```
 * 
 * ## Best Practices
 * 
 * 1. **Always provide a fallback**: Use `ldFlagFallback` to ensure your app works when LaunchDarkly is unavailable
 * 2. **Use template context variables**: Leverage the injected variables (`flagValue`, `isEmpty`, `isTruthy`) for better template logic
 * 3. **Handle different data types**: Ensure your templates work with various flag types (boolean, string, number, object, array)
 * 4. **Provide else templates**: Use `ldFlagElse` to show alternative content when conditions aren't met
 * 5. **Use loading templates**: Provide `ldFlagLoading` for better user experience during flag loading
 * 6. **Test with different flag values**: Ensure your templates work with various flag types and edge cases
 */
@Directive({
  selector: '[ldFlag]'
})
export class LdFlagDirective implements OnInit, OnDestroy {
  private subscription?: Subscription;
  private currentFlagKey?: string;
  private currentFallback?: any;
  private currentValue?: any;
  private elseTemplate?: TemplateRef<any>;
  private loadingTemplate?: TemplateRef<any>;
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
  @Input() set ldFlag(flagKey: string) {
    this.currentFlagKey = flagKey;
    this.updateSubscription();
  }

  /**
   * The fallback value to use if the flag is not available or evaluation fails
   */
  @Input() set ldFlagFallback(fallback: any) {
    this.currentFallback = fallback;
    this.updateSubscription();
  }

  /**
   * The specific value to check for. If provided, content is shown only if flag equals this value.
   * If not provided, the flag value itself is injected into the template context.
   */
  @Input() set ldFlagValue(expectedValue: any) {
    this.currentValue = expectedValue;
    this.updateSubscription();
  }

  /**
   * Template to show when the condition is false (only used when 'ldFlagValue' is specified)
   */
  @Input() set ldFlagElse(template: TemplateRef<any>) {
    this.elseTemplate = template;
    this.updateSubscription();
  }

  /**
   * Template to show while the flag is loading
   */
  @Input() set ldFlagLoading(template: TemplateRef<any>) {
    this.loadingTemplate = template;
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
        this.updateView(flagValue);
      });
  }

  /**
   * Updates the view based on the current flag value.
   * Injects the flag value into the template context and shows appropriate content.
   * 
   * @param flagValue - The current value of the LaunchDarkly flag
   */
  private updateView(flagValue: any) {
    // Clear existing views
    this.viewContainer.clear();

    // If a specific value is expected, check for exact match
    if (this.currentValue !== undefined) {
      const shouldShow = flagValue === this.currentValue;
      
      if (shouldShow) {
        // Show the main template with flag value in context
        this.viewContainer.createEmbeddedView(this.templateRef, {
          $implicit: flagValue,
          flagValue: flagValue,
          fallback: this.currentFallback,
          isMatch: true
        });
      } else {
        // Show the else template if provided
        if (this.elseTemplate) {
          this.viewContainer.createEmbeddedView(this.elseTemplate, {
            $implicit: flagValue,
            flagValue: flagValue,
            fallback: this.currentFallback,
            isMatch: false
          });
        }
      }
    } else {
      // No specific value expected - inject the flag value directly
      this.viewContainer.createEmbeddedView(this.templateRef, {
        $implicit: flagValue,
        flagValue: flagValue,
        fallback: this.currentFallback,
      });
    }
    
    this.cdr.markForCheck();
  }

  /**
   * Checks if a value is considered empty.
   * 
   * @param value - The value to check
   * @returns true if the value is empty, false otherwise
   */
  private isEmpty(value: any): boolean {
    return value === null || value === undefined || value === '' || 
           (Array.isArray(value) && value.length === 0) ||
           (typeof value === 'object' && Object.keys(value).length === 0);
  }
}
