import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { FeatureFlagsService } from './feature-flags.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  showNewNav$: Observable<boolean> = this.flags.getFlag$('new-nav', false);
  welcomeText$: Observable<string> = this.flags.getFlag$('welcome-text', 'Welcome!');

  constructor(private flags: FeatureFlagsService) {}

  async identifyUserA() { await this.flags.identify({ kind: 'user', key: 'demo-user-1', country: 'US' }); }
  async identifyUserB() { await this.flags.identify({ kind: 'user', key: 'demo-user-2', country: 'CA' }); }
}
