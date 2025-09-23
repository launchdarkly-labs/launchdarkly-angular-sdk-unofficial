import { Directive, Input, ElementRef, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { LaunchDarklyService } from '../services/launchdarkly.service';
import type { LDFlagValue } from 'launchdarkly-js-client-sdk';

/**
 * Directive for conditionally applying CSS classes based on LaunchDarkly feature flags.
 * Similar to ngClass, but reactive to LaunchDarkly flag changes.
 * 
 * ## Parameters
 * 
 * ### ldClassIf (required)
 * - **Type**: `string | LdClassIfConfig`
 * - **Description**: The LaunchDarkly flag key or configuration object
 * - **Examples**: 
 *   - `'premium-features'` (string)
 *   - `{ flag: 'theme', value: 'dark', class: 'dark-theme active' }` (object)
 * 
 * ### ldClassIfFallback (optional)
 * - **Type**: `any`
 * - **Description**: Default value to use if the flag is not available or evaluation fails
 * - **Default**: `undefined`
 * - **Example**: `false`, `'basic'`, `5`
 * 
 * ### ldClassIfValue (optional)
 * - **Type**: `any`
 * - **Description**: Specific value to check for. If provided, class is applied only if flag equals this value.
 *   If not provided, class is applied if flag is truthy.
 * - **Default**: `undefined`
 * - **Example**: `'premium'`, `10`, `true`
 * 
 * ### ldClassIfClass (optional)
 * - **Type**: `string`
 * - **Description**: The CSS class(es) to apply when the condition is met.
 *   Can be a single class name or multiple classes separated by spaces.
 * - **Default**: `undefined`
 * - **Example**: `'premium-user'`, `'dark-theme active'`, `'btn btn-primary'`
 * 
 * ### ldClassIfElseClass (optional)
 * - **Type**: `string`
 * - **Description**: The CSS class(es) to apply when the condition is not met.
 *   Can be a single class name or multiple classes separated by spaces.
 * - **Default**: `undefined`
 * - **Example**: `'basic-user'`, `'light-theme'`, `'btn btn-secondary'`
 * 
 * ## Configuration Object Properties
 * 
 * When using the object syntax for `ldClassIf`, you can provide a `LdClassIfConfig` object with the following properties:
 * 
 * ### flag (required)
 * - **Type**: `string`
 * - **Description**: The LaunchDarkly flag key to evaluate
 * - **Example**: `'theme'`, `'user-tier'`, `'premium-features'`
 * 
 * ### class (optional)
 * - **Type**: `string | string[]`
 * - **Description**: CSS class(es) to apply when the condition is met
 * - **Example**: `'premium-user'`, `['dark-theme', 'active']`, `'btn btn-primary'`
 * 
 * ### elseClass (optional)
 * - **Type**: `string | string[]`
 * - **Description**: CSS class(es) to apply when the condition is not met
 * - **Example**: `'basic-user'`, `['light-theme', 'inactive']`, `'btn btn-secondary'`
 * 
 * ### value (optional)
 * - **Type**: `any`
 * - **Description**: Specific value to check for. If provided, class is applied only if flag equals this value
 * - **Example**: `'premium'`, `10`, `true`
 * 
 * ### fallback (optional)
 * - **Type**: `any`
 * - **Description**: Fallback value to use if the flag is not available or evaluation fails
 * - **Example**: `false`, `'basic'`, `5`
 * 
 * ## Usage Examples
 * 
 * ### Basic Boolean Flag
 * ```html
 * <!-- Apply class when 'premium-features' flag is true -->
 * <div [ldClassIf]="'premium-features'" [ldClassIfClass]="'premium-user'">
 *   User content
 * </div>
 * ```
 * 
 * ### String Flag with Specific Value
 * ```html
 * <!-- Apply class only when 'user-tier' equals 'premium' -->
 * <div [ldClassIf]="'user-tier'" [ldClassIfValue]="'premium'" [ldClassIfClass]="'premium-tier'">
 *   User content
 * </div>
 * ```
 * 
 * ### With Else Class
 * ```html
 * <!-- Apply different classes based on condition -->
 * <div [ldClassIf]="'user-tier'" 
 *      [ldClassIfValue]="'premium'" 
 *      [ldClassIfClass]="'premium-user'" 
 *      [ldClassIfElseClass]="'basic-user'">
 *   User content
 * </div>
 * ```
 * 
 * 
 * ### Object Configuration
 * ```html
 * <!-- Simple object config -->
 * <div [ldClassIf]="{ flag: 'theme', value: 'dark', class: 'dark-theme active' }">
 *   Themed content
 * </div>
 * 
 * <!-- Object config with else class -->
 * <div [ldClassIf]="{ 
 *   flag: 'user-tier', 
 *   value: 'premium', 
 *   class: 'premium-user', 
 *   elseClass: 'basic-user' 
 * }">
 *   User content
 * </div>
 * 
 * <!-- Object config with array classes -->
 * <div [ldClassIf]="{ 
 *   flag: 'theme', 
 *   value: 'dark', 
 *   class: ['dark-theme', 'active', 'premium'], 
 *   elseClass: ['light-theme', 'inactive'] 
 * }">
 *   Themed content
 * </div>
 * ```
 * 
 * ### Multiple Classes
 * ```html
 * <!-- Multiple classes separated by spaces -->
 * <div [ldClassIf]="'premium-features'" [ldClassIfClass]="'premium-user active highlighted'">
 *   Premium content
 * </div>
 * 
 * <!-- Multiple classes with else classes -->
 * <div [ldClassIf]="'user-tier'" 
 *      [ldClassIfValue]="'premium'" 
 *      [ldClassIfClass]="'premium-user active'" 
 *      [ldClassIfElseClass]="'basic-user inactive'">
 *   User content
 * </div>
 * ```
 * 
 * ### With Fallback
 * ```html
 * <!-- Provide fallback value for when flag is unavailable -->
 * <div [ldClassIf]="'user-tier'" 
 *      [ldClassIfFallback]="'basic'" 
 *      [ldClassIfValue]="'premium'" 
 *      [ldClassIfClass]="'premium-user'" 
 *      [ldClassIfElseClass]="'basic-user'">
 *   User content
 * </div>
 * ```
 * 
 * ### Dynamic Class Application
 * ```html
 * <!-- Classes are applied/removed reactively as flag values change -->
 * <div [ldClassIf]="'theme'" 
 *      [ldClassIfClass]="'dark-theme'" 
 *      [ldClassIfElseClass]="'light-theme'">
 *   This div will automatically switch between dark and light themes
 * </div>
 * ```
 * 
 * ## Best Practices
 * 
 * 1. **Always provide a fallback**: Use `ldClassIfFallback` to ensure your app works when LaunchDarkly is unavailable
 * 2. **Use specific values**: When checking for specific flag values, use `ldClassIfValue` for precise control
 * 3. **Provide else classes**: Use `ldClassIfElseClass` to show alternative styling when conditions aren't met
 */
type LdClassNames = string | string[] | undefined;

/**
 * Configuration object for the LdClassIfDirective.
 * Provides a structured way to configure the directive with all options in a single object.
 * 
 * @example
 * ```typescript
 * const config: LdClassIfConfig = {
 *   flag: 'user-tier',
 *   value: 'premium',
 *   class: 'premium-user active',
 *   elseClass: 'basic-user',
 *   fallback: 'basic'
 * };
 * ```
 */
interface LdClassIfConfig {
  /** The LaunchDarkly flag key to evaluate */
  flag: string;
  /** CSS class(es) to apply when the condition is met. Can be a string or array of strings */
  class?: string | string[];
  /** CSS class(es) to apply when the condition is not met. Can be a string or array of strings */
  elseClass?: string | string[];
  /** Specific value to check for. If provided, class is applied only if flag equals this value */
  value?: LDFlagValue;
  /** Fallback value to use if the flag is not available or evaluation fails */
  fallback?: LDFlagValue;
}
@Directive({
  selector: '[ldClassIf]'
})
export class LdClassIfDirective implements OnInit, OnDestroy {
  private subscription?: Subscription;
  private currentFlagKey?: string;
  private currentFallback?: LDFlagValue;
  private currentValue?: LDFlagValue;
  private currentClass?: string;
  private currentElseClass?: string;
  private instanceId = Math.random().toString(36).substr(2, 9);

  private elementRef = inject(ElementRef);
  private ldService = inject(LaunchDarklyService);
  private cdr = inject(ChangeDetectorRef);

  /**
   * Primary input. Supports:
   * - string: flag key
   * - object: { flag, class?, elseClass?, value?, fallback? }
   */
  @Input() set ldClassIf(flagKeyOrConfig: string | LdClassIfConfig) {
    // string => just the flag key
    if (typeof flagKeyOrConfig === 'string') {
      this.currentFlagKey = flagKeyOrConfig;
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
  @Input() set ldClassIfFallback(fallback: LDFlagValue) {
    this.currentFallback = fallback;
    this.updateSubscription();
  }

  /**
   * The specific value to check for. If provided, class is applied only if flag equals this value.
   * If not provided, class is applied if flag is truthy.
   */
  @Input() set ldClassIfValue(expectedValue: LDFlagValue) {
    this.currentValue = expectedValue;
    this.updateSubscription();
  }

  /**
   * The CSS class(es) to apply when the condition is met.
   * Can be a single class name or multiple classes separated by spaces.
   */
  @Input() set ldClassIfClass(className: string) {
    this.currentClass = className;
    this.updateSubscription();
  }

  /**
   * The CSS class(es) to apply when the condition is not met.
   * Can be a single class name or multiple classes separated by spaces.
   */
  @Input() set ldClassIfElseClass(className: string) {
    this.currentElseClass = className;
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
   * Cleans up existing subscription and creates a new one if conditions are met.
   */
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

  /**
   * Updates the CSS classes based on the current flag value.
   * Applies or removes classes based on whether the condition is met.
   * 
   * @param flagValue - The current value of the LaunchDarkly flag
   */
  private updateClass(flagValue: LDFlagValue) {
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

  /**
   * Determines whether the class should be applied based on the flag value.
   * 
   * @param flagValue - The current value of the LaunchDarkly flag
   * @returns true if the class should be applied, false otherwise
   */
  private shouldApplyClass(flagValue: LDFlagValue): boolean {
    // If a specific value is provided, check for exact match
    if (this.currentValue !== undefined) {
      return flagValue === this.currentValue;
    }
    
    // Otherwise, check if flag value is truthy
    return Boolean(flagValue);
  }

  /**
   * Adds CSS classes to the element.
   * 
   * @param className - The class name(s) to add. Can be a string or array of strings.
   */
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

  /**
   * Removes CSS classes from the element.
   * 
   * @param className - The class name(s) to remove. Can be a string or array of strings.
   */
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
