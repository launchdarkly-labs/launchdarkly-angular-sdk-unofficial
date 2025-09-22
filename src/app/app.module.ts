import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { firstValueFrom, Observable } from 'rxjs';
import { AppComponent } from './app.component';
import { LaunchDarklyService, LD_SERVICE_CONFIG } from './launchdarkly.service';
import { LdIfDirective } from './ld-if.directive';
import { LdFlagDirective } from './ld-flag.directive';
import { LdSwitchDirective } from './ld-switch.directive';
import { LdSwitchCaseDirective } from './ld-switch-case.directive';
import { LdSwitchDefaultDirective } from './ld-switch-default.directive';
import { LdClassIfDirective } from './ld-class-if.directive';
import { LdStyleDirective } from './ld-style.directive';
import { LdTrackDirective } from './ld-track.directive';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [
    AppComponent, 
    LdIfDirective, 
    LdFlagDirective, 
    LdSwitchDirective,
    LdSwitchCaseDirective,
    LdSwitchDefaultDirective,
    LdClassIfDirective,
    LdStyleDirective,
    LdTrackDirective
  ],
  imports: [BrowserModule],
  providers: [
    {
      provide: LD_SERVICE_CONFIG,
      useValue: {
        clientId: environment.launchDarklyClientId,
        context: { kind: 'user', key: 'demo-user-1', name: 'Demo User One' },
        options: {
          streaming: true
        }
      }
    },
    // wait for at most 500ms for LaunchDarkly to be ready
    {
      provide: APP_INITIALIZER,
      useFactory: LaunchDarklyService.createAppInitializer(500),
      deps: [LaunchDarklyService],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
