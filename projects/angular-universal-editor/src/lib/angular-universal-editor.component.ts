import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild, inject } from '@angular/core';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';
import { Subject} from 'rxjs';
import { TextStylesComponent } from './components/text-styles/text-styles.component';
import { equal, generateUniqueId, getWatermarkData } from './shared/custom-methods';
import { Color, TextColorComponent } from './components/text-color/text-color.component';
import { Const } from './shared/constants';
import { Link } from './components/edit-link/Link';
import { EditorApi } from './angular-universal-editor-api';
import { EditorConfig } from './angular-universal-editor-config';
import { MentionUser } from './angular-universal-editor-mention-user';

@Component({
  selector: 'angular-universal-editor',
  templateUrl: './angular-universal-editor.component.html',
  styleUrls: ['./angular-universal-editor.component.css']
})
export class AngularUniversalEditorComponent  implements AfterViewInit{
  
  
  @Input() config: EditorConfig = new EditorConfig();
  @Input() mentionUsers:MentionUser[] = [];

  @Output() onChange = new EventEmitter<string>();
  @Output() onEditorReady = new EventEmitter<EditorApi>();
  @Output() onChangeMentionUsers = new EventEmitter<MentionUser[]>();
  @Output() onFilesChanged = new EventEmitter<{file:File; key:string}[]>();
  
  @ViewChild('editor') editor!: ElementRef;
  private widthSubject = new Subject<number>();
  editorWidth$ = this.widthSubject.asObservable();
  editorWidth = 1000;
  editorWidthM = Const.editorWidthM;
  editorWidthS = Const.editorWidthS;
  textColors = Const.colors;
  darkMode = false;
  defaultTextColor:Color | undefined;
  innerHtml!: SafeHtml;
  private el = inject(ElementRef);
  private sanitizer = inject(DomSanitizer);

  ngAfterViewInit(){
    const editorApi: EditorApi = {
      clearFormatting: this.onClearFormatting.bind(this),
      triggerBold: this.onSelectBold.bind(this),
      triggerItalic: this.onSelectItalic.bind(this),
      triggerUnderline: this.onSelectUnderline.bind(this),
      triggerStrikethrough: this.onSelectStrikethrough.bind(this),
      triggerSubscript: this.onSelectSubscript.bind(this),
      triggerSuperscript: this.onSelectSuperscript.bind(this),
      triggerMention: this.onMentionClick.bind(this),
      setTextStyle: this.onStyleChange.bind(this),
      setTextColor: this.triggerTextColor.bind(this),
      setInnerHTML: this.triggerInnerHtml.bind(this),
      triggerBulletList: this.onBulletListClick.bind(this),
      triggerNumberedList: this.onNumberedListClick.bind(this),
      setDarkMode: this.setDefaultTextColor.bind(this),
      triggerLinkPopup: this.triggerLink.bind(this),
      triggerUploadFilePopup: this.uploadFile.bind(this),
      setUploadedFiles: this.setUploadFiles.bind(this),
      setImageUrl: this.setImageUrl.bind(this),
      triggerCode: this.addCode.bind(this),
      triggerTable: this.addTable.bind(this),
      triggerDate: this.addDate.bind(this)
    }
    setTimeout(()=>{     
      this.onEditorReady.emit(editorApi);
      if(this.config.initialInnerHTML){
        this.innerHtml =typeof this.config.initialInnerHTML === 'string' ? this.sanitizer.bypassSecurityTrustHtml(this.config.initialInnerHTML) : this.config.initialInnerHTML;
        setTimeout(()=>this.setCurrentUserClass(true),0);
      }
      this.setDefaultTextColor(this.config.darkMode);
      this.files = this.config.initialFiles;
      this.widthSubject.next(this.editor.nativeElement.offsetWidth);
      this.editorWidth = this.editor.nativeElement.offsetWidth;
    }, 0);
  }


