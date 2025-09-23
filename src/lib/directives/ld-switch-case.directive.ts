import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy, inject } from '@angular/core';
import { LdSwitchDirective } from './ld-switch.directive';
import type { LDFlagValue } from 'launchdarkly-js-client-sdk';

/**
 * Directive for individual cases in ldSwitch.
 * Registers itself with the parent LdSwitchDirective and displays its content
 * when the LaunchDarkly flag value matches the specified case value.
 * 
 * ## Parameters
 * 
 * ### ldSwitchCase (required)
 * - **Type**: `LDFlagValue`
 * - **Description**: The value to match against the LaunchDarkly flag value
 * - **Example**: `'premium'`, `'dark'`, `5`, `true`, `{enabled: true}`
 * 
 * ## Usage Examples
 * 
 * ### String Case Values
 * ```html
 * <ng-container [ldSwitch]="'user-tier'" [ldSwitchFallback]="'basic'">
 *   <ng-template [ldSwitchCase]="'basic'">
 *     <div class="basic-plan">
 *       <h3>Basic Plan</h3>
 *       <p>Perfect for individuals</p>
 *       <ul>
 *         <li>5 projects</li>
 *         <li>Basic support</li>
 *         <li>Standard features</li>
 *       </ul>
 *       <button class="btn btn-primary">Get Started</button>
 *     </div>
 *   </ng-template>
 *   <ng-template [ldSwitchCase]="'premium'">
 *     <div class="premium-plan">
 *       <h3>Premium Plan</h3>
 *       <p>Great for teams</p>
 *       <ul>
 *         <li>Unlimited projects</li>
 *         <li>Priority support</li>
 *         <li>Advanced features</li>
 *         <li>Analytics dashboard</li>
 *       </ul>
 *       <button class="btn btn-success">Upgrade Now</button>
 *     </div>
 *   </ng-template>
 *   <ng-template [ldSwitchCase]="'enterprise'">
 *     <div class="enterprise-plan">
 *       <h3>Enterprise Plan</h3>
 *       <p>For large organizations</p>
 *       <ul>
 *         <li>Unlimited everything</li>
 *         <li>24/7 support</li>
 *         <li>Custom integrations</li>
 *         <li>Dedicated account manager</li>
 *       </ul>
 *       <button class="btn btn-warning">Contact Sales</button>
 *     </div>
 *   </ng-template>
 *   <ng-template ldSwitchDefault>
 *     <div class="unknown-plan">
 *       <h3>Unknown Plan</h3>
 *       <p>Please contact support to verify your plan.</p>
 *     </div>
 *   </ng-template>
 * </ng-container>
 * ```
 * 
 * ### Number Case Values
 * ```html
 * <ng-container [ldSwitch]="'max-items'" [ldSwitchFallback]="5">
 *   <ng-template [ldSwitchCase]="5">
 *     <div class="limited-view">
 *       <h3>Limited View</h3>
 *       <p>Showing 5 items (basic plan)</p>
 *       <div class="items-grid">
 *         <!-- 5 items displayed -->
 *       </div>
 *     </div>
 *   </ng-template>
 *   <ng-template [ldSwitchCase]="10">
 *     <div class="standard-view">
 *       <h3>Standard View</h3>
 *       <p>Showing 10 items (premium plan)</p>
 *       <div class="items-grid">
 *         <!-- 10 items displayed -->
 *       </div>
 *     </div>
 *   </ng-template>
 *   <ng-template [ldSwitchCase]="25">
 *     <div class="premium-view">
 *       <h3>Premium View</h3>
 *       <p>Showing 25 items (premium plan)</p>
 *       <div class="items-grid">
 *         <!-- 25 items displayed -->
 *       </div>
 *     </div>
 *   </ng-template>
 *   <ng-template [ldSwitchCase]="100">
 *     <div class="unlimited-view">
 *       <h3>Unlimited View</h3>
 *       <p>Showing all items (enterprise plan)</p>
 *       <div class="items-grid">
 *         <!-- All items displayed -->
 *       </div>
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
 * ### Boolean Case Values
 * ```html
 * <ng-container [ldSwitch]="'new-feature'" [ldSwitchFallback]="false">
 *   <ng-template [ldSwitchCase]="true">
 *     <div class="new-feature-enabled">
 *       <h3>🎉 New Feature Available!</h3>
 *       <p>Check out our latest feature</p>
 *       <button class="btn btn-primary">Try New Feature</button>
 *       <div class="feature-preview">
 *         <!-- New feature content -->
 *       </div>
 *     </div>
 *   </ng-template>
 *   <ng-template [ldSwitchCase]="false">
 *     <div class="new-feature-disabled">
 *       <h3>Standard Interface</h3>
 *       <p>Using the standard interface</p>
 *       <div class="standard-content">
 *         <!-- Standard content -->
 *       </div>
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
 * ### Object Case Values
 * ```html
 * <ng-container [ldSwitch]="'feature-config'" [ldSwitchFallback]="{}">
 *   <ng-template [ldSwitchCase]="{enabled: true, level: 'basic'}">
 *     <div class="basic-features">
 *       <h3>Basic Features</h3>
 *       <p>Basic feature set enabled</p>
 *       <ul>
 *         <li>Feature A</li>
 *         <li>Feature B</li>
 *       </ul>
 *     </div>
 *   </ng-template>
 *   <ng-template [ldSwitchCase]="{enabled: true, level: 'premium'}">
 *     <div class="premium-features">
 *       <h3>Premium Features</h3>
 *       <p>Premium feature set enabled</p>
 *       <ul>
 *         <li>Feature A</li>
 *         <li>Feature B</li>
 *         <li>Feature C</li>
 *         <li>Feature D</li>
 *       </ul>
 *     </div>
 *   </ng-template>
 *   <ng-template [ldSwitchCase]="{enabled: false}">
 *     <div class="features-disabled">
 *       <h3>Features Disabled</h3>
 *       <p>All features are currently disabled</p>
 *     </div>
 *   </ng-template>
 *   <ng-template ldSwitchDefault>
 *     <div class="unknown-config">
 *       <h3>Unknown Configuration</h3>
 *       <p>Unable to determine feature configuration</p>
 *     </div>
 *   </ng-template>
 * </ng-container>
 * ```
 */
@Directive({
  selector: '[ldSwitchCase]'
})
export class LdSwitchCaseDirective implements OnInit, OnDestroy {
  /** The value to match against the LaunchDarkly flag value */
  @Input() ldSwitchCase!: LDFlagValue;
  
  private view?: unknown;

  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);
  private ldSwitch = inject(LdSwitchDirective);

  /**
   * Registers this case with the parent LdSwitchDirective
   */
  ngOnInit() {
    this.ldSwitch.registerCase(this.ldSwitchCase, this);
  }

  /**
   * Unregisters this case from the parent LdSwitchDirective
   */
  ngOnDestroy() {
    this.ldSwitch.unregisterCase(this.ldSwitchCase);
  }

  /**
   * Shows the case content by creating an embedded view
   */
  show() {
    if (!this.view) {
      this.view = this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }

  /**
   * Hides the case content by clearing the view container
   */
  hide() {
    if (this.view) {
      this.viewContainer.clear();
      this.view = undefined;
    }
  }
}
