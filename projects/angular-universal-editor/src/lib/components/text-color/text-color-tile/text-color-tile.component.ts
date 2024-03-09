import { Component, Input } from '@angular/core';

@Component({
  selector: 'text-color-tile',
  templateUrl: './text-color-tile.component.html',
  styleUrls: ['./text-color-tile.component.css']
})
export class TextColorTileComponent {

  @Input() colorCode = 'gray';
  @Input() colorName = 'Default';
  @Input() selected = false;
  
}
