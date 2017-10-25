pragma solidity ^0.4.15;

contract Users {

  struct User {
    bytes32 name;
    bytes32 email;
    bytes32 country;
    bytes32 avatar;
  }

  // Each bit represents and offense. High bits/value more serious offences, low not so serious
  //
  // For example:
  //
  // 1 = Wrong tempo
  // 2 =
  // 4 =
  // 8 =
  // 16 =
  // 32 =
  // 64 = Non musical content
  // 128 = Published another user's musical content
  // 256 = Published other artist's copyrighted material
  uint16 private reputation;

  // The number of times each offense has been reported.
  mapping(uint16 => uint) private offenses;

  // Maps user address to information about that address
  mapping(address => User) private users;


  /*

    Identify the current sender of the transaction

  */
  function identify(bytes32 name, bytes32 email, bytes32 country, bytes32 avatar) public {
    users[msg.sender] = User(name, email, country, avatar);
  }

  /*

    Get the user identity for the specified address

    returns the user object;

  */
  function identity(address addr) internal constant returns (User memory) {
    return users[addr];
  }

  /*

    returns the sender registered identity information: name, email, country, avatar

  */
  function identity() public constant returns (bytes32, bytes32, bytes32, bytes32) {
    User storage u = users[msg.sender];
    return (u.name, u.email, u.country, u.avatar);
  }

}
