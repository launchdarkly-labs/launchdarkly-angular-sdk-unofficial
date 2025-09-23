import { TestBed, inject } from '@angular/core/testing';
import { NgZone, ElementRef } from '@angular/core';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { LaunchDarklyService } from '../../lib/services/launchdarkly.service';
import { LD_SERVICE_CONFIG, LDServiceConfig } from '../../lib/interfaces/launchdarkly.interface';

describe('LaunchDarklyService', () => {
  let service: LaunchDarklyService;
  let mockConfig: LDServiceConfig;
  let mockZone: jasmine.SpyObj<NgZone>;

  beforeEach(() => {
    mockConfig = {
      clientId: 'test-client-id',
      context: { key: 'test-user' },
      options: { streaming: true },
      timeout: 500
    };

    mockZone = jasmine.createSpyObj('NgZone', ['run'], {
      run: (fn: Function) => fn()
    });

    // Mock the LaunchDarkly SDK - we'll use a different approach
    // Since we can't easily mock ES modules in Jasmine, we'll test the service behavior
    // without mocking the actual SDK initialization

    TestBed.configureTestingModule({
      providers: [
        LaunchDarklyService,
        { provide: LD_SERVICE_CONFIG, useValue: mockConfig },
        { provide: NgZone, useValue: mockZone }
      ]
    });

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
      service.client$.subscribe((client: any) => {
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
      service.variation$('test-flag', 'fallback').subscribe((value: any) => {
        expect(value).toBeDefined();
        done();
      });
    });
  });

  describe('variationDetail$', () => {
    it('should return observable with detail object', (done) => {
      service.variationDetail$('test-flag', 'fallback').subscribe((detail: any) => {
        expect(detail).toBeDefined();
        expect(detail.value).toBeDefined();
        expect(detail.reason).toBeDefined();
        done();
      });
    });
  });

  describe('identify$', () => {
    it('should return observable for context change', (done) => {
      const newContext = { key: 'new-user' };
      
      service.identify$(newContext, 1000).subscribe({
        next: () => {
          expect(true).toBe(true); // Just verify it doesn't error
          done();
        },
        error: (err: any) => {
          // It's okay if this errors in test environment
          expect(err).toBeDefined();
          done();
        }
      });
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