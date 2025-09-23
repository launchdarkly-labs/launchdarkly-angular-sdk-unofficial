import { Directive, Input, ElementRef, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { LaunchDarklyService } from '../services/launchdarkly.service';
import type { LDFlagValue } from 'launchdarkly-js-client-sdk';

/**
 * Directive for conditionally applying inline CSS styles based on LaunchDarkly feature flags.
 * Similar to ngStyle, but reactive to LaunchDarkly flag changes.
 * 
 * ## Parameters
 * 
 * ### ldStyleIf (required)
 * - **Type**: `string | LdStyleIfConfig`
 * - **Description**: The LaunchDarkly flag key or configuration object
 * - **Examples**: 
 *   - `'theme'` (string)
 *   - `{ flag: 'theme', value: 'dark', style: { color: 'white' } }` (object)
 * 
 * ### ldStyleIfFallback (optional)
 * - **Type**: `any`
 * - **Description**: Default value to use if the flag is not available or evaluation fails
 * - **Default**: `undefined`
 * - **Example**: `false`, `'light'`, `5`
 * 
 * ### ldStyleIfValue (optional)
 * - **Type**: `any`
 * - **Description**: Specific value to check for. If provided, styles are applied only if flag equals this value.
 *   If not provided, styles are applied if flag is truthy.
 * - **Default**: `undefined`
 * - **Example**: `'dark'`, `10`, `true`
 * 
 * ### ldStyleIfStyle (optional)
 * - **Type**: `{ [key: string]: any }`
 * - **Description**: The CSS styles to apply when the condition is met (object syntax).
 *   Similar to ngStyle, accepts an object with CSS properties as keys.
 * - **Default**: `undefined`
 * - **Example**: `{ backgroundColor: '#007bff', color: 'white', fontSize: '16px' }`
 * 
 * ### ldStyleIfElseStyle (optional)
 * - **Type**: `{ [key: string]: any }`
 * - **Description**: The CSS styles to apply when the condition is not met (object syntax).
 *   Similar to ngStyle, accepts an object with CSS properties as keys.
 * - **Default**: `undefined`
 * - **Example**: `{ backgroundColor: '#e9ecef', color: '#495057' }`
 * 
 * ## Configuration Object Properties
 * 
 * When using the object syntax for `ldStyleIf`, you can provide a `LdStyleIfConfig` object with the following properties:
 * 
 * ### flag (required)
 * - **Type**: `string`
 * - **Description**: The LaunchDarkly flag key to evaluate
 * - **Example**: `'theme'`, `'user-tier'`, `'premium-features'`
 * 
 * ### style (optional)
 * - **Type**: `{ [key: string]: any }`
 * - **Description**: CSS styles to apply when the condition is met
 * - **Example**: `{ backgroundColor: '#333', color: '#fff', fontSize: '16px' }`
 * 
 * ### elseStyle (optional)
 * - **Type**: `{ [key: string]: any }`
 * - **Description**: CSS styles to apply when the condition is not met
 * - **Example**: `{ backgroundColor: '#fff', color: '#333', fontSize: '14px' }`
 * 
 * ### value (optional)
 * - **Type**: `any`
 * - **Description**: Specific value to check for. If provided, styles are applied only if flag equals this value
 * - **Example**: `'dark'`, `10`, `true`
 * 
 * ### fallback (optional)
 * - **Type**: `any`
 * - **Description**: Fallback value to use if the flag is not available or evaluation fails
 * - **Example**: `false`, `'light'`, `5`
 * 
 * ## Usage Examples
 * 
 * ### Basic Boolean Flag
 * ```html
 * <!-- Apply styles when 'premium-features' flag is true -->
 * <div [ldStyleIf]="'premium-features'" [ldStyleIfStyle]="{ backgroundColor: '#007bff', color: 'white' }">
 *   Premium content
 * </div>
 * ```
 * 
 * ### String Flag with Specific Value
 * ```html
 * <!-- Apply styles only when 'theme' equals 'dark' -->
 * <div [ldStyleIf]="'theme'" [ldStyleIfValue]="'dark'" [ldStyleIfStyle]="{ backgroundColor: '#333', color: '#fff' }">
 *   Dark themed content
 * </div>
 * ```
 * 
 * ### With Else Style
 * ```html
 * <!-- Apply different styles based on condition -->
 * <div [ldStyleIf]="'theme'" 
 *      [ldStyleIfValue]="'dark'" 
 *      [ldStyleIfStyle]="{ backgroundColor: '#333', color: '#fff' }" 
 *      [ldStyleIfElseStyle]="{ backgroundColor: '#fff', color: '#333' }">
 *   Themed content
 * </div>
 * ```
 * 
 * 
 * ### Object Configuration
 * ```html
 * <!-- Simple object config -->
 * <div [ldStyleIf]="{ flag: 'theme', value: 'dark', style: { backgroundColor: '#333', color: '#fff' } }">
 *   Themed content
 * </div>
 * 
 * <!-- Object config with else style -->
 * <div [ldStyleIf]="{ 
 *   flag: 'theme', 
 *   value: 'dark', 
 *   style: { backgroundColor: '#333', color: '#fff' }, 
 *   elseStyle: { backgroundColor: '#fff', color: '#333' } 
 * }">
 *   Themed content
 * </div>
 * ```
 * 
 * ### Complex Styling
 * ```html
 * <!-- Multiple CSS properties -->
 * <div [ldStyleIf]="'premium-features'" 
 *      [ldStyleIfStyle]="{ 
 *        backgroundColor: '#007bff', 
 *        color: 'white', 
 *        fontSize: '16px', 
 *        padding: '20px', 
 *        borderRadius: '8px',
 *        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
 *      }">
 *   Premium content with rich styling
 * </div>
 * ```
 * 
 * ### With Fallback
 * ```html
 * <!-- Provide fallback value for when flag is unavailable -->
 * <div [ldStyleIf]="'theme'" 
 *      [ldStyleIfFallback]="'light'" 
 *      [ldStyleIfValue]="'dark'" 
 *      [ldStyleIfStyle]="{ backgroundColor: '#333', color: '#fff' }" 
 *      [ldStyleIfElseStyle]="{ backgroundColor: '#fff', color: '#333' }">
 *   Themed content
 * </div>
 * ```
 * 
 * ### Dynamic Style Application
 * ```html
 * <!-- Styles are applied/removed reactively as flag values change -->
 * <div [ldStyleIf]="'theme'" 
 *      [ldStyleIfStyle]="{ backgroundColor: '#333', color: '#fff' }" 
 *      [ldStyleIfElseStyle]="{ backgroundColor: '#fff', color: '#333' }">
 *   This div will automatically switch between dark and light themes
 * </div>
 * ```
 * 
 * ### Responsive Styling
 * ```html
 * <!-- Use CSS custom properties for responsive design -->
 * <div [ldStyleIf]="'premium-features'" 
 *      [ldStyleIfStyle]="{ 
 *        '--primary-color': '#007bff',
 *        '--text-color': 'white',
 *        backgroundColor: 'var(--primary-color)',
 *        color: 'var(--text-color)'
 *      }">
 *   Premium content with CSS variables
 * </div>
 * ```
 * 
 * ## Best Practices
 * 
 * 1. **Always provide a fallback**: Use `ldStyleIfFallback` to ensure your app works when LaunchDarkly is unavailable
 * 2. **Use specific values**: When checking for specific flag values, use `ldStyleIfValue` for precise control
 * 3. **Provide else styles**: Use `ldStyleIfElseStyle` to show alternative styling when conditions aren't met
 * 4. **Use object syntax for complex configurations**: The object syntax is more readable for complex scenarios
 * 5. **Test with different flag values**: Ensure your styles work with various flag types and edge cases
 * 6. **Use meaningful style properties**: Choose CSS properties that clearly indicate their purpose
 * 7. **Consider CSS specificity**: Ensure your conditional styles have appropriate CSS specificity
 * 8. **Use CSS custom properties**: Leverage CSS variables for better maintainability and theming
 * 9. **Avoid inline styles for complex layouts**: Use this directive for simple conditional styling, not complex layouts
 */
type LdStyles = Record<string, string> | undefined;

/**
 * Configuration object for the LdStyleIfDirective.
 * Provides a structured way to configure the directive with all options in a single object.
 * 
 * @example
 * ```typescript
 * const config: LdStyleIfConfig = {
 *   flag: 'theme',
 *   value: 'dark',
 *   style: { backgroundColor: '#333', color: '#fff' },
 *   elseStyle: { backgroundColor: '#fff', color: '#333' },
 *   fallback: 'light'
 * };
 * ```
 */
interface LdStyleIfConfig {
  /** The LaunchDarkly flag key to evaluate */
  flag: string;
  /** CSS styles to apply when the condition is met */
  style?: Record<string, string>;   
  /** CSS styles to apply when the condition is not met */
  elseStyle?: Record<string, string>;
  /** Specific value to check for. If provided, styles are applied only if flag equals this value */
  value?: LDFlagValue;
  /** Fallback value to use if the flag is not available or evaluation fails */
  fallback?: LDFlagValue;
}
@Directive({
  selector: '[ldStyleIf]'
})
export class LdStyleIfDirective implements OnInit, OnDestroy {
  private subscription?: Subscription;
  private currentFlagKey?: string;
  private currentFallback?: LDFlagValue;
  private currentValue?: LDFlagValue;
  private currentStyles?: Record<string, string>;
  private currentElseStyles?: Record<string, string>;
  private instanceId = Math.random().toString(36).substr(2, 9);

  private elementRef = inject(ElementRef);
  private ldService = inject(LaunchDarklyService);
  private cdr = inject(ChangeDetectorRef);

  /**
   * Primary input. Supports:
   * - string: flag key
   * - object: { flag, style?, elseStyle?, value?, fallback? }
   */
  @Input() set ldStyleIf(flagKeyOrConfig: string | LdStyleIfConfig) {
    // string: just set the flag key
    if (typeof flagKeyOrConfig === 'string') {
      this.currentFlagKey = flagKeyOrConfig;
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
  @Input() set ldStyleIfFallback(fallback: LDFlagValue) {
    this.currentFallback = fallback;
    this.updateSubscription();
  }

  /**
   * The specific value to check for. If provided, styles are applied only if flag equals this value.
   * If not provided, styles are applied if flag is truthy.
   */
  @Input() set ldStyleIfValue(expectedValue: LDFlagValue) {
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
  @Input() set ldStyleIfStyle(styles: Record<string, string>) {
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
  @Input() set ldStyleIfElseStyle(styles: Record<string, string>) {
    this.currentElseStyles = styles;
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

  /**
   * Updates the CSS styles based on the current flag value.
   * Applies or removes styles based on whether the condition is met.
   * 
   * @param flagValue - The current value of the LaunchDarkly flag
   */
  private updateStyles(flagValue: LDFlagValue) {
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

  /**
   * Determines whether the styles should be applied based on the flag value.
   * 
   * @param flagValue - The current value of the LaunchDarkly flag
   * @returns true if the styles should be applied, false otherwise
   */
  private shouldApplyStyles(flagValue: LDFlagValue): boolean {
    // If a specific value is provided, check for exact match
    if (this.currentValue !== undefined) {
      return flagValue === this.currentValue;
    }
    
    // Otherwise, check if flag value is truthy
    return Boolean(flagValue);
  }

  /**
   * Applies CSS styles to the element.
   * 
   * @param styles - The styles to apply. Can be undefined.
   */
  private applyStyles(styles?: LdStyles) {
    if (styles) {
      const processedStyles = this.processStyleObject(styles);
      Object.assign(this.elementRef.nativeElement.style, processedStyles);
    }
  }

  /**
   * Removes CSS styles from the element.
   * 
   * @param styles - The styles to remove. Can be undefined.
   */
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
  private processStyleObject(styles: Record<string, string>): Record<string, string> {
    const processed: Record<string, string> = {};
    
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
