import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { Link } from './Link';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { linkValidator } from '../../shared/custom-methods';

@Component({
  selector: 'edit-link',
  templateUrl: './edit-link.component.html',
  styleUrls: ['./edit-link.component.css']
})
export class EditLinkComponent implements OnInit {

  @Input() data: Link | undefined;
  @Input() link$!: Observable<void>;
  @Output() onSubmitLink = new EventEmitter<Link>();
  @Output() onCancelLink = new EventEmitter<boolean>();

  fb = inject(FormBuilder);
  linkForm: FormGroup = new FormGroup({});

  ngOnInit(): void {
    this.linkForm = this.fb.group({
      link: [this.data ? this.data.link : '', [Validators.required, linkValidator()]],
      text: [this.data ? this.data.text : '', []]
    });

    this.link$.subscribe(() => {
      this.linkForm = this.fb.group({
        link: [this.data ? this.data.link : '', [Validators.required, linkValidator()]],
        text: [this.data ? this.data.text : '', []]
      });
    });
  }

  submitForm(){
    const linkData: Link = {
      link: this.linkForm.controls['link'].value,
      text: this.linkForm.controls['text'].value ? this.linkForm.controls['text'].value : this.linkForm.controls['link'].value,
    }
    this.onSubmitLink.emit(linkData);
  }

  cancelForm(){
    this.onCancelLink.emit(true);
  }

}
