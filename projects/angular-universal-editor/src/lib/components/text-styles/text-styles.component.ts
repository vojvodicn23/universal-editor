import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild, inject } from '@angular/core';
import { Const } from '../../shared/constants';
import { Observable } from 'rxjs';

@Component({
  selector: 'text-styles',
  templateUrl: './text-styles.component.html',
  styleUrls: ['./text-styles.component.css']
})
export class TextStylesComponent implements OnInit{


  @Output() onStyleChange = new EventEmitter<string>();
  @Input() disabled = false;
  @Input() darkMode = false;
  @Input() editorWidth$!: Observable<number>;


  editorWidth = 1000;
  isOpen = false;
  selectedStyle ='Normal text';
  style ='p';
  pSelected = true;
  h1Selected = false;
  h2Selected = false;
  h3Selected = false;
  h4Selected = false;
  h5Selected = false;
  h6Selected = false;
  el = inject(ElementRef);

  ngOnInit(): void {
    this.editorWidth$.subscribe(width => {
      this.editorWidth = width;
      this.setStyle(this.style);
    });
  }

  @HostListener('document:click', ['$event']) onHostClick(event: MouseEvent) {
    if(this.isOpen) {
      const dropdown = this.el.nativeElement.querySelector('.universal-editor-dropdown-content-text-styles');
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

      const dropdown = this.el.nativeElement.querySelector('.universal-editor-dropdown-content-text-styles');
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

  onSelect(style: string){
    this.setStyle(style);
    this.onStyleChange.emit(style);
  }

  setStyle(style:string){
    this.pSelected = false;
    this.h1Selected = false;
    this.h2Selected = false;
    this.h3Selected = false;
    this.h4Selected = false;
    this.h5Selected = false;
    this.h6Selected = false;
    this.style = style;
    if(style === 'p'){
      this.pSelected = true;
      this.selectedStyle = this.editorWidth > Const.editorWidthL ? 'Normal text' : 'P';
    }
    else if(style === 'h1'){
      this.h1Selected = true;
      this.selectedStyle = this.editorWidth > Const.editorWidthL ? 'Heading 1' : 'H1';
    }
    else if(style === 'h2'){
      this.h2Selected = true;
      this.selectedStyle = this.editorWidth > Const.editorWidthL ? 'Heading 2' : 'H2';
    }
    else if(style === 'h3'){
      this.h3Selected = true;
      this.selectedStyle = this.editorWidth > Const.editorWidthL ? 'Heading 3' : 'H3';
    }
    else if(style === 'h4'){
      this.h4Selected = true;
      this.selectedStyle = this.editorWidth > Const.editorWidthL ? 'Heading 4' : 'H4';
    }
    else if(style === 'h5'){
      this.h5Selected = true;
      this.selectedStyle = this.editorWidth > Const.editorWidthL ? 'Heading 5' : 'H5';
    }
    else if(style === 'h6'){
      this.h6Selected = true;
      this.selectedStyle = this.editorWidth > Const.editorWidthL ? 'Heading 6' : 'H6';
    }
  }

}
