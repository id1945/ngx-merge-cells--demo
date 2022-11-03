import { Injectable } from '@angular/core';

export const CONFIG_TABLE = {
  tdEvent: false,
  tables: [],
  markNonEmpty: true,
  color: {
    cell: '#9BB3DA',
    row: false,
    column: false,
  },
  showIndex: false,
  selected: [],
};

const getParentCell = (node) => {
  if (!node) {
    return null;
  }
  if (node.nodeName === 'TD' || node.nodeName === 'TH') {
    return node;
  }
  return getParentCell(node.parentNode);
};

const mark = (flag, el, row = 0, col = 0) => {
  // cell list with new coordinates
  let cl;
  // first parameter "flag" should be boolean (if not, then return from method
  if (typeof flag !== 'boolean') {
    return;
  }
  // test type of the second parameter (it can be string or object)
  if (typeof el === 'string') {
    // set reference to table or table cell (overwrite input el parameter)
    el = document.getElementById(el);
  }
  // if el is not string and is not an object then return from the method
  else if (typeof el !== 'object') {
    return;
  }
  // at this point, el should be an object - so test if it's TD or TABLE
  if (el.nodeName === 'TABLE') {
    // prepare cell list
    cl = cellList(el);
    // set reference to the cell (overwrite input el parameter)
    el = cl[row + '-' + col];
  }
  // if el doesn't exist (el is not set in previous step) or el is not table cell or table header cell either then return from method
  if (!el || (el.nodeName !== 'TD' && el.nodeName !== 'TH')) {
    return;
  }
  // if custom property "ngx_merge_cells" doesn't exist then create custom property
  el.ngx_merge_cells = el.ngx_merge_cells || {};
  // if color property is string, then TD background color will be changed
  if (typeof CONFIG_TABLE.color.cell === 'string') {
    // mark table cell
    if (flag === true) {
      // remember old color
      el.ngx_merge_cells.background_old = el.style.backgroundColor;
      // set background color
      el.style.backgroundColor = CONFIG_TABLE.color.cell;
      CONFIG_TABLE.selected.push(el);
    }
    // umark table cell
    else {
      // return original background color and reset selected flag
      el.style.backgroundColor = el.ngx_merge_cells.background_old;
      CONFIG_TABLE.selected = CONFIG_TABLE.selected.filter(
        (f) => f !== el
      );
    }
  }
  // set flag (true/false) to the cell "selected" property
  el.ngx_merge_cells.selected = flag;
};

const cellList = (table) => {
  let matrix = [],
    matrixrow,
    lookup = {},
    c, // current cell
    ri, // row index
    rowspan,
    colspan,
    firstAvailCol,
    tr, // TR collection
    k; // loop variables
  // set HTML collection of table rows
  tr = table.rows;
  // open loop for each TR element
  for (let i = 0; i < tr.length; i++) {
    // open loop for each cell within current row
    for (let j = 0; j < tr[i].cells.length; j++) {
      // define current cell
      c = tr[i].cells[j];
      // set row index
      ri = c.parentNode.rowIndex;
      // define cell rowspan and colspan values
      rowspan = c.rowSpan || 1;
      colspan = c.colSpan || 1;
      // if matrix for row index is not defined then initialize array
      matrix[ri] = matrix[ri] || [];
      // find first available column in the first row
      for (k = 0; k < matrix[ri].length + 1; k++) {
        if (typeof matrix[ri][k] === 'undefined') {
          firstAvailCol = k;
          break;
        }
      }
      // set cell coordinates and reference to the table cell
      lookup[ri + '-' + firstAvailCol] = c;
      for (k = ri; k < ri + rowspan; k++) {
        matrix[k] = matrix[k] || [];
        matrixrow = matrix[k];
        for (let l = firstAvailCol; l < firstAvailCol + colspan; l++) {
          matrixrow[l] = 'x';
        }
      }
    }
  }
  return lookup;
};

@Injectable()
export class NgxMergeCellsService {

