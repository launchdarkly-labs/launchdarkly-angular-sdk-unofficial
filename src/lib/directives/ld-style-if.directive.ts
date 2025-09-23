import { Directive, Input, ElementRef, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { LaunchDarklyService } from '../services/launchdarkly.service';

/**
 * Directive for conditionally applying inline CSS styles based on LaunchDarkly feature flags.
 * Similar to ngStyle, but reactive to LaunchDarkly flag changes.
 *
 * Examples (existing API):
 * ```html
 * <div [ldStyleIf]="'flag'" [ldStyleIfStyle]="{ backgroundColor: 'red' }"></div>
 * <div [ldStyleIf]="'flag'" [ldStyleIfValue]="'dark'" [ldStyleIfStyle]="{ color: 'white' }"></div>
 * <div [ldStyleIf]="'flag'" [ldStyleIfStyle]="{ color: 'white' }" [ldStyleIfElseStyle]="{ color: 'black' }"></div>
 * ```
 *
 * Shorthand API (single binding):
 * ```html
 * <!-- Tuple: [flag, style] -->
 * <div [ldStyleIf]="['flag', { backgroundColor: 'red' }]"></div>
 *
 * <!-- Tuple: [flag, value, style, elseStyle?] -->
 * <div [ldStyleIf]="['theme', 'dark', { color: 'white' }, { color: 'black' }]"></div>
 *
 * <!-- Object config: { flag, style?, elseStyle?, value?, fallback? } -->
 * <div [ldStyleIf]="{ flag: 'theme', value: 'dark', style: { color: 'white' }, elseStyle: { color: 'black' } }"></div>
 * ```
 */
type LdStyles = { [key: string]: any } | undefined;
interface LdStyleIfConfig {
  flag: string;
  style?: { [key: string]: any };
  elseStyle?: { [key: string]: any };
  value?: any;
  fallback?: any;
}
@Directive({
  selector: '[ldStyleIf]'
})
export class LdStyleIfDirective implements OnInit, OnDestroy {
  private subscription?: Subscription;
  private currentFlagKey?: string;
  private currentFallback?: any;
  private currentValue?: any;
  private currentStyles?: { [key: string]: any };
  private currentElseStyles?: { [key: string]: any };
  private instanceId = Math.random().toString(36).substr(2, 9);

  constructor(
    private elementRef: ElementRef,
    private ldService: LaunchDarklyService,
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * Primary input. Supports:
   * - string: flag key
   * - tuple: [flag, style] or [flag, value, style, elseStyle?]
   * - object: { flag, style?, elseStyle?, value?, fallback? }
   */
  @Input() set ldStyleIf(flagKeyOrConfig: string | [any, ...any[]] | LdStyleIfConfig) {
    // string: just set the flag key
    if (typeof flagKeyOrConfig === 'string') {
      this.currentFlagKey = flagKeyOrConfig;
      this.updateSubscription();
      return;
    }

    // array shorthand
    if (Array.isArray(flagKeyOrConfig)) {
      const [flag, second, third, fourth] = flagKeyOrConfig;
      this.currentFlagKey = flag;
      if (typeof second === 'object' && third === undefined) {
        // [flag, style]
        this.currentStyles = second as { [key: string]: any };
        this.currentValue = undefined;
        this.currentElseStyles = undefined;
      } else {
        // [flag, value, style, elseStyle?]
        this.currentValue = second;
        this.currentStyles = third as { [key: string]: any } | undefined;
        this.currentElseStyles = fourth as { [key: string]: any } | undefined;
      }
      this.updateSubscription();
      return;
    }

    // object config
    if (flagKeyOrConfig && typeof flagKeyOrConfig === 'object') {
      const cfg = flagKeyOrConfig as LdStyleIfConfig;
      this.currentFlagKey = cfg.flag;
      this.currentFallback = cfg.fallback;
      this.currentValue = cfg.value;
      this.currentStyles = cfg.style;
      this.currentElseStyles = cfg.elseStyle;
      this.updateSubscription();
      return;
    }
  }

  /**
   * The fallback value to use if the flag is not available or evaluation fails
   */
  @Input('ldStyleIfFallback') set ldStyleIfFallback(fallback: any) {
    this.currentFallback = fallback;
    this.updateSubscription();
  }

  /**
   * The specific value to check for. If provided, styles are applied only if flag equals this value.
   * If not provided, styles are applied if flag is truthy.
   */
  @Input('ldStyleIfValue') set ldStyleIfValue(expectedValue: any) {
    this.currentValue = expectedValue;
    this.updateSubscription();
  }

  /**
   * The CSS styles to apply when the condition is met (object syntax).
   * Similar to ngStyle, accepts an object with CSS properties as keys.
   * 
   * @example
   * [ldStyleIfStyle]="{backgroundColor: '#007bff', color: 'white', fontSize: '16px'}"
   */
  @Input('ldStyleIfStyle') set ldStyleIfStyle(styles: { [key: string]: any }) {
    this.currentStyles = styles;
    this.updateSubscription();
  }

  /**
   * The CSS styles to apply when the condition is not met (object syntax).
   * Similar to ngStyle, accepts an object with CSS properties as keys.
   * 
   * @example
   * [ldStyleIfElseStyle]="{backgroundColor: '#e9ecef', color: '#495057'}"
   */
  @Input('ldStyleIfElseStyle') set ldStyleIfElseStyle(styles: { [key: string]: any }) {
    this.currentElseStyles = styles;
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

    // Only create subscription if we have a flag key and at least one style
    if (!this.currentFlagKey || (!this.currentStyles && !this.currentElseStyles)) {
      return;
    }

    // Subscribe to flag changes
    this.subscription = this.ldService.variation$(this.currentFlagKey, this.currentFallback)
      .subscribe(flagValue => {
        this.updateStyles(flagValue);
      });
  }

  private updateStyles(flagValue: any) {
    const shouldApplyStyles = this.shouldApplyStyles(flagValue);
    
    if (shouldApplyStyles) {
      this.applyStyles(this.currentStyles);
      this.removeStyles(this.currentElseStyles);
    } else {
      this.removeStyles(this.currentStyles);
      this.applyStyles(this.currentElseStyles);
    }
    
    this.cdr.markForCheck();
  }

  private shouldApplyStyles(flagValue: any): boolean {
    // If a specific value is provided, check for exact match
    if (this.currentValue !== undefined) {
      return flagValue === this.currentValue;
    }
    
    // Otherwise, check if flag value is truthy
    return Boolean(flagValue);
  }

  private applyStyles(styles?: LdStyles) {
    if (styles) {
      const processedStyles = this.processStyleObject(styles);
      Object.assign(this.elementRef.nativeElement.style, processedStyles);
    }
  }

  private removeStyles(styles?: LdStyles) {
    if (styles) {
      const processedStyles = this.processStyleObject(styles);
      Object.keys(processedStyles).forEach(property => {
        this.elementRef.nativeElement.style.removeProperty(property);
      });
    }
  }

  /**
   * Processes a style object to handle Angular's unit syntax (e.g., fontSize.px, backgroundColor.rem).
   * Converts unit syntax to standard CSS properties.
   * 
   * @param styles - Style object that may contain unit syntax
   * @returns Processed style object with standard CSS properties
   */
  private processStyleObject(styles: { [key: string]: any }): { [key: string]: string } {
    const processed: { [key: string]: string } = {};
    
    Object.keys(styles).forEach(key => {
      const value = styles[key];
      
      // Check if the key contains a unit (e.g., fontSize.px, backgroundColor.rem)
      const unitMatch = key.match(/^(.+)\.(px|em|rem|%|vh|vw|vmin|vmax|ex|ch|cm|mm|in|pt|pc)$/);
      
      if (unitMatch) {
        // Extract the property name and unit
        const [, propertyName, unit] = unitMatch as unknown as [string, string, string];
        // Convert camelCase to kebab-case for CSS properties
        const cssProperty = this.camelToKebabCase(propertyName);
        processed[cssProperty] = `${value}${unit}`;
      } else {
        // Standard property, convert camelCase to kebab-case if needed
        const cssProperty = this.camelToKebabCase(key);
        processed[cssProperty] = typeof value === 'string' ? value : String(value);
      }
    });
    
    return processed;
  }

  /**
   * Converts camelCase property names to kebab-case for CSS properties.
   * 
   * @param camel - camelCase string (e.g., 'backgroundColor')
   * @returns kebab-case string (e.g., 'background-color')
   */
  private camelToKebabCase(camel: string): string {
    return camel.replace(/([A-Z])/g, '-$1').toLowerCase();
  }

}