  onKeydown(event:KeyboardEvent){  
    //console.log(event)

    if(this.isMentionDropdownOpen){
      if(event.key === 'ArrowDown' && this.enteredUser){
        event.preventDefault();
        if(this.enteredUser.index < this.filteredUsers.length - 1){
          const newIndex = this.enteredUser.index + 1;
          this.filteredUsers = this.filteredUsers.map(user =>{
            return{
              ...user,
              isMouseEntered : user.index === newIndex,
            }
          });
          this.enteredUser = this.filteredUsers[newIndex];
          const items = this.el.nativeElement.querySelectorAll('.universal-editor-user');
          if (!items.length) return;
          items[newIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
      else if(event.key === 'ArrowUp'){
        event.preventDefault();
        if(this.enteredUser && this.enteredUser.index > 0){
          const newIndex = this.enteredUser.index - 1;
          this.filteredUsers = this.filteredUsers.map(user =>{
            return{
              ...user,
              isMouseEntered : user.index === newIndex,
            }
          });
          this.enteredUser = this.filteredUsers[newIndex];
          const items = this.el.nativeElement.querySelectorAll('.universal-editor-user');
          if (!items.length) return;
          items[newIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
      else if(event.key === 'Tab' || event.key === 'Enter'){
        event.preventDefault();
        if(this.enteredUser){         
          this.onSelectUser(this.enteredUser);
        }
        else{
          this.onCancelSelectUser(false);
        }
      }
      else if(event.key === 'Backspace' && !this.searchUserText){
        event.preventDefault();
        this.onCancelSelectUser(true);
      }
      else if(event.key === 'Escape'){
        event.preventDefault();
        this.onCancelSelectUser(false);
      }
    }
    else if(event.key === 'z' && event.ctrlKey){
      /* event.preventDefault();
      if(this.savedChanges.length > 1){
        debugger
        this.savedChanges.pop();
        const last = this.savedChanges[this.savedChanges.length - 1];
        if(!last) return;
        this.innerHtml = this.sanitizer.bypassSecurityTrustHtml(last.html);
        this.files = last.files;
        this.savedRange = last.range;
        this.restoreCaretPosition();
        this.traverseTheDOM(true);
      } */
    }
    else if(event.key === 'y' && event.ctrlKey){
      /* event.preventDefault(); */
    }
    else if(event.key === 'b' && event.ctrlKey){
      const tag = 'strong';
      event.preventDefault();
      if(this.config.enableBold && !this.boldDisabled){
        this.isBold = !this.isBold;
        if(this.currentTextStyleElement){
          if(this.isBold){
            const elem = document.createElement(tag);
            let elemText = '\u200B';
            if(!this.currentTextStyleElement.textContent){ // empty p
              const space = document.createTextNode(elemText);
              elem.appendChild(space);
              this.currentTextStyleElement.appendChild(elem);
              this.setCursorPositionAfter(space, false);
            }
            else{  //with content
              if(this.selectedText){
                elemText = this.selectedText;
              }
              const space = document.createTextNode(elemText);
              elem.appendChild(space);
              this.addElement(elem, this.currentTextStyleElement);
              this.setCursorPositionAfter(elem, true);
            }
            this.currentBoldElement = elem;
          }
          else{
            if(this.currentBoldElement && this.currentBoldElement.textContent === '\u200B'){ // empty strong
              this.currentBoldElement.remove();            
            }
            else if(this.currentBoldElement){ // with content
              this.splitAtCaret(this.currentBoldElement, false, false);
            }
          }
        }
      }
    }
    else if(event.key === 'i' && event.ctrlKey){
      const tag = 'em';
      event.preventDefault();
      if(this.config.enableItalic && !this.italicDisabled){
        this.isItalic = !this.isItalic;
        if(this.currentTextStyleElement){
          if(this.isItalic){
            const elem = document.createElement(tag);
            let elemText = '\u200B';
            if(!this.currentTextStyleElement.textContent){ // empty p
              const space = document.createTextNode(elemText);
              elem.appendChild(space);
              this.currentTextStyleElement.appendChild(elem);
              this.setCursorPositionAfter(space, false);
            }
            else{  //with content
              if(this.selectedText){
                elemText = this.selectedText;
              }
              const space = document.createTextNode(elemText);
              elem.appendChild(space);
              this.addElement(elem, this.currentTextStyleElement);
              this.setCursorPositionAfter(elem, true);
            }
            this.currentBoldElement = elem;
          }
          else{
            if(this.currentItalicElement && this.currentItalicElement.textContent === '\u200B'){ // empty italic
              this.currentItalicElement.remove();            
            }
            else if(this.currentItalicElement){ // with content
              this.splitAtCaret(this.currentItalicElement, false, false);
            }
          }
        }
      }
    }
    else if(event.key === 'u' && event.ctrlKey){
      const tag = 'u';
      event.preventDefault();
      if(this.config.enableUnderline && !this.underlineDisabled){
        this.isUnderline = !this.isUnderline;
        if(this.currentTextStyleElement){
          if(this.isUnderline){
            const elem = document.createElement(tag);
            let elemText = '\u200B';
            if(!this.currentTextStyleElement.textContent){ // empty p
              const space = document.createTextNode(elemText);
              elem.appendChild(space);
              this.currentTextStyleElement.appendChild(elem);
              this.setCursorPositionAfter(space, false);
            }
            else{  //with content
              if(this.selectedText){
                elemText = this.selectedText;
              }
              const space = document.createTextNode(elemText);
              elem.appendChild(space);
              this.addElement(elem, this.currentTextStyleElement);
              this.setCursorPositionAfter(elem, true);
            }
            this.currentBoldElement = elem;
          }
          else{
            if(this.currentUnderlineElement && this.currentUnderlineElement.textContent === '\u200B'){ // empty 
              this.currentUnderlineElement.remove();            
            }
            else if(this.currentUnderlineElement){ // with content
              this.splitAtCaret(this.currentUnderlineElement, false, false);
            }
          }
        }
      }
    }
    else if(event.key === 'S' && event.ctrlKey && event.shiftKey){
      const tag = 's';
      event.preventDefault();
      if(this.config.enableStrikethrough && !this.strikethroughDisabled){
        this.isStrikethrough = !this.isStrikethrough;
        if(this.currentTextStyleElement){
          if(this.isStrikethrough){
            const elem = document.createElement(tag);
            let elemText = '\u200B';
            if(!this.currentTextStyleElement.textContent){ // empty p
              const space = document.createTextNode(elemText);
              elem.appendChild(space);
              this.currentTextStyleElement.appendChild(elem);
              this.setCursorPositionAfter(space, false);
            }
            else{  //with content
              if(this.selectedText){
                elemText = this.selectedText;
              }
              const space = document.createTextNode(elemText);
              elem.appendChild(space);
              this.addElement(elem, this.currentTextStyleElement);
              this.setCursorPositionAfter(elem, true);
            }
            this.currentBoldElement = elem;
          }
          else{
            if(this.currentStrikethroughElement && this.currentStrikethroughElement.textContent === '\u200B'){ // empty 
              this.currentStrikethroughElement.remove();            
            }
            else if(this.currentStrikethroughElement){ // with content
              this.splitAtCaret(this.currentStrikethroughElement, false, false);
            }
          }
        }
      }
    }
    else if(event.code === 'Comma' && event.ctrlKey && event.shiftKey){
      const tag = 'sub';
      event.preventDefault();
      if(this.config.enableSubscript && !this.subscriptDisabled){
        this.isSubscript = !this.isSubscript;
        if(this.currentTextStyleElement){
          if(this.isSubscript){
            const elem = document.createElement(tag);
            let elemText = '\u200B';
            if(!this.currentTextStyleElement.textContent){ // empty p
              const space = document.createTextNode(elemText);
              elem.appendChild(space);
              this.currentTextStyleElement.appendChild(elem);
              this.setCursorPositionAfter(space, false);
            }
            else{  //with content
              if(this.selectedText){
                elemText = this.selectedText;
              }
              const space = document.createTextNode(elemText);
              elem.appendChild(space);
              this.addElement(elem, this.currentTextStyleElement);
              this.setCursorPositionAfter(elem, true);
            }
            this.currentBoldElement = elem;
          }
          else{
            if(this.currentSubscriptElement && this.currentSubscriptElement.textContent === '\u200B'){ // empty 
              this.currentSubscriptElement.remove();            
            }
            else if(this.currentSubscriptElement){ // with content
              this.splitAtCaret(this.currentSubscriptElement, false, false);
            }
          }
        }
      }
    }
    else if(event.code === 'Period' && event.ctrlKey && event.shiftKey){
      const tag = 'sup';
      event.preventDefault();
      if(this.config.enableSuperscript && !this.superscriptDisabled){
        this.isSuperscript = !this.isSuperscript;
        if(this.currentTextStyleElement){
          if(this.isSuperscript){
            const elem = document.createElement(tag);
            let elemText = '\u200B';
            if(!this.currentTextStyleElement.textContent){ // empty p
              const space = document.createTextNode(elemText);
              elem.appendChild(space);
              this.currentTextStyleElement.appendChild(elem);
              this.setCursorPositionAfter(space, false);
            }
            else{  //with content
              if(this.selectedText){
                elemText = this.selectedText;
              }
              const space = document.createTextNode(elemText);
              elem.appendChild(space);
              this.addElement(elem, this.currentTextStyleElement);
              this.setCursorPositionAfter(elem, true);
            }
            this.currentBoldElement = elem;
          }
          else{
            if(this.currentSupesrsciptElement && this.currentSupesrsciptElement.textContent === '\u200B'){ // empty 
              this.currentSupesrsciptElement.remove();            
            }
            else if(this.currentSupesrsciptElement){ // with content
              this.splitAtCaret(this.currentSupesrsciptElement, false, false);
            }
          }
        }
      }
    }
    else if(event.key === '\\' && event.ctrlKey && !this.clearFormattingDisabled){
      event.preventDefault();
      if(this.currentTextStyleElement && this.highestFormatElement){
        this.splitAtCaret(this.highestFormatElement, true, false);
      }
    }
    else if(event.code === 'CustomTextColor'){
      const tag = 'span';
      event.preventDefault();
      if(this.config.enableTextColor && this.currentTextStyleElement && !this.textColorDisabled){
        if(equal(this.selectedColor, this.defaultTextColor)){
          if(this.currentTextStyleElement.textContent && this.currentTextColorElement){
            this.splitAtCaret(this.currentTextColorElement, false, false);
          }
        }
        else{
          if(this.currentTextColorElement){ // from color to color
            this.splitAtCaret(this.currentTextColorElement, false, true);
          }
          else if(this.selectedColor){ //from default to color
            const elem = document.createElement(tag);
            elem.style.color = this.selectedColor.colorCode;
            elem.className = 'universal-editor-text-color';
            elem.setAttribute('custom-text-color-name', this.selectedColor.colorName);
            elem.setAttribute('custom-text-color-code', this.selectedColor.colorCode);
            let elemText = '\u200B';
            if(!this.currentTextStyleElement.textContent){ // empty p
              const space = document.createTextNode(elemText);
              elem.appendChild(space);
              this.currentTextStyleElement.appendChild(elem);
              this.setCursorPositionAfter(space, false);
            }
            else{  //with content
              if(this.selectedText){
                elemText = this.selectedText;
              }
              const space = document.createTextNode(elemText);
              elem.appendChild(space);
              this.addElement(elem, this.currentTextStyleElement);
              this.setCursorPositionAfter(elem, true);
            }
            this.currentBoldElement = elem;
          }
        } 
      }
    }
    else if(event.code === 'Digit8' && event.ctrlKey && event.shiftKey && this.textStyle === 'p'){
      event.preventDefault();
      if(this.config.enableBulletList && !this.bulletListDisabled){
        this.isBulletList = !this.isBulletList;
        //
        if(this.isBulletList){
          const ul = document.createElement('ul');
          ul.className = 'universal-editor-bullet-list';
          this.currentBulletListElement = ul;
          ul.setAttribute('bullet-list-indent-level', '1');
          let caretElem = undefined;
          if(this.currentTextStyleElement){
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const pElements = this.editor.nativeElement.querySelectorAll('p'); 
              pElements.forEach((p:any) => {
                if(range.intersectsNode(p)){
                  const li = document.createElement('li');
                  li.appendChild(p);
                  ul.appendChild(li);
                  caretElem = p;
                }
              });
            }
            this.addElement(ul, this.editor.nativeElement);
            this.mergeAdjacent('ul');
            this.setCursorPositionAfter(caretElem, true);
          }
          else{
           // create empty ul
           const li = document.createElement('li');
           const p = document.createElement('p');
           p.textContent = '\u200B';
           li.appendChild(p);
           ul.appendChild(li);
           this.addElement(ul, this.editor.nativeElement);
           this.mergeAdjacent('ul');
           this.setCursorPositionAfter(p, true);
           this.currentTextStyleElement = p;
          }
          this.traverseTheDOM(true);
        }
        else if(this.currentTextStyleElement){
          if(this.currentBulletListElement && (this.currentBulletListElement.textContent === '\u200B' || this.currentBulletListElement.textContent === '')){ // empty ul
            const level = this.currentBulletListElement.getAttribute('bullet-list-indent-level');
            if(level && level === '1'){
              this.currentBulletListElement.replaceWith(this.currentTextStyleElement);      
              this.currentBulletListElement = undefined;   
            }
            else{
              const liLevel1 = this.currentBulletListElement.parentElement;
              const ulLevel1 = this.currentBulletListElement.parentElement?.parentElement;
              if(ulLevel1 && liLevel1){
                const li = document.createElement('li');
                li.appendChild(this.currentTextStyleElement);
                ulLevel1.insertBefore(li, liLevel1.nextSibling);
                this.currentBulletListElement.remove();
                this.currentBulletListElement = ulLevel1;
              }
              
            }
            
          }
          else if(this.currentBulletListElement){ // with content
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const level = this.currentBulletListElement.getAttribute('bullet-list-indent-level');
              const liElements = this.currentBulletListElement.querySelectorAll(':scope > li'); 
              const parent = this.currentBulletListElement.parentElement; 
              let ul:HTMLElement | undefined = undefined;
              let caretElem = undefined;
              liElements.forEach((li, index) => {
                if(index === 0 && this.currentBulletListElement && parent){
                  if(range.intersectsNode(li)){
                    while (li.firstChild) {
                      caretElem = li.firstChild;
                      if(level === '1'){
                        parent.insertBefore(li.firstChild, this.currentBulletListElement);
                      }
                      else{
                        const parentUl = parent.parentElement;
                        if(parentUl){
                          const newLi = document.createElement('li');
                          newLi.appendChild(li.firstChild);
                          parentUl.insertBefore(newLi, parent.nextSibling);
                        }
                      }
                    }
                  }
                  else{
                    ul = document.createElement('ul');
                    ul.className = 'universal-editor-bullet-list';
                    ul.setAttribute('bullet-list-indent-level', level ?? '');
                    ul.appendChild(li);
                    parent.insertBefore(ul, this.currentBulletListElement);
                  }
                }
                else if(this.currentBulletListElement && parent) {
                  if(range.intersectsNode(li)){
                    if(ul){
                      ul = undefined;
                    } 
                    while (li.firstChild) {
                      caretElem = li.firstChild;
                      if(level === '1'){
                        parent.insertBefore(li.firstChild, this.currentBulletListElement);
                      }
                      else{
                        const parentUl = parent.parentElement;
                        if(parentUl){
                          const newLi = document.createElement('li');
                          newLi.appendChild(li.firstChild);
                          parentUl.insertBefore(newLi, parent.nextSibling);
                        }
                      }
                    }
                  }
                  else{
                    if(ul){
                      ul.appendChild(li);
                    }
                    else{
                      ul = document.createElement('ul');
                      ul.className = 'universal-editor-bullet-list';
                      ul.setAttribute('bullet-list-indent-level', level ?? '');
                      ul.appendChild(li);
                      parent.insertBefore(ul, this.currentBulletListElement);
                    }
                  }
                } 
              });
              this.currentBulletListElement.remove();
              this.currentBulletListElement = undefined;
              this.setCursorPositionAfter(caretElem, true);
            }
          }


        }
        setTimeout(() => this.traverseTheDOM(true), 0);
      }
    }
    else if(event.code === 'Digit7' && event.ctrlKey && event.shiftKey && this.textStyle === 'p'){
      event.preventDefault();
      if(this.config.enableNumberedList && !this.numberedListDisabled){
        this.isNumberedList = !this.isNumberedList;
        //
        if(this.isNumberedList){
          const ol = document.createElement('ol');
          ol.className = 'universal-editor-numbered-list';
          this.currentNumberedListElement = ol;
          ol.setAttribute('numbered-list-indent-level', '1');
          let caretElem = undefined;
          if(this.currentTextStyleElement){
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const pElements = this.editor.nativeElement.querySelectorAll('p'); 
              pElements.forEach((p:any) => {
                if(range.intersectsNode(p)){
                  const li = document.createElement('li');
                  li.appendChild(p);
                  ol.appendChild(li);
                  caretElem = p;
                }
              });
            }
            this.addElement(ol, this.editor.nativeElement);
            this.mergeAdjacent('ol');
            this.setCursorPositionAfter(caretElem, true);
          }
          else{
           // create empty ul
           const li = document.createElement('li');
           const p = document.createElement('p');
           p.textContent = '\u200B';
           li.appendChild(p);
           ol.appendChild(li);
           this.addElement(ol, this.editor.nativeElement);
           this.mergeAdjacent('ol');
           this.setCursorPositionAfter(p, true);
           this.currentTextStyleElement = p;
          }
          this.traverseTheDOM(true);
        }
        else if(this.currentTextStyleElement){
          if(this.currentNumberedListElement && (this.currentNumberedListElement.textContent === '\u200B' || this.currentNumberedListElement.textContent === '')){ // empty ul
            const level = this.currentNumberedListElement.getAttribute('numbered-list-indent-level');
            if(level && level === '1'){
              this.currentNumberedListElement.replaceWith(this.currentTextStyleElement);      
              this.currentNumberedListElement = undefined;   
            }
            else{
              const liLevel1 = this.currentNumberedListElement.parentElement;
              const olLevel1 = this.currentNumberedListElement.parentElement?.parentElement;
              if(olLevel1 && liLevel1){
                const li = document.createElement('li');
                li.appendChild(this.currentTextStyleElement);
                olLevel1.insertBefore(li, liLevel1.nextSibling);
                this.currentNumberedListElement.remove();
                this.currentNumberedListElement = olLevel1;
              }
              
            }
            
          }
          else if(this.currentNumberedListElement){ // with content
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const level = this.currentNumberedListElement.getAttribute('numbered-list-indent-level');
              const liElements = this.currentNumberedListElement.querySelectorAll(':scope > li'); 
              const parent = this.currentNumberedListElement.parentElement; 
              let ol:HTMLElement | undefined = undefined;
              let caretElem = undefined;
              liElements.forEach((li, index) => {
                if(index === 0 && this.currentNumberedListElement && parent){
                  if(range.intersectsNode(li)){
                    while (li.firstChild) {
                      caretElem = li.firstChild;
                      if(level === '1'){
                        parent.insertBefore(li.firstChild, this.currentNumberedListElement);
                      }
                      else{
                        const parentUl = parent.parentElement;
                        if(parentUl){
                          const newLi = document.createElement('li');
                          newLi.appendChild(li.firstChild);
                          parentUl.insertBefore(newLi, parent.nextSibling);
                        }
                      }
                    }
                  }
                  else{
                    ol = document.createElement('ol');
                    ol.className = 'universal-editor-numbered-list';
                    ol.setAttribute('numbered-list-indent-level', level ?? '');
                    ol.appendChild(li);
                    parent.insertBefore(ol, this.currentNumberedListElement);
                  }
                }
                else if(this.currentNumberedListElement && parent) {
                  if(range.intersectsNode(li)){
                    if(ol){
                      ol = undefined;
                    } 
                    while (li.firstChild) {
                      caretElem = li.firstChild;
                      if(level === '1'){
                        parent.insertBefore(li.firstChild, this.currentNumberedListElement);
                      }
                      else{
                        const parentUl = parent.parentElement;
                        if(parentUl){
                          const newLi = document.createElement('li');
                          newLi.appendChild(li.firstChild);
                          parentUl.insertBefore(newLi, parent.nextSibling);
                        }
                      }
                    }
                  }
                  else{
                    if(ol){
                      ol.appendChild(li);
                    }
                    else{
                      ol = document.createElement('ol');
                      ol.className = 'universal-editor-numbered-list';
                      ol.setAttribute('numbered-list-indent-level', level ?? '');
                      ol.appendChild(li);
                      parent.insertBefore(ol, this.currentNumberedListElement);
                    }
                  }
                } 
              });
              this.currentNumberedListElement.remove();
              this.currentNumberedListElement = undefined;
              this.setCursorPositionAfter(caretElem, true);
            }
          }


        }
        setTimeout(() => this.traverseTheDOM(true), 0);
      }
    }
    else if (event.altKey && event.shiftKey && event.key === 'T') {
      event.preventDefault();
      this.addTable();
    }
    else if(event.key === 'k' && event.ctrlKey && !this.linkDisabled){
      event.preventDefault();
      this.showAddEditLink(true, 'Add');
    }
    else if (event.key === 'Backspace'){
      if(this.currentImageElement){
        event.preventDefault();
        this.removeFile();
        this.traverseTheDOM(true);
      }
      else if(this.currentCodeElement && this.currentCodeElement.lastChild){
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if (range.collapsed) {
            const startNode = range.startContainer;
            const isAtStartOfLine = range.startOffset === 0;
            const isAtStartOfContent = startNode === this.currentCodeElement.lastChild && isAtStartOfLine;
            if (isAtStartOfContent) {
              event.preventDefault(); 
              if(this.currentCodeElement.lastChild.textContent?.length === 0){
                this.currentCodeElement.remove();
              }
            }
          }
        }
        this.traverseTheDOM(true);
      }
      else if(this.currentTextStyleElement && (this.currentTextStyleElement.textContent === '\u200B' || this.currentTextStyleElement.textContent === '')){
        event.preventDefault();
        let sibiling = undefined;
        if(this.currentBulletListElement){
          if(this.currentBulletListElement.textContent === '\u200B' || this.currentBulletListElement.textContent === ''){
            sibiling = this.currentBulletListElement.previousSibling as HTMLElement;
            this.currentBulletListElement.remove();
          }
          else{
            const li = this.currentTextStyleElement.parentElement;
            if(li) li.remove();
          }
        }
        else if(this.currentNumberedListElement){
          if(this.currentNumberedListElement.textContent === '\u200B' || this.currentNumberedListElement.textContent === ''){
            sibiling = this.currentNumberedListElement.previousSibling as HTMLElement;
            this.currentNumberedListElement.remove();
          }
          else{
            const li = this.currentTextStyleElement.parentElement;
            if(li) li.remove();
          }
        }
        else{
          sibiling = this.currentTextStyleElement.previousSibling as HTMLElement;
          this.currentTextStyleElement.remove();
        }
        if(sibiling && sibiling.className === 'img-wrapper'){
          this.currentImageElement = sibiling;
          const p = document.createElement('p');
          p.textContent = '\u200B';
          sibiling.insertAdjacentElement('afterend', p);
          setTimeout(() => this.addSizerIntoImageWrapper(),50);
          this.setCursorPositionAfter(sibiling, true);
        }
        else if (sibiling && sibiling.className === 'code-wrapper') {
          this.currentCodeElement = sibiling;
          const p = document.createElement('p');
          p.textContent = '\u200B';
          sibiling.insertAdjacentElement('afterend', p);
          this.setCursorPositionAfter(sibiling.lastChild, true);
          this.showCodePopup(true);
        }
        else if (sibiling && sibiling.className === 'table-wrapper') {
          this.currentTableElement = sibiling;
          const p = document.createElement('p');
          p.textContent = '\u200B';
          sibiling.insertAdjacentElement('afterend', p);
          this.setCursorInsideTable();
          this.showTablePopup(true);
        }

        if(this.currentCellElement && !this.currentCellElement.hasChildNodes()){
          const p = document.createElement('p');
          p.textContent = '\u200B';
          this.currentCellElement.appendChild(p);
          this.setCursorPositionAfter(p, true);
        }
        this.traverseTheDOM(true);
      }
      else{
        const selection = window.getSelection();
        if(selection){
          const range = selection.getRangeAt(0);
          if (range.startOffset === 0 && range.startContainer.nodeType === Node.TEXT_NODE && this.currentTextStyleElement) {
            let sibiling = undefined;
            if(this.currentBulletListElement){
              sibiling = this.currentBulletListElement.previousSibling as HTMLElement;
            }
            else if(this.currentNumberedListElement){
              sibiling = this.currentNumberedListElement.previousSibling as HTMLElement;
            }
            else{
              sibiling = this.currentTextStyleElement.previousSibling as HTMLElement;
            }
            if(sibiling && sibiling.className === 'img-wrapper'){
              event.preventDefault();
              this.currentImageElement = sibiling;
              setTimeout(() => this.addSizerIntoImageWrapper(),50);
              this.setCursorPositionAfter(this.currentImageElement, true);
              this.traverseTheDOM(true);
            }
            else if(sibiling && sibiling.className === 'code-wrapper') {
              event.preventDefault();
              this.currentCodeElement = sibiling;
              this.setCursorPositionAfter(this.currentCodeElement.lastChild, true);
              this.showCodePopup(true);
              this.traverseTheDOM(true);
            }
            else if (sibiling && sibiling.className === 'table-wrapper') {
              event.preventDefault();
              this.currentTableElement = sibiling;
              this.setCursorInsideTable();
              this.showTablePopup(true);
            }           
          }
        }
      }
    }
    else if(event.key === 'Delete'){
      if(this.currentImageElement){
        event.preventDefault();
        this.removeFile();
        this.traverseTheDOM(true);
      }
      else if(this.currentCodeElement){
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if (range.collapsed) {
            const textNode = range.endContainer;
            if(textNode && textNode.textContent && range.endOffset === textNode.textContent.length && this.currentCodeElement){
              event.preventDefault();
            }
          }
        }
      }
      else if(this.currentTextStyleElement && (this.currentTextStyleElement.textContent === '\u200B' || this.currentTextStyleElement.textContent === '')){
        event.preventDefault();
        let sibiling = undefined;
        if(this.currentBulletListElement){
          if(this.currentBulletListElement.textContent === '\u200B' || this.currentBulletListElement.textContent === ''){
            sibiling = this.currentBulletListElement.nextSibling as HTMLElement;
            this.currentBulletListElement.remove();
          }
          else{
            const li = this.currentTextStyleElement.parentElement;
            if(li) li.remove();
          }
        }
        else if(this.currentNumberedListElement){
          if(this.currentNumberedListElement.textContent === '\u200B' || this.currentNumberedListElement.textContent === ''){
            sibiling = this.currentNumberedListElement.nextSibling as HTMLElement;
            this.currentNumberedListElement.remove();
          }
          else{
            const li = this.currentTextStyleElement.parentElement;
            if(li) li.remove();
          }
        }
        else{
          sibiling = this.currentTextStyleElement.nextSibling as HTMLElement;
          this.currentTextStyleElement.remove();
        }
        if(sibiling && sibiling.className === 'img-wrapper'){
          this.currentImageElement = sibiling;
          setTimeout(() => this.addSizerIntoImageWrapper(),50);
          this.setCursorPositionAfter(sibiling, true);
        }
        else if (sibiling && sibiling.className === 'code-wrapper') {
          this.currentCodeElement = sibiling;
          this.setCursorPositionAfter(sibiling.firstChild, false);
          this.showCodePopup(true);
        }
        else if (sibiling && sibiling.className === 'table-wrapper') {
          this.currentTableElement = sibiling;
          this.setCursorInsideTable();
          this.showTablePopup(true);
        }

        if(this.currentCellElement && !this.currentCellElement.hasChildNodes()){
          const p = document.createElement('p');
          p.textContent = '\u200B';
          this.currentCellElement.appendChild(p);
          this.setCursorPositionAfter(p, true);
        }
        this.traverseTheDOM(true);
      }
      else{
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if(!range.collapsed) return;

          if (range.endContainer.nodeType === Node.TEXT_NODE) {
            const textNode = range.endContainer;
            if(textNode && textNode.textContent && range.endOffset === textNode.textContent.length && this.currentTextStyleElement){
              let sibiling = undefined;
              if(this.currentBulletListElement){
                sibiling = this.currentBulletListElement.nextSibling as HTMLElement;
              }
              else if(this.currentNumberedListElement){
                sibiling = this.currentNumberedListElement.nextSibling as HTMLElement;
              }
              else{
                sibiling = this.currentTextStyleElement.nextSibling as HTMLElement;
              }
              if (sibiling && sibiling.className === 'img-wrapper') {
                event.preventDefault(); 
                this.currentImageElement = sibiling;
                this.removeFile();
              }
              else if (sibiling && sibiling.className === 'code-wrapper') {
                event.preventDefault(); 
                this.currentCodeElement = sibiling;
                this.setCursorPositionAfter(sibiling.firstChild, false);
                this.showCodePopup(true);
                this.traverseTheDOM(true);
              }
              else if (sibiling && sibiling.className === 'table-wrapper') {
                event.preventDefault();
                this.currentTableElement = sibiling;
                this.setCursorInsideTable();
                this.showTablePopup(true);
              }
            }
          }
          else{
            let sibiling = undefined;
            if(this.currentBulletListElement){
              sibiling = this.currentBulletListElement.nextSibling as HTMLElement;
            }
            else if(this.currentNumberedListElement){
              sibiling = this.currentNumberedListElement.nextSibling as HTMLElement;
            }
            else if(this.currentTextStyleElement){
              sibiling = this.currentTextStyleElement.nextSibling as HTMLElement;
            }
            if (sibiling && sibiling.className === 'img-wrapper') {
              event.preventDefault(); 
              this.currentImageElement = sibiling;
              this.removeFile();
            }
            else if (sibiling && sibiling.className === 'code-wrapper') {
              event.preventDefault(); 
              this.currentCodeElement = sibiling;
              this.setCursorPositionAfter(sibiling.firstChild, false);
              this.showCodePopup(true);
              this.traverseTheDOM(true);
            }
            else if (sibiling && sibiling.className === 'table-wrapper') {
              event.preventDefault();
              this.currentTableElement = sibiling;
              this.setCursorInsideTable();
              this.showTablePopup(true);
            }
          }
        }
      }
    }
    else if(event.key === 'Enter'){
      if(this.currentImageElement){
        event.preventDefault();
        const p = this.currentImageElement.nextSibling;
        if(p){
          this.setCursorPositionAfter(p, true);
        }
        this.traverseTheDOM(true);

      }
      else if(this.currentCodeElement && this.currentCodeElement.lastChild){
        event.preventDefault();
        const elem = document.createTextNode('\n\u00A0'); //\u200B \u00A0
        this.addElement(elem, this.editor.nativeElement);
        this.setCursorPositionAfter(elem, false);
        this.traverseTheDOM(true);
      }
      else if((this.currentBulletListElement || this.currentNumberedListElement) && this.currentTextStyleElement && (this.currentTextStyleElement.textContent === '\u200B' || this.currentTextStyleElement.textContent === '')){
        event.preventDefault();
        if(this.currentBulletListElement){
          this.onBulletListClick();
        }
        else if(this.currentNumberedListElement){
          this.onNumberedListClick();
        }
      }
    }
    else if(event.key === 'Tab'){
      if(this.currentCodeElement && this.currentCodeElement.lastChild){
        event.preventDefault();
        const elem = document.createTextNode('   '); 
        this.addElement(elem, this.editor.nativeElement);
        this.setCursorPositionAfter(elem, false);
        this.traverseTheDOM(true);
      }
      else if((this.currentBulletListElement || this.currentNumberedListElement) && this.currentTextStyleElement){
        event.preventDefault();
        if(this.currentBulletListElement && this.currentBulletListElement.textContent !== '\u200B' && this.currentBulletListElement.textContent !== '' && (this.currentTextStyleElement.textContent === '\u200B' || this.currentTextStyleElement.textContent === '')){
          const li = this.currentTextStyleElement.parentElement;
          const level = this.currentBulletListElement.getAttribute('bullet-list-indent-level');
          const prevLi = li?.previousElementSibling;
          if(prevLi){
            const ul = document.createElement('ul');
            ul.className = 'universal-editor-bullet-list';
            this.currentBulletListElement = ul;
            ul.setAttribute('bullet-list-indent-level', (parseInt(level ?? '1') + 1).toString());
            const liNew = document.createElement('li');
            liNew.appendChild(this.currentTextStyleElement);
            ul.appendChild(liNew);
            li.remove();
            prevLi.appendChild(ul);
          }
        }
        else if(this.currentNumberedListElement && this.currentNumberedListElement.textContent !== '\u200B' && this.currentNumberedListElement.textContent !== '' && (this.currentTextStyleElement.textContent === '\u200B' || this.currentTextStyleElement.textContent === '')){
          const li = this.currentTextStyleElement.parentElement;
          const level = this.currentNumberedListElement.getAttribute('numbered-list-indent-level');
          const prevLi = li?.previousElementSibling;
          if(prevLi){
            const ol = document.createElement('ol');
            ol.className = 'universal-editor-numbered-list';
            this.currentNumberedListElement = ol;
            ol.setAttribute('numbered-list-indent-level', (parseInt(level ?? '1') + 1).toString());
            const liNew = document.createElement('li');
            liNew.appendChild(this.currentTextStyleElement);
            ol.appendChild(liNew);
            li.remove();
            prevLi.appendChild(ol);
          }
        }
      }
      else if(this.currentTableElement && this.currentCellElement){
        event.preventDefault();
        if(this.currentCellElement.nextSibling){
          this.setCursorPositionAfter(this.currentCellElement.nextSibling.firstChild, true);
        }
        else if(this.currentCellElement.parentElement && this.currentCellElement.parentElement.nextElementSibling && this.currentCellElement.parentElement.nextElementSibling.firstChild){
          this.setCursorPositionAfter(this.currentCellElement.parentElement.nextElementSibling.firstChild.firstChild, true);
        }
        this.traverseTheDOM(true);
      }
    }

