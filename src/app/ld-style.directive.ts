import { Directive, Input, ElementRef, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { LaunchDarklyService } from './launchdarkly.service';

/**
 * Directive for conditionally applying inline CSS styles based on LaunchDarkly feature flags.
 * Similar to ngStyle, but reactive to LaunchDarkly flag changes.
 * 
 * @example
 * ```html
 * <!-- Apply styles when flag is truthy -->
 * <div [ldStyle]="'premium-features'" [ldStyleStyle]="'background: #007bff; color: white'">
 *   Premium content
 * </div>
 * 
 * <!-- Apply styles when flag matches specific value -->
 * <div [ldStyle]="'theme'" [ldStyleValue]="'dark'" [ldStyleStyle]="'background: #2c3e50; color: white'">
 *   Themed content
 * </div>
 * 
 * <!-- Apply different styles based on condition -->
 * <div [ldStyle]="'user-tier'" 
 *      [ldStyleValue]="'premium'" 
 *      [ldStyleStyle]="'background: gold; color: black'" 
 *      [ldStyleElseStyle]="'background: silver; color: white'">
 *   User content
 * </div>
 * 
 * <!-- Apply styles when flag is false -->
 * <div [ldStyle]="'premium-features'" 
 *      [ldStyleValue]="false" 
 *      [ldStyleStyle]="'background: #6c757d; color: white'">
 *   Basic user content
 * </div>
 * ```
 */
@Directive({
  selector: '[ldStyle]'
})
export class LdStyleDirective implements OnInit, OnDestroy {
  private subscription?: Subscription;
  private currentFlagKey?: string;
  private currentFallback?: any;
  private currentValue?: any;
  private currentStyles?: string;
  private currentElseStyles?: string;
  private instanceId = Math.random().toString(36).substr(2, 9);

  constructor(
    private elementRef: ElementRef,
    private ldService: LaunchDarklyService,
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * The feature flag key to evaluate
   */
  @Input() set ldStyle(flagKey: string) {
    this.currentFlagKey = flagKey;
    this.updateSubscription();
  }

  /**
   * The fallback value to use if the flag is not available or evaluation fails
   */
  @Input() set ldStyleFallback(fallback: any) {
    this.currentFallback = fallback;
    this.updateSubscription();
  }

  /**
   * The specific value to check for. If provided, styles are applied only if flag equals this value.
   * If not provided, styles are applied if flag is truthy.
   */
  @Input() set ldStyleValue(expectedValue: any) {
    this.currentValue = expectedValue;
    this.updateSubscription();
  }

  /**
   * The CSS styles to apply when the condition is met.
   * Should be a string of CSS properties and values (e.g., 'background: red; color: white').
   */
  @Input() set ldStyleStyle(styles: string) {
    this.currentStyles = styles;
    this.updateSubscription();
  }

  /**
   * The CSS styles to apply when the condition is not met.
   * Should be a string of CSS properties and values (e.g., 'background: blue; color: black').
   */
  @Input() set ldStyleElseStyle(styles: string) {
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

  private applyStyles(styles?: string) {
    if (styles) {
      const parsedStyles = this.parseStyles(styles);
      Object.assign(this.elementRef.nativeElement.style, parsedStyles);
    }
  }

  private removeStyles(styles?: string) {
    if (styles) {
      const parsedStyles = this.parseStyles(styles);
      Object.keys(parsedStyles).forEach(property => {
        this.elementRef.nativeElement.style.removeProperty(property);
      });
    }
  }

  /**
   * Parses a CSS style string into an object of CSS properties.
   * Handles both camelCase and kebab-case property names.
   * 
   * @param styles - CSS style string (e.g., 'background-color: red; color: white')
   * @returns Object with CSS properties as keys and values as values
   */
  private parseStyles(styles: string): { [key: string]: string } {
    const styleObj: { [key: string]: string } = {};
    
    if (!styles || typeof styles !== 'string') {
      return styleObj;
    }

    // Split by semicolon and process each style declaration
    const declarations = styles.split(';').filter(decl => decl.trim());
    
    declarations.forEach(declaration => {
      const colonIndex = declaration.indexOf(':');
      if (colonIndex > 0) {
        const property = declaration.substring(0, colonIndex).trim();
        const value = declaration.substring(colonIndex + 1).trim();
        
        if (property && value) {
          // Convert kebab-case to camelCase for CSS properties
          const camelCaseProperty = this.kebabToCamelCase(property);
          styleObj[camelCaseProperty] = value;
        }
      }
    });

    return styleObj;
  }

  /**
   * Converts kebab-case CSS property names to camelCase for JavaScript style object.
   * 
   * @param kebab - kebab-case string (e.g., 'background-color')
   * @returns camelCase string (e.g., 'backgroundColor')
   */
  private kebabToCamelCase(kebab: string): string {
    return kebab.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
  }
}
