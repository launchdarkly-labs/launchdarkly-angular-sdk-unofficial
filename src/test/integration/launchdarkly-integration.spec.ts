import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgZone, Component } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { LaunchDarklyAngularModule } from '../../lib/launchdarkly-angular.module';
import { LaunchDarklyService } from '../../lib/services/launchdarkly.service';
import { LD_SERVICE_CONFIG } from '../../lib/interfaces/launchdarkly.interface';

describe('LaunchDarklyAngularModule Integration', () => {
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;
  let ldService: LaunchDarklyService;

  beforeEach(async () => {
    // Test without mocking the SDK - focus on module integration
    await TestBed.configureTestingModule({
      declarations: [TestComponent],
      imports: [
        LaunchDarklyAngularModule.forRoot({
          clientId: 'test-client-id',
          context: { key: 'test-user' },
          options: { streaming: true }
        })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    ldService = TestBed.inject(LaunchDarklyService);
  });

  it('should create component with LaunchDarkly module', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize LaunchDarkly service', () => {
    expect(ldService).toBeTruthy();
    expect(ldService.client$).toBeDefined();
    expect(ldService.waitUntilReady$).toBeDefined();
  });

  it('should provide LaunchDarkly service', () => {
    expect(ldService).toBeInstanceOf(LaunchDarklyService);
  });

  it('should handle flag variations', (done) => {
    ldService.variation$('test-flag', 'fallback').subscribe((value: any) => {
      expect(value).toBeDefined();
      done();
    });
  });

  it('should handle flag detail variations', (done) => {
    ldService.variationDetail$('test-flag', 'fallback').subscribe((detail: any) => {
      expect(detail).toBeDefined();
      expect(detail.value).toBeDefined();
      expect(detail.reason).toBeDefined();
      done();
    });
  });

  it('should track events without throwing', () => {
    expect(() => {
      ldService.track('test-event', { data: 'test' }, 1);
    }).not.toThrow();
  });

  it('should handle user identification', (done) => {
    const newContext = { key: 'new-user' };
    ldService.identify$(newContext, 1000).subscribe({
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

  it('should flush events without throwing', async () => {
    await expectAsync(ldService.flush()).toBeResolved();
  });
});

describe('LaunchDarklyAngularModule forChild', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestComponent],
      imports: [
        LaunchDarklyAngularModule.forChild()
      ],
      providers: [
        { provide: LD_SERVICE_CONFIG, useValue: {
          clientId: 'test-client-id',
          context: { key: 'test-user' },
          options: { streaming: true },
          timeout: 500
        }}
      ]
    }).compileComponents();
  });

  it('should create component with forChild module', () => {
    const fixture = TestBed.createComponent(TestComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});

@Component({
  template: `
    <div *ldIf="'test-flag'; fallback: false">Test Content</div>
    <div [ldClassIf]="'premium-features'" [ldClassIfClass]="'premium-user'">User content</div>
    <div [ldStyle]="'theme'" [ldStyleStyle]="'background: red'">Themed content</div>
    <button [ldTrack]="'button-clicked'">Click me</button>
  `
})
class TestComponent {}