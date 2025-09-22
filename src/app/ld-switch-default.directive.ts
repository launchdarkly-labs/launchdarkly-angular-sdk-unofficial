import { Directive, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { LdSwitchDirective } from './ld-switch.directive';

/**
 * Directive for the default case in ldSwitch.
 * Shows when no other case matches the flag value.
 * 
 * @example
 * ```html
 * <ng-template ldSwitchDefault>
 *   <div>Default content</div>
 * </ng-template>
 * ```
 */
@Directive({
  selector: '[ldSwitchDefault]'
})
export class LdSwitchDefaultDirective implements OnInit, OnDestroy {
  private view?: any;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private ldSwitch: LdSwitchDirective
  ) {}

  ngOnInit() {
    this.ldSwitch.registerDefault(this);
  }

  ngOnDestroy() {
    this.ldSwitch.unregisterDefault();
  }

  show() {
    if (!this.view) {
      this.view = this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }

  hide() {
    if (this.view) {
      this.viewContainer.clear();
      this.view = undefined;
    }
  }
}
