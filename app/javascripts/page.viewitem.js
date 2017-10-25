
import * as d3 from 'd3';
import $ from 'jquery';
import Mustache from 'mustache';

const layout = require("html-loader!../viewitem.html")

export function ViewItem(viewcontroller) {

  const element = null;

  this.viewcontroller = viewcontroller;

  Object.defineProperty(this, "element", {
    "get" : () => {
      return element;
    },
    configurable : true
  });

}

ViewItem.prototype.load = function load(id) {

  const vc = this.viewcontroller;

  vc.busy();

  return new Promise((resolve, reject) => {
    vc.store.get(parseInt(id))
    .then((info) => {

      vc.store.files.dir(info.directory).then((dir) => {

        info.files = dir;

        const element = $.parseHTML(Mustache.render(layout, info))[0];

        Object.defineProperty(this, "element", {
          "get" : () => {
            return element;
          }
        });

        resolve();
        vc.ready();

      });

    })
    .catch(reject);

  });
}

ViewItem.prototype.save = function save() {

}
