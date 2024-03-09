import { SafeHtml } from "@angular/platform-browser";

export interface EditorApi{
    clearFormatting: () => void;
    triggerBold: () => void;
    triggerItalic: () => void;
    triggerUnderline: () => void;
    triggerStrikethrough: () => void;
    triggerSubscript: () => void;
    triggerSuperscript: () => void;
    triggerMention: () => void;
    setTextStyle: (style: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') => void;
    setTextColor: (color: 'Black' | 'Gainsboro' | 'Red' | 'Green' | 'Blue' |
    'Yellow' | 'Cyan' | 'Magenta' | 'Light Gray' | 'Gray' | 'Maroon' | 'Olive' |
    'Purple' | 'Teal' | 'Navy' | 'Coral' | 'Turquoise' | 'Salmon' |
    'Lime' | 'Gold' | 'Orchid') => void;
    setInnerHTML: (html: string | SafeHtml) => void; 
    triggerBulletList: () => void; 
    triggerNumberedList: () => void; 
    setDarkMode: (enable:boolean) => void; 
    triggerLinkPopup: () => void; 
    triggerUploadFilePopup: () => void; 
    setUploadedFiles: (files: {file:File; key:string}[]) => void; 
    setImageUrl: (key:string, url:string) => void; 
    triggerCode: (code:string) => void; 
    triggerTable: () => void; 
    triggerDate: () => void; 
}