  /**
   * onMouseDown
   */
  onMouseDown(el, flag: boolean, type = '') {
    let td, // collection of table cells within container
      th, // collection of table header cells within container
      i,
      t, // loop variables
      getTables; // private method returns array
    // method returns array with table nodes for a DOM node
    getTables = function (el) {
      let arr = [], // result array
        nodes, // node collection
        i; // loop variable
      // collect table nodes
      nodes = el.getElementsByTagName('table');
      // open node loop and push to array
      for (i = 0; i < nodes.length; i++) {
        arr.push(nodes[i]);
      }
      // return result array
      return arr;
    };
    // save event parameter to this.tdEvent private property
    CONFIG_TABLE.tdEvent = flag;
    // if third parameter is set to "classname" then select tables by given class name (first parameter is considered as class name)
    if (typeof el === 'string') {
      if (type === 'classname') {
        // collect all tables on the page
        CONFIG_TABLE.tables = getTables(document);
        // open loop
        for (i = 0; i < CONFIG_TABLE.tables.length; i++) {
          // if class name is not found then cut out table from tables collection
          if (CONFIG_TABLE.tables[i].className.indexOf(el) === -1) {
            CONFIG_TABLE.tables.splice(i, 1);
            i--;
          }
        }
      }
      // first parameter is string and that should be id of container or id of a table
      else {
        // set object reference (overwrite el parameter)
        el = document.getElementById(el);
      }
    }
    // el is object
    if (el && typeof el === 'object') {
      // if container is already a table
      if (el.nodeName === 'TABLE') {
        CONFIG_TABLE.tables[0] = el;
      }
      // else collect tables within container
      else {
        CONFIG_TABLE.tables = getTables(el);
      }
    }
    // at this point tables should contain one or more tables
    for (t = 0; t < CONFIG_TABLE.tables.length; t++) {
      // collect table header cells from the selected table
      th = CONFIG_TABLE.tables[t].getElementsByTagName('th');
      // loop goes through every collected TH
      for (i = 0; i < th.length; i++) {
        // add or remove event listener
        this.cellInit(th[i]);
      }

      // collect table cells from the selected table
      td = CONFIG_TABLE.tables[t].getElementsByTagName('td');
      // loop goes through every collected TD
      for (i = 0; i < td.length; i++) {
        // add or remove event listener
        this.cellInit(td[i]);
      }
    }
    // show cell index (if showIndex public property is set to true)
    this.cellIndex();
  }

  cellInit(c) {
    // if cell contains "ignore" class name then ignore this table cell
    if (c.className.indexOf('ignore') > -1) {
      return;
    }
    // if this.tdEvent is set to true then onMouseDown event listener will be attached to table cells
    if (CONFIG_TABLE.tdEvent === true) {
      this.eventAdd(c, 'mousedown', this.handlerOnMouseDown);
    } else {
      this.eventRemove(c, 'mousedown', this.handlerOnMouseDown);
    }
  }

  cellIgnore(c) {
    // if input parameter is string then overwrite it with cell reference
    if (typeof c === 'string') {
      c = document.getElementById(c);
    }
    // remove onMouseDown event listener
    this.eventRemove(c, 'mousedown', this.handlerOnMouseDown);
  }

  handlerOnMouseDown(e) {
    let evt = e || window.event,
      td = getParentCell(evt.target || evt.srcElement),
      mouseButton,
      empty;
    // return if td is not defined
    if (!td) {
      return;
    }
    // set empty flag for clicked TD element
    // http://forums.asp.net/t/1409248.aspx/1
    empty = !!/^\s*$/.test(td.innerHTML);
    // if "markNonEmpty" is set to false and current cell is not empty then do nothing (just return from the event handler)
    if (CONFIG_TABLE.markNonEmpty === false && empty === false) {
      return;
    }
    // define which mouse button was pressed
    if (evt.which) {
      mouseButton = evt.which;
    } else {
      mouseButton = evt.button;
    }
    // if left mouse button is pressed and target cell is empty
    if (mouseButton === 1 /* && td.childNodes.length === 0 */) {
      // if custom property "ngx_merge_cells" doesn't exist then create custom property
      td.ngx_merge_cells = td.ngx_merge_cells || {};
      // cell is already marked
      if (td.ngx_merge_cells.selected === true) {
        // return original background color and reset selected flag
        mark(false, td);
      }
      // cell is not marked
      else {
        mark(true, td);
      }
    }
  }

