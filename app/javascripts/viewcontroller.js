/*
  -- Loople
  Copyright (C) 2017 Odd Marthon Lende
*/

import "../stylesheets/bootstrap.css";
import "../../../vrt/public/resources/css/vrt.css";
import "../../../vrt/public/resources/css/layoutgrid.css";
import "../stylesheets/loople.css";

import "./utils.js";

import {loadUIComponents, latest} from "./viewcontroller.loadui.js";
import {Loader} from "./viewcontroller.loader.js";
import {Player} from "./viewcontroller.player.js";
import {BlockchainStore} from "./stores/ethereum.js";
import {Confirm} from "../../../vrt/js/dialog.confirm.js";

import {Publish} from "./page.publish.js";
import {ViewItem} from "./page.viewitem.js";

import i18next from 'i18next';
import $ from 'jquery';
import * as d3 from 'd3';


const languages = {
  en : require("../../lang/en.json"),
  no : require("../../lang/no.json")
}

function loading(busy) {

  d3.select(document.body)
  .style("cursor", busy ? "wait" : null);

}

window.viewController = {

  "_status"      : "",
  "layout"       : null,
  "store"        : null,
  "status"       : function(text) {

    var self = this;
    if(!arguments.length) return self._status;
    return self._status !== text ? ((self._status  = text), (self.toolbar && d3.select("body").each(self.toolbar))) : (self._status = text);
  },
  "loader" : null,
  "player" : null,
  "pages"  : {

    "publish" : null,
    "item" : null

  },
  "initialize"   : function() {

    const self = this;

    self.store  = new BlockchainStore(self);
    self.loader = new Loader(self);
    self.player = new Player(self);
    self.pages.publish = new Publish(self);
    self.pages.item  = new ViewItem(self);

    self.busy();

    i18next.init({
      "lng": 'en',
      "debug": false,
      "resources": languages
    },
    function(err) {

        if(err) {
          new Confirm(i18next.t('14'), err.message);
          self.ready();
        }
        else {

            Promise.all([self.store.initialize(), self.store.identity()])
            .then((results) => {

              const credentials = results[1];
              const lid = loadUIComponents.call(self);

              if(credentials.name)
                self.status(`${i18next.t('15')}  ${credentials.name}`);

              self.loader.activate(lid);
              self.ready();

            })
            .catch((error) => {
                 new Confirm(i18next.t('14'), error.message);
                 console.debug(error);
                 self.ready();
            });

        }

    });

  },

  "busy" : function() {
    console.debug("Busy...");
    return loading.call(this, true);
  },

  "ready" : function() {
    console.debug("Ready!")
    return loading.call(this, false);
  }

}

window.addEventListener('load', viewController.initialize.bind(viewController));
