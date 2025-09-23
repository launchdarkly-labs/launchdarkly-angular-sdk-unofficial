import { Injectable, NgZone, inject } from '@angular/core';
import { BehaviorSubject, Observable, distinctUntilChanged, map, switchMap, filter, startWith, catchError, concatMap, take, Subject, timer, race, firstValueFrom } from 'rxjs';
import {
  initialize,
  type LDClient,
  type LDContext,
  type LDFlagValue,
  type LDOptions,
  type LDEvaluationDetail,
  LDFlagChangeset
} from 'launchdarkly-js-client-sdk';
import equal from 'fast-deep-equal';

import { FlagChangeEvent, LD_SERVICE_CONFIG, LDServiceConfig } from '../interfaces/launchdarkly.interface';

/**
 * LaunchDarkly service for Angular applications.
 * Provides reactive observables for feature flags and user context management.
 * 
 * @example
 * ```typescript
 * // In your component
 * constructor(private ldService: LaunchDarklyService) {}
 * 
 * ngOnInit() {
 *   this.ldService.variation$('new-feature', false).subscribe(enabled => {
 *     if (enabled) {
 *       this.showNewFeature();
 *     }
 *   });
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class LaunchDarklyService {
  private clientSubject$ = new BehaviorSubject<LDClient | undefined>(undefined);
  private isInitializedSubject$ = new BehaviorSubject<boolean>(false);
  private goalsReadySubject$ = new BehaviorSubject<boolean>(false);
  private flagChangesSubject$ = new Subject<FlagChangeEvent>();

  private zone = inject(NgZone);
  private config : LDServiceConfig = inject(LD_SERVICE_CONFIG);

  constructor() {
    this._initialize(this.config.clientId, this.config.context, this.config.options);
  }

  /**
   * Creates an APP_INITIALIZER factory function for LaunchDarkly initialization.
   * This will wait for at most timeoutMs for LaunchDarkly to be ready and will never throw
   * 
   * @param timeoutMs - Maximum time to wait for LaunchDarkly initialization in milliseconds (default: 500ms)
   * @returns A function that can be used as an APP_INITIALIZER factory
   * 
   * @example
   * ```typescript
   * // In app.module.ts
   * providers: [
   *   {
   *     provide: APP_INITIALIZER,
   *     useFactory: LaunchDarklyService.createAppInitializer(1000),
   *     deps: [LaunchDarklyService],
   *     multi: true
   *   }
   * ]
   * ```
   */
  static createAppInitializer(timeoutMs = 500) {
    return (ldService: LaunchDarklyService): () => Promise<boolean> => {
      return () => firstValueFrom(ldService.waitUntilReady$(timeoutMs));
    };
  }

  /**
   * Observable stream of the LaunchDarkly client instance.
   * Emits undefined until the client is created, then emits the client instance.
   * 
   * @returns Observable that emits the LDClient instance when available
   * 
   * @example
   * ```typescript
   * this.ldService.client$.subscribe(client => {
   *   if (client) {
   *     console.log('LaunchDarkly client is ready');
   *   }
   * });
   * ```
   */
  get client$(): Observable<LDClient | undefined> {
    return this.clientSubject$.asObservable();
  }

  /**
   * Convenience method that returns a promise resolving to the LaunchDarkly client.
   * Used internally for lazy initialization and client access.
   * 
   * @returns Promise that resolves to the LDClient instance
   */
  private getClient(): Promise<LDClient> {
    return firstValueFrom(this.clientSubject$.pipe(
      filter((client): client is LDClient => client !== undefined),
      take(1)
    ))
  }
  
  /**
   * Waits for LaunchDarkly to be ready with a timeout, never emits errors.
   * If initialization fails or times out, it gracefully emits false and continues waiting.
   * The SDK will continue to attempt to initialize in the background and will emit true when ready.
   * 
   * @param timeoutMs - Maximum time to wait for initialization in milliseconds
   * @returns Observable that emits true when ready, false on timeout, then continues waiting
   * 
   * @example
   * ```typescript
   * this.ldService.waitUntilReady$(2000).subscribe(isReady => {
   *   if (isReady) {
   *     console.log('LaunchDarkly is ready');
   *   } else {
   *     console.log('Still waiting for LaunchDarkly...');
   *   }
   * });
   * ```
   */
  waitUntilReady$(timeoutMs: number): Observable<boolean> {
    return this.waitForInitialization$(timeoutMs).pipe(
      catchError(() => {
        return this.isInitializedSubject$.asObservable().pipe(
          startWith(false)
        );
      })
    );
  }

  /**
   * Waits for LaunchDarkly initialization with timeout handling.
   * Returns immediately if already initialized, otherwise waits up to timeoutMs.
   * 
   * @param timeoutMs - Maximum time to wait for initialization in milliseconds
   * @returns Observable that emits true when initialized, false on timeout
   * 
   * @example
   * ```typescript
   * this.ldService.waitForInitialization$(1000).subscribe(isInitialized => {
   *   if (isInitialized) {
   *     // Proceed with flag evaluations
   *   }
   * });
   * ```
   */
  waitForInitialization$(timeoutMs: number): Observable<boolean> {
    // TODO: this doesn't reject on errors
    return this.isInitializedSubject$.pipe(
      switchMap((isInitialized) => {
        // If already initialized, return the subject immediately
        if (isInitialized) {
          return this.isInitializedSubject$.asObservable();
        }
        // otherwise we will wait for at most timeoutMs for initialization
        // if the timeout is reached, we will return false then continue waiting for initialization
        // Create timeout observable that emits false after timeoutMs
        const timeout$ = timer(timeoutMs).pipe(map(() => false));
        
        // Observable only emits true when initialized
        const initialization$ = this.isInitializedSubject$.pipe(
          filter((init) => init)
        );
        
        // Race timeout vs initialization, but continue after timeout
        return race(timeout$, initialization$).pipe(
          take(1),
          // either way we're returning the subject as an observable
          concatMap(() => this.isInitializedSubject$.asObservable())
        );
      })
    );
  }

  /**
   * Private observable that emits flag change events for a specific flag key.
   * 
   * @param key - The flag key to listen for changes
   * @returns Observable that emits FlagChangeEvent when the specified flag changes
   */
  private onFlagChange$(key: string): Observable<FlagChangeEvent> {
    return this.flagChangesSubject$.pipe(
      filter(event => event.key === key)
    );
  }

  /**
   * Protected method that initializes the LaunchDarkly client with the provided configuration.
   * Sets up event listeners for flag changes, initialization, and goals ready events.
   * 
   * @param clientId - LaunchDarkly client-side ID
   * @param context - User context for flag evaluation
   * @param options - Optional LaunchDarkly client options
   * 
   * @throws Will log an error if called after client is already initialized
   */
  protected _initialize(clientId: string, context: LDContext, options?: LDOptions): void {
    // copy so we don't mutate the original options
    const clientOptions: LDOptions = { streaming: true, ...(options ?? {}) } as LDOptions;
    if (this.clientSubject$.value) {
      console.error('[LaunchDarkly Service] initialize called after LD already initialized, skipping. please ensure this is only called once.');
      return;
    }

    const client = initialize(clientId, context, clientOptions);
    this._setClient(client);
  }
  protected _setClient(client: LDClient): void {
    this.clientSubject$.next(client);
    // Set up global flag change listener
    client.on('change', (settings: LDFlagChangeset) => {
      this.zone.run(() => {
        Object.entries(settings).forEach(([key, { current, previous }]) => {
          this.flagChangesSubject$.next({
            key,
            current,
            previous
          });
        });
      });
    });

    client.on('initialized', () => {
      this.zone.run(() => {
        this.isInitializedSubject$.next(true);
        // Emit initial events for all flags (previous = undefined)
        Object.entries(client.allFlags()).forEach(([key, value]) => {
          const currentValue = value;
          this.flagChangesSubject$.next({
            key,
            current: currentValue,
            previous: undefined
          });
        });
      });
    });

    client.on('goalsReady', () => {
      this.zone.run(() => this.goalsReadySubject$.next(true));
    });
  }

  /**
   * Gets the value of a feature flag as an observable stream.
   * Emits the current value immediately, then emits new values when the flag changes.
   * 
   * @param key - The feature flag key
   * @param fallback - Default value to return if flag is not available
   * @returns Observable that emits the flag value, starting with current value
   * 
   * @example
   * ```typescript
   * this.ldService.variation$('new-feature', false).subscribe(enabled => {
   *   if (enabled) {
   *     this.showNewFeature();
   *   }
   * });
   * ```
   */
  variation$(key: string, fallback: LDFlagValue): Observable<LDFlagValue> {
    // Start with the current value (fallback if client isn't ready), then listen for changes
    return this.onFlagChange$(key).pipe(
      map(() => this.variation(key, fallback)),
      startWith(this.variation(key, fallback)),
      distinctUntilChanged((prev: LDFlagValue, curr: LDFlagValue) => equal(prev, curr))
    );
  }

  /**
   * Gets detailed evaluation information for a feature flag as an observable stream.
   * Includes the flag value, variation index, and evaluation reason.
   * 
   * @param key - The feature flag key
   * @param fallback - Default value to return if flag is not available
   * @returns Observable that emits LDEvaluationDetail with flag value and metadata
   * 
   * @example
   * ```typescript
   * this.ldService.variationDetail$('pricing-tier', 'basic').subscribe(detail => {
   *   console.log(`Flag value: ${detail.value}`);
   *   console.log(`Reason: ${detail.reason.kind}`);
   * });
   * ```
   */
  variationDetail$(key: string, fallback: LDFlagValue): Observable<LDEvaluationDetail> {
    // Start with the current detail (fallback if client isn't ready), then listen for changes
    return this.onFlagChange$(key).pipe(
      map(() => this.variationDetail(key, fallback)),
      startWith(this.variationDetail(key, fallback)),
      distinctUntilChanged((prev: LDEvaluationDetail, curr: LDEvaluationDetail) => equal(prev, curr))
    );
  }

  /**
   * Private method that evaluates a feature flag value using the LaunchDarkly client.
   * Uses the provided client instance to ensure consistency and prevent race conditions.
   * 
   * @param key - The feature flag key
   * @param fallback - Default value to return if flag evaluation fails
   * @param client - Optional LaunchDarkly client instance (uses current client if not provided)
   * @returns The flag value or fallback if evaluation fails
   */
  private variation(key: string, fallback: LDFlagValue, client?: LDClient): LDFlagValue {
    // Use the provided client instance to ensure consistency within event handlers
    // and prevent race conditions where this.client might change between calls
    const clientToUse = client ?? this.clientSubject$.value;
    if(!clientToUse) {
      return fallback;
    }
    return clientToUse.variation(key, fallback);
  }

  /**
   * Private method that evaluates a feature flag and returns detailed evaluation information.
   * Uses the provided client instance to ensure consistency and prevent race conditions.
   * 
   * @param key - The feature flag key
   * @param fallback - Default value to return if flag evaluation fails
   * @param client - Optional LaunchDarkly client instance (uses current client if not provided)
   * @returns LDEvaluationDetail with flag value, variation index, and evaluation reason
   */
  private variationDetail(key: string, fallback: LDFlagValue, client?: LDClient): LDEvaluationDetail {
    // Use the provided client instance to ensure consistency within event handlers
    // and prevent race conditions where this.client might change between calls
    const clientToUse = client ?? this.clientSubject$.value;
     
    if (!clientToUse) {
      // we don't have a client set so we emulate a client not ready reason
      // this only would happen if we add support for lazy initialization
      return {
        value: fallback,
        variationIndex: undefined,
        reason: { kind: 'ERROR', errorKind: 'CLIENT_NOT_READY' }
      };
    } else {
      return clientToUse.variationDetail(key, fallback);
    }
  }
  
  /**
   * Changes the user context for the LaunchDarkly client.
   * This will trigger re-evaluation of all flags for the new context.
   * 
   * @param context - The new user context
   * @param timeoutMs - Optional timeout in milliseconds for the context change operation
   * @returns Promise that resolves when the context change is successful
   * 
   * @throws Will reject if the context change operation fails or times out
   * 
   * @example
   * ```typescript
   * const newContext = { key: 'user123', email: 'user@example.com' };
   * try {
   *   await this.ldService.setContext(newContext, 5000);
   *   console.log('Context updated successfully');
   * } catch (err) {
   *   console.error('Failed to update context', err);
   * }
   * ```
   */
  async setContext(context: LDContext, timeoutMs?: number): Promise<void> {
    const client = await this.getClient();
    const timeoutPromise : Promise<void> = timeoutMs ? new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('TimeoutError'));
      }, timeoutMs);
    }) : Promise.resolve();
    return Promise.race([client.identify(context).then(() => void 0), timeoutPromise]);
  }

  /**
   * Tracks a custom event for analytics and experimentation.
   * 
   * @param key - The event key/name to track
   * @param data - Optional custom data associated with the event
   * @param metricValue - Optional numeric value for the event
   * 
   * @example
   * ```typescript
   * // Track a simple event
   * this.ldService.track('button-clicked');
   * 
   * // Track an event with data
   * this.ldService.track('purchase-completed', { productId: 'abc123', amount: 99.99 });
   * 
   * // Track an event with metric value
   * this.ldService.track('page-view', { page: '/dashboard' }, 1);
   * ```
   */
  track(key: string, data?: unknown, metricValue?: number): void {
    this.getClient().then((client) => {
      client.track(key, data, metricValue);
    }).catch((error) => {
      // this should never happen
      console.error('[LaunchDarkly Service] Unexpected rejection when tracking event:', error);
    });
  }

  /**
   * Forces the LaunchDarkly client to flush any pending analytics events.
   * 
   * @throws Will throw an error if the flush operation fails. Be sure to handle this error.
   * @returns Promise that resolves when the flush operation completes
   */
  async flush(): Promise<void> {
    const client = await this.getClient();
    return client.flush();
  }
}