  merge(mode: string, clear: boolean, table: string) {
    let tbl, // table array (loaded from tables array or from table input parameter)
      tr, // row reference in table
      c, // current cell
      rc1, // row/column maximum value for first loop
      rc2, // row/column maximum value for second loop
      marked, // (boolean) marked flag of current cell
      span, // (integer) rowspan/colspan value
      id, // cell id in format "1-2", "1-4" ...
      cl, // cell list with new coordinates
      j, // loop variable
      first = {
        index: -1, // index of first cell in sequence
        span: -1,
      }; // span value (colspan / rowspan) of first cell in sequence
    // remove text selection
    this.removeSelection();
    // if table input parameter is undefined then use "tables" private property (table array) or set table reference from getTable method
    tbl = table === undefined ? CONFIG_TABLE.tables : this.getTable(table);
    // open loop for each table inside container
    for (let t = 0; t < tbl.length; t++) {
      // define cell list with new coordinates
      cl = cellList(tbl[t]);
      // define row number in current table
      tr = tbl[t].rows;
      // define maximum value for first loop (depending on mode)
      rc1 = mode === 'v' ? this.maxCols(tbl[t]) : tr.length;
      // define maximum value for second loop (depending on mode)
      rc2 = mode === 'v' ? tr.length : this.maxCols(tbl[t]);
      // first loop
      for (let i = 0; i < rc1; i++) {
        // reset marked cell index and span value
        first.index = first.span = -1;
        // second loop
        for (j = 0; j <= rc2; j++) {
          // set cell id (depending on horizontal/verical merging)
          id = mode === 'v' ? j + '-' + i : i + '-' + j;
          // if cell with given coordinates (in form like "1-2") exists, then process this cell
          if (cl[id]) {
            // set current cell
            c = cl[id];
            // if custom property "ngx_merge_cells" doesn't exist then create custom property
            c.ngx_merge_cells = c.ngx_merge_cells || {};
            // set marked flag for current cell
            marked = c ? c.ngx_merge_cells.selected : false;
            // set opposite span value
            span = mode === 'v' ? c.colSpan : c.rowSpan;
          } else {
            marked = false;
          }
          // if first marked cell in sequence is found then remember index of first marked cell and span value
          if (marked === true && first.index === -1) {
            first.index = j;
            first.span = span;
          }
          // sequence of marked cells is finished (naturally or next cell has different span value)
          else if (
            (marked !== true && first.index > -1) ||
            (first.span > -1 && first.span !== span)
          ) {
            // merge cells in a sequence (cell list, row/column, sequence start, sequence end, horizontal/vertical mode)
            this.mergeCells(cl, i, first.index, j, mode, clear);
            // reset marked cell index and span value
            first.index = first.span = -1;
            // if cell is selected then unmark and reset marked flag
            // reseting marked flag is needed in case for last cell in column/row (so mergeCells () outside for loop will not execute)
            if (marked === true) {
              // if clear flag is set to true (or undefined) then clear marked cell after merging
              if (clear === true || clear === undefined) {
                mark(false, c);
              }
              marked = false;
            }
          }
          // increase "j" counter for span value (needed for merging spanned cell and cell after when index is not in sequence)
          if (cl[id]) {
            j += mode === 'v' ? c.rowSpan - 1 : c.colSpan - 1;
          }
        }
        // if loop is finished and last cell is marked (needed in case when TD sequence include last cell in table row)
        if (marked === true) {
          this.mergeCells(cl, i, first.index, j, mode, clear);
        }
      }
    }
    // show cell index (if showIndex public property is set to true)
    this.cellIndex();
  }

