import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, distinctUntilChanged, map, startWith } from 'rxjs';
import { environment } from '../environments/environment';
import {
  initialize,
  type LDClient,
  type LDContext,
  type LDFlagValue
} from 'launchdarkly-js-client-sdk';

@Injectable({ providedIn: 'root' })
export class FeatureFlagsService {
  private client?: LDClient;
  private flags$ = new BehaviorSubject<Record<string, LDFlagValue>>({});

  constructor(private zone: NgZone) {}

  async initialize(initialContext?: LDContext): Promise<void> {
    if (this.client) return;
    const context: LDContext = initialContext ?? { kind: 'user', key: 'demo-anon', anonymous: true };

    this.client = initialize(environment.launchDarklyClientId, context, {
      bootstrap: environment.bootstrapFlags
    });

    try { await this.client.waitForInitialization(); } 
    catch (e) { console.warn('[LD] init error; using bootstrap defaults', e); }

    this.flags$.next(this.client.allFlags());

    this.client.on('change', (changes) => {
      const merged = { ...this.flags$.value };
      Object.keys(changes).forEach((k) => (merged[k] = changes[k].current));
      this.zone.run(() => this.flags$.next(merged));
    });
  }

  getFlag$<T extends LDFlagValue = LDFlagValue>(key: string, fallback: T): Observable<T> {
    const first = this.variation<T>(key, fallback);
    return this.flags$.pipe(
      map(() => this.variation<T>(key, fallback)),
      startWith(first),
      distinctUntilChanged()
    );
  }

  variation<T extends LDFlagValue = LDFlagValue>(key: string, fallback: T): T {
    try { return (this.client?.variation(key, fallback) ?? fallback) as T; }
    catch { return fallback; }
  }

  async identify(context: LDContext): Promise<void> {
    if (!this.client) throw new Error('LD not initialized');
    await this.client.identify(context);
    this.zone.run(() => this.flags$.next(this.client!.allFlags()));
  }
}
