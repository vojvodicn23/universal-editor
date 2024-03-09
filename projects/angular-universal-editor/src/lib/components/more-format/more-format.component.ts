import { Component, ElementRef, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';


@Component({
  selector: 'more-format',
  templateUrl: './more-format.component.html',
  styleUrls: ['./more-format.component.css']
})
export class MoreFormatComponent{


  @Output() onFormat = new EventEmitter<string>();
  @Input() disabled = false;
  @Input() darkMode = false;

  @Input() isUnderline = false;
  @Input() isStrikethrough = false;
  @Input() isSubscript = false;
  @Input() isSuperscript = false;
  @Input() underlineDisabled = false;
  @Input() strikethroughDisabled = false;
  @Input() subscriptDisabled = false;
  @Input() superscriptDisabled = false;
  @Input() clearFormattingDisabled = false;
  @Input() enableUnderline = false;
  @Input() enableStrikethrough = false;
  @Input() enableSubscript = false;
  @Input() enableSuperscript = false;
  @Input() enableClearFormatting = false;


  isOpen = false;
  el = inject(ElementRef);


  @HostListener('document:click', ['$event']) onHostClick(event: MouseEvent) {
    if(this.isOpen) {
      const dropdown = this.el.nativeElement.querySelector('.universal-editor-dropdown-content-more-format');
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

      const dropdown = this.el.nativeElement.querySelector('.universal-editor-dropdown-content-more-format');
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

  onSelect(format: string, isDisabled:boolean){
    if(isDisabled) return;
    this.onFormat.emit(format);
  }


}
