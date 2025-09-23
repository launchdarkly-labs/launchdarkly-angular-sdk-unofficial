import { InjectionToken } from '@angular/core';
import type { LDContext, LDOptions } from 'launchdarkly-js-client-sdk';

/**
 * Configuration interface for the LaunchDarkly service
 */
export interface LDServiceConfig {
  /** LaunchDarkly client-side ID */
  clientId: string;
  /** User context for flag evaluation */
  context: LDContext;
  /** Optional LaunchDarkly client options */
  options?: LDOptions;
  /** Optional timeout for initialization in milliseconds */
  timeout?: number;
}

/**
 * Event interface for flag changes
 */
export interface FlagChangeEvent {
  /** The flag key that changed */
  key: string;
  /** The current flag value */
  current: any;
  /** The previous flag value */
  previous: any;
}

/**
 * Configuration interface for directives
 */
export interface LDDirectiveConfig {
  /** The feature flag key to evaluate */
  flagKey: string;
  /** The fallback value to use if flag is not available */
  fallback?: any;
  /** The specific value to check for (optional) */
  value?: any;
}

/**
 * Default configuration values
 */
export const DEFAULT_LD_CONFIG: Partial<LDServiceConfig> = {
  options: {
    streaming: true
  },
  timeout: 500
};

/**
 * Injection token for LaunchDarkly service configuration
 */
export const LD_SERVICE_CONFIG = new InjectionToken<LDServiceConfig>('LD_SERVICE_CONFIG');
