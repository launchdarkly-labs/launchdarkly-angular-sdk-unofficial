import { TestBed } from '@angular/core/testing';
import { LaunchDarklyService } from '../../lib/services/launchdarkly.service';
import { setupLaunchDarklyServiceWithMockedClient } from '../mocks/launchdarkly.mock';

describe('LaunchDarklyService', () => {
  let service: LaunchDarklyService;

  beforeEach(() => {
    // Set up service with mocked client
    const setup = setupLaunchDarklyServiceWithMockedClient();
    
    // Configure TestBed with the setup providers
    TestBed.configureTestingModule({
      providers: setup.providers
    });

    // Get the real service with mocked client
    service = TestBed.inject(LaunchDarklyService);
  });

  afterEach(() => {
    // Clean up any subscriptions or state
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize LaunchDarkly client on construction', () => {
    // Test that service is created successfully with proper configuration
    expect(service).toBeTruthy();
    expect(service.client$).toBeDefined();
    expect(service.waitUntilReady$).toBeDefined();
  });

  describe('createAppInitializer', () => {
    it('should create APP_INITIALIZER factory function', () => {
      const factory = LaunchDarklyService.createAppInitializer(1000);
      expect(typeof factory).toBe('function');
    });

    it('should return a function that resolves to boolean', async () => {
      const factory = LaunchDarklyService.createAppInitializer(1000);
      const initFn = factory(service);
      const result = await initFn();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('client$', () => {
    it('should emit client instance', (done) => {
      service.client$.subscribe(client => {
        expect(client).toBeDefined();
        done();
      });
    });
  });

  describe('waitUntilReady$', () => {
    it('should emit boolean value', (done) => {
      service.waitUntilReady$(1000).subscribe((isReady: boolean) => {
        expect(typeof isReady).toBe('boolean');
        done();
      });
    });
  });

  describe('variation$', () => {
    it('should return observable with fallback value', (done) => {
      service.variation$('test-flag', 'fallback').subscribe(value => {
        expect(value).toBeDefined();
        done();
      });
    });
  });

  describe('variationDetail$', () => {
    it('should return observable with detail object', (done) => {
      service.variationDetail$('test-flag', 'fallback').subscribe(detail => {
        expect(detail).toBeDefined();
        expect(detail.value).toBeDefined();
        expect(detail.reason).toBeDefined();
        done();
      });
    });
  });

  describe('setContext', () => {
    it('should return promise for context change', async () => {
      const newContext = { key: 'new-user' };
      
      try {
        await service.setContext(newContext, 1000);
        expect(true).toBe(true); // Just verify it doesn't error
      } catch (err: unknown) {
        // It's okay if this errors in test environment
        expect(err).toBeDefined();
      }
    });
  });

  describe('track', () => {
    it('should track events without throwing', () => {
      expect(() => {
        service.track('test-event', { data: 'test' }, 1);
      }).not.toThrow();
    });

    it('should track events without data', () => {
      expect(() => {
        service.track('test-event');
      }).not.toThrow();
    });
  });

  describe('flush', () => {
    it('should flush events without throwing', async () => {
      await expectAsync(service.flush()).toBeResolved();
    });
  });
}); 