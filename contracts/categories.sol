pragma solidity ^0.4.15;

contract Categories {

  bytes16[] private _categories;

  function category(bytes16 name) internal returns (uint8) {
    _categories.push(name);
  }

  function category(uint8 id) internal constant returns (bytes16) {
    return _categories[id];
  }

  function categories() public constant returns (bytes16[]) {
    return _categories;
  }

}
