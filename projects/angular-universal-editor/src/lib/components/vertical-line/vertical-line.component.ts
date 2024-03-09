import { Component, Input } from '@angular/core';

@Component({
  selector: 'vertical-line',
  templateUrl: './vertical-line.component.html',
  styleUrls: ['./vertical-line.component.css']
})
export class VerticalLineComponent {
  @Input() height = '20px';

}