  mergeCells(cl, idx, pos1, pos2, mode, clear) {
    let span = 0, // set initial span value to 0
      id, // cell id in format "1-2", "1-4" ...
      fc, // reference of first cell in sequence
      c; // reference of current cell
    // set reference of first cell in sequence
    fc = mode === 'v' ? cl[pos1 + '-' + idx] : cl[idx + '-' + pos1];
    // delete table cells and sum their colspans
    for (let i = pos1 + 1; i < pos2; i++) {
      // set cell id (depending on horizontal/verical merging)
      id = mode === 'v' ? i + '-' + idx : idx + '-' + i;
      // if cell with given coordinates (in form like "1-2") exists, then process this cell
      if (cl[id]) {
        // define next cell in column/row
        c = cl[id];
        // add colSpan/rowSpan value
        span += mode === 'v' ? c.rowSpan : c.colSpan;
        // relocate content before deleting cell in merging process
        this.relocate(c, fc);
        // delete cell
        c.parentNode.deleteCell(c.cellIndex);
      }
    }
    // if cell exists
    if (fc !== undefined) {
      // vertical merging
      if (mode === 'v') {
        fc.rowSpan += span; // set new rowspan value
      }
      // horizontal merging
      else {
        fc.colSpan += span; // set new rowspan value
      }
      // if clear flag is set to true (or undefined) then set original background color and reset selected flag
      if (clear === true || clear === undefined) {
        mark(false, fc);
      }
    }
  }

  maxCols(table) {
    let tr = table.rows, // define number of rows in current table
      span, // sum of colSpan values
      max = 0; // maximum number of columns
    // if input parameter is string then overwrite it with table reference
    if (typeof table === 'string') {
      table = document.getElementById(table);
    }
    // open loop for each TR within table
    for (let i = 0; i < tr.length; i++) {
      // reset span value
      span = 0;
      // sum colspan value for each table cell
      for (let j = 0; j < tr[i].cells.length; j++) {
        span += tr[i].cells[j].colSpan || 1;
      }
      // set maximum value
      if (span > max) {
        max = span;
      }
    }
    // return maximum value
    return max;
  }

  split(mode: string, table: string) {
    let tbl, // table array (loaded from tables array or from table input parameter)
      tr, // row reference in table
      c, // current table cell
      cl, // cell list with new coordinates
      rs, // rowspan cells before
      n, // reference of inserted table cell
      cols, // number of columns (used in TD loop)
      max, // maximum number of columns
      getRowSpan;
    // method returns number of rowspan cells before current cell (in a row)
    getRowSpan = function (c, row, col) {
      let rs, last, i;
      // set rs
      rs = 0;
      // set row index of bottom row for the current cell with rowspan value
      last = row + c.rowSpan - 1;
      // go through every cell before current cell in a row
      for (i = col - 1; i >= 0; i--) {
        // if cell doesn't exist then rowspan cell exists before
        if (cl[last + '-' + i] === undefined) {
          rs++;
        }
      }
      return rs;
    };
    // remove text selection
    this.removeSelection();
    // if table input parameter is undefined then use "tables" private property (table array) or set table reference from getTable method
    tbl = table === undefined ? CONFIG_TABLE.tables : this.getTable(table);
    // TABLE loop
    for (let t = 0; t < tbl.length; t++) {
      // define cell list with new coordinates
      cl = cellList(tbl[t]);
      // define maximum number of columns in table
      max = this.maxCols(tbl[t]);
      // define row number in current table
      tr = tbl[t].rows;
      // loop TR
      for (let i = 0; i < tr.length; i++) {
        // define column number (depending on mode)
        cols = mode === 'v' ? max : tr[i].cells.length;
        // loop TD
        for (let j = 0; j < cols; j++) {
          // split vertically
          if (mode === 'v') {
            // define current table cell
            c = cl[i + '-' + j];
            // if custom property "ngx_merge_cells" doesn't exist then create custom property
            if (c !== undefined) {
              c.ngx_merge_cells = c.ngx_merge_cells || {};
            }
            // if marked cell is found and rowspan property is greater then 1
            if (
              c !== undefined &&
              c.ngx_merge_cells.selected === true &&
              c.rowSpan > 1
            ) {
              // get rowspaned cells before current cell (in a row)
              rs = getRowSpan(c, i, j);
              // insert new cell at last position of rowspan (consider rowspan cells before)
              n = tr[i + c.rowSpan - 1].insertCell(j - rs);
              // set the same colspan value as it has current cell
              n.colSpan = c.colSpan;
              // decrease rowspan of marked cell
              c.rowSpan -= 1;
              // add "ngx_merge_cells" property to the table cell and optionally event listener
              this.cellInit(n);
              // recreate cell list after vertical split (new cell is inserted)
              cl = cellList(tbl[t]);
            }
          }
          // split horizontally
          else {
            // define current table cell
            c = tr[i].cells[j];
            // if custom property "ngx_merge_cells" doesn't exist then create custom property
            c.ngx_merge_cells = c.ngx_merge_cells || {};
            // if marked cell is found and cell has colspan property greater then 1
            if (c.ngx_merge_cells.selected === true && c.colSpan > 1) {
              // increase cols (because new cell is inserted)
              cols++;
              // insert cell after current cell
              n = tr[i].insertCell(j + 1);
              // set the same rowspan value as it has current cell
              n.rowSpan = c.rowSpan;
              // decrease colspan of marked cell
              c.colSpan -= 1;
              // add "ngx_merge_cells" property to the table cell and optionally event listener
              this.cellInit(n);
            }
          }
          // return original background color and reset selected flag (if cell exists)
          if (c !== undefined) {
            mark(false, c);
          }
        }
      }
    }
    // show cell index (if showIndex public property is set to true)
    this.cellIndex();
  }

