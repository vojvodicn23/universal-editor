import { Component, Input } from '@angular/core';

@Component({
  selector: 'mention-user',
  templateUrl: './mention-user.component.html',
  styleUrls: ['./mention-user.component.css']
})
export class MentionUserComponent {

  @Input() user:any;

  get initials(): string {
    const firstNameInitial = this.user ? this.user.firstName.charAt(0).toUpperCase() : '';
    const lastNameInitial = this.user ? this.user.lastName.charAt(0).toUpperCase() : '';
    return `${firstNameInitial}${lastNameInitial}`;
  }


}  
