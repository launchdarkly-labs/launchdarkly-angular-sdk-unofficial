import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { firstValueFrom, Observable } from 'rxjs';
import { AppComponent } from './app.component';
import { LaunchDarklyAngularModule, LaunchDarklyService } from 'launchdarkly-angular';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    LaunchDarklyAngularModule.forRoot({
      clientId: environment.launchDarklyClientId,
      context: { kind: 'user', key: 'demo-user-1', name: 'Demo User One' },
      options: {
        streaming: true
      }
    })
  ],
  providers: [
    // wait for at most 500ms for LaunchDarkly to be ready
    {
      provide: APP_INITIALIZER,
      useFactory: (ldService: LaunchDarklyService) => {
        return () => firstValueFrom(ldService.waitUntilReady$(500));
      },
      deps: [LaunchDarklyService],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}