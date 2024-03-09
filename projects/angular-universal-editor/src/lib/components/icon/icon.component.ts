import { Component, Input } from '@angular/core';

@Component({
  selector: 'icon',
  templateUrl: './icon.component.html',
  styleUrls: ['./icon.component.css']
})
export class IconComponent {


  @Input() color = 'black';
  @Input() icon = '';
  @Input() width = 20; 
  @Input() height = 20; 
}
