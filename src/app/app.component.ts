import {
  AfterContentInit,
  Component,
  VERSION,
  ViewEncapsulation,
} from '@angular/core';

import { NgxMergeCellsService, CONFIG_TABLE } from './ngx-merge-cells.service';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent implements AfterContentInit {
  name = 'Angular ' + VERSION.major;

  constructor(private ngxMergeCellsService: NgxMergeCellsService) {}

  ngAfterContentInit() {
    // add onload event listener
    if (window.addEventListener) {
      this.init();
      // window.addEventListener('load', this.init(), false);
    } else if (window?.['attachEvent']) {
      window?.['attachEvent']('onload', this.init());
    }
  }

  // initialization
  init() {
    // define background color for marked cell
    CONFIG_TABLE.showIndex = false;
    // activate onmousedown event listener on cells within table with id="mainTable"
    this.ngxMergeCellsService.onMouseDown('mainTable', true);
    // show cellIndex (it is nice for debugging)
    // this.ngxMergeCellsService.cellIndex(true);
  }

  // function merges table cells
  merge(id: string) {
    // first merge cells horizontally and leave cells marked
    this.ngxMergeCellsService.merge('h', false, id);
    // and then merge cells vertically and clear cells (second parameter is true by default)
    this.ngxMergeCellsService.merge('v', true, id);
  }

  // function splits table cells if colspan/rowspan is greater then 1
  // mode is 'h' or 'v' (cells should be marked before)
  split(mode: string, id: string) {
    this.ngxMergeCellsService.split(mode, id);
  }

  // insert/delete table row
  row(type: string, id: string) {
    this.ngxMergeCellsService.row(id, type, -1);
  }

  // insert/delete table column
  column(type: string, id: string) {
    this.ngxMergeCellsService.column(id, type, -1);
  }

  updateStyles() {
    this.ngxMergeCellsService.updateStyles({
      color: 'red',
      fontSize: '17pt'
    });
  }
}
