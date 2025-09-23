import { Component } from '@angular/core';
import { Observable, map, startWith, filter, switchMap, shareReplay } from 'rxjs';
import { LaunchDarklyService } from '@launchtarqly/launchdarkly-angular';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {

  // Keep the observables for demonstration purposes, but we'll use directives in the template
  showReleaseWidget$: Observable<boolean> = this.ld.variation$('release-widget', false)
  welcomeText$: Observable<string> = this.ld.variation$('welcome-text', 'Welcome!')

  // Data objects for tracking directive
  analyticsData = { section: 'analytics', type: 'directive' };
  conversionData = { product: 'premium', method: 'directive' };
  hoverData = { section: 'analytics' };

  constructor(private ld: LaunchDarklyService) {
    // Debug: Log the flag value
    this.showReleaseWidget$.subscribe(value => {
      console.log('release-widget flag value:', value, 'type:', typeof value);
    });
  }

  async identifyUserA() { 
    try {
      await this.ld.setContext({ kind: 'user', key: 'demo-user-1', country: 'US' }, 5000);
      console.log('User A context set successfully');
    } catch (err) {
      console.error('Failed to set User A context:', err);
    }
  }
  
  async identifyUserB() { 
    try {
      await this.ld.setContext({ kind: 'user', key: 'demo-user-2', country: 'CA' }, 5000);
      console.log('User B context set successfully');
    } catch (err) {
      console.error('Failed to set User B context:', err);
    }
  }

  trackEvent() {
    this.ld.track('button-clicked', { 
      button: 'track-event',
      timestamp: new Date().toISOString()
    });
    console.log('Event tracked: button-clicked');
  }

  trackConversion() {
    this.ld.track('purchase-completed', { 
      product: 'demo-product',
      value: 29.99
    }, 29.99);
    console.log('Conversion tracked: purchase-completed with value $29.99');
  }

  flushEvents() {
    this.ld.flush().then(() => console.log('Events flushed successfully'));
  }
}