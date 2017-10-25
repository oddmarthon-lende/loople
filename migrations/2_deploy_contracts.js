var LinkedList = artifacts.require("./LinkedList.sol");
var Loople = artifacts.require("./Loople.sol");

module.exports = function(deployer) {
  deployer.deploy(LinkedList);
  deployer.link(LinkedList, Loople);
  deployer.deploy(Loople);
};
