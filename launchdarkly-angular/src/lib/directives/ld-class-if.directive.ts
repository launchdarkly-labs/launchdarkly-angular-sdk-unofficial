import { Directive, Input, ElementRef, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { LaunchDarklyService } from '../services/launchdarkly.service';

/**
 * Directive for conditionally applying CSS classes based on LaunchDarkly feature flags.
 * Similar to ngClass, but reactive to LaunchDarkly flag changes.
 * 
 * @example
 * ```html
 * <!-- Apply class when flag is truthy -->
 * <div [ldClassIf]="'premium-features'" [ldClass]="'premium-user'">
 *   User content
 * </div>
 * 
 * <!-- Apply class when flag matches specific value -->
 * <div [ldClassIf]="'user-tier'" [ldClassValue]="'premium'" [ldClass]="'premium-tier'">
 *   User content
 * </div>
 * 
 * <!-- Apply multiple classes -->
 * <div [ldClassIf]="'theme'" [ldClassValue]="'dark'" [ldClass]="'dark-theme active'">
 *   Themed content
 * </div>
 * 
 * <!-- Apply different classes based on condition -->
 * <div [ldClassIf]="'user-tier'" [ldClassValue]="'premium'" [ldClass]="'premium-user'" [ldClassElse]="'basic-user'">
 *   User content
 * </div>
 * 
 * <!-- Apply class when flag is false -->
 * <div [ldClassIf]="'premium-features'" [ldClassValue]="false" [ldClass]="'basic-user'">
 *   Basic user content
 * </div>
 * ```
 */
@Directive({
  selector: '[ldClassIf]'
})
export class LdClassIfDirective implements OnInit, OnDestroy {
  private subscription?: Subscription;
  private currentFlagKey?: string;
  private currentFallback?: any;
  private currentValue?: any;
  private currentClass?: string;
  private currentElseClass?: string;
  private instanceId = Math.random().toString(36).substr(2, 9);

  constructor(
    private elementRef: ElementRef,
    private ldService: LaunchDarklyService,
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * The feature flag key to evaluate
   */
  @Input() set ldClassIf(flagKey: string) {
    this.currentFlagKey = flagKey;
    this.updateSubscription();
  }

  /**
   * The fallback value to use if the flag is not available or evaluation fails
   */
  @Input() set ldClassFallback(fallback: any) {
    this.currentFallback = fallback;
    this.updateSubscription();
  }

  /**
   * The specific value to check for. If provided, class is applied only if flag equals this value.
   * If not provided, class is applied if flag is truthy.
   */
  @Input() set ldClassValue(expectedValue: any) {
    this.currentValue = expectedValue;
    this.updateSubscription();
  }

  /**
   * The CSS class(es) to apply when the condition is met.
   * Can be a single class name or multiple classes separated by spaces.
   */
  @Input() set ldClass(className: string) {
    this.currentClass = className;
    this.updateSubscription();
  }

  /**
   * The CSS class(es) to apply when the condition is not met.
   * Can be a single class name or multiple classes separated by spaces.
   */
  @Input() set ldClassElse(className: string) {
    this.currentElseClass = className;
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

    // Only create subscription if we have a flag key and at least one class
    if (!this.currentFlagKey || (!this.currentClass && !this.currentElseClass)) {
      return;
    }

    // Subscribe to flag changes
    this.subscription = this.ldService.variation$(this.currentFlagKey, this.currentFallback)
      .subscribe(flagValue => {
        this.updateClass(flagValue);
      });
  }

  private updateClass(flagValue: any) {
    const shouldApplyClass = this.shouldApplyClass(flagValue);
    
    if (shouldApplyClass) {
      this.addClass(this.currentClass);
      this.removeClass(this.currentElseClass);
    } else {
      this.removeClass(this.currentClass);
      this.addClass(this.currentElseClass);
    }
    
    this.cdr.markForCheck();
  }

  private shouldApplyClass(flagValue: any): boolean {
    // If a specific value is provided, check for exact match
    if (this.currentValue !== undefined) {
      return flagValue === this.currentValue;
    }
    
    // Otherwise, check if flag value is truthy
    return Boolean(flagValue);
  }

  private addClass(className?: string) {
    if (className) {
      const classes = className.split(' ').filter(cls => cls.trim());
      classes.forEach(cls => {
        if (cls.trim()) {
          this.elementRef.nativeElement.classList.add(cls.trim());
        }
      });
    }
  }

  private removeClass(className?: string) {
    if (className) {
      const classes = className.split(' ').filter(cls => cls.trim());
      classes.forEach(cls => {
        if (cls.trim()) {
          this.elementRef.nativeElement.classList.remove(cls.trim());
        }
      });
    }
  }
}
