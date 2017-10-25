/*
  -- Loople
  Copyright (C) 2017 Odd Marthon Lende
*/

import {LayoutGrid} from "../../../vrt/js/viewcontroller.layoutgrid.js";
import {Confirm} from "../../../vrt/js/dialog.confirm.js";
import {Input} from "../../../vrt/js/dialog.component.input.js";
import {ContextMenuDialog} from "../../../vrt/js/dialog.context.js";
import {dock} from "../../../vrt/js/viewcontroller.dock.js";
import {toolbar} from "../../../vrt/js/viewcontroller.toolbar.js";

import i18next from 'i18next';
import * as d3 from 'd3';
import $ from 'jquery';
import Mustache from 'mustache';

const templates = {
  preferences : require("html-loader!../preferences.html"),
  listItem    : require("html-loader!../listitem.html")
};

function createListItems(results) {

  return results.map((props, i) => {

    var element;

    element = $.parseHTML(Mustache.render(templates.listItem, props))[0];
    element.parentNode.removeChild(element);

    return element;

  });

}

export function latest(skip, limit) {

  const self = this;

  skip = skip || 0;
  limit = limit || 10;

  return new Promise((resolve, reject) => {

    self.store.list(0, skip, limit)
    .then((results) => {

      var elements = createListItems(results);
      resolve(elements);

    })
    .catch(reject);

  });

}