    setTimeout(() => this.emitChange(), 0);
  }

  onInput(event: any) { 
    //console.log(event)
    const fontElements = this.editor.nativeElement.querySelectorAll('font');
    fontElements.forEach((fontElem:any) => {
      fontElem.remove();
    });

    // FIRST CHAR
    if(event.inputType === 'insertText' && this.editor.nativeElement.innerHTML.length <= 1){
      let coords = this.getCaretCoordinates();
      event.preventDefault();
      let content = event.data;
      content = `<span class="universal-marker">${content}</span>`
      if(event.data === '@' && this.config.enableMention){
        content = `<span class="universal-tag">${content}</span>`;
      }
      if(this.selectedColor && !equal(this.selectedColor, this.defaultTextColor)){
        content = `<span class="universal-editor-text-color" style="color:${this.selectedColor.colorCode};" 
        custom-text-color-name="${this.selectedColor.colorName}" custom-text-color-code="${this.selectedColor.colorCode}">${content}</span>`;
      }
      if(this.isBold){
        content = `<strong>${content}</strong>`;
      }
      if(this.isItalic){
        content = `<em>${content}</em>`;
      }
      if(this.isUnderline){
        content = `<u>${content}</u>`;
      }
      if(this.isStrikethrough){
        content = `<s>${content}</s>`;
      }
      if(this.isSubscript){
        content = `<sub>${content}</sub>`;
      }
      if(this.isSuperscript){
        content = `<sup>${content}</sup>`;
      }
      content = `<${this.textStyle}>${content}</${this.textStyle}>`;

      const elem = this.createElementFromString(content) as HTMLElement;
      const text = this.editor.nativeElement.firstChild;
      if(text){
        this.editor.nativeElement.replaceChild(elem, text);
      }
      else{
        this.editor.nativeElement.appendChild(elem);
      }
      const marker = elem.querySelector('.universal-marker');
      if(marker && marker.textContent){
        const text = document.createTextNode(marker.textContent);
        marker.replaceWith(text);
        this.setCursorPositionAfter(text, false);
      }
      else{
        this.setCursorPositionAfter(elem, true);
      }
      if(event.data === '@' && this.config.enableMention){ 
        this.openMentionDropdown(coords.x, coords.y);
      }
    }

    // MENTION PART
    if(event.data === '@' && !this.isMentionDropdownOpen && this.editor.nativeElement.innerHTML.length > 1 && this.config.enableMention && this.currentTextStyleElement) {
      const coords = this.getCaretCoordinates();
      event.preventDefault();

      if(event.type !== 'customInput'){
        this.deleteCharBeforeCaret();
      }
      const elemText = `<span class="universal-tag">@</span>`; 
      const elem = this.createElementFromString(elemText) as HTMLElement;
      this.addElement(elem, this.currentTextStyleElement);
      this.setCursorPositionAfter(elem, true);

      this.openMentionDropdown(coords.x, coords.y);
    }

    if(this.isMentionDropdownOpen){
      const tag = this.el.nativeElement.querySelector('.universal-tag');
      if(tag){
        this.searchUserText = tag.textContent.replace(/@/g, '');
        this.filterUsers();
      }

    }

    this.traverseTheDOM(true);
    setTimeout(() => this.emitChange(), 0);
  }

  handlePaste(event: ClipboardEvent) {
    event.preventDefault();
    const paste = event.clipboardData || (window as any).clipboardData;
    const text = paste.getData('text');

    if(Const.urlRegex.test(text) && this.config.enableLink && !this.linkDisabled){ //link
      this.addLink(text, text);
    }
    else if (paste.items && paste.items.length && paste.types.includes('Files') && this.config.enableFile && !this.fileDisabled) { //file
      for (let i = 0; i < paste.items.length; i++) {
        if (paste.items[i].kind === 'file') {
          const file = paste.items[i].getAsFile();
          if(file){
            this.addFile(file);
          }
        }
      }
    }
    else if (Const.codeRegex.test(text) && this.config.enableCode && !this.codeDisabled) { //code
      this.addCode(text);
    }
    else{
      if(this.currentTextStyleElement){
        const elem = document.createTextNode(text);
        this.addElement(elem, this.currentTextStyleElement);
        this.setCursorPositionAfter(elem, false);
      }
      else if(this.currentCodeElement){
        const elem = document.createTextNode(text);
        this.addElement(elem, this.editor.nativeElement);
        this.setCursorPositionAfter(elem, true);
      }
      else{
        const elem = this.createElementFromString(`<p>${text}</p>`) as HTMLElement;
        this.addElement(elem, this.editor.nativeElement);
        this.setCursorPositionAfter(elem, true);
      }
    }
    this.traverseTheDOM(true);
  }




  // SHARED
  private textElement:HTMLElement | undefined;
  private selectedText = '';
  resizeTimeout:any;
  private editorHTML = '';
  private taggedUsers:string[] = [];
  private savedRange: Range | null = null;
  private savedChanges: {range: Range | null; html: string; files:{key:string; file:File;}[]}[] = [];
  private emitChange(){
    if(this.editorHTML === this.editor.nativeElement.innerHTML || !this.config.editMode || !this.checkWatermark()) return;

    const taggedElements:  NodeListOf<Element> = this.editor.nativeElement.querySelectorAll('.universal-editor-tag');
    const ids = Array.from(taggedElements).map(element => element.getAttribute('user-id') ?? '');
    const userIds = Array.from(new Set(ids));
    if(!equal(this.taggedUsers, userIds)){
      this.taggedUsers = userIds;
      this.onChangeMentionUsers.emit(this.mentionUsers.filter(user => userIds.includes(user.id.toString())));
    }

    this.saveCaretPosition();
    this.savedChanges.push({range: this.savedRange, html: this.editor.nativeElement.innerHTML, files: this.files});
    this.editorHTML = this.editor.nativeElement.innerHTML;
    this.onChange.emit(this.removeClassess(this.editorHTML));

  }
  triggerInnerHtml(html: string | SafeHtml){
    this.innerHtml =typeof html === 'string' ? this.sanitizer.bypassSecurityTrustHtml(html) : html;
    setTimeout(()=>this.setCurrentUserClass(true),0);
  }
  private removeClassess(html: string){
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    if(this.config.currentUserId.toString()){
      const currentUsers = doc.querySelectorAll(`[user-id="${this.config.currentUserId}"]`);
      currentUsers.forEach(element => element.classList.remove('universal-editor-tag-selected'));
    }
    let elements = doc.querySelectorAll('.code-counter-selected');
    elements.forEach(function(element) {
        element.classList.remove('code-counter-selected');
    });
    elements = doc.querySelectorAll('.code-wrapper-selected');
    elements.forEach(function(element) {
        element.classList.remove('code-wrapper-selected');
    });
    elements = doc.querySelectorAll('.code-wrapper-selected');
    elements.forEach(function(element) {
        element.classList.remove('code-wrapper-selected');
    });
    elements = doc.querySelectorAll('.code-wrapper-collapsed');
    elements.forEach(function(element) {
        element.classList.remove('code-wrapper-collapsed');
    });
    elements = doc.querySelectorAll('.code-collapsed');
    elements.forEach(function(element) {
        element.classList.remove('code-collapsed');
        element.removeAttribute('contenteditable');
    });
    elements = doc.querySelectorAll('.cell-selected');
    elements.forEach(function(element) {
        element.classList.remove('cell-selected');
    });

    return doc.body.innerHTML;
  }
  private mergeAdjacent(tag:string) {
    const all = document.querySelectorAll(tag);
    let prev: any = null;
  
    all.forEach((ul, index) => {
      if (prev && ul.previousElementSibling === prev) {
        while (ul.children.length > 0) {
          prev.appendChild(ul.children[0]);
        }
        ul.remove();
      } else {
        prev = ul;
      }
    });
  }
  private splitAtCaret(element: HTMLElement, clearFormatting: boolean, changeTextColor: boolean) {
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0){
      return;
    } 
    const range = selection.getRangeAt(0);
    let selectedText = range.toString();
    if (element) {
      const startOffset = range.startOffset;
      const originalText = element.textContent;
      if(originalText){
        if(this.textElement && this.textElement.textContent){
          const leftContainer = element.cloneNode(false) as HTMLElement;
          const rightContainer = element.cloneNode(false) as HTMLElement;
          const middleContainer = element.cloneNode(false) as HTMLElement;
          this.splitElementAtText(element, leftContainer, middleContainer, rightContainer, startOffset, selectedText.length);
          const marker = middleContainer.querySelector('#editor-marker');
          if(!marker) return;
          if(!selectedText){
            selectedText = '\u200B';
          }
          const space = document.createTextNode(selectedText);
          marker.replaceWith(space);
          const parent = element.parentNode;
          if(!parent) return;
          parent.insertBefore(leftContainer, element);
          if(clearFormatting){
            parent.insertBefore(space, element);
          }
          else{
            if(changeTextColor && this.selectedColor){
              middleContainer.style.color = this.selectedColor.colorCode;
              middleContainer.setAttribute('custom-text-color-name', this.selectedColor.colorName);
              middleContainer.setAttribute('custom-text-color-code', this.selectedColor.colorCode);
              parent.insertBefore(middleContainer, element);
            }
            else if(middleContainer.firstChild){
              parent.insertBefore(middleContainer.firstChild, element);
            }
          }
          if(rightContainer.textContent){
            parent.insertBefore(rightContainer, element);
          }
          element.remove();
          this.setCursorPositionAfter(space, false);
        }
      }  
    }
  }
  private splitElementAtText(container:HTMLElement, leftContainer:HTMLElement, middleContainer:HTMLElement, rightContainer:HTMLElement, splitIndex:number, selectedTextLength:number) {
    const children = container.childNodes;
    let left = true;
    children.forEach(child => {
      if (this.textElement && child.contains(this.textElement) && this.textElement.textContent) {
        left = false;
        const textLeft = this.textElement.textContent.slice(0, splitIndex);
        const textRight = this.textElement.textContent.slice(splitIndex + selectedTextLength);
        if(child === this.textElement){
          leftContainer.appendChild(document.createTextNode(textLeft));
          const marker = document.createElement('span');
          marker.id = 'editor-marker';
          middleContainer.appendChild(marker);
          if(textRight){
            rightContainer.appendChild(document.createTextNode(textRight));
          }
        }
        else{
          const leftNew = child.cloneNode(false);
          leftContainer.appendChild(leftNew);
          const rightNew = child.cloneNode(false);
          rightContainer.appendChild(rightNew);
          const middleNew = child.cloneNode(false);
          middleContainer.appendChild(middleNew);
          this.splitElementAtText(child as HTMLElement, leftNew as HTMLElement, middleNew as HTMLElement, rightNew as HTMLElement, splitIndex, selectedTextLength);
          
        }
        
      } else if(left) {
        leftContainer.appendChild(child.cloneNode(true));
      }
      else{
        rightContainer.appendChild(child.cloneNode(true));
      }
    });
  }
  private replaceElement(oldElement: HTMLElement, newElementType: string) {
    //console.log(oldElement, newElementType)
    const newElement = document.createElement(newElementType);
    newElement.innerHTML = oldElement.innerHTML;
    if(oldElement.parentNode){
      oldElement.parentNode.replaceChild(newElement, oldElement);
      this.setCursorPositionAfter(newElement, true);
    }
  }
  private deleteCharBeforeCaret() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0){
      return;
    } 

    const range = selection.getRangeAt(0);

    // Check if the selection is collapsed (no text is selected)
    if (range.collapsed) {
      const startContainer = range.startContainer;
      // Deleting a character in a text node
      if (startContainer.nodeType === Node.TEXT_NODE && range.startOffset > 0) {
        // Modify the range to encompass the character before the caret
        range.setStart(startContainer, range.startOffset - 1);
        // Delete the character
        range.deleteContents();

        // Create a new range to set the caret position
        const newRange = document.createRange();
        newRange.setStart(startContainer, range.startOffset);
        newRange.collapse(true);

        // Set the new range as the selection
        selection.removeAllRanges();
        selection.addRange(newRange);
      } 
    }
  }
  private createElementFromString(htmlString: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    if (doc.body.firstChild && doc.body.firstChild.nodeType === Node.ELEMENT_NODE) {
        return doc.body.firstChild as HTMLElement;
    }
    return doc.body.firstElementChild;
  }
  private addElement(elem:HTMLElement | Text, parent: HTMLElement){
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && parent.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(elem);

      range.selectNodeContents(elem);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);    
    }          
  }
  private setCursorPositionAfter(element: any, afterContentInsideTag: boolean) {
    if (element) {
      const range = document.createRange();
      const selection = window.getSelection();
      
      if(afterContentInsideTag){
        if (element.lastChild) {
          range.setStartAfter(element.lastChild);
        } else {
            range.setStart(element, 0);
        }
      }
      else{
        range.setStartAfter(element);
      }
      range.collapse(true);
      
      if(selection){
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }
  saveCaretPosition() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      this.savedRange = selection.getRangeAt(0);
    }
  }
  restoreCaretPosition() {
    if (this.savedRange) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(this.savedRange);
    }
    this.editor.nativeElement.focus();
  }
  @HostListener('document:click', ['$event']) onHostClick(event: MouseEvent) {
    if(!this.config.editMode) return;

    const targetElement = event.target as HTMLElement;
    const dropdown = this.el.nativeElement.querySelector('.universal-editor-mention');
    const datepicker = this.el.nativeElement.querySelector('.universal-editor-datepicker');
    const dateButton = this.el.nativeElement.querySelector('.date-button');
    const mentionButton = this.el.nativeElement.querySelector('.mention-button');
    const editLink = this.el.nativeElement.querySelector('.universal-editor-link-edit');

    if (targetElement && dropdown && mentionButton && !dropdown.contains(targetElement) && this.isMentionDropdownOpen && !mentionButton.contains(targetElement)) {
      this.onCancelSelectUser(false);
    }

    if (targetElement && datepicker && dateButton && !datepicker.contains(targetElement) && !dateButton.contains(targetElement)) {
      this.showDatePopup(false);
    }

    if(this.editor.nativeElement.contains(targetElement) && targetElement.className === 'img-wrapper'){
      this.currentImageElement = targetElement;
      this.setCursorPositionAfter(targetElement, true);
      this.addSizerIntoImageWrapper();
    }
    if(this.editor.nativeElement.contains(targetElement) && targetElement.nodeName === 'IMG'){
      const parent = targetElement.parentElement;
      if(parent){
        this.currentImageElement = parent;
        this.setCursorPositionAfter(parent, true);
        this.addSizerIntoImageWrapper();
      }
    }
    if(this.editor.nativeElement.contains(targetElement)){
      this.traverseTheDOM(true);
    }
    if(this.config.enableLink && targetElement && editLink && !editLink.contains(targetElement) && this.isAddEditLinkDialogOpen){
      this.showAddEditLink(false, 'Add');
    }
  }
  @HostListener('window:resize', ['$event']) onResize() {
    this.widthSubject.next(this.editor.nativeElement.offsetWidth);
    this.editorWidth = this.editor.nativeElement.offsetWidth;
  }
  onFormat(format:string){
    if(format === 'Underline'){
      this.onSelectUnderline();
    }
    else if(format === 'Strikethrough'){
      this.onSelectStrikethrough();
    }
    else if(format === 'Subscript'){
      this.onSelectSubscript();
    }
    else if(format === 'Superscript'){
      this.onSelectSuperscript();
    }
    else if(format === 'Clear formatting'){
      this.onClearFormatting();
    }
  }
  onOptions(option:string){
    if(option === 'Mention'){
      this.onMentionClick();
    }
    else if(option === 'Link'){
      this.showAddEditLink(true, 'Add');
    }
    else if(option === 'File'){
      this.uploadFile();
    }
    else if(option === 'Code'){
      this.addCode('\u00A0');
    }
    else if(option === 'Date'){
      this.addDate();
    }
    else if(option === 'Info'){
    }
  }
  private checkWatermark(){
    return true;

    const pseudoAfterStyles = window.getComputedStyle(this.editor.nativeElement, '::after');
    const styles = getWatermarkData();
    const computedStyles = {
      content: pseudoAfterStyles.getPropertyValue('content'),
      position: pseudoAfterStyles.getPropertyValue('position'),
      bottom: pseudoAfterStyles.getPropertyValue('bottom'),
      right: pseudoAfterStyles.getPropertyValue('right'),
      color: pseudoAfterStyles.getPropertyValue('color'), 
      fontSize: pseudoAfterStyles.getPropertyValue('font-size'),
      height: pseudoAfterStyles.getPropertyValue('height'),
      width: pseudoAfterStyles.getPropertyValue('width'),
    }
    const currentDate = new Date();
    if(equal(computedStyles, styles) && currentDate < Const.expirationDate){
      return true;
    }
    for(let i = 0; i < 100; i++){
      console.error('Invalid licence', i);
    }
    return false;
    
  }

  private traverseTheDOM(exposeChanges: boolean) {
    const editor = this.editor.nativeElement;
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || !editor.contains(selection.anchorNode) || !this.checkWatermark()) {
        return;
    }
    const range = selection.getRangeAt(0);
    this.selectedText = range.toString();

    let node: Node | null = selection.getRangeAt(0).startContainer;
    if(exposeChanges){
      this.isBold = false;
      this.isItalic = false;
      this.isUnderline = false;
      this.isStrikethrough = false;
      this.isSubscript = false;
      this.isSuperscript = false;
      this.selectedColor = this.defaultTextColor;
      this.isBulletList = false;
      this.isNumberedList = false;
      this.textStyle = 'p';
    }
    this.showLinkPopup(false);
    this.showCodePopup(false);
    this.showTablePopup(false);
    this.showDatePopup(false);
    this.currentLinkElement = undefined;
    this.textElement = undefined;
    this.currentTextStyleElement = undefined;
    this.currentBoldElement = undefined;
    this.currentItalicElement = undefined;
    this.currentUnderlineElement = undefined;
    this.currentStrikethroughElement = undefined;
    this.currentSupesrsciptElement = undefined;
    this.currentSubscriptElement = undefined;
    this.highestFormatElement = undefined;
    this.currentTextColorElement = undefined;
    this.currentBulletListElement = undefined;
    this.currentNumberedListElement = undefined;
    this.currentImageElement = undefined;
    this.currentCodeElement = undefined;
    this.currentTableElement = undefined;
    this.currentCellElement = undefined;
    this.currentDateElement = undefined;
    if(node.nodeType === Node.TEXT_NODE){
      this.textElement = node as HTMLElement;
    }

    while (node && node !== editor) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if(node.nodeName === 'DIV'){
            const div = node as HTMLElement;
            if(div.className === 'img-wrapper'){
              this.currentImageElement = div;
            }
            else if(div.className === 'img-wrapper-sizer' || div.className === 'img-wrapper-sizer-visual' || div.className === 'code-counter'){

            }
            else if(div.className === 'code-wrapper' || div.className === 'code-wrapper code-wrapper-collapsed'){
              this.currentCodeElement = div;
            }
            else if(div.className === 'table-wrapper'){
              this.currentTableElement = div;
              this.setCursorInsideTable();
              this.showTablePopup(true);
            }
            else{
              const p = document.createElement('p');
              const space = document.createTextNode('\u200B');
              p.appendChild(space);
              (node as HTMLElement).replaceWith(p);
              this.setCursorPositionAfter(space, false);
              this.currentTextStyleElement = p;
            }
          }
          else if (['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(node.nodeName)) {
            this.textStyle = node.nodeName.toLowerCase(); 
            this.currentTextStyleElement = node as HTMLElement;
            const br = this.currentTextStyleElement.querySelector('br');
            if(br){
              const space = document.createTextNode('\u200B');
              br.replaceWith(space);
              this.setCursorPositionAfter(space, false);
            }
          }
          else if(node.nodeName === 'STRONG'){
            if(exposeChanges){
              this.isBold = true;
            }
            this.currentBoldElement = node as HTMLElement;
            this.highestFormatElement = node as HTMLElement;
          }
          else if(node.nodeName === 'EM'){
            if(exposeChanges){
              this.isItalic = true;
            }
            this.currentItalicElement = node as HTMLElement;
            this.highestFormatElement = node as HTMLElement;
          }
          else if(node.nodeName === 'U'){
            if(exposeChanges){
              this.isUnderline = true;
            }
            this.currentUnderlineElement = node as HTMLElement;
            this.highestFormatElement = node as HTMLElement;
          }
          else if(node.nodeName === 'S'){
            if(exposeChanges){
              this.isStrikethrough = true;
            }
            this.currentStrikethroughElement = node as HTMLElement;
            this.highestFormatElement = node as HTMLElement;
          }
          else if(node.nodeName === 'SUB'){
            if(exposeChanges){
              this.isSubscript = true;
            }
            this.currentSubscriptElement = node as HTMLElement;
            this.highestFormatElement = node as HTMLElement;
          }
          else if(node.nodeName === 'SUP'){
            if(exposeChanges){
              this.isSuperscript = true;
            }
            this.currentSupesrsciptElement = node as HTMLElement;
            this.highestFormatElement = node as HTMLElement;
          }
          else if(node.nodeName === 'SPAN'){
            const elem = node as HTMLElement;
            if(elem.className === 'universal-editor-text-color'){
              this.currentTextColorElement = elem;
              if(exposeChanges){
                const textColor = this.currentTextColorElement.getAttribute('custom-text-color-code');
                this.selectedColor = this.textColors.find(color => color.colorCode === textColor);
              }
              this.highestFormatElement = elem;
            }
            else if(elem.className === 'universal-editor-date-widget'){
              this.currentDateElement = elem;
              this.showDatePopup(true);
            }
          }
          else if(node.nodeName === 'UL' && !this.currentBulletListElement){
            if(exposeChanges){
              this.isBulletList = true;
            }
            this.currentBulletListElement = node as HTMLElement;
          }
          else if(node.nodeName === 'OL' && !this.currentNumberedListElement){
            if(exposeChanges){
              this.isNumberedList = true;
            }
            this.currentNumberedListElement = node as HTMLElement;
          }
          else if(node.nodeName === 'A'){
            this.currentLinkElement = node as HTMLElement;
            this.showLinkPopup(true);
          }
          else if(node.nodeName === 'TD' || node.nodeName === 'TH'){
            this.currentCellElement = node as HTMLElement;
          }
          //console.log('Element type:', node.nodeName);
        } 
        node = node.parentNode;
    }

    const sizer = this.el.nativeElement.querySelector('.img-wrapper-sizer');
    if(sizer && !this.currentImageElement){
      sizer.style.display='none';
      this.showImgPopup(false);
    }

    if(this.currentCodeElement?.lastChild){
      const code = this.currentCodeElement.lastChild.textContent;
      this.updateNumberOfLines(code, 'Edit');
      this.showCodePopup(true);
    }

    if(exposeChanges){
      if(this.textStyles){
        this.textStyles.setStyle(this.textStyle);
      }
      if(this.selectedColor){
        this.textColorRef.setColor(this.selectedColor);
      }
    }
  }




  // DATE
  currentDateElement:HTMLElement | undefined;
  dateSubject = new Subject<Date>();
  currentDate$ = this.dateSubject.asObservable();
  get dateDisabled(){
    if(this.currentImageElement || this.currentCodeElement || this.currentLinkElement){
      return true;
    }
    return false;
  }
  addDate(){
    this.restoreCaretPosition();
    const date = new Date();
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const elemText = `<span class="universal-editor-date-widget" timestamp="${date}" contenteditable=false>${formattedDate}</span> `; 
    if(this.currentTextStyleElement){
      const elem = this.createElementFromString(elemText) as HTMLElement;
      this.addElement(elem, this.currentTextStyleElement);
      this.setCursorPositionAfter(elem, true);
    }
    else{
      const elem = this.createElementFromString(`<p>${elemText}</p>`) as HTMLElement;
      this.addElement(elem, this.editor.nativeElement);
      this.setCursorPositionAfter(elem.firstChild, true);
    }
    this.traverseTheDOM(true);
    this.emitChange();
  }
  showDatePopup(show:boolean){
    const dialog = this.el.nativeElement.querySelector('.universal-editor-datepicker');
    if(!dialog || !this.config.enableDate) return;

    if(show && this.currentDateElement){
      const date = this.currentDateElement.getAttribute('timestamp') ?? '';
      this.dateSubject.next(new Date(date));

      const rect = this.currentDateElement.getBoundingClientRect();
      const x = rect.left + window.scrollX; // Left of the element
      const y = rect.top + window.scrollY; // Top of the element

      dialog.style.display = 'block';
      setTimeout(() => {
        const dialogHeight = dialog.offsetHeight;
      
        dialog.style.top = `${y - dialogHeight - 8}px`; // Position above the current date element with a small offset
      
        dialog.style.left = `${x}px`; // Align left with the date element
      
        if (x < 0) {
          dialog.style.left = `${window.scrollX}px`; // Align to the left edge
        } else if (x + dialog.offsetWidth > window.innerWidth) {
          dialog.style.left = `${window.innerWidth - dialog.offsetWidth + window.scrollX}px`; // Align to the right edge
        }
      });
    }
    else{
      dialog.style.display = 'none';
    }
  }
  onSelectDate(date: Date){
    if(this.currentDateElement){
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      this.currentDateElement.textContent = formattedDate;
      this.currentDateElement.setAttribute('timestamp', date.toString());
      this.showDatePopup(false);
      this.setCursorPositionAfter(this.currentDateElement, false);
      this.traverseTheDOM(true);
      this.emitChange();
    }
  }


  //TABLE
  currentTableElement:HTMLElement | undefined;
  currentCellElement:HTMLElement | undefined;
  newRow:HTMLElement | undefined;
  newColumn:HTMLElement[] = [];
  get tableDisabled(){
    if(this.currentTableElement || this.currentImageElement || this.currentCodeElement || this.currentBulletListElement || this.currentNumberedListElement){
      return true;
    }
    return false;
  }
  addTable(){
    if(this.tableDisabled || !this.config.enableTable) return;

    const div = document.createElement('div');  
    div.className = 'table-wrapper';  
    const table = document.createElement('table');    
    /* table.setAttribute('table-id', generateUniqueId()); */ 
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);
    const rowH = document.createElement('tr');
    let first = true;
    let firstCell;
    for (let index = 0; index < 3; index++) {
      const cell = document.createElement('th');
      /* cell.setAttribute('cell-id', generateUniqueId());  */
      const p = document.createElement('p');
      p.textContent = '\u200B';
      cell.appendChild(p);
      rowH.appendChild(cell);
      if(first){
        firstCell = cell;
        first = false;
      }
    }
    tbody.appendChild(rowH)
    for (let index = 0; index < 2; index++) {
      const row = document.createElement('tr');
      for (let index = 0; index < 3; index++){
        const cell = document.createElement('td');
        /* cell.setAttribute('cell-id', generateUniqueId()); */ 
        const p = document.createElement('p');
        p.textContent = '\u200B';
        cell.appendChild(p);
        row.appendChild(cell);

      }
      tbody.appendChild(row);
    }
    div.appendChild(table);
    if(this.currentTextStyleElement){
      this.currentTextStyleElement.insertAdjacentElement('afterend', div);
    }
    else{
      this.editor.nativeElement.focus();
      this.editor.nativeElement.appendChild(div);  
    }
    const p = document.createElement('p');
    p.textContent = '\u200B';
    div.insertAdjacentElement('afterend', p);
    this.setCursorPositionAfter(firstCell?.firstChild, true);
    this.emitChange();
    this.traverseTheDOM(true);

  }
  showTablePopup(show:boolean){
    const dialog = this.el.nativeElement.querySelector('.universal-editor-table');
    if(!dialog || !this.config.enableTable) return;

    if (show && this.currentTableElement) {
      const rect = this.currentTableElement.getBoundingClientRect();
      const x = rect.left + window.scrollX + (rect.width / 2); // Middle of the element
      const y = rect.top + window.scrollY + rect.height; // Bottom of the element
      this.addRemoveTableClass(true);
      dialog.style.display = 'flex';
      setTimeout(() => {
        const dialogWidth = dialog.offsetWidth;
        const dialogHalfWidth = dialogWidth / 2; // Half the width of the dialog
    
        dialog.style.top = `${y + 8}px`;
    
        // Calculate left position to center the dialog
        const leftPosition = x - dialogHalfWidth;
    
        // Adjust if the dialog goes beyond the left or right edge
        if (leftPosition < 0) {
          dialog.style.left = `${window.scrollX}px`; // Align to the left edge
        } else if (leftPosition + dialogWidth > window.innerWidth) {
          dialog.style.left = `${window.innerWidth - dialogWidth + window.scrollX}px`; // Align to the right edge
        } else {
          dialog.style.left = `${leftPosition}px`; // Centered
        }
      });
    }
    else{
      dialog.style.display = 'none';
      this.addRemoveTableClass(false);
    }
  }
  private setCursorInsideTable(){
    if(!this.currentCellElement && this.currentTableElement){
      const firstCell = this.currentTableElement.querySelector('table tr:first-child th:first-child');
      if(firstCell){
        this.currentCellElement = firstCell as HTMLElement;
        this.setCursorPositionAfter(firstCell, true);
      }
      else{
        const secondCell = this.currentTableElement.querySelector('table tr:first-child td:first-child');
        if(secondCell){
          this.currentCellElement = secondCell as HTMLElement;
          this.setCursorPositionAfter(secondCell, true);
        }
      }
    }
  }
  removeTable(){
    if(this.currentTableElement){
      this.onRemoveTableLeave();
      this.currentTableElement.remove();
      this.editor.nativeElement.focus();
      this.emitChange();
      this.traverseTheDOM(true);
    }
  }
  clearCell(){
    if(this.currentCellElement){
      const p = document.createElement('p');
      p.textContent = '\u200B';
      this.currentCellElement.innerHTML='';
      this.currentCellElement.appendChild(p);
      this.setCursorPositionAfter(p,true);
      this.emitChange();
      this.traverseTheDOM(true);
    }
  }
  onRemoveCellEnter(){
    if(this.currentCellElement && !this.currentCellElement.classList.contains('remove')){
      this.currentCellElement.classList.add('remove');
      const button = this.el.nativeElement.querySelector('#remove-button-cell');
      if(button){
        button.children[0].classList.add('remove-button');
      }
    }
  }
  onRemoveCellLeave(){
    if(this.currentCellElement && this.currentCellElement.classList.contains('remove')){
      this.currentCellElement.classList.remove('remove');
      const button = this.el.nativeElement.querySelector('#remove-button-cell');
      if(button){
        button.children[0].classList.remove('remove-button');
      }
    }
  }
  removeRow(){
    if(this.currentCellElement && this.currentCellElement.parentElement){
      this.currentCellElement.parentElement.remove();
      this.editor.nativeElement.focus();
      this.emitChange();
      this.traverseTheDOM(true);
    }
  }
  onRemoveRowEnter(){
    if(this.currentCellElement && this.currentCellElement.parentElement){
      this.currentCellElement.parentElement.childNodes.forEach(element => {
        if(!(element as HTMLElement).classList.contains('remove')){
          (element as HTMLElement).classList.add('remove');
          (element as HTMLElement).classList.add('cell-selected-remove');
        }
      });
      const button = this.el.nativeElement.querySelector('#remove-button-row');
      if(button){
        button.children[0].classList.add('remove-button');
      }
    }
  }
  onRemoveRowLeave(){
    if(this.currentCellElement && this.currentCellElement.parentElement){
      this.currentCellElement.parentElement.childNodes.forEach(element => {
        if((element as HTMLElement).classList.contains('remove')){
          (element as HTMLElement).classList.remove('remove');
          (element as HTMLElement).classList.remove('cell-selected-remove');
        }
      });
      const button = this.el.nativeElement.querySelector('#remove-button-row');
      if(button){
        button.children[0].classList.remove('remove-button');
      }
    }
  }
  removeColumn(){
    if(this.currentCellElement && this.currentCellElement.parentNode && this.currentTableElement){
      const columnIndex = Array.from(this.currentCellElement.parentNode.children).indexOf(this.currentCellElement);
      const rows = this.currentTableElement.querySelectorAll('tr');
      rows.forEach(row => { if(row.cells[columnIndex]) row.deleteCell(columnIndex); });
      this.editor.nativeElement.focus();
      this.emitChange();
      this.traverseTheDOM(true);
    }
  }
  onRemoveColumnEnter(){
    if(this.currentCellElement && this.currentCellElement.parentNode && this.currentTableElement){
      const columnIndex = Array.from(this.currentCellElement.parentNode.children).indexOf(this.currentCellElement);
      const rows = this.currentTableElement.querySelectorAll('tr');
      rows.forEach(row => { if(row.cells[columnIndex] && !row.cells[columnIndex].classList.contains('remove')){
        row.cells[columnIndex].classList.add('remove');
        row.cells[columnIndex].classList.add('cell-selected-remove');
      }});
      const button = this.el.nativeElement.querySelector('#remove-button-column');
      if(button){
        button.children[0].classList.add('remove-button');
      }
    }
  }
  onRemoveColumnLeave(){
    if(this.currentCellElement && this.currentCellElement.parentNode && this.currentTableElement){
      const columnIndex = Array.from(this.currentCellElement.parentNode.children).indexOf(this.currentCellElement);
      const rows = this.currentTableElement.querySelectorAll('tr');
      rows.forEach(row => { if(row.cells[columnIndex] && row.cells[columnIndex].classList.contains('remove')){
        row.cells[columnIndex].classList.remove('remove');
        row.cells[columnIndex].classList.remove('cell-selected-remove');
      }});
      const button = this.el.nativeElement.querySelector('#remove-button-column');
      if(button){
        button.children[0].classList.remove('remove-button');
      }
    }
  }
  insertRow(){
    if(this.currentCellElement && this.currentCellElement.parentElement){
      this.onInsertRowLeave();
      const newRow = this.currentCellElement.parentElement.cloneNode(true);
      let firstPar;
      newRow.childNodes.forEach((cell, index) => {
        (cell as HTMLElement).innerHTML = '';
        const p = document.createElement('p');
        p.textContent = '\u200B';
        cell.appendChild(p);
        if(index === 0) firstPar = p;
      })
      this.currentCellElement.parentElement.insertAdjacentElement('afterend', newRow as HTMLElement);
      this.setCursorPositionAfter(firstPar, true);
      this.emitChange();
      this.traverseTheDOM(true);
    }
  }
  onInsertRowEnter(){
    if(this.currentCellElement && this.currentCellElement.parentElement){
      const newRow = this.currentCellElement.parentElement.cloneNode(true);
      newRow.childNodes.forEach((cell, index) => {
        (cell as HTMLElement).innerHTML = '';
        (cell as HTMLElement).classList.add('cell-selected');
        const p = document.createElement('p');
        p.textContent = '\u200B';
        cell.appendChild(p);
      });
      this.newRow = newRow as HTMLElement;
      this.currentCellElement.parentElement.insertAdjacentElement('afterend', newRow as HTMLElement);
    }
  }
  onInsertRowLeave(){
    if(this.newRow){
      this.newRow.remove();
      this.newRow = undefined;
    }
  }
  insertColumn(){
    if(this.currentCellElement && this.currentCellElement.parentNode && this.currentTableElement){
      this.onInsertColumnLeave();
      const columnIndex = Array.from(this.currentCellElement.parentNode.children).indexOf(this.currentCellElement);
      const rows = this.currentTableElement.querySelectorAll('tr');
      let firstPar;
      rows.forEach((row, index) => { 
        if(row.cells[columnIndex]){
          const newCell = row.cells[columnIndex].cloneNode(false);
          const p = document.createElement('p');
          p.textContent = '\u200B';
          newCell.appendChild(p);
          row.cells[columnIndex].insertAdjacentElement('afterend', newCell as HTMLElement);
          if(index === 0) firstPar = p;
        }
      });
      this.setCursorPositionAfter(firstPar, true);
      this.emitChange();
      this.traverseTheDOM(true);
    }
  }
  onInsertColumnEnter(){
    if(this.currentCellElement && this.currentCellElement.parentNode && this.currentTableElement){
      const columnIndex = Array.from(this.currentCellElement.parentNode.children).indexOf(this.currentCellElement);
      const rows = this.currentTableElement.querySelectorAll('tr');
      rows.forEach((row) => { 
        if(row.cells[columnIndex]){
          const newCell = row.cells[columnIndex].cloneNode(false);
          (newCell as HTMLElement).classList.add('cell-selected');
          const p = document.createElement('p');
          p.textContent = '\u200B';
          newCell.appendChild(p);
          row.cells[columnIndex].insertAdjacentElement('afterend', newCell as HTMLElement);
          this.newColumn.push(newCell as HTMLElement);
        }
      });
    }
  }
  onInsertColumnLeave(){
    if(this.newColumn){
      this.newColumn.forEach(cell => cell.remove());
      this.newColumn = [];
    }
  }
  private addRemoveTableClass(show:boolean){
    if(this.currentCellElement && this.currentTableElement){
      const selectedCells = this.currentTableElement.querySelectorAll('.cell-selected');
      selectedCells.forEach(element => {
        element.classList.remove('cell-selected');
      });
      if(show){
        this.currentCellElement.classList.add('cell-selected');
      }
    }
  }
  onRemoveTableEnter(){
    if(this.currentTableElement && !this.currentTableElement.classList.contains('remove')){
      this.currentTableElement.classList.add('remove');
      const button = this.el.nativeElement.querySelector('#remove-button-table');
      if(button){
        button.children[0].classList.add('remove-button');
      }
    }
  }
  onRemoveTableLeave(){
    if(this.currentTableElement && this.currentTableElement.classList.contains('remove')){
      this.currentTableElement.classList.remove('remove');
      const button = this.el.nativeElement.querySelector('#remove-button-table');
      if(button){
        button.children[0].classList.remove('remove-button');
      }
    }
  }


  //CODE
  currentCodeElement:HTMLElement | undefined;
  isExpandedCode = true;
  get codeDisabled(){
    if(this.currentImageElement || this.currentCodeElement || this.currentBulletListElement || this.currentNumberedListElement){
      return true;
    }
    return false;
  }
  addCode(codeText: string){
    if(this.codeDisabled) return;

    const div = document.createElement('div');
    this.currentCodeElement = div;
    div.className = 'code-wrapper';
    div.setAttribute('spellcheck', 'false');
    
    this.updateNumberOfLines(codeText, 'Add');
    
    const code = document.createElement('code');
    code.textContent = codeText;
    div.appendChild(code);

    if(this.currentTextStyleElement){
      this.currentTextStyleElement.insertAdjacentElement('afterend', div);
    }
    else{
      this.editor.nativeElement.focus();
      this.editor.nativeElement.appendChild(div);  
    }
    const p = document.createElement('p');
    p.textContent = '\u200B';
    div.insertAdjacentElement('afterend', p);
    this.setCursorPositionAfter(code, true);
    this.currentTextStyleElement = undefined;

    this.emitChange();
    this.traverseTheDOM(true);
  }
  removeCode(){
    if(this.currentCodeElement){
      this.onRemoveCodeLeave();
      this.currentCodeElement.remove();
      this.editor.nativeElement.focus();
      this.emitChange();
      this.traverseTheDOM(true);
    }
  }
  copyCode(){
    if(this.currentCodeElement){
      navigator.clipboard.writeText(this.currentCodeElement.lastChild?.textContent ?? '');
      this.copySelected = true;
      setTimeout(() => this.copySelected = false, 500);
    }
  }
  private updateNumberOfLines(codeText: string | null, mode: 'Add' | 'Edit'){
    if(this.currentCodeElement && codeText !== null){
      const lines = codeText.split('\n');
      const counter = document.createElement('div');
      counter.setAttribute('contenteditable', 'false');
      counter.className = 'code-counter';
      lines.forEach((text, index) => {
        const span = document.createElement('span');
        span.textContent = (index + 1).toString();
        counter.appendChild(span);
      });
      if(mode === 'Add'){
        this.currentCodeElement.appendChild(counter);
      }
      else if(this.currentCodeElement.firstChild){
        this.currentCodeElement.firstChild.replaceWith(counter);
      }
    }
  }
  showCodePopup(show:boolean){
    const dialog = this.el.nativeElement.querySelector('.universal-editor-code');
    if(!dialog || !this.config.enableCode) return;

    if (show && this.currentCodeElement && this.currentCodeElement.firstChild) {
      const rect = this.currentCodeElement.getBoundingClientRect();
      const x = rect.left + window.scrollX + (rect.width / 2); // Middle of the element
      const y = rect.top + window.scrollY + rect.height; // Bottom of the element
      this.addRemoveCodeClass(true);
      dialog.style.display = 'flex';
      setTimeout(() => {
        const dialogWidth = dialog.offsetWidth;
        const dialogHalfWidth = dialogWidth / 2; // Half the width of the dialog
    
        dialog.style.top = `${y + 8}px`;
    
        // Calculate left position to center the dialog
        const leftPosition = x - dialogHalfWidth;
    
        // Adjust if the dialog goes beyond the left or right edge
        if (leftPosition < 0) {
          dialog.style.left = `${window.scrollX}px`; // Align to the left edge
        } else if (leftPosition + dialogWidth > window.innerWidth) {
          dialog.style.left = `${window.innerWidth - dialogWidth + window.scrollX}px`; // Align to the right edge
        } else {
          dialog.style.left = `${leftPosition}px`; // Centered
        }
      });
    }
    else{
      dialog.style.display = 'none';
      this.addRemoveCodeClass(false);
    }
  }
  private addRemoveCodeClass(show:boolean){
    if(this.currentCodeElement){
      if(show){
        (this.currentCodeElement.firstChild as HTMLElement).classList.add('code-counter-selected');
        this.currentCodeElement.classList.add('code-wrapper-selected');
      }
      else{
        (this.currentCodeElement.firstChild as HTMLElement).classList.remove('code-counter-selected');
        this.currentCodeElement.classList.remove('code-wrapper-selected');
      }
    }
  }
  expandCollapseCode(show:boolean){
    if(this.currentCodeElement){
      this.isExpandedCode = show;
      if(show){
        (this.currentCodeElement.lastChild as HTMLElement).classList.remove('code-collapsed');
        this.currentCodeElement.classList.remove('code-wrapper-collapsed');
        (this.currentCodeElement.lastChild as HTMLElement).removeAttribute('contenteditable');
      }
      else{
        (this.currentCodeElement.lastChild as HTMLElement).classList.add('code-collapsed');
        this.currentCodeElement.classList.add('code-wrapper-collapsed');
        (this.currentCodeElement.lastChild as HTMLElement).setAttribute('contenteditable', 'false');
      }
      this.showCodePopup(true);
    }
  }
  onRemoveCodeEnter(){
    if(this.currentCodeElement && !this.currentCodeElement.classList.contains('remove')){
      this.currentCodeElement.classList.add('remove');
      const button = this.el.nativeElement.querySelector('#remove-button-code');
      if(button){
        button.children[0].classList.add('remove-button');
      }
    }
  }
  onRemoveCodeLeave(){
    if(this.currentCodeElement && this.currentCodeElement.classList.contains('remove')){
      this.currentCodeElement.classList.remove('remove');
      const button = this.el.nativeElement.querySelector('#remove-button-code');
      if(button){
        button.children[0].classList.remove('remove-button');
      }
    }
  }


  //FILE & IMAGE
  files: {file:File; key:string}[] = [];
  currentImageElement:HTMLElement | undefined;
  private resizing = false;
  private startX = 0;
  private startWidth = 0;
  private maxWidth = 0;
  altText = '';
  private altTextSubject = new Subject<void>();
  altText$ = this.altTextSubject.asObservable();
  get fileDisabled(){
    if(this.currentImageElement || this.currentCodeElement || this.currentLinkElement || this.currentBulletListElement || this.currentNumberedListElement){
      return true;
    }
    return false;
  }
  private setImageUrl(key:string, url:string){
    const imgElement = this.editor.nativeElement.querySelector(`img[image-key="${key}"]`);
    if(imgElement){
      imgElement.src = url;
    }
    this.emitChange();
  }
  showAddEditAltText(show:boolean){
    const dialog = this.el.nativeElement.querySelector('.universal-editor-altText-edit');
    if(!dialog || !this.config.enableFile) return;

    if (show && this.currentImageElement && this.currentImageElement.firstChild) {
      this.altText = (this.currentImageElement.firstChild as HTMLImageElement).alt;
      const rect = (this.currentImageElement.firstChild as HTMLElement).getBoundingClientRect();
      const x = rect.left + window.scrollX; // Align with the start of the image
      const bottomOfImage = rect.top + window.scrollY + rect.height;

      dialog.style.display = 'block';
      setTimeout(() => {
          this.altTextSubject.next();
          const dialogHeight = dialog.offsetHeight;
          const dialogTop = bottomOfImage - dialogHeight; 

          // Adjust vertical position
          dialog.style.top = `${dialogTop}px`;

          // Adjust horizontal position
          const dialogWidth = dialog.offsetWidth;
          dialog.style.left = (x + dialogWidth > window.innerWidth) ? `${window.innerWidth - dialogWidth + window.scrollX}px` : `${x}px`;
      });
    }
    else{
      dialog.style.display = 'none';
    }
  }
  onSubmitAltText(altText:string){
    if(this.currentImageElement && this.currentImageElement.firstChild){
      const img = this.currentImageElement.firstChild as HTMLImageElement;
      img.alt = altText;
      this.setCursorPositionAfter(this.currentImageElement, true);
      this.clearSizer();
      this.emitChange();
      this.addSizerIntoImageWrapper();
      this.showAddEditAltText(false);
    }
  }
  private addImage(file: {file:File; key:string}){
    const setImage = (url:string) =>{
      const div = document.createElement('div');
        div.setAttribute('wrapper-image-key', file.key);
        div.className = 'img-wrapper';
        div.setAttribute('contenteditable', 'false');
        const img = document.createElement('img');
        img.src = url;
        img.alt = '';
        img.onerror = function() {
          console.log('Error loading the image.');
          this.src = Const.no_image; 
          this.style.width = '100px'; 
        }
        img.setAttribute('image-key', file.key);
        img.style.width = '50%';
        img.style.height = 'auto';
        div.appendChild(img);

        if(this.currentTextStyleElement){
          this.currentTextStyleElement.insertAdjacentElement('afterend', div);
        }
        else{
          this.editor.nativeElement.focus();
          this.editor.nativeElement.appendChild(div);  
        }
        const p = document.createElement('p');
        p.textContent = '\u200B';
        div.insertAdjacentElement('afterend', p);
        this.setCursorPositionAfter(p, true);
        this.currentTextStyleElement = p;
        this.emitChange();
    }
    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setImage(result);
      }
    };
    reader.readAsDataURL(file.file);
  }
  private addFile(file: File){
    const newF = {key: generateUniqueId(), file: file};
    
    this.files.push(newF);
    if (file.type.match(/^image\//)) {
      this.addImage(newF);
    }
    this.onFilesChanged.emit(this.files);
  }
  removeFile(key?:string){
    if(key){
      const imgElement = this.editor.nativeElement.querySelector(`div[wrapper-image-key="${key}"]`);
      if(imgElement){
        this.clearSizer();
        imgElement.remove();
        this.currentImageElement = undefined;
        this.emitChange();
      }
      this.files = this.files.filter(file => file.key !== key);
      this.onFilesChanged.emit(this.files);
    }
    else if(this.currentImageElement){
      this.clearSizer();
      const key = this.currentImageElement.getAttribute('wrapper-image-key')
      if(key){
        this.currentImageElement.remove();
        this.currentImageElement = undefined;
        this.files = this.files.filter(file => file.key !== key);
        this.onFilesChanged.emit(this.files);
        this.emitChange();
        const button = this.el.nativeElement.querySelector('#remove-button-img');
        if(button){
          button.children[0].classList.remove('remove-button');
        }
      }
    }
    this.traverseTheDOM(true);
  }
  async copyImage(){
    if(this.currentImageElement && this.currentImageElement.firstChild){
      const image = this.currentImageElement.firstChild as HTMLImageElement;
      if(image.src){
        const response = await fetch(image.src);
        const blob = await response.blob();
          
        await navigator.clipboard.write([new ClipboardItem({[blob.type]: blob})]);
        this.copySelected = true;
        setTimeout(() => this.copySelected = false, 500);
      }
    }
  }
  uploadFile(){
    if(!this.config.enableFile) return;

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    fileInput.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        this.addFile(file);
        document.body.removeChild(fileInput);
      }
    });

    fileInput.click();
  }
  private addSizerIntoImageWrapper(){
    if(this.currentImageElement){
      const sizer = this.el.nativeElement.querySelector('.img-wrapper-sizer');
      if(sizer){
        sizer.style.display = 'flex';
        this.currentImageElement.appendChild(sizer);
        this.showImgPopup(true);
      }
    }
  }
  private showImgPopup(show: boolean) {
    const dialog = this.el.nativeElement.querySelector('.universal-editor-img');
    if(!dialog || !this.config.enableFile) return;

    if (show && this.currentImageElement && this.currentImageElement.firstChild) {
      const rect = (this.currentImageElement.firstChild as HTMLElement).getBoundingClientRect();
      const x = rect.left + window.scrollX + (rect.width / 2); // Middle of the element
      const y = rect.top + window.scrollY + rect.height; // Bottom of the element
    
      dialog.style.display = 'flex';
      setTimeout(() => {
        const dialogWidth = dialog.offsetWidth;
        const dialogHalfWidth = dialogWidth / 2; // Half the width of the dialog
    
        dialog.style.top = `${y + 8}px`;
    
        // Calculate left position to center the dialog
        const leftPosition = x - dialogHalfWidth;
    
        // Adjust if the dialog goes beyond the left or right edge
        if (leftPosition < 0) {
          dialog.style.left = `${window.scrollX}px`; // Align to the left edge
        } else if (leftPosition + dialogWidth > window.innerWidth) {
          dialog.style.left = `${window.innerWidth - dialogWidth + window.scrollX}px`; // Align to the right edge
        } else {
          dialog.style.left = `${leftPosition}px`; // Centered
        }
      });
    }
    else{
      dialog.style.display = 'none';
    }
  }
  private clearSizer(){
    const sizer = this.el.nativeElement.querySelector('.img-wrapper-sizer');
    if(!sizer) return;
    sizer.style.display = 'none';
    this.el.nativeElement.appendChild(sizer);
    this.showImgPopup(false);
  }
  resizeImage(event: MouseEvent) {
    if(this.currentImageElement){
      this.resizing = true;
      this.startX = event.clientX;
      this.maxWidth = this.currentImageElement.offsetWidth - 30;
      const img = this.currentImageElement.firstChild as HTMLElement;
      this.startWidth = img.offsetWidth;

      const mouseMove = (e: MouseEvent) => {
        if (this.resizing) {
          const diffX = e.clientX - this.startX;
          const newWidth = this.startWidth + diffX;
          if(this.currentImageElement && this.currentImageElement.firstChild){
            const img = this.currentImageElement.firstChild as HTMLElement;
            img.style.width = `${newWidth > this.maxWidth ? this.maxWidth : newWidth}px`;
            this.showImgPopup(true);
            this.clearSizer();
            this.emitChange();
            this.addSizerIntoImageWrapper();
          }
        }
      };

      const mouseUp = () => {
        this.resizing = false;
        document.removeEventListener('mousemove', mouseMove);
        document.removeEventListener('mouseup', mouseUp);
      };

      document.addEventListener('mousemove', mouseMove);
      document.addEventListener('mouseup', mouseUp);
    }
  }
  onRemoveImgEnter(){
    if(this.currentImageElement && !this.currentImageElement.classList.contains('remove')){
      this.currentImageElement.classList.add('remove');
      const button = this.el.nativeElement.querySelector('#remove-button-img');
      if(button){
        button.children[0].classList.add('remove-button');
      }
    }
  }
  onRemoveImgLeave(){
    if(this.currentImageElement && this.currentImageElement.classList.contains('remove')){
      this.currentImageElement.classList.remove('remove');
      const button = this.el.nativeElement.querySelector('#remove-button-img');
      if(button){
        button.children[0].classList.remove('remove-button');
      }
    }
  }
  setUploadFiles(files: {file:File; key:string}[]){
    this.files = files;
  }


 
  //BULLET LIST
  isBulletList = false;
  private currentBulletListElement: HTMLElement | undefined;
  get bulletListDisabled(){
    if(this.textStyle !== 'p' || this.currentImageElement || this.currentCodeElement){
      return true;
    }
    return false;
  }
  onBulletListClick(){
    this.editor.nativeElement.focus();
    const event = new KeyboardEvent('keydown', {
      code:'Digit8',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true
    });
    this.editor.nativeElement.dispatchEvent(event);
  }


  //NUMBERED LIST
  isNumberedList = false;
  private currentNumberedListElement: HTMLElement | undefined;
  get numberedListDisabled(){
    if(this.textStyle !== 'p' || this.currentImageElement || this.currentCodeElement){
      return true;
    }
    return false;
  }
  onNumberedListClick(){
    this.editor.nativeElement.focus();
    const event = new KeyboardEvent('keydown',{
      code:'Digit7',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true
    });
    this.editor.nativeElement.dispatchEvent(event);
  }


  // TEXT STYLE
  @ViewChild('textStyles') private textStyles!: TextStylesComponent;
  textStyle = 'p';
  private currentTextStyleElement: HTMLElement | undefined;
  get textStyleDisabled(){
    if(this.currentBulletListElement || this.currentNumberedListElement || this.currentImageElement || this.currentCodeElement){
      return true;
    }
    return false;
  }
  onStyleChange(event: string){
    if(this.config.enableTextStyles){
      this.restoreCaretPosition();
      if(this.editor.nativeElement.innerHTML.length === 0){
        this.editor.nativeElement.focus();
        let inside = `&#8203;`;
        if(this.selectedColor && !equal(this.selectedColor, this.defaultTextColor)){
          inside = `<span class="universal-editor-text-color" style="color:${this.selectedColor.colorCode};" 
          custom-text-color-name="${this.selectedColor.colorName}" custom-text-color-code="${this.selectedColor.colorCode}">${inside}</span>`;
        }
        if(this.isBold){
          inside = `<strong>${inside}</strong>`;
        }
        if(this.isItalic){
          inside = `<em>${inside}</em>`;
        }
        if(this.isUnderline){
          inside = `<u>${inside}</u>`;
        }
        if(this.isStrikethrough){
          inside = `<s>${inside}</s>`;
        }
        if(this.isSubscript){
          inside = `<sub>${inside}</sub>`;
        }
        if(this.isSuperscript){
          inside = `<sup>${inside}</sup>`;
        }
        inside = `<${event}>${inside}</${event}>`;
  
        const elem = this.createElementFromString(inside) as HTMLElement;
        this.addElement(elem, this.editor.nativeElement);
        this.setCursorPositionAfter(elem, true);
      }
      else if(this.currentTextStyleElement){
        this.replaceElement(this.currentTextStyleElement, event);
      }
      this.traverseTheDOM(false);
      this.textStyle = event;
      if(this.textStyles){
        this.textStyles.setStyle(this.textStyle);
      }
     this.emitChange();
    }
  }


  // TEXT COLOR
  selectedColor: Color | undefined;
  private currentTextColorElement: HTMLElement | undefined;
  @ViewChild('textColor') private textColorRef!: TextColorComponent;
  get textColorDisabled(){
    if(this.currentImageElement || this.currentCodeElement || this.currentLinkElement){
      return true;
    }
    return false;
  }
  private setDefaultTextColor(mode:boolean){
    this.darkMode = mode;
    this.textColors = this.darkMode ? Const.colorsDarkMode : Const.colors;
    this.defaultTextColor = this.textColors.find(color => color.colorName = this.config.defaultTextColor);
    if(this.defaultTextColor){
      this.defaultTextColor.selected = true;
      this.selectedColor = this.defaultTextColor;
    } 
  }
  triggerTextColor(color: 'Black' | 'Gainsboro' | 'Red' | 'Green' | 'Blue' |
  'Yellow' | 'Cyan' | 'Magenta' | 'Light Gray' | 'Gray' | 'Maroon' | 'Olive' |
  'Purple' | 'Teal' | 'Navy' | 'Coral' | 'Turquoise' | 'Salmon' |
  'Lime' | 'Gold' | 'Orchid'){
    const item = Const.colors.find(col => col.colorName === color);
    if(item){
      return item;
    }
    return Const.colors[0];
  }
  onTextColorChange(color:Color){
    this.restoreCaretPosition();
    if(equal(this.selectedColor, color)) return;
    this.selectedColor = color;
    const event = new KeyboardEvent('keydown', {
      code: 'CustomTextColor',
      bubbles: true,
      cancelable: true
    });
    this.editor.nativeElement.dispatchEvent(event);
  }


  // BOLD
  isBold = false;
  private currentBoldElement: HTMLElement | undefined;
  get boldDisabled(){
    if(this.currentImageElement || this.currentCodeElement || this.currentLinkElement){
      return true;
    }
    return false;
  }
  onSelectBold(){
    this.editor.nativeElement.focus();
    const event = new KeyboardEvent('keydown', {
      key: 'b',
      ctrlKey: true,
      bubbles: true,
      cancelable: true
    });
    this.editor.nativeElement.dispatchEvent(event);
  }


  // ITALIC
  isItalic = false;
  private currentItalicElement: HTMLElement | undefined;
  get italicDisabled(){
    if(this.currentImageElement || this.currentCodeElement || this.currentLinkElement){
      return true;
    }
    return false;
  }
  onSelectItalic(){
    this.editor.nativeElement.focus();
    const event = new KeyboardEvent('keydown', {
      key: 'i',
      ctrlKey: true,
      bubbles: true,
      cancelable: true
    });
    this.editor.nativeElement.dispatchEvent(event);
  }


  // UNDERLINE
  isUnderline = false;
  private currentUnderlineElement: HTMLElement | undefined;
  get underlineDisabled(){
    if(this.currentImageElement || this.currentCodeElement || this.currentLinkElement){
      return true;
    }
    return false;
  }
  onSelectUnderline(){
    this.restoreCaretPosition();
    const event = new KeyboardEvent('keydown', {
      key: 'u',
      ctrlKey: true,
      bubbles: true,
      cancelable: true
    });
    this.editor.nativeElement.dispatchEvent(event);
  }


  // STRIKETROUGH
  isStrikethrough = false;
  private currentStrikethroughElement: HTMLElement | undefined;
  get strikethroughDisabled(){
    if(this.currentImageElement || this.currentCodeElement || this.currentLinkElement){
      return true;
    }
    return false;
  }
  onSelectStrikethrough(){
    this.restoreCaretPosition();
    const event = new KeyboardEvent('keydown', {
      key: 'S',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
      shiftKey: true
    });
    this.editor.nativeElement.dispatchEvent(event);
  }


  // SUBSCRIPT
  isSubscript = false;
  private currentSubscriptElement: HTMLElement | undefined;
  get subscriptDisabled(){
    if(this.currentImageElement || this.currentCodeElement || this.currentLinkElement){
      return true;
    }
    return false;
  }
  onSelectSubscript(){
    this.restoreCaretPosition();
    const event = new KeyboardEvent('keydown', {
      code: 'Comma',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
      shiftKey: true
    });
    this.editor.nativeElement.dispatchEvent(event);
  }


  // SUPERSCRIPT
  isSuperscript = false;
  private currentSupesrsciptElement: HTMLElement | undefined;
  get superscriptDisabled(){
    if(this.currentImageElement || this.currentCodeElement || this.currentLinkElement){
      return true;
    }
    return false;
  }
  onSelectSuperscript(){
    this.restoreCaretPosition();
    const event = new KeyboardEvent('keydown', {
      code: 'Period',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
      shiftKey: true
    });
    this.editor.nativeElement.dispatchEvent(event);
  }


  // CLEAR FORMATTING
  private highestFormatElement: HTMLElement | undefined;
  get clearFormattingDisabled(){
    if(this.currentImageElement || this.currentCodeElement || this.currentLinkElement){
      return true;
    }
    return false;
  }
  onClearFormatting(){
    this.restoreCaretPosition();
    const event = new KeyboardEvent('keydown', {
      key: '\\',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    this.editor.nativeElement.dispatchEvent(event);
  }


  //LINK
  private linkSubject = new Subject<void>();
  link$ = this.linkSubject.asObservable();
  linkData: Link | undefined;
  linkMode: 'Add' | 'Edit' = 'Add';
  private isAddEditLinkDialogOpen = false;
  copySelected = false;
  private currentLinkElement: HTMLElement | undefined;
  get linkDisabled(){
    if(this.currentImageElement || this.currentCodeElement || this.currentLinkElement){
      return true;
    }
    return false;
  }
  private showLinkPopup(show: boolean) {
    const dialog = this.el.nativeElement.querySelector('.universal-editor-link');
    if(!dialog || !this.config.enableLink) return;

    if(show && this.currentLinkElement){
      const rect = this.currentLinkElement.getBoundingClientRect();
      const x = rect.left + window.scrollX;
      const y = rect.top + window.scrollY;
      dialog.style.display = 'flex';
      setTimeout(() => {
        const dialogWidth = dialog.offsetWidth;
        const rightWidth = window.innerWidth - x;

        dialog.style.top = `${y + rect.height + 8}px`;
        if (rightWidth > dialogWidth) {
          dialog.style.left = `${x}px`;
        } else {
          dialog.style.left = `${x - (dialogWidth - rightWidth)}px`;
        }
      }, 0);
    }
    else{
      dialog.style.display = 'none';
    }
  }
  showAddEditLink(show:boolean, mode: 'Add' | 'Edit'){
    const dialog = this.el.nativeElement.querySelector('.universal-editor-link-edit');
    if(!dialog || !this.config.enableLink) return;

    if(show){
      this.linkMode = mode;
      if(mode === 'Add'){
        this.linkData = undefined;
      }
      else{
        this.linkData = {
          link: this.currentLinkElement ? this.currentLinkElement.getAttribute('href') ?? '' : '',
          text: this.currentLinkElement ? this.currentLinkElement.textContent ?? '' : ''
        } 
      }

      this.restoreCaretPosition();
      this.showLinkPopup(false);
      const coords = this.getCaretCoordinates();
      const x = coords.x;
      const y = coords.y;
      dialog.style.display = 'block';
      setTimeout(() => {
      this.linkSubject.next();
      this.isAddEditLinkDialogOpen = true;
        const dropdownHeight = dialog.clientHeight;
        const dropdownWidth = dialog.offsetWidth;
        const rightWidth = window.innerWidth - x;
        //console.log(x, y, dropdownHeight, dropdownWidth, rightWidth);
  
        if(y > dropdownHeight){
          dialog.style.top = `${y - 10 - dropdownHeight}px`;
        }
        else{
          dialog.style.top = `${y + 30}px`;
        }  
        if(rightWidth > dropdownWidth){
          dialog.style.left = `${x}px`;
        }
        else{
          dialog.style.left = `${x - (dropdownWidth - rightWidth)}px`;
        }
      });
    }
    else{
      dialog.style.display = 'none';
      this.isAddEditLinkDialogOpen = false;
    }
  }
  openLink(){
    if(this.currentLinkElement){
      window.open(this.currentLinkElement.getAttribute('href') ?? '', '_blank');
    }
  }
  unLink(){
    if(this.currentLinkElement && this.currentLinkElement.textContent){
      const text = document.createTextNode(this.currentLinkElement.textContent);
      this.currentLinkElement.replaceWith(text);
      this.currentLinkElement = undefined;
      this.setCursorPositionAfter(text, false);
      this.showLinkPopup(false);
     this.emitChange();
    }
  }
  copyLink(){
    if(this.currentLinkElement){
      const link = this.currentLinkElement.getAttribute('href') ?? '';
      navigator.clipboard.writeText(link);
      this.copySelected = true;
      setTimeout(() => this.copySelected = false, 500);
    }
  }
  removeLink(){
    if(this.currentLinkElement){
      this.onRemoveLinkLeave();
      const space = document.createTextNode('\u200B');
      this.currentLinkElement.replaceWith(space);
      this.setCursorPositionAfter(space, false);
      this.currentLinkElement = undefined;
      this.showLinkPopup(false);
      this.emitChange();
    }
  }
  private addLink(link: string, text: string){
    this.restoreCaretPosition();
    const replacedText = `<a href="${link}" target="_blank" rel="noopener noreferrer">${text}</a>`; //target="_blank" rel="noopener noreferrer"
    if(this.currentTextStyleElement){
      const elem = this.createElementFromString(replacedText) as HTMLElement;
      this.addElement(elem, this.currentTextStyleElement);
      this.setCursorPositionAfter(elem, false);
    }
    else{
      const elem = this.createElementFromString(`<p>${replacedText}</p>`) as HTMLElement;
      this.addElement(elem, this.editor.nativeElement);
      this.setCursorPositionAfter(elem, false);
    }
    this.traverseTheDOM(true);
    this.emitChange();
  }
  onSubmitLink(link: Link){
    if(this.linkMode === 'Add'){
      this.addLink(link.link, link.text);
    }
    else if(this.currentLinkElement){
      this.currentLinkElement.setAttribute('href', link.link);
      this.currentLinkElement.textContent = link.text;
      this.setCursorPositionAfter(this.currentLinkElement, false);
      this.emitChange();
    }
    this.showAddEditLink(false, 'Add');
  }
  onRemoveLinkEnter(){
    if(this.currentLinkElement && !this.currentLinkElement.classList.contains('remove')){
      this.currentLinkElement.classList.add('remove');
      const button = this.el.nativeElement.querySelector('#remove-button-link');
      if(button){
        button.children[0].classList.add('remove-button');
      }
    }
  }
  onRemoveLinkLeave(){
    if(this.currentLinkElement && this.currentLinkElement.classList.contains('remove')){
      this.currentLinkElement.classList.remove('remove');
      const button = this.el.nativeElement.querySelector('#remove-button-link');
      if(button){
        button.children[0].classList.remove('remove-button');
      }
    }
  }
  triggerLink(){
    this.showAddEditLink(true, 'Add');
  }

   
  // MENTION PART
  private isMentionDropdownOpen = false;
  filteredUsers: any[] = [];
  private searchUserText = '';
  private enteredUser:any;
  get mentionDisabled(){
    if(this.currentImageElement || this.currentCodeElement || this.currentLinkElement){
      return true;
    }
    return false;
  }
  onMentionClick(){
    this.restoreCaretPosition();
    const event = new InputEvent('customInput',{
      inputType: 'insertText',
      data: '@',
      bubbles: true,
      cancelable: true,
    });
    this.onInput(event);
  }
  onMouseEnter(enteredUser:any){
    if(equal(enteredUser, this.enteredUser)) return;
    this.enteredUser = enteredUser;
    this.filteredUsers = this.filteredUsers.map(user =>{
      return{
        ...user,
        isMouseEntered : user.id === enteredUser.id,
      }
    });
  }
  onSelectUser(user:any){
    if(this.isMentionDropdownOpen){
      const tag = this.el.nativeElement.querySelector('.universal-tag');
      if(tag){
        const newElement = document.createElement('span');
        newElement.className = user.id === this.config.currentUserId ? 'universal-editor-tag universal-editor-tag-selected' : 'universal-editor-tag';
        newElement.setAttribute('user-id', user.id.toString());
        newElement.setAttribute('contenteditable', 'false');
        newElement.textContent = `@${user.firstName} ${user.lastName}`;

        tag.replaceWith(newElement);
        const space = document.createTextNode('\u00A0');
        const parentNode = newElement.parentNode;
        if(parentNode){
          parentNode.insertBefore(space, newElement.nextSibling);
        }
        this.setCursorPositionAfter(space, false);

        this.closeMentionDropdown();
       this.emitChange();
      }
    }
  }
  private onCancelSelectUser(remove: boolean){
    if(this.isMentionDropdownOpen){
      const tag = this.el.nativeElement.querySelector('.universal-tag');
      if(tag){
        const newElement = document.createTextNode(remove ? '' : tag.textContent);
        tag.replaceWith(newElement);
        this.setCursorPositionAfter(newElement, false);
      }
      this.closeMentionDropdown();
    }
  }
  private getCaretCoordinates() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return { x: 0, y: 0 };
  
    const range = selection.getRangeAt(0).cloneRange();
    const dummySpan = document.createElement('span');
    dummySpan.appendChild(document.createTextNode('\u200B')); // Zero-width space
    range.insertNode(dummySpan);
    range.collapse(true);
  
    const rect = dummySpan.getBoundingClientRect();
    const coordinates = { x: rect.left, y: rect.top };
    
    const parent = dummySpan.parentNode;
    if(parent){
      dummySpan.parentNode.removeChild(dummySpan);
    }
    return coordinates;
  }
  private openMentionDropdown(x: number, y: number) {
    const dropdown = this.el.nativeElement.querySelector('.universal-editor-mention');
    const backdrop = this.el.nativeElement.querySelector('.universal-editor-mention-backdrop');

    dropdown.style.display = 'block';
    backdrop.style.display = 'block';
    this.isMentionDropdownOpen = true;
    this.searchUserText = '';
    this.filterUsers();

    setTimeout(() => {
      const dropdownHeight = dropdown.clientHeight;
      const dropdownWidth = dropdown.offsetWidth;
      const rightWidth = window.innerWidth - x;
      //console.log(x, y, dropdownHeight, dropdownWidth, rightWidth);

      if(this.config.mentionPosition === 'auto'){
        if(y > dropdownHeight){
          dropdown.style.top = `${y - 10 - dropdownHeight}px`;
        }
        else{
          dropdown.style.top = `${y + 30}px`;
        }    
      }else if(this.config.mentionPosition === 'below'){
        dropdown.style.top = `${y + 30}px`;
      }else{
        dropdown.style.top = `${y - 10 - dropdownHeight}px`;
      }
      if(rightWidth > dropdownWidth){
        dropdown.style.left = `${x}px`;
      }
      else{
        dropdown.style.left = `${x - (dropdownWidth - rightWidth)}px`;
      }
    });
    
    
  }
  private closeMentionDropdown() {
    const dropdown = this.el.nativeElement.querySelector('.universal-editor-mention');
    const backdrop = this.el.nativeElement.querySelector('.universal-editor-mention-backdrop');
    dropdown.style.display = 'none';
    backdrop.style.display = 'none';
    this.isMentionDropdownOpen = false;
  }
  private filterUsers() {
    if (!this.searchUserText) {
      this.filteredUsers = this.mentionUsers.map((user, index) =>{
        return {
          ...user,
          isMouseEntered : index === 0,
          index: index,
        }
      });    
    }
    else{
      const searchLowerCase = this.searchUserText.trim().toLowerCase();

      this.filteredUsers = this.mentionUsers.filter(user =>{
        const fullName = user.firstName + ' ' + user.lastName;

        return user.firstName?.toLowerCase().includes(searchLowerCase) ||
        user.lastName?.toLowerCase().includes(searchLowerCase) ||
        fullName.toLowerCase().includes(searchLowerCase) ||
        user.email?.toLowerCase().includes(searchLowerCase)
      }).map((user, index) =>{
        return {
          ...user,
          isMouseEntered : index === 0,
          index: index,
        }
      });
      
    }
    if(this.filteredUsers.length > 0){
      this.enteredUser = this.filteredUsers[0];
    }
    else{
      this.enteredUser = null;
    }

    
    if(this.isMentionDropdownOpen){
      setTimeout(() => {
        const coords = this.getCaretCoordinates();
        if(coords.x === 0 || coords.y === 0){
          return;
        }
        const dropdown = this.el.nativeElement.querySelector('.universal-editor-mention');
        const dropdownHeight = dropdown.clientHeight;
        const dropdownWidth = dropdown.offsetWidth;
        const rightWidth = window.innerWidth - coords.x;
        //console.log(coords.x, coords.y, dropdownHeight, dropdownWidth, rightWidth)
        if(this.config.mentionPosition === 'auto'){
          if(coords.y > dropdownHeight){
            dropdown.style.top = `${coords.y - 10 - dropdownHeight}px`;
          }
          else{
            dropdown.style.top = `${coords.y + 30}px`;
          }
          
        }else if(this.config.mentionPosition === 'below'){
          dropdown.style.top = `${coords.y + 30}px`;
        }else{
          dropdown.style.top = `${coords.y - 10 - dropdownHeight}px`;
        }
        if(rightWidth > dropdownWidth){
          dropdown.style.left = `${coords.x}px`;
        }
        else{
          dropdown.style.left = `${coords.x - (dropdownWidth - rightWidth)}px`;
        }
      }, 5);
    }
    
    


  }
  private setCurrentUserClass(toAdd:boolean){
    if(this.config.currentUserId.toString()){
      const currentUsers = document.querySelectorAll(`[user-id="${this.config.currentUserId}"]`);
      currentUsers.forEach(element => {
        if(toAdd){
          element.classList.add('universal-editor-tag-selected');
        }
        else{
          element.classList.remove('universal-editor-tag-selected');
        }
      });
    }
  }

}


