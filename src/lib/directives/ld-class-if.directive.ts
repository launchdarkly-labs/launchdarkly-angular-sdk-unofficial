import { Directive, Input, ElementRef, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { LaunchDarklyService } from '../services/launchdarkly.service';

/**
 * Directive for conditionally applying CSS classes based on LaunchDarkly feature flags.
 * Similar to ngClass, but reactive to LaunchDarkly flag changes.
 *
 * Examples (verbose existing API):
 * ```html
 * <!-- Apply class when flag is truthy -->
 * <div [ldClassIf]="'premium-features'" [ldClassIfClass]="'premium-user'"></div>
 *
 * <!-- Apply class when flag matches specific value -->
 * <div [ldClassIf]="'user-tier'" [ldClassIfValue]="'premium'" [ldClassIfClass]="'premium-tier'"></div>
 *
 * <!-- Apply different classes based on condition -->
 * <div [ldClassIf]="'user-tier'" [ldClassIfValue]="'premium'" [ldClassIfClass]="'premium-user'" [ldClassIfElseClass]="'basic-user'"></div>
 * ```
 *
 * Shorthand API (single binding):
 * ```html
 * <!-- String tuple: [flag, class] -->
 * <div [ldClassIf]="['premium-features', 'premium-user']"></div>
 *
 * <!-- Tuple: [flag, value, class, elseClass?] -->
 * <div [ldClassIf]="['user-tier', 'premium', 'premium-user', 'basic-user']"></div>
 *
 * <!-- Object config -->
 * <div [ldClassIf]="{ flag: 'theme', value: 'dark', class: 'dark-theme active' }"></div>
 * <div [ldClassIf]="{ flag: 'user-tier', value: 'premium', class: 'premium-user', elseClass: 'basic-user' }"></div>
 * ```
 */
type LdClassNames = string | string[] | undefined;
interface LdClassIfConfig {
  flag: string;
  class?: string | string[];
  elseClass?: string | string[];
  value?: any;
  fallback?: any;
}
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
   * Primary input. Supports:
   * - string: flag key
   * - tuple: [flag, class] or [flag, value, class, elseClass?]
   * - object: { flag, class?, elseClass?, value?, fallback? }
   */
  @Input() set ldClassIf(flagKeyOrConfig: string | [any, ...any[]] | LdClassIfConfig) {
    // string => just the flag key
    if (typeof flagKeyOrConfig === 'string') {
      this.currentFlagKey = flagKeyOrConfig;
      this.updateSubscription();
      return;
    }

    // array shorthand
    if (Array.isArray(flagKeyOrConfig)) {
      const [flag, second, third, fourth] = flagKeyOrConfig;
      this.currentFlagKey = flag;
      if (typeof second === 'string' && third === undefined) {
        // [flag, class]
        this.currentClass = second;
        this.currentValue = undefined;
      } else {
        // [flag, value, class, elseClass?]
        this.currentValue = second;
        this.currentClass = third as string | undefined;
        this.currentElseClass = fourth as string | undefined;
      }
      this.updateSubscription();
      return;
    }

    // object config
    if (flagKeyOrConfig && typeof flagKeyOrConfig === 'object') {
      const cfg = flagKeyOrConfig as LdClassIfConfig;
      this.currentFlagKey = cfg.flag;
      this.currentFallback = cfg.fallback;
      this.currentValue = cfg.value;
      this.currentClass = Array.isArray(cfg.class) ? cfg.class.join(' ') : cfg.class;
      this.currentElseClass = Array.isArray(cfg.elseClass) ? cfg.elseClass.join(' ') : cfg.elseClass;
      this.updateSubscription();
      return;
    }
  }

  /**
   * The fallback value to use if the flag is not available or evaluation fails
   */
  @Input('ldClassIfFallback') set ldClassIfFallback(fallback: any) {
    this.currentFallback = fallback;
    this.updateSubscription();
  }

  /**
   * The specific value to check for. If provided, class is applied only if flag equals this value.
   * If not provided, class is applied if flag is truthy.
   */
  @Input('ldClassIfValue') set ldClassIfValue(expectedValue: any) {
    this.currentValue = expectedValue;
    this.updateSubscription();
  }

  /**
   * The CSS class(es) to apply when the condition is met.
   * Can be a single class name or multiple classes separated by spaces.
   */
  @Input('ldClassIfClass') set ldClassIfClass(className: string) {
    this.currentClass = className;
    this.updateSubscription();
  }

  /**
   * The CSS class(es) to apply when the condition is not met.
   * Can be a single class name or multiple classes separated by spaces.
   */
  @Input('ldClassIfElseClass') set ldClassIfElseClass(className: string) {
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

  private addClass(className?: LdClassNames) {
    if (!className) {
      return;
    }
    const classesArray = Array.isArray(className) ? className : className.split(' ');
    const classes = classesArray.filter(cls => typeof cls === 'string' && cls.trim());
    classes.forEach(cls => {
      if (cls.trim()) {
        this.elementRef.nativeElement.classList.add(cls.trim());
      }
    });
  }

  private removeClass(className?: LdClassNames) {
    if (!className) {
      return;
    }
    const classesArray = Array.isArray(className) ? className : className.split(' ');
    const classes = classesArray.filter(cls => typeof cls === 'string' && cls.trim());
    classes.forEach(cls => {
      if (cls.trim()) {
        this.elementRef.nativeElement.classList.remove(cls.trim());
      }
    });
  }
}
