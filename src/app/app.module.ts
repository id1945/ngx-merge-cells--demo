import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { NgxMergeCellsService } from './ngx-merge-cells.service';

@NgModule({
  imports:      [ BrowserModule, FormsModule ],
  declarations: [ AppComponent ],
  providers: [NgxMergeCellsService],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
