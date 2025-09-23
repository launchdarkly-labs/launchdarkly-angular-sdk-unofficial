import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

// Directives
import { LdIfDirective } from './directives/ld-if.directive';
import { LdFlagDirective } from './directives/ld-flag.directive';
import { LdSwitchDirective } from './directives/ld-switch.directive';
import { LdSwitchCaseDirective } from './directives/ld-switch-case.directive';
import { LdSwitchDefaultDirective } from './directives/ld-switch-default.directive';
import { LdClassIfDirective } from './directives/ld-class-if.directive';
import { LdStyleIfDirective } from './directives/ld-style-if.directive';
import { LdTrackDirective } from './directives/ld-track.directive';

// Services and interfaces
import { LaunchDarklyService } from './services/launchdarkly.service';
import { LD_SERVICE_CONFIG } from './interfaces/launchdarkly.interface';
import type { LDServiceConfig } from './interfaces/launchdarkly.interface';
 
/**
 * LaunchDarkly Angular Module
 * 
 * Provides LaunchDarkly service and directives for feature flag management in Angular applications.
 * 
 * @example
 * ```typescript
 * // In your app.module.ts
 * import { LaunchDarklyAngularModule } from 'launchdarkly-angular';
 * 
 * @NgModule({
 *   imports: [
 *     LaunchDarklyAngularModule.forRoot({
 *       clientId: 'your-client-id',
 *       context: { key: 'user123', name: 'John Doe' },
 *       options: { streaming: true }
 *     })
 *   ],
 *   // ... other module configuration
 * })
 * export class AppModule {}
 * ```
 */
@NgModule({
  imports: [CommonModule],
  declarations: [
    LdIfDirective,
    LdFlagDirective,
    LdSwitchDirective,
    LdSwitchCaseDirective,
    LdSwitchDefaultDirective,
    LdClassIfDirective,
    LdStyleIfDirective,
    LdTrackDirective
  ],
  exports: [
    LdIfDirective,
    LdFlagDirective,
    LdSwitchDirective,
    LdSwitchCaseDirective,
    LdSwitchDefaultDirective,
    LdClassIfDirective,
    LdStyleIfDirective,
    LdTrackDirective
  ]
})
export class LaunchDarklyAngularModule {
  /**
   * Configure the LaunchDarkly module for the root of your application.
   * This should be called once in your AppModule.
   * 
   * @param config - LaunchDarkly configuration object
   * @returns ModuleWithProviders for the configured module
   * 
   * @example
   * ```typescript
   * @NgModule({
   *   imports: [
   *     LaunchDarklyAngularModule.forRoot({
   *       clientId: 'your-client-id',
   *       context: { key: 'user123', name: 'John Doe' },
   *       options: { streaming: true }
   *     })
   *   ]
   * })
   * export class AppModule {}
   * ```
   */
  static forRoot(config: LDServiceConfig): ModuleWithProviders<LaunchDarklyAngularModule> {
    return {
      ngModule: LaunchDarklyAngularModule,
      providers: [
        LaunchDarklyService,
        {
          provide: LD_SERVICE_CONFIG,
          useValue: config
        }
      ]
    };
  }

  /**
   * Configure the LaunchDarkly module for feature modules.
   * This should be called in feature modules that need LaunchDarkly functionality.
   * The service will use the configuration provided by forRoot().
   * 
   * @returns ModuleWithProviders for the module
   * 
   * @example
   * ```typescript
   * @NgModule({
   *   imports: [
   *     LaunchDarklyAngularModule.forChild()
   *   ]
   * })
   * export class FeatureModule {}
   * ```
   */
  static forChild(): ModuleWithProviders<LaunchDarklyAngularModule> {
    return {
      ngModule: LaunchDarklyAngularModule,
      providers: [
        LaunchDarklyService
      ]
    };
  }
}