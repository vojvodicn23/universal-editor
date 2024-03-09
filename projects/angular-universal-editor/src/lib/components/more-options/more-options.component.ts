import { Component, ElementRef, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';

@Component({
  selector: 'more-options',
  templateUrl: './more-options.component.html',
  styleUrls: ['./more-options.component.css']
})
export class MoreOptionsComponent {
  
  @Output() onOptions = new EventEmitter<string>();
  @Input() disabled = false;
  @Input() darkMode = false;

  @Input() mentionDisabled = false;
  @Input() linkDisabled = false;
  @Input() fileDisabled = false;
  @Input() codeDisabled = false;
  @Input() dateDisabled = false;
  @Input() enableMention = false;
  @Input() enableLink = false;
  @Input() enableFile = false;
  @Input() enableCode = false;
  @Input() enableDate = false;


  isOpen = false;
  el = inject(ElementRef);


  @HostListener('document:click', ['$event']) onHostClick(event: MouseEvent) {
    if(this.isOpen) {
      const dropdown = this.el.nativeElement.querySelector('.universal-editor-dropdown-content-more-options');
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

      const dropdown = this.el.nativeElement.querySelector('.universal-editor-dropdown-content-more-options');
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

  onSelect(option: string, isDisabled:boolean){
    if(isDisabled) return;
    this.onOptions.emit(option);
  }

}
