import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Link } from '../edit-link/Link';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'alt-text-img',
  templateUrl: './alt-text-img.component.html',
  styleUrls: ['./alt-text-img.component.css']
})
export class AltTextImgComponent implements OnInit  {

  @Input() data = '';
  @Input() altText$!: Observable<void>;
  @Output() onSubmitAltText = new EventEmitter<string>();
  @Output() onCancelAltText = new EventEmitter<boolean>();

  fb = inject(FormBuilder);
  altTextForm: FormGroup = new FormGroup({});

  ngOnInit(): void {
    this.altTextForm = this.fb.group({
      altText: [this.data, []],
    });

    this.altText$.subscribe(() => {
      this.altTextForm = this.fb.group({
        altText: [this.data, []],
      });
    });
  }

  submitForm(){
    this.onSubmitAltText.emit(this.altTextForm.controls['altText'].value);
  }

  cancelForm(){
    this.onCancelAltText.emit(true);
  }

}
