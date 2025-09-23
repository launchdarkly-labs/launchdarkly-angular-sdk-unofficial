import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { LaunchDarklyService } from '../services/launchdarkly.service';

/**
 * Universal structural directive for LaunchDarkly feature flags.
 * Supports any flag type (boolean, string, number, object) with flexible content injection.
 * 
 * @example
 * ```html
 * <!-- Boolean flag with conditional rendering -->
 * <ng-template [ldFlag]="'new-feature'" [ldFlagFallback]="false" let-enabled>
 *   <div *ngIf="enabled">New feature content</div>
 * </ng-template>
 * 
 * <!-- String flag with text injection -->
 * <ng-template [ldFlag]="'welcome-message'" [ldFlagFallback]="'Welcome!'" let-message>
 *   <h1>{{ message }}</h1>
 * </ng-template>
 * 
 * <!-- Number flag with value comparison -->
 * <ng-template [ldFlag]="'max-items'" [ldFlagFallback]="5" let-maxItems>
 *   <div>Showing {{ maxItems }} items</div>
 * </div>
 * 
 * <!-- Object flag with complex data -->
 * <ng-template [ldFlag]="'user-config'" [ldFlagFallback]="{}" let-config>
 *   <div>Theme: {{ config.theme || 'default' }}</div>
 * </ng-template>
 * 
 * <!-- With else template for fallback content -->
 * <ng-template [ldFlag]="'premium-feature'" [ldFlagFallback]="false" [ldFlagElse]="premiumUnavailable" let-enabled>
 *   <div *ngIf="enabled">Premium content</div>
 * </ng-template>
 * 
 * <ng-template #premiumUnavailable>
 *   <div>Premium feature not available</div>
 * </ng-template>
 * ```
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
        isEmpty: this.isEmpty(flagValue),
        isTruthy: Boolean(flagValue)
      });
    }
    
    this.cdr.markForCheck();
  }

  private isEmpty(value: any): boolean {
    return value === null || value === undefined || value === '' || 
           (Array.isArray(value) && value.length === 0) ||
           (typeof value === 'object' && Object.keys(value).length === 0);
  }
}
