import { APP_INITIALIZER, NgModule, NgZone } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { LaunchDarklyService, LD_SERVICE_CONFIG, LaunchDarklyAngularModule } from '@launchtarqly/launchdarkly-angular';

import { environment } from '../environments/environment';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    LaunchDarklyAngularModule
  ],
  providers: [
    {
      provide: LD_SERVICE_CONFIG,
      useValue: {
        clientId: environment.launchDarklyClientId,
        context: { key: 'demo-user', name: 'Demo User' },
        options: { streaming: true
          hooks: {
            afterEvaluation(...) {
              
            }
          }
         }
      }
    },
    /* only needed because angular  DI gets messed up with local file imports 
    {
      provide: LaunchDarklyService,
      useFactory: (zone: NgZone, cfg: any) => new LaunchDarklyService(zone as any, cfg),
      deps: [NgZone, LD_SERVICE_CONFIG]
    },*/
    // wait for at most 500ms for LaunchDarkly to be ready
    {
      provide: APP_INITIALIZER,
      useFactory: LaunchDarklyService.createAppInitializer(200),
      deps: [LaunchDarklyService],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}