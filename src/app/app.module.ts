import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { FeatureFlagsService } from './feature-flags.service';

function initFlags(flags: FeatureFlagsService) {
  return () => flags.initialize({ kind: 'user', key: 'demo-user-1', name: 'Demo User One' });
}

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  providers: [{
    provide: APP_INITIALIZER,
    multi: true,
    deps: [FeatureFlagsService],
    useFactory: initFlags
  }],
  bootstrap: [AppComponent]
})
export class AppModule {}
