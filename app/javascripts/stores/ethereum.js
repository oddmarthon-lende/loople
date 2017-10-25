import {Store} from "./store.js";
import {SwarmProxy} from "./files/swarm.js";
import {Bzz} from "./files/bzz.js";

import loople_artifacts from '../../../build/contracts/Loople.json';
import { default as contract } from 'truffle-contract';


export function BlockchainStore(viewcontroller) {

  Store.call(this, viewcontroller);

  if (typeof web3 !== 'undefined') {
    this.web3 = new Web3(web3.currentProvider);
    this.files = new Bzz(this);
  }
  else {
    this.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    this.files = new SwarmProxy(this);
  }

  this.api = contract(loople_artifacts);
  this.api.setProvider(this.web3.currentProvider);


}

BlockchainStore.prototype = Object.create(Store.prototype);

BlockchainStore.prototype.initialize = function initialize() {

  const self = this, web3 = self.web3;

  self._tags = {};

  return new Promise((resolve, reject) => {

    self.api.deployed().then((loople) => {
      loople.tags.call().then((response) => {

        response = response.sort();

        for(var i = 0; i < response.length; i++) {
          var tag = web3.toUtf8(response[i]);
          for(var j = 1; j < tag.length; j++) {
            var t = tag.substr(0, j);
            self._tags[t] = self._tags[t] || [];
            self._tags[t].push(tag);
          }
        }
        resolve();
      })
      .catch(reject);
    })
    .catch(reject);

  })

}

BlockchainStore.prototype.tags = function tags(text, limit) {
  limit = limit || 10;
  return (this._tags[text] || []).slice(0, limit);

}

function selectWallet() {
  return {
    "from" : this.web3.eth.accounts[Number(prompt("Enter wallet number", "0"))],
    "gas"  : 6000000,
    "gasPrice" : 1000000000 // 1 gwei
  };
}

function createListItem(id, title, hash, dir, usr, tags, category, bpm, isOwner, time) {

  const self = this, web3 = self.web3;

  return {

    "id"        : typeof id != "number" ? id.toNumber() : id,
    "title"     : web3.toUtf8(title),
    "preview"   : hash.map((h) => { return web3.toUtf8(h); }).join(""),
    "directory" : dir.map((d) => { return web3.toUtf8(d); }).join(""),
    "category"  : web3.toUtf8(category).toLowerCase(),
    "bpm"       : bpm.toNumber(),
    "tags"      : tags.map(web3.toUtf8).map((tag) => { return {"name" : tag}; }),
    "user"      : {
      "name"    : web3.toUtf8(usr[0]) || "N/A",
      "email"   : web3.toUtf8(usr[1]) || "N/A",
      "country" : web3.toUtf8(usr[2]) || "N/A",
      "avatar"  : web3.toUtf8(usr[3]) || ""
    },
    "owned" : isOwner

  }

}

function _get(loople, ids) {

  const self = this, web3 = self.web3;

  // Must use web3 method because truffle return data is corrupt
  loople = web3.eth.contract(loople_artifacts.abi).at(self.api.address);

  ids = ids.map((id) => {
    if(typeof id != "number")
      return id.toNumber();
    return id;
  })
  .filter((id) => { return id != 0; });

  return new Promise((resolve, reject) => {

    Promise.all(ids.map((id, i) => {
      //return loople.get.call(id);
      return new Promise((resolve, reject) => {
        try {
          resolve(loople.get.call(id));
        }
        catch(error) {
          reject(error);
        }
      })

    })
    .filter((id) => {
      return id != 0;
    }))
    .then((results) => {
      resolve(results.map((r, i) => {
        return createListItem.call(self, ids[i], r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8]);
      }));
    })
    .catch(reject);

  });
}

BlockchainStore.prototype.get = function get(id) {

  const self = this, web3 = self.web3;

  return new Promise((resolve, reject) => {

    self.api.deployed().then((loople) => {
      _get.call(self, loople, [id])
      .then((results) => {
        resolve(results[0]);
      })
      .catch(reject);
    })
    .catch(reject);


  });

}

BlockchainStore.prototype.find = function find(tags, skip, limit) {

  const self = this, web3 = self.web3;

  return new Promise((resolve, reject) => {

    self.api.deployed().then((loople) => {
      loople.find.call(tags, skip, limit).then((ids) => {

        _get.call(self, loople, ids)
        .then(resolve)
        .catch(reject);

      })
      .catch(reject);
    })
    .catch(reject);


  });

}

