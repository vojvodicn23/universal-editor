import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'datepicker',
  templateUrl: './datepicker.component.html',
  styleUrls: ['./datepicker.component.css']
})
export class DatepickerComponent implements OnInit, OnDestroy{



  @Input() darkMode = true;
  @Input() currentDate$!:Observable<Date>;
  @Output() onSelectDate = new EventEmitter<Date>();

  todayDate = new Date();
  currentDate!: Date;
  shownYear!: number;
  shownMonth!: number;
  shownMonthName!: string;

  days:{day:number, month:number, year:number}[] = [];

  private subscriptions = new Subscription();
  ngOnInit(): void {
    this.subscriptions.add(this.currentDate$.subscribe(date => {
      this.currentDate = date;
      this.shownYear = this.currentDate.getFullYear();
      this.shownMonth = this.currentDate.getMonth();
      this.shownMonthName = this.currentDate.toLocaleString('default', { month: 'long' });
      this.generateCalendarDays(this.shownYear, this.shownMonth);
    }));
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  goToPreviousMonth(): void {
    this.shownYear = this.shownMonth === 0 ? this.shownYear - 1 : this.shownYear;
    this.shownMonth = this.shownMonth === 0 ? 11 : this.shownMonth - 1;
    this.shownMonthName = new Date(this.shownYear, this.shownMonth, 1).toLocaleString('default', { month: 'long' });
    this.generateCalendarDays(this.shownYear, this.shownMonth);
  }
  goToPreviousYear(): void {
    this.shownYear = this.shownYear - 1;
    this.generateCalendarDays(this.shownYear, this.shownMonth);
  }

  goToNextMonth(): void {
    this.shownYear = this.shownMonth === 11 ? this.shownYear + 1 : this.shownYear;
    this.shownMonth = this.shownMonth === 11 ? 0 : this.shownMonth + 1;
    this.shownMonthName = new Date(this.shownYear, this.shownMonth, 1).toLocaleString('default', { month: 'long' });
    this.generateCalendarDays(this.shownYear, this.shownMonth);
  }
  goToNextYear(): void {
    this.shownYear = this.shownYear + 1;
    this.generateCalendarDays(this.shownYear, this.shownMonth);
  }

  pickDate(day:{day:number, month:number, year:number}){
    this.currentDate = new Date(day.year, day.month, day.day);
    this.onSelectDate.emit(this.currentDate);
  }

  generateCalendarDays(year: number, month: number){
    this.days = [];
    const firstDayOfMonth = new Date(year, month, 1); //1 feb
    const lastDayOfPrevMonth = new Date(year, month, 0); // 31 jan
    const lastDayOfMonthh = new Date(year, month + 1, 0); // 29 feb

    const firstDayOfWeek: number = firstDayOfMonth.getDay(); // 4 Thu
    const daysInPreviousMonth: number = lastDayOfPrevMonth.getDate(); //31
    const daysInMonth: number = lastDayOfMonthh.getDate(); //29

    for (let index = 0; index < firstDayOfWeek; index++) {
      const day = {
        day: daysInPreviousMonth - index,
        month: month === 0 ? 11 : month - 1,
        year: month === 0 ? year - 1 : year
      }
      this.days.unshift(day);
    }
    for (let index = 0; index < daysInMonth; index++) {
      const day = {
        day: index + 1,
        month: month,
        year: year
      }
      this.days.push(day);
    }
    const daysLeft = 42 - this.days.length;
    for (let index = 0; index < daysLeft; index++) {
      const day = {
        day: index + 1,
        month: month === 11 ? 0 : month + 1,
        year: month === 11 ? year + 1 : year
      }
      this.days.push(day);
    }
  }
}