import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[tooltipText]'
})
export class TooltipDirective {
  @Input() tooltipText = '';
  @Input() tooltipPostition = 'above';

  tooltipElement: HTMLElement | undefined;

  timeoutId: any;
  hideTimeoutId: any;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('mouseenter') onMouseEnter() {
    if (this.hideTimeoutId) {
      clearTimeout(this.hideTimeoutId);
    }
    this.createTooltip();
  }

  @HostListener('mouseleave') onMouseLeave() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.destroyTooltip();
  }

  createTooltip() {
    this.timeoutId = setTimeout(() => {
      if (!this.tooltipElement && this.tooltipText) {
        this.tooltipElement = this.renderer.createElement('div');
        this.renderer.addClass(this.tooltipElement, 'tooltip');
        if(this.tooltipElement){
          this.tooltipElement.textContent = this.tooltipText;
          this.renderer.appendChild(this.el.nativeElement, this.tooltipElement);

          const hostPos = this.el.nativeElement.getBoundingClientRect();
          const tooltipPos = this.tooltipElement.getBoundingClientRect();

          let top = -(hostPos.height / 2 + tooltipPos.height / 2 + 6);
          let right = hostPos.width / 2 - tooltipPos.width / 2;
          if(this.tooltipPostition === 'bellow'){
            top = (hostPos.height / 2 + tooltipPos.height / 2 + 6);
          }
          this.renderer.setStyle(this.tooltipElement, 'right', `${right}px`);
          this.renderer.setStyle(this.tooltipElement, 'top', `${top}px`);
        }
      }
    }, 400);
  }

  destroyTooltip() {
    if (this.hideTimeoutId) {
      clearTimeout(this.hideTimeoutId);
    }

    this.hideTimeoutId = setTimeout(() => {
      if (this.tooltipElement) {
        this.renderer.removeChild(this.el.nativeElement, this.tooltipElement);
        this.tooltipElement = undefined;
      }
    }, 400);
  }
}
