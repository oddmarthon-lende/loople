import * as Swarm from 'swarm-js';

const proxyUrl = "http://localhost:8500";

export function SwarmProxy(store) {
  this.store = store;
  this.swarm = Swarm.at(proxyUrl);
}

function readFile(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = (e) => {
      file.data = new Uint8Array(reader.result);
      resolve(file);
    }
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);

  });

}

SwarmProxy.prototype.upload = function upload(files) {

  const self = this;

  return new Promise((resolve, reject) => {

    Promise.all(files.map((f) => {
      return readFile(f);
    }))
    .then((files) => {

      const dir = {};

      for(var i = 0, f; i < files.length; i++) {
        f = files[i];
        dir[`/${f.name}`] = f;
      }

      self.swarm.upload(dir).then((hash) => {
        self.dir(hash).then((entries) => {
          resolve({
            entries: entries,
            directory: hash
          });
        })
        .catch(reject);
      })
      .catch(reject);
    })
    .catch(reject);

  });
}

SwarmProxy.prototype.dir = function dir(hash) {
  return new Promise((resolve, reject) => {
    this.swarm.downloadEntries(hash).then((manifest) => {
      const files = Object.getOwnPropertyNames(manifest).map((p) => {
        manifest[p].name = p;
        return manifest[p];
      });
      resolve(files);
    })
    .catch(reject);

  });
}

SwarmProxy.prototype.getUrl = function getUrl(ah, dh) {
  return new Promise((resolve, reject) => {
    this.dir(dh).then((dir) => {
      for(var i = 0; i < dir.length; i++) {
        if(dir[i].hash === ah) {
          return resolve(`${proxyUrl}/bzz:/${dh}/${dir[i].name}`);
        }
      }
      resolve("");
    })
    .catch(reject);
  });
}
