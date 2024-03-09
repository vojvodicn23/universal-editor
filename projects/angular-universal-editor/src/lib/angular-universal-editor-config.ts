import { SafeHtml } from "@angular/platform-browser";

export class EditorConfig {
    placeholderText: string;
    enableClearFormatting: boolean;
    enableBold: boolean;
    enableItalic: boolean;
    enableUnderline: boolean;
    enableStrikethrough: boolean;
    enableSubscript: boolean;
    enableSuperscript: boolean;
    enableMention: boolean;
    currentUserId: number | string;
    enableTextStyles: boolean;
    enableTextColor: boolean;
    showToolbar: boolean;
    editMode: boolean;
    mentionPosition: 'auto' | 'above' | 'below';
    initialInnerHTML: string | SafeHtml;
    defaultTextColor: 'Black' | 'Gainsboro' | 'Red' | 'Green' | 'Blue' |
    'Yellow' | 'Cyan' | 'Magenta' | 'Light Gray' | 'Gray' | 'Maroon' | 'Olive' |
    'Purple' | 'Teal' | 'Navy' | 'Coral' | 'Turquoise' | 'Salmon' |
    'Lime' | 'Gold' | 'Orchid';
    enableBulletList: boolean;
    enableNumberedList: boolean;
    darkMode: boolean;
    enableLink: boolean;
    enableFile: boolean;
    initialFiles: {file:File; key:string}[];
    enableCode: boolean;
    enableTable: boolean;
    enableDate: boolean;


    constructor(config: Partial<EditorConfig> = {}) {
        this.placeholderText = config.placeholderText ?? '';
        this.enableClearFormatting = config.enableClearFormatting ?? true;
        this.enableBold = config.enableBold ?? true;
        this.enableItalic = config.enableItalic ?? true;
        this.enableUnderline = config.enableUnderline ?? true;
        this.enableStrikethrough = config.enableStrikethrough ?? true;
        this.enableSubscript = config.enableSubscript ?? true;
        this.enableSuperscript = config.enableSuperscript ?? true;
        this.enableMention = config.enableMention ?? true;
        this.currentUserId = config.currentUserId ?? '';
        this.enableTextStyles = config.enableTextStyles ?? true;
        this.enableTextColor = config.enableTextColor ?? true;
        this.showToolbar = config.showToolbar ?? true;
        this.editMode = config.editMode ?? true;
        this.mentionPosition = config.mentionPosition ?? 'auto';
        this.initialInnerHTML = config.initialInnerHTML ?? '';
        this.defaultTextColor = config.defaultTextColor ?? (config.darkMode ? 'Light Gray' : 'Black');
        this.enableBulletList = config.enableBulletList ?? true;
        this.enableNumberedList = config.enableNumberedList ?? true;
        this.darkMode = config.darkMode ?? false;
        this.enableLink = config.enableLink ?? true;
        this.enableFile = config.enableFile ?? true;
        this.initialFiles = config.initialFiles ?? [];
        this.enableCode = config.enableCode ?? true;
        this.enableTable = config.enableTable ?? true;
        this.enableDate = config.enableDate ?? true;
    }
}