  getTable(table) {
    // define output array
    let tbl = [];
    // input parameter should exits
    if (table !== undefined) {
      // if table parameter is string then set reference and overwrite input parameter
      if (typeof table === 'string') {
        table = document.getElementById(table);
      }
      // set table reference if table is not null and table is object and node is TABLE
      if (table && typeof table === 'object' && table.nodeName === 'TABLE') {
        tbl[0] = table;
      }
    }
    // return table reference as array
    return tbl;
  }

  row(table: any, mode: string, index: number) {
    let nc, // new cell
      nr = null, // new row
      fr, // reference of first row
      c, // current cell reference
      cl, // cell list
      cols = 0, // number of columns
      i,
      j,
      k; // loop variables
    // remove text selection
    this.removeSelection();
    // if table is not object then input parameter is id and table parameter will be overwritten with table reference
    if (typeof table !== 'object') {
      table = document.getElementById(table);
    }
    // if index is not defined then index of the last row
    if (index === undefined) {
      index = -1;
    }
    // insert table row
    if (mode === 'insert') {
      // set reference of first row
      fr = table.rows[0];
      // define number of columns (it is colspan sum)
      for (i = 0; i < fr.cells.length; i++) {
        cols += fr.cells[i].colSpan;
      }
      // insert table row (insertRow returns reference to the newly created row)
      nr = table.insertRow(index);
      // insert table cells to the new row
      for (i = 0; i < cols; i++) {
        nc = nr.insertCell(i);
        // add "ngx_merge_cells" property to the table cell and optionally event listener
        this.cellInit(nc);
      }
      // show cell index (if showIndex public property is set to true)
      this.cellIndex();
    }
    // delete table row and update rowspan for cells in upper rows if needed
    else {
      // last row should not be deleted
      if (table.rows.length === 1) {
        return;
      }
      // delete last row
      table.deleteRow(index);
      // prepare cell list
      cl = cellList(table);
      // set new index for last row
      index = table.rows.length - 1;
      // set maximum number of columns that table has
      cols = this.maxCols(table);
      // open loop for each cell in last row
      for (i = 0; i < cols; i++) {
        // try to find cell in last row
        c = cl[index + '-' + i];
        // if cell doesn't exist then update colspan in upper cells
        if (c === undefined) {
          // open loop for cells up in column
          for (j = index, k = 1; j >= 0; j--, k++) {
            // try to find cell upper cell with rowspan value
            c = cl[j + '-' + i];
            // if cell is found then update rowspan value
            if (c !== undefined) {
              c.rowSpan = k;
              break;
            }
          }
        }
        // if cell in last row has rowspan greater then 1
        else if (c.rowSpan > 1) {
          c.rowSpan -= 1;
        }
        // increase loop variable "i" for colspan value
        i += c.colSpan - 1;
      }
    }
    // in case of inserting new table row method will return TR reference (otherwise it will return NULL)
    return nr;
  }

