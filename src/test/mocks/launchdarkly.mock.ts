import { BehaviorSubject, of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import type { LDClient, LDEvaluationDetail, LDFlagSet, LDFlagValue, LDFlagChangeset } from 'launchdarkly-js-client-sdk';
import { LaunchDarklyService } from '../../lib/services/launchdarkly.service';
import { LD_SERVICE_CONFIG, LDServiceConfig } from '../../lib/interfaces/launchdarkly.interface';

/**
 * Creates a fresh LaunchDarkly client mock for each test.
 * This ensures test isolation and prevents interference between tests.
 * 
 * @returns A new jasmine spy object for LDClient
 */
export const createLdClientMock = (): jasmine.SpyObj<LDClient> => {
  const mock = jasmine.createSpyObj('LDClient', [
    'track',
    'identify',
    'allFlags',
    'close',
    'flush',
    'getContext',
    'off',
    'on',
    'setStreaming',
    'variation',
    'variationDetail',
    'waitForInitialization',
    'waitUntilGoalsReady',
    'waitUntilReady'
  ]);

  // Set up default mock behaviors
  mock.track.and.returnValue(undefined);
  mock.identify.and.returnValue(Promise.resolve({} as LDFlagSet));
  mock.allFlags.and.returnValue(Promise.resolve({}));
  mock.close.and.returnValue(Promise.resolve());
  mock.flush.and.returnValue(Promise.resolve());
  mock.getContext.and.returnValue({ key: 'test-user' });
  mock.off.and.returnValue(undefined);
  mock.on.and.returnValue(undefined);
  mock.setStreaming.and.returnValue(undefined);
  mock.variation.and.returnValue('fallback');
  mock.variationDetail.and.returnValue({
    value: false,
    variationIndex: undefined,
    reason: { kind: 'ERROR', errorKind: 'CLIENT_NOT_READY' }
  } as LDEvaluationDetail);
  mock.waitForInitialization.and.returnValue(Promise.resolve());
  mock.waitUntilGoalsReady.and.returnValue(Promise.resolve());
  mock.waitUntilReady.and.returnValue(Promise.resolve());

  return mock;
};

/**
 * Global mock client for backward compatibility (deprecated)
 * @deprecated Use createLdClientMock() for better test isolation
 */
export const ldClientMock: jasmine.SpyObj<LDClient> = createLdClientMock();

/**
 * Creates a real LaunchDarklyService instance with a mocked client.
 * This approach tests the actual service logic while controlling the client behavior.
 * 
 * @param initialFlags - Optional initial flag values to set on the mock client
 * @returns A real LaunchDarklyService instance with mocked client
 * @deprecated Use createLaunchDarklyServiceWithMockedClientDirect instead
 */
export const createLaunchDarklyServiceWithMockedClient = (
  initialFlags?: LDFlagSet
): LaunchDarklyService => {
  // Reset the mock client
  resetLDMocks();
  
  // Set up initial flags if provided
  if (initialFlags) {
    mockFlags(initialFlags);
  }
  
  // Create a mock configuration
  const mockConfig: LDServiceConfig = {
    clientId: 'test-client-id',
    context: { key: 'test-user' },
    options: { streaming: true },
    timeout: 500
  };
  
  // Create the real service using TestBed to provide injection context
  const service = TestBed.configureTestingModule({
    providers: [
      { provide: LD_SERVICE_CONFIG, useValue: mockConfig }
    ]
  }).inject(LaunchDarklyService);
  
  return service;
};

/**
 * Creates a real LaunchDarklyService instance with a mocked client for use in tests.
 * This approach tests the actual service logic while controlling the client behavior.
 * 
 * @param initialFlags - Optional initial flag values to set on the mock client
 * @returns A real LaunchDarklyService instance with mocked client
 * @deprecated Use createLaunchDarklyServiceWithMockedClientDirect instead
 */
export const createLaunchDarklyServiceForTesting = (
  initialFlags?: LDFlagSet
): LaunchDarklyService => {
  // Reset the mock client
  resetLDMocks();
  
  // Set up initial flags if provided
  if (initialFlags) {
    mockFlags(initialFlags);
  }
  
  // Create a mock configuration
  const mockConfig: LDServiceConfig = {
    clientId: 'test-client-id',
    context: { key: 'test-user' },
    options: { streaming: true },
    timeout: 500
  };
  
  // Create the real service using TestBed to provide injection context
  const service = TestBed.configureTestingModule({
    providers: [
      { provide: LD_SERVICE_CONFIG, useValue: mockConfig }
    ]
  }).inject(LaunchDarklyService);
  
  return service;
};

/**
 * Creates a fresh mock LaunchDarkly service for each test.
 * This ensures test isolation and prevents interference between tests.
 * 
 * @param clientMock - Optional client mock to use (defaults to creating a new one)
 * @returns A new jasmine spy object for LaunchDarklyService
 */
export const createMockLaunchDarklyService = (clientMock?: jasmine.SpyObj<LDClient>) => {
  const client = clientMock || createLdClientMock();
  
  const mock = jasmine.createSpyObj('LaunchDarklyService', [
    'variation$',
    'variationDetail$',
    'track',
    'setContext',
    'flush',
    'waitUntilReady',
    'waitUntilGoalsReady',
    'waitUntilReady$',
    'waitForInitialization$'
  ], {
    client$: new BehaviorSubject(client),
    isInitialized$: of(true),
    goalsReady$: of(true),
    flagChanges$: of({ flagKey: 'test-flag', value: 'test-value' })
  });

  // Set up method returns
  mock.waitUntilReady$.and.returnValue(of(true));
  mock.waitForInitialization$.and.returnValue(of(true));
  mock.waitUntilReady.and.returnValue(Promise.resolve(true));
  mock.waitUntilGoalsReady.and.returnValue(Promise.resolve());
  mock.setContext.and.returnValue(Promise.resolve());
  mock.flush.and.returnValue(Promise.resolve());
  mock.track.and.returnValue(undefined);
  mock.variation$.and.returnValue(of('fallback'));
  mock.variationDetail$.and.returnValue(of({
    value: 'fallback',
    variationIndex: undefined,
    reason: { kind: 'FALLBACK' }
  }));

  return mock;
};

/**
 * Mock flags for testing
 * 
 * @param flags - The flag values to mock
 * @param clientMock - Optional client mock to use (defaults to global ldClientMock)
 */
export const mockFlags = (flags: LDFlagSet, clientMock?: jasmine.SpyObj<LDClient>) => {
  const client = clientMock || ldClientMock;
  
  // Mock the variation method to return specific flag values
  client.variation.and.callFake((flagKey: string, defaultValue: unknown) => {
    return flags[flagKey] !== undefined ? flags[flagKey] : defaultValue;
  });

  client.variationDetail.and.callFake((flagKey: string, defaultValue: unknown) => {
    const value = flags[flagKey] !== undefined ? flags[flagKey] : defaultValue;
    return {
      value,
      variationIndex: undefined,
      reason: { kind: 'FALLBACK' }
    } as LDEvaluationDetail;
  });

  client.allFlags.and.returnValue(flags);
};

/**
 * Simulates a flag change event on the mock client.
 * This triggers the 'change' event listener that the service has registered.
 * 
 * @param flagKey - The flag key that changed
 * @param newValue - The new flag value
 * @param oldValue - The previous flag value (optional)
 * @param clientMock - Optional client mock to use (defaults to global ldClientMock)
 */
export const simulateFlagChange = (flagKey: string, newValue: LDFlagValue, oldValue?: LDFlagValue, clientMock?: jasmine.SpyObj<LDClient>) => {
  const client = clientMock || ldClientMock;
  
  // Update the variation method to return the new value
  client.variation.and.callFake((key: string, defaultValue: LDFlagValue) => {
    if (key === flagKey) {
      return newValue;
    }
    return defaultValue;
  });
  
  // Update the variationDetail method
  client.variationDetail.and.callFake((key: string, defaultValue: LDFlagValue) => {
    const value = key === flagKey ? newValue : defaultValue;
    return {
      value,
      variationIndex: undefined,
      reason: { kind: 'FALLBACK' }
    } as LDEvaluationDetail;
  });
  
  // Simulate the change event by calling the registered event handler
  const changeHandler = client.on.calls.all().find(call => call.args[0] === 'change');
  if (changeHandler) {
    const changeset: LDFlagChangeset = {
      [flagKey]: {
        current: newValue,
        previous: oldValue
      }
    };
    changeHandler.args[1](changeset);
  }
};

/**
 * Simulates the 'initialized' event on the mock client.
 * This triggers the service's initialization logic.
 * 
 * @param clientMock - Optional client mock to use (defaults to global ldClientMock)
 */
export const simulateInitialization = (clientMock?: jasmine.SpyObj<LDClient>) => {
  const client = clientMock || ldClientMock;
  const initHandler = client.on.calls.all().find(call => call.args[0] === 'initialized');
  if (initHandler) {
    initHandler.args[1]();
  }
};

/**
 * Simulates the 'goalsReady' event on the mock client.
 * 
 * @param clientMock - Optional client mock to use (defaults to global ldClientMock)
 */
export const simulateGoalsReady = (clientMock?: jasmine.SpyObj<LDClient>) => {
  const client = clientMock || ldClientMock;
  const goalsHandler = client.on.calls.all().find(call => call.args[0] === 'goalsReady');
  if (goalsHandler) {
    goalsHandler.args[1]();
  }
};

/**
 * Reset all LaunchDarkly mocks
 * 
 * @param clientMock - Optional client mock to reset (defaults to global ldClientMock)
 */
export const resetLDMocks = (clientMock?: jasmine.SpyObj<LDClient>) => {
  const client = clientMock || ldClientMock;
  
  // Reset all spy methods
  Object.keys(client).forEach((key) => {
    const spy = (client as unknown as Record<string, jasmine.Spy>)[key];
    if (spy && spy.calls) {
      spy.calls.reset();
    }
  });

  // Reset to default behaviors
  client.track.and.returnValue(undefined);
  client.identify.and.returnValue(Promise.resolve({} as LDFlagSet));
  client.allFlags.and.returnValue(Promise.resolve({} as LDFlagSet));
  client.close.and.returnValue(Promise.resolve());
  client.flush.and.returnValue(Promise.resolve());
  client.getContext.and.returnValue({ key: 'test-user' });
  client.off.and.returnValue(undefined);
  client.on.and.returnValue(undefined);
  client.setStreaming.and.returnValue(undefined);
  client.variation.and.returnValue('fallback');
  client.variationDetail.and.returnValue({
    value: 'fallback',
    variationIndex: undefined,
    reason: { kind: 'FALLBACK' }
  } as LDEvaluationDetail);
  client.waitForInitialization.and.returnValue(Promise.resolve());
  client.waitUntilGoalsReady.and.returnValue(Promise.resolve());
  client.waitUntilReady.and.returnValue(Promise.resolve());
};

/**
 * Sets up TestBed configuration for a REAL LaunchDarklyService with a mocked client
 * This function should be called BEFORE TestBed.configureTestingModule()
 * 
 * @param clientMock - Optional client mock to use (defaults to creating a new one)
 * @param initialFlags - Optional initial flag values to set on the mock client
 * @returns Configuration object to be used in TestBed.configureTestingModule()
 */
export const setupLaunchDarklyServiceWithMockedClient = (
  clientMock?: jasmine.SpyObj<LDClient>,
  initialFlags?: LDFlagSet
) => {
  // Create or use provided client mock
  const client = clientMock || createLdClientMock();
  
  // Set up initial flags if provided
  if (initialFlags) {
    mockFlags(initialFlags, client);
  }
  
  // Create a mock configuration
  const mockConfig: LDServiceConfig = {
    clientId: 'test-client-id',
    context: { key: 'test-user' },
    options: { streaming: true },
    timeout: 500
  };
  
  // Create a test service class that extends the real service
  class TestLaunchDarklyService extends LaunchDarklyService {
    protected override _initialize(): void {
      // Override _initialize to use our mock client instead of creating a real one
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any)._setClient(client);
    }
  }
  
  // Return configuration for TestBed
  return {
    providers: [
      { provide: LD_SERVICE_CONFIG, useValue: mockConfig },
      { provide: LaunchDarklyService, useFactory: () => new TestLaunchDarklyService() }
    ],
    clientMock: client
  };
};
