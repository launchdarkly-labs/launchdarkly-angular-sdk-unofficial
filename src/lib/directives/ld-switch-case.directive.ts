import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { LdSwitchDirective } from './ld-switch.directive';

/**
 * Directive for individual cases in ldSwitch.
 * Registers itself with the parent LdSwitchDirective.
 * 
 * @example
 * ```html
 * <ng-template [ldSwitchCase]="'premium'">
 *   <div>Premium content</div>
 * </ng-template>
 * ```
 */
@Directive({
  selector: '[ldSwitchCase]'
})
export class LdSwitchCaseDirective implements OnInit, OnDestroy {
  @Input() ldSwitchCase!: any;
  private view?: any;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private ldSwitch: LdSwitchDirective
  ) {}

  ngOnInit() {
    this.ldSwitch.registerCase(this.ldSwitchCase, this);
  }

  ngOnDestroy() {
    this.ldSwitch.unregisterCase(this.ldSwitchCase);
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
