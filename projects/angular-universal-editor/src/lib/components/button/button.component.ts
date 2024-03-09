import { Component, Input } from '@angular/core';

@Component({
  selector: 'universal-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.css']
})
export class ButtonComponent {
  @Input() showIcon = false;
  @Input() bigButtton = false;
  @Input() darkMode = false;
  @Input() isOpen = false;
  @Input() isSelected = false;
  @Input() isDisabled = false;
  @Input() tooltip = '';
  @Input() tooltipPosition = 'above';

}
