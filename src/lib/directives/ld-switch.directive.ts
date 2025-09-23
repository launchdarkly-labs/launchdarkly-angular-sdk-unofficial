import { Directive, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { LaunchDarklyService } from '../services/launchdarkly.service';
import type { LDFlagValue } from 'launchdarkly-js-client-sdk';

interface LdCaseDirective {
  show(): void;
  hide(): void;
}

/**
 * Container directive for LaunchDarkly feature flags with multiple cases.
 * Similar to Angular's ngSwitch, but reactive to LaunchDarkly flag changes.
 * 
 * ## Parameters
 * 
 * ### ldSwitch (required)
 * - **Type**: `string`
 * - **Description**: The LaunchDarkly feature flag key to evaluate
 * - **Example**: `'user-tier'`, `'theme'`, `'plan-type'`
 * 
 * ### ldSwitchFallback (optional)
 * - **Type**: `any`
 * - **Description**: Default value to use if the flag is not available or evaluation fails
 * - **Default**: `undefined`
 * - **Example**: `'basic'`, `'light'`, `'standard'`
 * 
 * ## Usage Examples
 * 
 * ### Basic User Tier Switch
 * ```html
 * <ng-container [ldSwitch]="'user-tier'" [ldSwitchFallback]="'basic'">
 *   <ng-template [ldSwitchCase]="'basic'">
 *     <div class="basic-features">
 *       <h3>Basic Plan</h3>
 *       <ul>
 *         <li>5 projects</li>
 *         <li>Basic support</li>
 *         <li>Standard features</li>
 *       </ul>
 *     </div>
 *   </ng-template>
 *   <ng-template [ldSwitchCase]="'premium'">
 *     <div class="premium-features">
 *       <h3>Premium Plan</h3>
 *       <ul>
 *         <li>Unlimited projects</li>
 *         <li>Priority support</li>
 *         <li>Advanced features</li>
 *         <li>Analytics dashboard</li>
 *       </ul>
 *     </div>
 *   </ng-template>
 *   <ng-template [ldSwitchCase]="'enterprise'">
 *     <div class="enterprise-features">
 *       <h3>Enterprise Plan</h3>
 *       <ul>
 *         <li>Unlimited everything</li>
 *         <li>24/7 support</li>
 *         <li>Custom integrations</li>
 *         <li>Dedicated account manager</li>
 *       </ul>
 *     </div>
 *   </ng-template>
 *   <ng-template ldSwitchDefault>
 *     <div class="unknown-tier">
 *       <h3>Unknown Plan</h3>
 *       <p>Please contact support to verify your plan.</p>
 *     </div>
 *   </ng-template>
 * </ng-container>
 * ```
 * 
 * ### Theme Switch
 * ```html
 * <ng-container [ldSwitch]="'theme'" [ldSwitchFallback]="'light'">
 *   <ng-template [ldSwitchCase]="'light'">
 *     <div class="light-theme">
 *       <h3>Light Theme</h3>
 *       <p>Clean and bright interface</p>
 *     </div>
 *   </ng-template>
 *   <ng-template [ldSwitchCase]="'dark'">
 *     <div class="dark-theme">
 *       <h3>Dark Theme</h3>
 *       <p>Easy on the eyes</p>
 *     </div>
 *   </ng-template>
 *   <ng-template [ldSwitchCase]="'auto'">
 *     <div class="auto-theme">
 *       <h3>Auto Theme</h3>
 *       <p>Follows system preference</p>
 *     </div>
 *   </ng-template>
 *   <ng-template ldSwitchDefault>
 *     <div class="default-theme">
 *       <h3>Default Theme</h3>
 *       <p>Using default theme</p>
 *     </div>
 *   </ng-template>
 * </ng-container>
 * ```
 * 
 * ### Feature Flag Switch
 * ```html
 * <ng-container [ldSwitch]="'feature-set'" [ldSwitchFallback]="'basic'">
 *   <ng-template [ldSwitchCase]="'basic'">
 *     <div class="basic-features">
 *       <h3>Basic Features</h3>
 *       <button class="btn btn-primary">Basic Action</button>
 *     </div>
 *   </ng-template>
 *   <ng-template [ldSwitchCase]="'advanced'">
 *     <div class="advanced-features">
 *       <h3>Advanced Features</h3>
 *       <button class="btn btn-primary">Basic Action</button>
 *       <button class="btn btn-secondary">Advanced Action</button>
 *       <button class="btn btn-success">Pro Action</button>
 *     </div>
 *   </ng-template>
 *   <ng-template [ldSwitchCase]="'premium'">
 *     <div class="premium-features">
 *       <h3>Premium Features</h3>
 *       <button class="btn btn-primary">Basic Action</button>
 *       <button class="btn btn-secondary">Advanced Action</button>
 *       <button class="btn btn-success">Pro Action</button>
 *       <button class="btn btn-warning">Premium Action</button>
 *       <button class="btn btn-info">Exclusive Action</button>
 *     </div>
 *   </ng-template>
 *   <ng-template ldSwitchDefault>
 *     <div class="fallback-features">
 *       <h3>Fallback Features</h3>
 *       <p>Using fallback feature set</p>
 *     </div>
 *   </ng-template>
 * </ng-container>
 * ```
 * 
 * ### Number-based Switch
 * ```html
 * <ng-container [ldSwitch]="'max-items'" [ldSwitchFallback]="5">
 *   <ng-template [ldSwitchCase]="5">
 *     <div class="limited-view">
 *       <h3>Limited View</h3>
 *       <p>Showing 5 items</p>
 *     </div>
 *   </ng-template>
 *   <ng-template [ldSwitchCase]="10">
 *     <div class="standard-view">
 *       <h3>Standard View</h3>
 *       <p>Showing 10 items</p>
 *     </div>
 *   </ng-template>
 *   <ng-template [ldSwitchCase]="25">
 *     <div class="premium-view">
 *       <h3>Premium View</h3>
 *       <p>Showing 25 items</p>
 *     </div>
 *   </ng-template>
 *   <ng-template [ldSwitchCase]="100">
 *     <div class="unlimited-view">
 *       <h3>Unlimited View</h3>
 *       <p>Showing all items</p>
 *     </div>
 *   </ng-template>
 *   <ng-template ldSwitchDefault>
 *     <div class="default-view">
 *       <h3>Default View</h3>
 *       <p>Using default item limit</p>
 *     </div>
 *   </ng-template>
 * </ng-container>
 * ```
 * 
 * ### Boolean Switch
 * ```html
 * <ng-container [ldSwitch]="'new-feature'" [ldSwitchFallback]="false">
 *   <ng-template [ldSwitchCase]="true">
 *     <div class="new-feature-enabled">
 *       <h3>🎉 New Feature Available!</h3>
 *       <p>Check out our latest feature</p>
 *       <button class="btn btn-primary">Try New Feature</button>
 *     </div>
 *   </ng-template>
 *   <ng-template [ldSwitchCase]="false">
 *     <div class="new-feature-disabled">
 *       <h3>Standard Interface</h3>
 *       <p>Using the standard interface</p>
 *     </div>
 *   </ng-template>
 *   <ng-template ldSwitchDefault>
 *     <div class="feature-status-unknown">
 *       <h3>Feature Status Unknown</h3>
 *       <p>Unable to determine feature status</p>
 *     </div>
 *   </ng-template>
 * </ng-container>
 * ```
 * 
 * ## Best Practices
 * 
 * 1. **Always provide a fallback**: Use `ldSwitchFallback` to ensure your app works when LaunchDarkly is unavailable
 * 2. **Use meaningful case values**: Choose case values that clearly indicate their purpose
 * 3. **Provide a default case**: Always include `ldSwitchDefault` to handle unexpected values
 * 4. **Keep cases focused**: Each case should represent a distinct state or feature set
 * 5. **Test with different flag values**: Ensure your switch works with various flag types and edge cases
 * 6. **Use consistent styling**: Apply consistent CSS classes across all cases for better maintainability
 * 7. **Consider accessibility**: Ensure all cases provide appropriate content for screen readers
 * 8. **Handle edge cases**: Test what happens when the flag value doesn't match any case
 */
@Directive({
  selector: '[ldSwitch]'
})
export class LdSwitchDirective implements OnInit, OnDestroy {
  private subscription?: Subscription;
  private currentFlagKey?: string;
  private currentFallback?: LDFlagValue;
  private cases = new Map<LDFlagValue, LdCaseDirective>();
  private defaultCase?: LdCaseDirective;
  private currentFlagValue?: LDFlagValue;

  private ldService = inject(LaunchDarklyService);

  /**
   * The feature flag key to evaluate
   */
  @Input() set ldSwitch(flagKey: string) {
    this.currentFlagKey = flagKey;
    this.updateSubscription();
  }

  /**
   * The fallback value to use if the flag is not available or evaluation fails
   */
  @Input() set ldSwitchFallback(fallback: LDFlagValue) {
    this.currentFallback = fallback;
    this.updateSubscription();
  }

  ngOnInit() {
    this.updateSubscription();
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  /**
   * Register a case directive for a specific value.
   * Called by LdSwitchCaseDirective during initialization.
   * 
   * @param value - The value that this case should match
   * @param caseDirective - The LdSwitchCaseDirective instance
   */
  registerCase(value: LDFlagValue, caseDirective: LdCaseDirective) {
    this.cases.set(value, caseDirective);
    this.updateCases();
  }

  /**
   * Unregister a case directive.
   * Called by LdSwitchCaseDirective during destruction.
   * 
   * @param value - The value of the case to unregister
   */
  unregisterCase(value: LDFlagValue) {
    this.cases.delete(value);
    this.updateCases();
  }

  /**
   * Register the default case directive.
   * Called by LdSwitchDefaultDirective during initialization.
   * 
   * @param defaultDirective - The LdSwitchDefaultDirective instance
   */
  registerDefault(defaultDirective: LdCaseDirective) {
    this.defaultCase = defaultDirective;
    this.updateCases();
  }

  /**
   * Unregister the default case directive.
   * Called by LdSwitchDefaultDirective during destruction.
   */
  unregisterDefault() {
    this.defaultCase = undefined;
    this.updateCases();
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
        this.currentFlagValue = flagValue;
        this.updateCases();
      });
  }

  /**
   * Updates the visibility of all cases based on the current flag value.
   * Shows the matching case or the default case, and hides all others.
   */
  private updateCases() {
    // Find the matching case
    const matchingCase = this.cases.get(this.currentFlagValue);
    
    if (matchingCase) {
      // Hide all cases
      this.cases.forEach(caseDirective => caseDirective.hide());
      if (this.defaultCase) {
        this.defaultCase.hide();
      }
      // Show the matching case
      matchingCase.show();
    } else if (this.defaultCase) {
      // Hide all cases
      this.cases.forEach(caseDirective => caseDirective.hide());
      // Show the default case
      this.defaultCase.show();
    }
  }
}
