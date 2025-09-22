import { Injectable, InjectionToken, NgZone, Inject } from '@angular/core';
import { BehaviorSubject, Observable, distinctUntilChanged, map, defer, EMPTY, finalize, switchMap, filter, from, of, startWith, catchError, throwError, timeout, concatMap, take, Subject, MonoTypeOperatorFunction, timer, race, tap, firstValueFrom } from 'rxjs';
import {
  initialize,
  type LDClient,
  type LDContext,
  type LDFlagValue,
  type LDOptions,
  type LDEvaluationDetail,
  LDFlagChangeset
} from 'launchdarkly-js-client-sdk';
import * as equal from 'fast-deep-equal';

export interface LDServiceConfig {
  options?: LDOptions;
  context: LDContext;
  timeout?: number;
  clientId: string;
}
export interface FlagChangeEvent {
  key: string;
  current: LDFlagValue;
  previous: LDFlagValue | undefined;
}
export const LD_SERVICE_CONFIG = new InjectionToken<LDServiceConfig>('configuration for the launchdarkly service');

// Utility operator for conditional application
function when<T>(condition: boolean, operator: MonoTypeOperatorFunction<T>): MonoTypeOperatorFunction<T> {
  return condition ? operator : (source: Observable<T>) => source;
}

@Injectable({ providedIn: 'root' })
export class LaunchDarklyService {
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
  static createAppInitializer(timeoutMs: number = 500) {
    return (ldService: LaunchDarklyService): () => Promise<boolean> => {
      return () => firstValueFrom(ldService.waitUntilReady$(timeoutMs));
    };
  }
  private clientSubject$ = new BehaviorSubject<LDClient | undefined>(undefined);
  private isInitializedSubject$ = new BehaviorSubject<boolean>(false);
  private goalsReadySubject$ = new BehaviorSubject<boolean>(false);
  private flagChangesSubject$ = new Subject<FlagChangeEvent>();

