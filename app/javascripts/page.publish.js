
import * as d3 from 'd3';
import $ from 'jquery';
import Mustache from 'mustache';
import {Chance} from 'chance';

const layout = require("html-loader!../publish.html")

export function Publish(viewcontroller) {

  const self = this,
        chance = new Chance(),
        vc = viewcontroller;

  this.viewcontroller = vc;
  this.files   = [];
  this.categories = [];

  /* Title */
  Object.defineProperty(self, "title", {
   "get" : () => {
     const el = !self.element || d3.select(self.element)
                 .select("#s_title")
                 .node();
     return el === true ? self.generateTitle() : el.value;
   },
    "set" : (value) => {

      const el = !self.element || d3.select(self.element)
                  .select("#s_title")
                  .node();

      if(el !== true) {
        el.value = value;
      }

    }
  });

  /* BPM */
  Object.defineProperty(self, "bpm", {
    "get" : () => {
      const el = !self.element || d3.select(self.element)
                  .select("#s_bpm")
                  .node();
      return el === true ? 120 : parseInt(el.value);
    }
  });

  /* Category */
  Object.defineProperty(self, "category", {
    "get" : () => {
      const el = !self.element || d3.select(self.element)
                  .select("#s_category")
                  .node();
      return el === true ? "" : el.value;
    }
  });

  /* Audio */
  Object.defineProperty(self, "audio", {
    "get" : () => {
      const el = !self.element || d3.select(self.element)
                  .select("#s_main_audio")
                  .node();
      return el === true ? "" : el.value;
    }
  });

  /* Tags */
  Object.defineProperty(self, "tags", {
    "get" : () => {
      const el = !self.element || d3.select(self.element)
                  .select("#s_tags")
                  .node(),
            t  = [];
      for(var i = 0; el !== true && i < el.children.length; i++) {
        t.push(el.children[i].innerText);
      }
      return t
    }
  });

  vc.busy();
  vc.store.categories()
    .then((categories) => {
      self.categories = categories;
      vc.ready();
      update.call(this);
    });


}

Publish.prototype.generateTitle = function generateTitle() {
  return (this.title = chance.sentence({words: Math.ceil(Math.random() * 2)}).substr(0, 32))
}

Publish.prototype.reset = function reset() {

  const el = !this.element || d3.select(this.element);

  this.files = [];

  if(el !== true) {

    this.generateTitle();

    el.select("#s_bpm")
    .node().value = 120;

  }

  update.call(this);

}

Publish.prototype.save = function save() {
  return this.viewcontroller.store.publish(parseInt(this.category), this.bpm, this.title, d3.select(this.element).select("#s_main_audio").node().selectedIndex, this.files, this.tags);
}

function update() {

  const self    = this,
        element = $.parseHTML(Mustache.render(layout, this))[0],
        prev    = this.element;

  Object.defineProperty(this, "element", {
    "get" : () => {
      return element;
    },
    "configurable" : true
  });

  if(prev) {
    var parent = prev.parentNode;
    if(parent) {
      parent.removeChild(prev);
      parent.appendChild(element);
    }
  }

  d3.select(element)
    .select("#s_dir")
    .on("dragover", () => {

        var e = d3.event;

        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "copy";


    })
    .on("drop", () => {

        var e = d3.event, files = e.dataTransfer.items;

        e.preventDefault();
        e.stopPropagation();

        if(files.length) {
          for(var i = 0; i < files.length; i++) {
            this.files.push(files[i].getAsFile())
          }
          update.call(self);
        }

    });

}
