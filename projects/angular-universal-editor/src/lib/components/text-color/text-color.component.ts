import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, inject } from '@angular/core';
import { equal } from '../../shared/custom-methods';

export interface Color {
  colorName: string,
  colorCode: string,
  selected: boolean
}

@Component({
  selector: 'text-color',
  templateUrl: './text-color.component.html',
  styleUrls: ['./text-color.component.css']
})
export class TextColorComponent implements AfterViewInit{

  

  @Output() onColorChange = new EventEmitter<Color>();
  @Input() defaultColorName = 'Black';
  @Input() colors:Color[] = [];
  @Input() darkMode = false;
  @Input() disabled = false;


  isOpen = false;
  selectedColor = this.colors.find(col => col.colorName === this.defaultColorName);

  el = inject(ElementRef);

  ngOnInit(){
    
  }

  ngAfterViewInit() {
    setTimeout(()=>{     
      this.colors = this.colors.map(item => {
        if(item.colorName == this.defaultColorName){
          item.selected = true;
          this.selectedColor = item;
        }
        else{
          item.selected = false;
        }
        return item;
      });
    },0);
  }
  


  @HostListener('document:click', ['$event']) onHostClick(event: MouseEvent) {
    if(this.isOpen) {
      const dropdown = this.el.nativeElement.querySelector('.universal-editor-dropdown-content-text-color');
      dropdown.style.display = 'none';
      this.isOpen = false;
    }
    else if(this.el.nativeElement.contains(event.target)){
      this.openDropdown();
    }
  }

  openDropdown(){
    if(!this.isOpen){
      const rect = this.el.nativeElement.getBoundingClientRect();
      const buttonX = rect.left + window.scrollX;
      const buttonY = rect.top + window.scrollY;

      const dropdown = this.el.nativeElement.querySelector('.universal-editor-dropdown-content-text-color');
      dropdown.style.display = 'block';
      this.isOpen = true;
      const dropdownHeight = dropdown.clientHeight;
      const dropdownWidth = dropdown.offsetWidth;
      const rightWidth = window.innerWidth - buttonX;

      if(buttonY > dropdownHeight){
        dropdown.style.top = `${buttonY - 15 - dropdownHeight}px`;
      }
      else{
        dropdown.style.top = `${buttonY + 30 + 5}px`;
      }
      if(rightWidth > dropdownWidth){
        dropdown.style.left = `${buttonX}px`;
      }
      else{
        dropdown.style.left = `${buttonX - (dropdownWidth - rightWidth)}px`;
      }
      //console.log(buttonX, buttonY)
    }
    
  }

  onSelect(color: Color){
    this.setColor(color);
    this.onColorChange.emit(color);
  }

  setColor(color:Color){
    this.colors = this.colors.map(item => {
      if(equal(item, color)){
        item.selected = true;
        this.selectedColor = item;
      }
      else{
        item.selected = false;
      }
      return item;
    });
  }


}
