import { Component, ElementRef, EventEmitter, Input, Output, inject } from '@angular/core';
import { downloadFile } from '../../shared/custom-methods';

@Component({
  selector: 'file-widget',
  templateUrl: './file-widget.component.html',
  styleUrls: ['./file-widget.component.css']
})
export class FileWidgetComponent {

  @Input() darkMode = false;
  @Input() editMode = true;
  @Input() file:{file:File; key:string} | undefined;
  @Output() onRemoveFile = new EventEmitter<string>();


  private el = inject(ElementRef);

  mouseEnter = false;
  date = new Date();
  fileName ='File dasdasdasdas asd sad adas das daname.xlsx';


  onMouseEnter(){
    if(this.mouseEnter) return;
    this.showEditDialog(true);
    this.mouseEnter = true;
  }

  onMouseLeave(){
    if(!this.mouseEnter) return;
    this.showEditDialog(false);
    this.mouseEnter = false;
  }

  removeFile(){
    if(this.file){
      this.onRemoveFile.emit(this.file.key);
    }
  }

  downloadFile(){
    if(this.file) downloadFile(this.file.file);
  }

  private showEditDialog(show: boolean) {
    const dialog = this.el.nativeElement.querySelector('.file-widget-edit');
    if(!dialog) return;

    if(show){
      dialog.style.display = 'flex';
    }
    else{
      dialog.style.display = 'none';
    }
  }
}
