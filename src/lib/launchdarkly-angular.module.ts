import { NgModule, ModuleWithProviders, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LaunchDarklyService } from './services/launchdarkly.service';
import { LDServiceConfig, LD_SERVICE_CONFIG } from './interfaces/launchdarkly.interface';

// Directives
import { LdIfDirective } from './directives/ld-if.directive';
import { LdFlagDirective } from './directives/ld-flag.directive';
import { LdSwitchDirective } from './directives/ld-switch.directive';
import { LdSwitchCaseDirective } from './directives/ld-switch-case.directive';
import { LdSwitchDefaultDirective } from './directives/ld-switch-default.directive';
import { LdClassIfDirective } from './directives/ld-class-if.directive';
import { LdStyleIfDirective } from './directives/ld-style-if.directive';
import { LdTrackDirective } from './directives/ld-track.directive';
 
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

}