BlockchainStore.prototype.inventory = function inventory(skip, limit) {

  const self = this, web3 = self.web3;

  return new Promise((resolve, reject) => {

    self.api.deployed().then((loople) => {
      loople.inventory.call(skip, limit).then((ids) => {

        _get.call(self, loople, ids)
        .then(resolve)
        .catch(reject);

      })
      .catch(reject);
    })
    .catch(reject);


  });

}

BlockchainStore.prototype.list = function list(id, skip, limit) {

  const self = this, web3 = self.web3;

  return new Promise((resolve, reject) => {
    self.api.deployed().then((loople) => {
      loople.list.call(id, skip, limit).then((ids) => {
        _get.call(self, loople, ids)
        .then(resolve)
        .catch(reject);
      })
      .catch(reject);
    })
    .catch(reject);


  });

}

BlockchainStore.prototype.categories = function categories() {

  const self = this, web3 = self.web3;

  return new Promise((resolve, reject) => {
    self.api.deployed().then((loople) => {
      loople.categories.call().then((categories) => {
        resolve(categories.sort().map((name, i) => {
          return {
            "id" : i,
            "name" : web3.toUtf8(name)
          };
        }));
      })
      .catch(reject);
    })
    .catch(reject);


  });

}

BlockchainStore.prototype.publish  = function publish(category, bpm, title, mainAudioIndex, files, tags) {

  const self = this, web3 = self.web3, t = [];
  var m_name;

  return new Promise((resolve, reject) => {

    if(tags.length > 4)
      return reject(new Error("Too many tags. Maximum number of 4 tags supported."));

    tags = tags.map((t) => { return t.trim().toLowerCase(); });

    for(var i = 0; i < tags.length; i++) {
      if(t.indexOf(tags[i]) === -1)
        t.push(tags[i]);
    }

    const {count, pids, comb} = paths(t);

    for(var i = 0; i < count; i++) {
      while(comb[i].length < 4)
        comb[i].push("");
    }

    if(!files.length)
      return reject(new Error("No audio files provided"));

    m_name = files[mainAudioIndex].name;

    Promise.all([self.api.deployed(), self.files.upload(files)])
    .then((result) => {

      const loople = result[0],
            f      = result[1],
            d      = f.directory;
      var a;

      for(var i = 0; i < f.entries.length; i++) {
        if(f.entries[i].name === m_name)
          a = f.entries[i].hash;
      }

      loople.publish(category, bpm, title, [a.substr(0,32), a.substr(32,64)], [d.substr(0,32), d.substr(32,64)], pids, comb, selectWallet.call(self))
      .then(resolve)
      .catch(reject);


    })
    .catch(reject);


  });


}

BlockchainStore.prototype.identity = function identity() {

  const self = this, web3 = self.web3;

  return new Promise((resolve, reject) => {

    self.api.deployed().then((loople) => {

      loople.identity.call().then((response) => {

        const credentials = {
          "name" : web3.toUtf8(response[0]),
          "email" : web3.toUtf8(response[1]),
          "country" : web3.toUtf8(response[2]),
          "avatar" : web3.toUtf8(response[3])
        };

        resolve(credentials);

      })
      .catch(reject);

    })
    .catch(reject);

  });


}

function sum(tgs) {

    var result = 0;

    for(var i = 0; i < tgs.length; i++) {
      result += Array.isArray(tgs) ? sum(tgs[i]) : typeof tgs === "string" ? tgs.charCodeAt(i) : tgs[i];
    }

    return result;

  }

function paths(tgs) {

    if(!Array.isArray(tgs))
      tgs = Array.prototype.slice.call(arguments);

    const count = (2 ** tgs.length) - 1;
    const s  = new Array(count);
    const ts = new Array(count);

    for(var i = 1; i <= count; i++) {

      var tmp = new Array(tgs.length);
      var k = 0;

      for(var j = 0; j < tgs.length; j++) {

         if( (i & (1 << j)) != 0 ) {

           tmp[k++] = tgs[j];

         }

      }

      var t = new Array(k);

      for(var m = 0; m < k; m++) {
        t[m] = tmp[m];
      }

      s[i - 1]  = sum(t);
      ts[i - 1] = t;
    }

    if(count == s.length && count == ts.length)
      return {
        "count" : count,
        "pids"  : s,
        "comb"  : ts
      };

  }
