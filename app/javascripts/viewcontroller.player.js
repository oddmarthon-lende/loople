import {EventEmitter} from 'events';
import * as d3 from 'd3';
import {Confirm} from "../../../vrt/js/dialog.confirm.js";
import i18next from 'i18next';

export function Player(viewcontroller) {

  this.viewcontroller = viewcontroller;
  this.audio = document.createElement("audio");
  this.playing = false;
  this.selection = null;

  window.addEventListener("click", function listen(event) {

    var p = event.target;
    var s;
    var isListitem = false;
    var isSample   = false;
    var isOpenIcon = false;
    var isTag      = false;

    while(p) {

      try {

        s = d3.select(p);

        isListitem = s.classed("listitem") ? s : isListitem;
        isOpenIcon = isOpenIcon || s.classed("icon open");
        isTag      = isTag      || s.classed("tag");

        if(isListitem) {
          this.pause();
          this.selection = s;
          break;
        }

        p = p.parentNode;

     }
     catch(error) {
       break;
     }

    }

    if(isListitem && (isOpenIcon || isTag))
      return;
    else if(isListitem && !isOpenIcon && !isTag) {
      viewcontroller.store.files.getUrl(isListitem.attr("data-preview"), isListitem.attr("data-directory"))
      .then(url => {
        this.play(url);
      })
      .catch(error => {
        console.debug(error);
        new Confirm(i18next.t('14'), error.message);
      })

    }

  }.bind(this));

}

Player.prototype = Object.create(EventEmitter.prototype);

Player.prototype.play = function play(src) {

  var a = this.audio;
  var vc = this.viewcontroller;
  var s = this.selection;

  a.loop = true;
  a.src = src;

  if((this.playing = a.play()))
    this.emit("play", a.src);

  if(s)
    s.classed("playing", true);

}

Player.prototype.pause = function pause() {

  var a = this.audio;
  var vc = this.viewcontroller;
  var s = this.selection;

  a.pause();

  this.playing = false;
  this.emit("pause", a.src);

  if(s)
    s.classed("playing", false);
}
