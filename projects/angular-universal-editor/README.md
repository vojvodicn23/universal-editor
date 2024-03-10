# Universal Editor Angular

## Introduction

Universal Editor is a versatile web component designed to integrate seamlessly with Angular. It provides a rich text editing experience, customizable to fit the needs of various web applications.
Supported Angular versions: 16, 17.

[Click here to try it on StackBlitz](https://stackblitz.com/edit/stackblitz-starters-dt2mcb)


![alt text](https://github.com/vojvodicn23/universal-editor/blob/master/example.png?raw=true)

## Features

- Rich text editing capabilities
- Image and file uploads
- Mention users
- Code snippets
- Date widget
- Bullet and Numbered lists
- Tables

## Installation

To install the Universal Editor, run the following command in your project directory:

```bash
npm install angular-universal-editor
```

## Usage

Import library module in you AppModule and simply use it inside your html template and you should be able to see the component and try it right away.
```typescript
import { AngularUniversalEditorModule } from 'angular-universal-editor';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    AngularUniversalEditorModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```
```html
<angular-universal-editor></angular-universal-editor>
```


## Editor Configuration

The library is made for easy and fast integration into project. The complete configuration and available events:
```html
<angular-universal-editor
    [config]="config"
    [mentionUsers]="users"
    (onChangeMentionUsers)="onChangeMentionUsers($event)"
    (onFilesChanged)="onFilesChanged($event)"
    (onEditorReady)="onEditorReady($event)"
    (onChange)="onChange($event)"
></angular-universal-editor>
```

The EditorConfig class allows you to customize the Universal Editor to fit your specific requirements. It provides a wide range of options that you can set to enable or disable features within the editor, adjust the UI, and control the behavior of the editor. By default all features are enabled.

- placeholderText: The text displayed when the editor is empty.
- enableClearFormatting: Enables users to clear formatting from their text.
- enableBold: Enables bold text formatting.
- enableItalic: Enables italic text formatting.
- enableUnderline: Enables underline text formatting.
- enableStrikethrough: Enables strikethrough text formatting.
- enableSubscript: Enables subscript text formatting.
- enableSuperscript: Enables superscript text formatting.
- enableMention: Enables mentioning users or other items. Requires users array as input to identify the user.
- currentUserId: The ID of the current user, used in conjunction with mentions.
- enableTextStyles: Allows changing text styles (e.g., headings).
- enableTextColor: Enables text color changes.
- showToolbar: Determines if the toolbar should be shown.
- editMode: Enables the edit mode of the editor.
- mentionPosition: Controls the position of the mention list ('auto', 'above', or 'below').
- initialInnerHTML: Sets the initial HTML content of the editor. Can be a string or SafeHtml for Angular applications.
- defaultTextColor: Sets the default text color. Accepts specific color names.
- enableBulletList: Enables bullet list formatting.
- enableNumberedList: Enables numbered list formatting.
- darkMode: Enables dark mode for the editor.
- enableLink: Enables hyperlink insertion.
- enableFile: Allows file attachments.
- initialFiles: Sets initial files attached to the editor.
- enableCode: Enables code snippets.
- enableTable: Enables table insertion and editing.
- enableDate: Enables date insertion.

To configure the Universal Editor, create an instance of EditorConfig with your desired settings:

```typescript
import { EditorConfig } from 'angular-universal-editor';

const config = new EditorConfig({
  placeholderText: 'Start typing...',
  enableItalic: false, // Disables italic formatting adn remove it from toolbar
  darkMode: true, // Enables dark mode
  // Add other configurations as needed
});
```

## Implementing Mentions

The Universal Editor Library supports mentioning users within the text editor. This feature is configurable through the enableMention option in EditorConfig. To use mentions, you need to provide a list of users that can be mentioned. Users should be defined according to the MentionUser interface with following properties:

- id: A unique identifier for the user (required).
- firstName: The user's first name (required).
- lastName: The user's last name (required).
- email: The user's email address (optional).
- imageUrl: A URL to the user's profile picture or avatar (optional).

To enable mentions, you must supply an array of users conforming to the MentionUser interface. This can be done programmatically by fetching users from a server or by defining a static list. Here is an example of how to define a list of mentionable users:

```typescript
import { MentionUser } from 'angular-universal-editor';

const users: MentionUser[] = [
  { id: '1', firstName: 'Jane', lastName: 'Doe', email: 'jane.doe@example.com', imageUrl: 'https://example.com/path/to/jane.jpg' },
  { id: '2', firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com' },
  // Add more users as needed
];
```

## onChangeMentionUsers Event

The onChangeMentionUsers event is specifically designed to capture changes in the array of mentioned users within the editor. It triggers every time there's a change in the mentioned users, such as adding or removing a mention.

```typescript
onChangeMentionUsers(mentionedUsers: MentionUser[]) {
  console.log('Mentioned users changed:', mentionedUsers);
  // Process the changes in mentioned users
}
```

## onChange Event

The Universal Editor provides real-time feedback through the onChange event, which fires every time the inner content of the editor changes. This event is crucial for applications that need to capture user input as it happens, for features like auto-saving, validation, or dynamic UI updates based on the content.

```typescript
onChange(innerHtml: string) {
  console.log('Editor content updated:', innerHtml);
  // Implement any processing logic here, such as updating a model or making an API call
}
```

## onEditorReady Event

The onEditorReady event is emitted once the Universal Editor is fully initialized and ready for interaction. This event provides an EditorApi object that allows you to programmatically control various aspects of the editor from outside the editor itself. The EditorApi object provided by the onEditorReady event includes the following methods for controlling the editor:

- clearFormatting(): Clears all formatting from the selected text.
- triggerBold(): Applies bold formatting to the selected text.
- triggerItalic(): Applies italic formatting to the selected text.
- triggerUnderline(): Applies underline formatting to the selected text.
- triggerStrikethrough(): Applies strikethrough formatting to the selected text.
- triggerSubscript(): Applies subscript formatting.
- triggerSuperscript(): Applies superscript formatting.
- triggerMention(): Opens the mention selection popup.
- setTextStyle(style): Sets the text style (e.g., paragraph, headings).
- setTextColor(color): Sets the text color.
- setInnerHTML(html): Sets the editor's content.
- triggerBulletList(): Creates a bullet list.
- triggerNumberedList(): Creates a numbered list.
- setDarkMode(enable): Toggles dark mode.
- triggerLinkPopup(): Opens the link insertion popup.
- triggerUploadFilePopup(): Opens the file upload popup.
- setUploadedFiles(files): Sets the uploaded files.
- setImageUrl(key, url): Sets the URL for an image by key. !By default image is saved in base64 format which should be replaced with image url and this method should do this
- triggerCode(code): Inserts code.
- triggerTable(): Inserts a table.
- triggerDate(): Inserts the date widget.

```typescript
export class MyComponent {
  private editorApi: EditorApi;

  onEditorReady(api: EditorApi) {
    this.editorApi = api;
    // Now you can use this.editorApi to control the editor
  }

  // Example usage of the API
  triggerBoldText() {
    this.editorApi?.triggerBold();
  }
}
```

## onFilesChanged Event

The onFilesChanged event is emitted whenever a file is uploaded through the editor, providing you with an array of objects containing the File and a unique key for each uploaded file.

```typescript
onFilesChanged(files: {file: File; key: string}[]) {
  console.log('Files uploaded:', files);
  // Process or store the uploaded files as needed
}
```

### Important note on Images

When an image is uploaded, it's initially represented as a base64-encoded string within the editor. For optimal performance and to adhere to best practices, it's recommended to store the image on a server or cloud storage and then reference it by URL.

```typescript
onFilesChanged(files: {file: File; key: string}[]) {
  console.log('Files uploaded:', files);
  files.forEach(fileObj => {
    // Store the file and obtain a URL
    this.uploadFile(fileObj.file).then(url => {
      // Use the editor API to replace the base64 string with the real URL
      this.editorApi.setImageUrl(fileObj.key, url);
    });
  });
}
```