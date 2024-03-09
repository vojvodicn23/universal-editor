import { NgModule } from '@angular/core';
import { AngularUniversalEditorComponent } from './angular-universal-editor.component';
import { AltTextImgComponent } from './components/alt-text-img/alt-text-img.component';
import { ButtonComponent } from './components/button/button.component';
import { DatepickerComponent } from './components/datepicker/datepicker.component';
import { EditLinkComponent } from './components/edit-link/edit-link.component';
import { FileWidgetComponent } from './components/file-widget/file-widget.component';
import { IconComponent } from './components/icon/icon.component';
import { MentionUserComponent } from './components/mention-user/mention-user.component';
import { MoreFormatComponent } from './components/more-format/more-format.component';
import { MoreOptionsComponent } from './components/more-options/more-options.component';
import { TextColorTileComponent } from './components/text-color/text-color-tile/text-color-tile.component';
import { TextColorComponent } from './components/text-color/text-color.component';
import { TextStylesComponent } from './components/text-styles/text-styles.component';
import { VerticalLineComponent } from './components/vertical-line/vertical-line.component';
import { TooltipDirective } from './shared/tooltip.directive';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';


@NgModule({
  declarations: [
    AngularUniversalEditorComponent,
    MentionUserComponent,
    TextStylesComponent,
    ButtonComponent,
    TooltipDirective,
    VerticalLineComponent,
    TextColorComponent,
    TextColorTileComponent,
    EditLinkComponent,
    FileWidgetComponent,
    AltTextImgComponent,
    IconComponent,
    MoreFormatComponent,
    MoreOptionsComponent,
    DatepickerComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    ReactiveFormsModule
  ],
  exports: [
    AngularUniversalEditorComponent
  ]
})
export class AngularUniversalEditorModule { }
