import { ValidatorFn, AbstractControl } from "@angular/forms";
import { Const } from "./constants";

export function copy(obj: any) {
    return JSON.parse(JSON.stringify(obj));
}

export function equal(obj1: any, obj2: any) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
}

export function linkValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      return Const.urlRegex.test(control.value) ? null : { invalidUrl: true };
    };
}

export function downloadFile(file: File) {
    const fileURL = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = fileURL;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(fileURL);
}

export function generateUniqueId(): string {
  const timestamp = Date.now().toString();
  const randomNum = Math.floor(Math.random() * 1000).toString();
  return btoa(timestamp + randomNum);
}

export function getWatermarkData() {
  return{
    content: '\"https://github.com/vojvodicn23\"',
    position: 'absolute',
    bottom: '10px',
    right: '10px',
    color: 'rgb(0, 0, 0)', 
    fontSize: '12px', 
    height: '15px', 
    width: '151px', 
  }
}
