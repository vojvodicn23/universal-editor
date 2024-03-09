import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { MentionUser, EditorApi, EditorConfig } from 'angular-universal-editor';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  
  darkMode= true;
  file = new File([new Blob(['Hello, world!'], { type: 'text/plain' })], 'example.txt', { type: 'text/plain', lastModified: Date.now() });
  users: MentionUser[] = [
    {
      id: '1-xxxaxsax',
      firstName: 'Nikola',
      lastName: 'Vojvodic',
      email: 'nikola.vojvodic@email.com',
    },
    {
      id: '2-21321321',
      firstName: 'Miljan',
      lastName: 'Jovic',
      email: 'miljan.jovic@email.com',
    },
    {
      id: '3das dasdsa',
      firstName: 'Pera',
      lastName: 'Peric',
      email: 'pera.peric@email.com',
    },
    {
      id: '1-ewqe',
      firstName: 'Nikola',
      lastName: 'Vojvodic',
      email: 'nikola.vojvodic@email.com',
    },
    {
      id: '2-qwrgfdsg',
      firstName: 'Miljan',
      lastName: 'Jovic',
      email: 'miljan.jovic@email.com',
    },
    {
      id: '3dasgergredasdsa',
      firstName: 'Pera',
      lastName: 'Peric',
      email: 'pera.peric@email.com',
    },
    {
      id: '1-xrtertxxaxtetersax',
      firstName: 'Nikola',
      lastName: 'Vojvodic',
      email: 'nikola.vojvodic@email.com',
    },
    {
      id: '2-2132retert1321',
      firstName: 'Miljan',
      lastName: 'Jovic',
      email: 'miljan.jovicc@email.com',
    },
    {
      id: '3das dfsdfsdfdsfasdsa',
      firstName: 'Pera',
      lastName: 'Peric',
      email: 'pera.peric@email.com',
    },
  ];
  innerHtml = `<p>My name is&nbsp;<strong>​Nikola&nbsp;<span class="universal-editor-text-color" custom-text-color-name="Maroon" custom-text-color-code="#800000" style="color: rgb(128, 0, 0);">​<em>​Vojvodic.</em>​</span></strong>​ You can trigger my by inserting a tag: <span class="universal-editor-tag universal-editor-tag-selected" user-id="1-xxxaxsax" contenteditable="false">@Nikola Vojvodic</span>&nbsp;I am working on a Angular rich text editor to:</p><ul class="universal-editor-bullet-list" bullet-list-indent-level="1"><li><p>​make user experience better</p></li><li><p>easy add useful features to app</p></li><li><p>increase the overall <span class="universal-editor-text-color" custom-text-color-name="Gold" custom-text-color-code="#FFD700" style="color: rgb(255, 215, 0);">productivity</span></p></li></ul><p>​I have plenty of features here:</p><ol class="universal-editor-numbered-list" numbered-list-indent-level="1"><li><p>​ option to tag someone <span class="universal-editor-tag" user-id="3dasgergredasdsa" contenteditable="false">@Pera Peric</span>&nbsp;</p></li><li><p>​ option to add or edit link:&nbsp;<a href="http://localhost:4200/" target="_blank" rel="noopener noreferrer">http://localhost:4200/</a></p></li><li><p>​Also you can add date widget to improve visual date effect:&nbsp;<span class="universal-editor-date-widget" timestamp="Sat Feb 24 2024 00:00:00 GMT+0100 (Central European Standard Time)" contenteditable="false">Feb 24, 2024</span>.</p></li><li><p>​You can add image and change its size and ALT text</p></li></ol><p>​<span style="background-color: var(--background-color, white); color: var(--text-color, black);">Also, you can add code snippet by just paste the code in the editor or clicking on a icon at the header:</span></p><div class="code-wrapper code-wrapper-collapsed" spellcheck="false"><div contenteditable="false" class="code-counter"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span><span>11</span><span>12</span><span>13</span><span>14</span><span>15</span><span>16</span></div><code class="code-collapsed" contenteditable="false">.editor{
    padding-left: 10px;
    padding-right: 10px;
    padding-top: 200px;
    display: flex;
    gap: 10px;
    height: 400px;
    max-height: 400px;
    }


    .button{
        padding-top: 100px;
        padding-left: 50%;
        padding-bottom: 40px;
    }</code></div><p>​Finally, you can add table in inside insert all those things and modify its properties:</p><p><strong></strong></p><div class="table-wrapper"><table><tbody><tr><th class=""><p>​H1</p></th><th class=""><p>​H2</p></th><th class=""><p>​H3</p></th></tr><tr><td class=""><p>​first</p></td><td class=""><p>​second</p></td><td class=""><p>​third</p></td></tr><tr><td class=""><p>​</p></td><td class=""><p>​</p></td><td class=""><p>​</p></td></tr></tbody></table></div>`
  editorApi!:EditorApi;
  editorApi1!:EditorApi;
  config = new EditorConfig({
    enableBold: true,
    enableItalic: true,
    enableLink: true,
    mentionPosition: 'auto',
    //editMode: false,
    darkMode: this.darkMode,
    currentUserId: '1-xxxaxsax',
    //initialFiles: [this.file],
    //initialInnerHTML: this.innerHtml,
    placeholderText: 'Type @ to mention and notify someone',
  });
  config1 = new EditorConfig({
    editMode: false,
    darkMode: this.darkMode,
    currentUserId: '1-xxxaxsax',
  })
  enableEditor1 = false;

  private accessKey = 'UXnAMwNyxHDH17xlcexNARjC8qO0nogxa2Neez4SXow';
  http = inject(HttpClient);
  ngOnInit() {
    document.body.style.backgroundColor = this.darkMode ? '#3e3f40' : 'white';
    /* from(this.users).pipe(
      concatMap(user => this.getRandomPhoto().pipe(
        map(photo => ({
          ...user,
          imageUrl: photo.urls.small
        }))
      )),
      toArray()).subscribe(updatedUsers => {
      this.users = updatedUsers;
      //console.log(this.users);
    }); */
  }

  getRandomPhoto(): Observable<any> {
    const url = `https://api.unsplash.com/photos/random?client_id=${this.accessKey}`;
    return this.http.get(url);
  }

  onChangeUsers(event:any){
    //console.log(event)
  }
  onChangeText(event:any){
    if(!this.editorApi1) return;
    this.editorApi1.setInnerHTML(event);
  }
  onFilesChanged(event:any){
    if(!this.editorApi1) return;
    this.editorApi1.setUploadedFiles(event);
  }



  onEditorReady(event: EditorApi){
    //console.log(event)
    this.editorApi = event;
    setTimeout(() => {
      //this.editorApi.triggerMention();
      //this.editorApi.setDarkMode(true);
      //this.darkMode = true;
      //this.editorApi.triggerLinkPopup()
      //this.editorApi.setUploadedFiles([this.file]);
      /* this.getRandomPhoto().subscribe(res => {
      this.editorApi.setImageUrl('nikola', res.urls.small);
      }) */
    }, 10000);
    //this.editorApi.setInnerHTML(this.innerHtml);
  } 
  onEditorReady1(event: any){
    this.editorApi1 = event;
  } 

  changeTheme(){
    if(this.editorApi){
      this.darkMode = !this.darkMode;
      this.editorApi.setDarkMode(this.darkMode);
      document.body.style.backgroundColor = this.darkMode ? '#4e5052' : 'white';
    }
    if(this.editorApi1){
      this.editorApi1.setDarkMode(this.darkMode);
    }
  }



}
