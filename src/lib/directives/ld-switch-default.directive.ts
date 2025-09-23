import { Directive, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { LdSwitchDirective } from './ld-switch.directive';

/**
 * Directive for the default case in ldSwitch.
 * Shows when no other case matches the LaunchDarkly flag value.
 * This is the fallback content that displays when none of the ldSwitchCase
 * directives match the current flag value.
 * 
 * ## Parameters
 * 
 * This directive has no parameters. It automatically displays when no other case matches.
 * 
 * ## Usage Examples
 * 
 * ### Basic Default Case
 * ```html
 * <ng-container [ldSwitch]="'user-tier'" [ldSwitchFallback]="'basic'">
 *   <ng-template [ldSwitchCase]="'basic'">
 *     <div class="basic-plan">
 *       <h3>Basic Plan</h3>
 *       <p>Perfect for individuals</p>
 *     </div>
 *   </ng-template>
 *   <ng-template [ldSwitchCase]="'premium'">
 *     <div class="premium-plan">
 *       <h3>Premium Plan</h3>
 *       <p>Great for teams</p>
 *     </div>
 *   </ng-template>
 *   <ng-template ldSwitchDefault>
 *     <div class="unknown-plan">
 *       <h3>Unknown Plan</h3>
 *       <p>Please contact support to verify your plan.</p>
 *       <button class="btn btn-secondary">Contact Support</button>
 *     </div>
 *   </ng-template>
 * </ng-container>
 * ```
 * 
 * ### Error Handling Default Case
 * ```html
 * <ng-container [ldSwitch]="'feature-set'" [ldSwitchFallback]="'basic'">
 *   <ng-template [ldSwitchCase]="'basic'">
 *     <div class="basic-features">
 *       <h3>Basic Features</h3>
 *       <p>Standard feature set</p>
 *     </div>
 *   </ng-template>
 *   <ng-template [ldSwitchCase]="'premium'">
 *     <div class="premium-features">
 *       <h3>Premium Features</h3>
 *       <p>Advanced feature set</p>
 *     </div>
 *   </ng-template>
 *   <ng-template ldSwitchDefault>
 *     <div class="error-state">
 *       <h3>⚠️ Configuration Error</h3>
 *       <p>Unable to determine your feature set. Please refresh the page or contact support.</p>
 *       <div class="error-actions">
 *         <button class="btn btn-primary" (click)="refreshPage()">Refresh Page</button>
 *         <button class="btn btn-secondary" (click)="contactSupport()">Contact Support</button>
 *       </div>
 *     </div>
 *   </ng-template>
 * </ng-container>
 * ```
 * 
 * ### Fallback Content Default Case
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
 *   <ng-template ldSwitchDefault>
 *     <div class="fallback-theme">
 *       <h3>Default Theme</h3>
 *       <p>Using the default theme as fallback</p>
 *       <div class="theme-info">
 *         <p><strong>Note:</strong> Your theme preference could not be determined.</p>
 *         <p>You can change your theme in the settings.</p>
 *       </div>
 *       <button class="btn btn-outline" (click)="openSettings()">Open Settings</button>
 *     </div>
 *   </ng-template>
 * </ng-container>
 * ```
 * 
 * ### Loading State Default Case
 * ```html
 * <ng-container [ldSwitch]="'user-status'" [ldSwitchFallback]="'loading'">
 *   <ng-template [ldSwitchCase]="'active'">
 *     <div class="active-user">
 *       <h3>Welcome Back!</h3>
 *       <p>Your account is active and ready to use.</p>
 *     </div>
 *   </ng-template>
 *   <ng-template [ldSwitchCase]="'inactive'">
 *     <div class="inactive-user">
 *       <h3>Account Inactive</h3>
 *       <p>Your account is currently inactive.</p>
 *     </div>
 *   </ng-template>
 *   <ng-template [ldSwitchCase]="'suspended'">
 *     <div class="suspended-user">
 *       <h3>Account Suspended</h3>
 *       <p>Your account has been suspended.</p>
 *     </div>
 *   </ng-template>
 *   <ng-template ldSwitchDefault>
 *     <div class="loading-state">
 *       <h3>Loading...</h3>
 *       <div class="spinner"></div>
 *       <p>Determining your account status</p>
 *     </div>
 *   </ng-template>
 * </ng-container>
 * ```
 * 
 * ### Complex Default Case with Actions
 * ```html
 * <ng-container [ldSwitch]="'plan-type'" [ldSwitchFallback]="'unknown'">
 *   <ng-template [ldSwitchCase]="'free'">
 *     <div class="free-plan">
 *       <h3>Free Plan</h3>
 *       <p>Basic features available</p>
 *     </div>
 *   </ng-template>
 *   <ng-template [ldSwitchCase]="'pro'">
 *     <div class="pro-plan">
 *       <h3>Pro Plan</h3>
 *       <p>Advanced features available</p>
 *     </div>
 *   </ng-template>
 *   <ng-template [ldSwitchCase]="'enterprise'">
 *     <div class="enterprise-plan">
 *       <h3>Enterprise Plan</h3>
 *       <p>All features available</p>
 *     </div>
 *   </ng-template>
 *   <ng-template ldSwitchDefault>
 *     <div class="unknown-plan">
 *       <h3>Plan Status Unknown</h3>
 *       <p>We couldn't determine your current plan. This might be due to:</p>
 *       <ul>
 *         <li>Network connectivity issues</li>
 *         <li>Account configuration problems</li>
 *         <li>Temporary service unavailability</li>
 *       </ul>
 *       <div class="action-buttons">
 *         <button class="btn btn-primary" (click)="retry()">Retry</button>
 *         <button class="btn btn-secondary" (click)="contactSupport()">Contact Support</button>
 *         <button class="btn btn-outline" (click)="viewPlans()">View Available Plans</button>
 *       </div>
 *     </div>
 *   </ng-template>
 * </ng-container>
 * ```
 * 
 * ### Minimal Default Case
 * ```html
 * <ng-container [ldSwitch]="'feature-flag'" [ldSwitchFallback]="false">
 *   <ng-template [ldSwitchCase]="true">
 *     <div class="feature-enabled">
 *       <h3>Feature Available</h3>
 *       <p>This feature is now available to you!</p>
 *     </div>
 *   </ng-template>
 *   <ng-template [ldSwitchCase]="false">
 *     <div class="feature-disabled">
 *       <h3>Feature Not Available</h3>
 *       <p>This feature is not currently available.</p>
 *     </div>
 *   </ng-template>
 *   <ng-template ldSwitchDefault>
 *     <div class="feature-unknown">
 *       <p>Feature status unknown</p>
 *     </div>
 *   </ng-template>
 * </ng-container>
 * ```
 * 
 * ## Best Practices
 * 
 * 1. **Always include a default case**: Provide fallback content for unexpected flag values
 * 2. **Make default content helpful**: Include actionable information or next steps
 * 3. **Handle error states gracefully**: Provide clear error messages and recovery options
 * 4. **Use consistent styling**: Apply consistent CSS classes with other cases
 * 5. **Consider user experience**: Make default content informative but not alarming
 * 6. **Provide recovery actions**: Include buttons or links to help users resolve issues
 * 7. **Test edge cases**: Ensure default case works with various flag types and values
 * 8. **Use semantic HTML**: Structure default content with appropriate HTML elements
 * 9. **Consider accessibility**: Ensure default content is accessible to screen readers
 * 10. **Keep it simple**: Don't overwhelm users with complex default content
 */
@Directive({
  selector: '[ldSwitchDefault]'
})
export class LdSwitchDefaultDirective implements OnInit, OnDestroy {
  private view?: any;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private ldSwitch: LdSwitchDirective
  ) {}

  /**
   * Registers this default case with the parent LdSwitchDirective
   */
  ngOnInit() {
    this.ldSwitch.registerDefault(this);
  }

  /**
   * Unregisters this default case from the parent LdSwitchDirective
   */
  ngOnDestroy() {
    this.ldSwitch.unregisterDefault();
  }

  /**
   * Shows the default content by creating an embedded view
   */
  show() {
    if (!this.view) {
      this.view = this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }

  /**
   * Hides the default content by clearing the view container
   */
  hide() {
    if (this.view) {
      this.viewContainer.clear();
      this.view = undefined;
    }
  }
}