export function loadUIComponents() {

  const self = this;
  var d, t;

  function over(d, i) {
    self.status(d.description);
  }

  function out(d, i) {
    self.status("");
  }

  self.layout = new LayoutGrid(document.body);
  self.layout.on("load", console.debug);

  const lid = self.loader.add(latest, self);

  self.dock = d = {

    "top"  : dock.call(document.body, {"orientation" : "top", "autoHide" : false}),
    "left" : dock.call(document.body, {"orientation" : "left", "autoHide" : false})

  };



  /*
    The button that shows/hides the sidebar at the top left.
  */
  (function(visible) {

    self.dock.left.toggle(visible);

    d.top.shortcuts.add("sidebar", i18next.t('12'),
      function click () {

        d.left.toggle((visible = !visible));

      }, over, out);

  })(false);

  /*

    The loople log at the top left

  */
  d.top.shortcuts.add("logo", i18next.t('24'),
    function click() {
      var w = self.dock.left.windows.activate();
      if(!w) {
        self.loader.activate(lid);
      }
      else {
        w.activate(false);
      }
    }, over, out);

  /*
      Tag searching icon top right
  */
  (function() {

    var component;

    (function() {

      var tags = [];

      d.top.shortcuts.add("search", i18next.t('5'),
        function show() {

          if(!self.search) {

            self.search = new ContextMenuDialog(this, true);

            self.search.add("tags", (component = new Input({
              "size" : "small",
              "name" : "tags",
              "placeholder" : i18next.t('3')
            })
            .on("keyup", function() {

              const e = window.event;

              if(e && (e.keyCode === 13 || d3.select(e.target).classed("tag")))
                search(null, 0, 1).then(createWindow);
              else {

                var value = this.valueOf(),
                    tgs = value.split(",").map((txt) => {return txt.trim();}),
                    t     = self.store.tags(tgs[tgs.length - 1]);

                while(tags.length) {
                  self.search.remove(tags.pop());
                }

                for(var i = 0; i < t.length; i++) {
                  tags.push(self.search.add("", t[i], "", () => {}).nest());
                }

              }

            })), i18next.t('16'), () => {})
            .on("show", function() {
              this.element.select("input").node().focus();
            })
            .on("hide", function() {

            });

          }

        }, over, out);

      })();

    /*
      Creates the window in the left sidebar dock
    */
    function createWindow(elements) {

      const tags = elements.tags;
      const field = d3.select(".dialog-component-input.tags input").node();

      if(elements.length && field) {

        field.value = "";

        const index = self.loader.add(search.bind(self, tags), self);
        const c     = d3.select(self.toolbar.get("close").element);
        const name  = tags.map((d) => { return d.toUpperCase(); }).join("|");

        d.left.windows.activate(name) ||
        d.left.windows.add(name, "",
          function active() {
            self.loader.activate(index);
            self.switchToolbarContext("windowed");

          },
          function close() {
            self.loader.remove(index);
            self.switchToolbarContext("empty");
          },
          function hide() {
            self.loader.activate(lid);
          },
          function over() {
            self.status(tags.join(", "));
          })
          .activate();
      }

    }

    /*
      The search function
    */
    function search(tags, skip, limit) {

      const field = d3.select(".dialog-component-input.tags input").node();

      tags = tags || field.value.split(",");

      for(var i = 0; i < tags.length; i++) {
        tags[i] = tags[i].trim();
      }

      return new Promise((resolve, reject) => {

        self.store.find(tags, skip, limit)
        .then((results) => {

          var elements = createListItems(results);
          elements.tags = tags;
          resolve(elements);

        })
        .catch(reject);

      });

    }

  })();

  /*
    Inventory
  */
  (function(index) {

    index = self.loader.add(inventory, self);

    d.top.shortcuts.add("inventory", i18next.t('7'),
      function click () {
        self.layout.up();
        self.loader.activate(index);
      }, over, out);

    function inventory(skip, limit) {

      return new Promise((resolve, reject) => {

        self.store.inventory(skip, limit)
        .then((results) => {

          var elements = createListItems(results);
          resolve(elements);

        })
        .catch(reject);

      });

    }

  })();

  /*
    The menu at the top right
  */
  (function(menu) {

    d.top.shortcuts.add("menu", i18next.t('17'),
     function show () {

       if(!self.menu) {

         self.menu = menu = new ContextMenuDialog(this, true);

         menu.add("", i18next.t('0'), "", function() { // "Publish audio samples"

           self.pages.publish.reset();
           self.layout.up(self.pages.publish.element);

           self.switchToolbarContext("publish",
             {
               "click": function() {
                 self.pages.publish.save()
                 .then((response) => {
                   self.ready();
                   console.debug(response);
                 })
                 .catch((error) => {
                   self.ready();
                   console.debug(error);
                   new Confirm(i18next.t('14'), error.message);
                 })
               }
             });



         })
         .add("", i18next.t('1'), i18next.t('18'), function() { // "Donate"


         })
         .add("", i18next.t('19'), "", function() { // "Identity" sub menu


         })
         .nest()
         .add("", i18next.t('20'), "", function() { // "Edit"


         })
         .add("", i18next.t('21'), "", function() { // "Delete"


         });

         menu.add("", i18next.t('23'), "", function() { // "Select Wallet"


         })
         .add("", i18next.t('2'), "", function() { // "Preferences"

           self.layout.up(Mustache.render(templates.preferences, {}));
           self.switchToolbarContext("preferences");

         })
         .add("", i18next.t('22'), "", function() { // "Help"



         });

       }

     }, over, out);

   })();

  /*
    The toolbar at the bottom right
  */
  (function(n, p, e, r, v, w) {

    self.toolbar = t = toolbar.call(document.body, {"autoHide" : false, "vertical" : "bottom", "horizontal" : "right"});
    self.toolbar.buttons = {
      "windowed"    : (w = []),
      "navigation"  : (n = []),
      "player"      : (p = []),
      "publish"     : (e = []),
      "preferences" : (r = []),
      "empty"       : [],
      "viewing"     : (v = [])
    };



    v.push(t.add("close", i18next.t('11'),
      function click () {

        if(self.layout.viewing)
          return self.layout.close();

        return d.left.windows.activate().remove(), self.loader.activate(lid);
      },
      function show () {
        //var w = d.left.windows.activate();
        //return d3.select(this).style("display", w ? null : "none");
      }, over, out));

    v.push(t.add("donate", i18next.t('1'),
      function click () {

      },
      function show () {

      }, over, out));

    n.push(t.add("next", i18next.t('9'), function click () {
      self.layout.next().then((page) => {
        self.status(`Page ${page + 1}`);
      });
    }, over, out));

    n.push(t.add("previous", i18next.t('10'), function click () {
      self.layout.prev().then((page) => {
        self.status(`Page ${page + 1}`);
      });
    }, over, out));

    self.toolbar.buttons["windowed"] = w = w.concat(n).concat(v);

    p.push(t.add("play", "", function click () {

      if(self.player.playing)
        return self.player.pause();

      self.player.play();

    }, over, out));

    e.push(t.add("save", "Save", function click () {

    }, over, out));

    r.push(e[0]);

    t.add("status", "", function show () {
      return d3.select(this).text(self.status()).attr("class", "status");
    });

    self.switchToolbarContext = function switchToolbarContext(name) {

      var buttons = [],
            args    = Array.prototype.slice.call(arguments);

      args.shift();

      for(var p in self.toolbar.buttons) {
        buttons = buttons.concat(self.toolbar.buttons[p]);
      }

      if(name != "player" && self.player.playing)
        self.player.pause();

      for(var i = 0; i < buttons.length; i++) {
          d3.select(buttons[i].element).style("display",
            self.toolbar.buttons[name].indexOf(buttons[i]) === -1 ? "none" : null);
      }

      for(i = 0; i < args.length; i++) {
        if(args[i]) {
          for(var p in args[i]) {
            self.toolbar.buttons[name][i][p] = args[i][p];
          }
        }
      }

    }

    self.toolbar();
    self.switchToolbarContext("empty");

  })();

  self.loader.on("activate", (index) => {
    if(index === lid)
      self.switchToolbarContext("navigation");
  });

  self.player.on("play", (src) => {
    self.switchToolbarContext("player");
    d3.select(self.toolbar.get("play").element).classed("pause", true);
  });

  self.player.on("pause", (src) => {
    d3.select(self.toolbar.get("play").element).classed("pause", false);
    self.switchToolbarContext("navigation");
  });

  self.layout.on("up", () => {
    self.dock.left.windows.activate(false, false);
  });

  self.layout.on("view", () => {
    self.dock.left.windows.activate(false, false);
    self.switchToolbarContext("viewing");
    // d3.select(self.toolbar.get("close").element).style("display", null);
  });

  self.layout.on("close", () => {
    //self.switchToolbarContext("navigation");
  });

  return lid;


}