  constructor(
    @Inject(NgZone) private zone: NgZone,
    @Inject(LD_SERVICE_CONFIG) private config: LDServiceConfig
  ) {
    // Auto-initialize if context is provided
    this._initialize(this.config.clientId, this.config.context, this.config.options);
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
   * } else {
   *     console.log('Still waiting for LaunchDarkly...');
   * }
   * });
   * ```
   */
  waitUntilReady$(timeoutMs: number): Observable<boolean> {
    return this.waitForInitialization$(timeoutMs).pipe(
      catchError((error: any) => {
        return this.isInitializedSubject$.asObservable().pipe(
          startWith(false)
        );
      })
    )
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
   * Private method that initializes the LaunchDarkly client with the provided configuration.
   * Sets up event listeners for flag changes, initialization, and goals ready events.
   * 
   * @param clientId - LaunchDarkly client-side ID
   * @param context - User context for flag evaluation
   * @param options - Optional LaunchDarkly client options
   * 
   * @throws Will log an error if called after client is already initialized
   */
  private _initialize(clientId: string, context: LDContext, options: LDOptions = {}): void {
    // copy so we don't mutate the original options
    console.log("[LaunchDarkly Service] initializing");
    let clientOptions = { ...options };
    if (!Object.prototype.hasOwnProperty.call(clientOptions, 'streaming')) {
      clientOptions.streaming = true;
    }
    if (this.clientSubject$.value) {
      console.error('[LaunchDarkly Service] initialize called after LD already initialized, skipping. please ensure this is only called once.');
      return;
    }

    const client = initialize(clientId, context, clientOptions);
    this.clientSubject$.next(client);
    // Set up global flag change listener
    client.on('change', (settings: LDFlagChangeset) => {
      console.log('[LaunchDarkly Service] Flag changes detected:', Object.keys(settings));
      Object.entries(settings).forEach(([key, { current, previous }]) => {
        this.zone.run(() => this.flagChangesSubject$.next({
          key,
          current,
          previous
        }));
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
        })

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
  variation$ < T extends LDFlagValue = LDFlagValue > (key: string, fallback: T): Observable < T > {
      return this.clientSubject$.pipe(
        switchMap((client: LDClient | undefined) => {
          if (!client) {
            console.log("[LaunchDarkly Service] variation$ called before client is ready, returning fallback");
            // Return fallback until client is ready
            return of(fallback);
          }

          // Start with the current value, then listen for changes
          return this.onFlagChange$(key).pipe(
            map((changeEvent) => {
              const value = this.variation<T>(key, fallback, client);
              console.log("[LaunchDarkly Service] variation$ emitted", value);
              return value;
            }),
            startWith(this.variation<T>(key, fallback, client)),
            distinctUntilChanged((prev: T, curr: T) => equal(prev, curr))
          );
        })
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
    variationDetail$ < T extends LDFlagValue = LDFlagValue > (key: string, fallback: T): Observable < LDEvaluationDetail > {
      return this.clientSubject$.pipe(
        switchMap((client: LDClient | undefined) => {
          if (!client) {
            console.log("[LaunchDarkly Service] variationDetail$ called before client is ready, returning fallback detail");
            // Return fallback detail until client is ready
            const fallbackDetail: LDEvaluationDetail = {
              value: fallback,
              variationIndex: undefined,
              reason: { kind: 'FALLBACK' }
            };
            return of(fallbackDetail);
          }

          // Start with the current detail, then listen for changes
          return this.onFlagChange$(key).pipe(
            map((changeEvent) => {
              const detail = this.variationDetail<T>(key, fallback, client);
              console.log("[LaunchDarkly Service] variationDetail$ emitted", detail);
              return detail;
            }),
            startWith(this.variationDetail<T>(key, fallback, client)),
            distinctUntilChanged((prev: LDEvaluationDetail, curr: LDEvaluationDetail) => equal(prev, curr))
          );
        })
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
    private variation < T extends LDFlagValue = LDFlagValue > (key: string, fallback: T, client ?: LDClient): T {
      // Use the provided client instance to ensure consistency within event handlers
      // and prevent race conditions where this.client might change between calls
      const clientToUse = client ?? this.clientSubject$.value;
      try { return (clientToUse?.variation(key, fallback) ?? fallback) as T; }
      catch { return fallback; }
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
    private variationDetail < T extends LDFlagValue = LDFlagValue > (key: string, fallback: T, client ?: LDClient): LDEvaluationDetail {
      // Use the provided client instance to ensure consistency within event handlers
      // and prevent race conditions where this.client might change between calls
      const clientToUse = client ?? this.clientSubject$.value;
      if (!clientToUse) {
        return {
          value: fallback,
          variationIndex: undefined,
          reason: { kind: 'FALLBACK' }
        };
      }
      const detail = clientToUse.variationDetail(key, fallback);
      return {
        value: detail.value ?? fallback,
        variationIndex: detail.variationIndex,
        reason: detail.reason ?? { kind: 'FALLBACK' }
      } as LDEvaluationDetail;
    }
  
  
  /**
   * Changes the user context for the LaunchDarkly client.
   * This will trigger re-evaluation of all flags for the new context.
   * 
   * @param context - The new user context
   * @param timeoutMs - Optional timeout in milliseconds for the identify operation
   * @returns Observable that completes when the context change is successful
   * 
   * @throws Will emit an error if the identify operation fails or times out
   * 
   * @example
   * ```typescript
   * const newContext = { key: 'user123', email: 'user@example.com' };
   * this.ldService.identify$(newContext, 5000).subscribe({
   *   next: () => console.log('Context updated'),
   *   error: (err) => console.error('Failed to update context', err)
   * });
   * ```
   */
  identify$(context: LDContext, timeoutMs?: number): Observable<void> {
    if(!timeoutMs) {
      console.warn('[LaunchDarkly Service] identify$ called without a timeout');
    }
    return this.clientSubject$.pipe(
      when(!!timeoutMs, timeout(timeoutMs!)),
      filter((client): client is LDClient => client !== undefined),
      concatMap((client) => from(client.identify(context).then(() => void 0))),
      catchError((error: any) => {
        return throwError(() => error);
      })
    );
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
  track(key: string, data?: any, metricValue?: number): void {
    firstValueFrom(this.clientSubject$.pipe(
      filter((client): client is LDClient => client !== undefined),
      take(1)
    )).then((client) => {
      client.track(key, data, metricValue);
    }).catch((error: any) => {
      console.error('[LaunchDarkly Service] Error tracking event:', error);
    })  ;
  }

  /**
   * Forces the LaunchDarkly client to flush any pending analytics events.   * 
   * @returns Promise that resolves when the flush operation completes
   * 
   */
  async flush(): Promise<void> {
    return firstValueFrom(this.clientSubject$.pipe(
      take(1),
      filter((client): client is LDClient => client !== undefined),
      concatMap((client) => from(client.flush()))
    ))
  }
}
