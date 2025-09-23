import { Directive, Input, ElementRef, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { LaunchDarklyService } from '../services/launchdarkly.service';

/**
 * Directive for conditionally applying inline CSS styles based on LaunchDarkly feature flags.
 * Similar to ngStyle, but reactive to LaunchDarkly flag changes.
 * 
 * @example
 * ```html
 * <!-- Apply styles when flag is truthy -->
 * <div [ldStyleIf]="'premium-features'" [ldStyle]="{backgroundColor: '#007bff', color: 'white'}">
 *   Premium content
 * </div>
 * 
 * <!-- Apply styles when flag matches specific value -->
 * <div [ldStyleIf]="'theme'" 
 *      [ldStyleIfValue]="'dark'" 
 *      [ldStyle]="{backgroundColor: '#2c3e50', color: 'white', border: '2px solid #34495e'}">
 *   Themed content
 * </div>
 * 
 * <!-- Apply different styles based on condition -->
 * <div [ldStyleIf]="'user-tier'" 
 *      [ldStyleIfValue]="'premium'" 
 *      [ldStyle]="{background: 'linear-gradient(45deg, #ffd700, #ffed4e)', color: '#8b4513'}"
 *      [ldElseStyle]="{backgroundColor: '#e9ecef', color: '#495057'}">
 *   User content
 * </div>
 * 
 * <!-- Using Angular's unit syntax (like ngStyle) -->
 * <div [ldStyleIf]="'responsive-design'" 
 *      [ldStyle]="{fontSize: '16px', marginTop: '2rem', paddingLeft: '1em'}">
 *   Responsive content
 * </div>
 * 
 * <!-- Using computed styles from component -->
 * <div [ldStyleIf]="'user-tier'" 
 *      [ldStyleIfValue]="'premium'" 
 *      [ldStyle]="getPremiumStyles()"
 *      [ldElseStyle]="getBasicStyles()">
 *   User content
 * </div>
 * ```
 */
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
   * The feature flag key to evaluate
   */
  @Input() set ldStyleIf(flagKey: string) {
    this.currentFlagKey = flagKey;
    this.updateSubscription();
  }

  /**
   * The fallback value to use if the flag is not available or evaluation fails
   */
  @Input() set ldStyleIfFallback(fallback: any) {
    this.currentFallback = fallback;
    this.updateSubscription();
  }

  /**
   * The specific value to check for. If provided, styles are applied only if flag equals this value.
   * If not provided, styles are applied if flag is truthy.
   */
  @Input() set ldStyleIfValue(expectedValue: any) {
    this.currentValue = expectedValue;
    this.updateSubscription();
  }

  /**
   * The CSS styles to apply when the condition is met (object syntax).
   * Similar to ngStyle, accepts an object with CSS properties as keys.
   * 
   * @example
   * [ldStyle]="{backgroundColor: '#007bff', color: 'white', fontSize: '16px'}"
   */
  @Input() set ldStyle(styles: { [key: string]: any }) {
    this.currentStyles = styles;
    this.updateSubscription();
  }

  /**
   * The CSS styles to apply when the condition is not met (object syntax).
   * Similar to ngStyle, accepts an object with CSS properties as keys.
   * 
   * @example
   * [ldElseStyle]="{backgroundColor: '#e9ecef', color: '#495057'}"
   */
  @Input() set ldElseStyle(styles: { [key: string]: any }) {
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

  private applyStyles(styles?: { [key: string]: any }) {
    if (styles) {
      const processedStyles = this.processStyleObject(styles);
      Object.assign(this.elementRef.nativeElement.style, processedStyles);
    }
  }

  private removeStyles(styles?: { [key: string]: any }) {
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
        const [, propertyName, unit] = unitMatch;
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
