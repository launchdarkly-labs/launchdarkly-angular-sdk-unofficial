import { Component } from '@angular/core';
import { Observable, map, startWith, filter, switchMap, shareReplay } from 'rxjs';
import { LaunchDarklyService } from 'launchdarkly-angular';

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

  identifyUserA() { 
    this.ld.identify$({ kind: 'user', key: 'demo-user-1', country: 'US' }).subscribe({
      next: () => console.log('User A identified successfully'),
      error: (err) => console.error('Failed to identify User A:', err)
    });
  }
  
  identifyUserB() { 
    this.ld.identify$({ kind: 'user', key: 'demo-user-2', country: 'CA' }).subscribe({
      next: () => console.log('User B identified successfully'),
      error: (err) => console.error('Failed to identify User B:', err)
    });
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