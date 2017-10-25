String.prototype.capitalize = function() {
      return this.substr(0,1).toUpperCase()+this.substr(1);
};

Number.isFinite = Number.isFinite || function (n) {
      return typeof n === 'number' && n !== NaN;
};
