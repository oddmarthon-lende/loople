/*
  -- Loople
  Copyright (C) 2017 Odd Marthon Lende
*/

export function Store(viewcontroller) {

  this.credentials = {};
  this.viewcontroller = viewcontroller;

}

Store.prototype = {

  get : function get(id) { },

  find : function find(category, bpm, tags) {

     return new Promise((resolve, reject) => {

       resolve(tags.map((d, i) => {

         return {
           "id"    : Math.random() * Math.random(),
           "title" : d,
           "hash"  : ""
         };

       }));

     });

   },

  list  : function list(id, skip, limit) { },

  publish  : function publish() { },

  tag  : function tag(id, tags) { },

  identity : function identity() {

     return new Promise((resolve, reject) => {

       resolve({
         "name"    : "Developer",
         "email"   : "o@m.com",
         "country" : "NO",
         "avatar"  : ""
       });

     });

   }

}