  column(table: any, mode: string, index: number) {
    let c, // current cell
      idx, // cell index needed when column is deleted
      nc, // new cell
      i; // loop variable
    // remove text selection
    this.removeSelection();
    // if table is not object then input parameter is id and table parameter will be overwritten with table reference
    if (typeof table !== 'object') {
      table = document.getElementById(table);
    }
    // if index is not defined then index will be set to special value -1 (means to remove the very last column of a table or add column to the table end)
    if (index === undefined) {
      index = -1;
    }
    // insert table column
    if (mode === 'insert') {
      // loop iterates through each table row
      for (i = 0; i < table.rows.length; i++) {
        // insert cell
        nc = table.rows[i].insertCell(index);
        // add "ngx_merge_cells" property to the table cell and optionally event listener
        this.cellInit(nc);
      }
      // show cell index (if showIndex public property is set to true)
      this.cellIndex();
    }
    // delete table column
    else {
      // set reference to the first row
      c = table.rows[0].cells;
      // test column number and prevent deleting last column
      if (
        c.length === 1 &&
        (c[0].colSpan === 1 || c[0].colSpan === undefined)
      ) {
        return;
      }
      // row loop
      for (i = 0; i < table.rows.length; i++) {
        // define cell index for last column
        if (index === -1) {
          idx = table.rows[i].cells.length - 1;
        }
        // if index is defined then use "index" value
        else {
          idx = index;
        }
        // define current cell (it can't use special value -1)
        c = table.rows[i].cells[idx];
        // if cell has colspan value then decrease colspan value
        if (c.colSpan > 1) {
          c.colSpan -= 1;
        }
        // else delete cell
        else {
          table.rows[i].deleteCell(index);
        }
        // increase loop variable "i" for rowspan value
        i += c.rowSpan - 1;
      }
    }
  }

  removeSelection() {
    // remove text selection (Chrome, FF, Opera, Safari)
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
    // IE8
    // else if (document.selection && document.selection.type === 'Text') {
    //   try {
    //     document.selection.empty();
    //   } catch (error) {
    //     // ignore error (if there is any)
    //   }
    // }
  }

  relocate(from, to) {
    let cn; // number of child nodes
    // test if "from" cell is equal to "to" cell then do nothing
    if (from === to) {
      return;
    }
    // define childnodes length before loop
    cn = from.childNodes.length;
    // loop through all child nodes in table cell
    // 'j', not 'i' because NodeList objects in the DOM are live
    for (let i = 0, j = 0; i < cn; i++) {
      // relocate only element nodes
      if (from.childNodes[j].nodeType === 1) {
        to.appendChild(from.childNodes[j]);
      }
      // skip text nodes, attribute nodes ...
      else {
        j++;
      }
    }
  }

  cellIndex() {
    if (CONFIG_TABLE.showIndex) {
      // variable declaration
      let tr, // number of rows in a table
        c, // current cell
        cl, // cell list
        cols; // maximum number of columns that table contains
      // open loop for each table inside container
      for (let t = 0; t < CONFIG_TABLE.tables.length; t++) {
        // define row number in current table
        tr = CONFIG_TABLE.tables[t].rows;
        // define maximum number of columns (table row may contain merged table cells)
        cols = this.maxCols(CONFIG_TABLE.tables[t]);
        // define cell list
        cl = cellList(CONFIG_TABLE.tables[t]);
        // open loop for each row
        for (let i = 0; i < tr.length; i++) {
          // open loop for every TD element in current row
          for (let j = 0; j < cols; j++) {
            // if cell exists then display cell index
            if (cl[i + '-' + j]) {
              // set reference to the current cell
              c = cl[i + '-' + j];
              // set innerHTML with cellIndex property
              c.innerHTML = i + '-' + j;
            }
          }
        }
      }
    }
  }

  updateStyles(styles: Object) {
    CONFIG_TABLE.selected.forEach((f) => {
      Object.keys(styles).forEach((key) => {
        f.style[key] = styles[key];
      });
    });
  }

  eventAdd(obj, eventName, handler) {
    if (obj.addEventListener) {
      // (false) register event in bubble phase (event propagates from from target element up to the DOM root)
      obj.addEventListener(eventName, handler, false);
    } else if (obj.attachEvent) {
      obj.attachEvent('on' + eventName, handler);
    } else {
      obj['on' + eventName] = handler;
    }
  }

  // remove event listener
  eventRemove(obj, eventName, handler) {
    if (obj.removeEventListener) {
      obj.removeEventListener(eventName, handler, false);
    } else if (obj.detachEvent) {
      obj.detachEvent('on' + eventName, handler);
    } else {
      obj['on' + eventName] = null;
    }
  }
}
