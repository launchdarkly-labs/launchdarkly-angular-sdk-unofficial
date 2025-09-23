import { Directive, Input, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { LaunchDarklyService } from '../services/launchdarkly.service';

/**
 * Container directive for LaunchDarkly feature flags with multiple cases.
 * Similar to Angular's ngSwitch, but reactive to LaunchDarkly flag changes.
 * 
 * @example
 * ```html
 * <ng-container [ldSwitch]="'user-tier'" [ldSwitchFallback]="'basic'">
 *   <ng-template [ldSwitchCase]="'basic'">
 *     <div>Basic user features</div>
 *   </ng-template>
 *   <ng-template [ldSwitchCase]="'premium'">
 *     <div>Premium user features</div>
 *   </ng-template>
 *   <ng-template [ldSwitchCase]="'enterprise'">
 *     <div>Enterprise user features</div>
 *   </ng-template>
 *   <ng-template ldSwitchDefault>
 *     <div>Unknown user tier</div>
 *   </ng-template>
 * </ng-container>
 * ```
 */
@Directive({
  selector: '[ldSwitch]'
})
export class LdSwitchDirective implements OnInit, OnDestroy {
  private subscription?: Subscription;
  private currentFlagKey?: string;
  private currentFallback?: any;
  private cases = new Map<any, any>();
  private defaultCase?: any;
  private currentFlagValue?: any;

  constructor(private ldService: LaunchDarklyService) {}

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
  @Input() set ldSwitchFallback(fallback: any) {
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
   * Register a case directive for a specific value
   */
  registerCase(value: any, caseDirective: any) {
    this.cases.set(value, caseDirective);
    this.updateCases();
  }

  /**
   * Unregister a case directive
   */
  unregisterCase(value: any) {
    this.cases.delete(value);
    this.updateCases();
  }

  /**
   * Register the default case directive
   */
  registerDefault(defaultDirective: any) {
    this.defaultCase = defaultDirective;
    this.updateCases();
  }

  /**
   * Unregister the default case directive
   */
  unregisterDefault() {
    this.defaultCase = undefined;
    this.updateCases();
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
        this.currentFlagValue = flagValue;
        this.updateCases();
      });
  }

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
