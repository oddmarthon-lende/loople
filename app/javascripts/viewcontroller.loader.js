/*
    Loople - Copyright © 2017 Odd Marthon Lende
    All Rights Reserved
*/

import {EventEmitter} from 'events';
import * as d3 from 'd3';
import Mustache from 'mustache';
import {Confirm} from "../../../vrt/js/dialog.confirm.js";
import i18next from 'i18next';

const templates = {
  viewItem    : require("html-loader!../viewitem.html")
}

export function Loader(viewcontroller) {

  const self = this;

  this.viewcontroller = viewcontroller;
  this._stack = {};

  window.addEventListener("click", function(event) {

    const vc = self.viewcontroller;
    var p = event.target;
    var s;
    var isListitem = false;
    var isSample = false;
    var isOpenIcon = false;
    var isTag = false;

    while(p) {

      try {

        s = d3.select(p);

        isListitem =  s.classed("listitem") ? s : isListitem;
        isOpenIcon = isOpenIcon || s.classed("icon open");
        isTag      = isTag      || s.classed("tag");

        if(isListitem)
          break;

        p = p.parentNode;

      }
      catch(error) {
        break;
      }

    }

    if(isListitem && isOpenIcon) {

      vc.busy();

      vc.pages.item.load(parseInt(isListitem.attr("data-id"))).then(() => {
        vc.layout.view(isListitem.node(), vc.pages.item.element);
        vc.ready();
      });
    }
    else if(isListitem && isTag) {
      var field = d3.select(".dialog-component-input.tags input").node();
      var shortcut = self.viewcontroller.dock.top.shortcuts.get("search");
      field.value = s.node().innerText;
      self.viewcontroller.search.nest().emit("keyup");
    }

  }.bind(this));
}

Loader.prototype = Object.create(EventEmitter.prototype);

Loader.prototype.add = function add(fn, context) {

  const self = this;
  const vc = this.viewcontroller;
  const i = vc.layout.push([]);
  const s = this._stack;

  s[i] = new Load(i, this, context, fn);

  vc.layout.on("load", s[i].handler);

  return i;

}

function Load(i, loader, context, fn) {

  const self = this;
  const vc = loader.viewcontroller;

  this.load = function load(a) {
    vc.busy();
    return fn.apply(context, a)
    .then((results) => {
      if(results.length)
        vc.layout.load(i, results, true)
          .then(vc.ready);
      else {
        vc.ready();
      }
    })
    .catch((error) => {
      console.debug(error);
      new Confirm(i18next.t('14'), error.message);
      vc.ready();
    });
  }

  this.append = function append(a) {
    vc.busy();
    return fn.apply(context, a)
    .then((results) => {
      if(results.length)
        vc.layout.append(i, results)
          .then(vc.ready);
      else {
        vc.ready();
      }

    })
    .catch((error) => {
      console.debug(error);
      new Confirm(i18next.t('14'), error.message);
      vc.ready();
    });
  }

  this.handler =  function handler(index, page, last_page, start, per_page, count) {

    if(index === i && self.args) {

      if(start + per_page === 0) {

        setTimeout(() => {
          self.load(self.args.concat([0, 1]));
        }, 0);

      }
      else if(count < per_page && self.page === -1) {

        self.page = page;
        self.load(self.args.concat([start + count, per_page - count]))
            .then(() => {
              self.limit = per_page;
            });

      }
      else if (page === self.page) {
        self.page = ++page;
        self.append(self.args.concat([page * self.limit, self.limit]));
      }

      loader.emit("load");

    }

  };

  this.args = undefined;
  this.page = -1;
  this.limit = 0;

}

Loader.prototype.remove = function remove(index) {

  verify_index_exists.call(this, index);

  var vc = this.viewcontroller;
  var s = this._stack;
  var l = s[index];
  var count = s.length;

  vc.layout.removeListener("load", l[0]);
  vc.layout.remove(index);

  delete s[index];

  this.emit("remove", index);

}

Loader.prototype.activate = function activate(index) {

  verify_index_exists.call(this, index);

  var s    = this._stack;
  var vc   = this.viewcontroller;
  var l    = s[index];
  var args = Array.prototype.slice.call(arguments);

  index = args.shift();

  l.args = args;
  l.page = -1;

  vc.busy();

  vc.layout.load(index, [], false)
    .then(() => {
      this.emit("activate", index);
      vc.ready();
    });

}

function verify_index_exists(index) {
  if(!(index in this._stack))
    throw new Error("Specified index does not exist");
}
