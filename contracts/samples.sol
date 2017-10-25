pragma solidity ^0.4.15;

import "/Users/lendodd/dev/lib/ethereum/id.sol";
import "/Users/lendodd/dev/lib/ethereum/linkedlist.sol";
import "./tags.sol";
import "./users.sol";
import "./categories.sol";

contract Samples is Users, Categories, Tags(6)  {

  using LinkedList for *;

  struct Sample {
    bytes32 title;
    bytes32[2] audio;
    bytes32[2] directory;
    uint8 bpm;
    uint8 categoryId;
    address owner;
    uint time;
    uint pid;
    int index;
  }

  // Map ids to samples
  mapping(uint => Sample) internal i_samples;

  // User address list of owned samples
  mapping(address => LinkedList.List) private u_samples;

  // List of all samples
  LinkedList.List private l_samples;

  /*

    Publish an item

    returns the generated id;

  */
  function publish(uint8 categoryId, uint8 bpm, bytes32 title, bytes32[2] ah, bytes32[2] dir, uint[] pids, bytes16[4][] tgs ) public returns (uint) {

    uint id = generateId();

    require(uint(title) != 0);
    require(uint(ah[0]) != 0);
    require(uint(dir[0]) != 0);
    require(uint(ah[1]) != 0);
    require(uint(dir[1]) != 0);
    require(pids.length == tgs.length);
    require(category(categoryId) != bytes16(0));

    i_samples[id] = Sample(title, ah, dir, bpm, categoryId, msg.sender, now, 0, -1);
    u_samples[msg.sender].push(id);
    l_samples.push(id);

    tag(id, pids, tgs);

    return id;

  }

  function tag(uint id, uint[] pids, bytes16[4][] tgs) private {

    Sample storage s = i_samples[id];
    uint pid = 0;
    uint l = 0;
    uint m = 0;
    int index;

    require(s.owner == msg.sender);
    require(pids.length <= ((uint(2) ** 6) - 1) && pids.length == tgs.length);

    for(uint i = 0; i < pids.length; i++) {

      bytes16[] memory t = new bytes16[](4);

      for(uint j = 0; j < 4; j++) {
        t[j] = tgs[i][j];
      }

      index = tag(id, pids[i], t);
      l = filter(t).length;

      if(l > m) {
        m = l;
        pid = pids[i];
      }

    }

    s.pid = pid;
    s.index = index;

  }

  /*

    Get the fields for an item.

    returns the title, audio hash, directory hash, user, tags, category, bpm, isOwner, time

  */
  function get( uint id ) public constant returns (bytes32, bytes32[2], bytes32[2], bytes32[] memory, bytes16[] memory, bytes16, uint8, bool, uint) {

    assert(id > 0);

    Sample storage s = i_samples[id];
    User memory u   = identity(s.owner);

    bytes16[] memory tags = s.pid > 0 ? p_tags[s.pid][uint(s.index)] : new bytes16[](0);
    bytes32[] memory usr = new bytes32[](4);

    usr[0] = u.name;
    usr[1] = u.email;
    usr[2] = u.country;
    usr[3] = u.avatar;

    return (s.title, s.audio, s.directory, usr, tags, category(s.categoryId), s.bpm, s.owner == msg.sender, s.time);
  }

  /*

    Find samples from specified tags.

    returns ids

  */
  function find(bytes16[] tgs, uint skip, uint16 limit) public constant returns (uint[] memory) {

    LinkedList.Link[] memory links = lookup(tgs, skip, limit);

    uint[] memory ids = new uint[](links.length);

    for(uint i = 0; i < links.length; i++) {
      ids[i] = links[i].ref;
    }

    return (ids);

  }

  /*

     List items.

     If id = id of item, then will list item from owner of parent item;

     returns Id array

  */
  function list(uint id, uint skip, uint16 limit) public constant returns (uint[] memory) {

    require(id >= 0);

    Sample storage s = i_samples[id];

    LinkedList.List storage lst = (id != 0 ? u_samples[s.owner] : l_samples);
    LinkedList.Link storage l = lst.tail();

    limit = lst.length < limit ? uint16(lst.length) : limit;

    uint[] memory ids = new uint[](limit);

    uint i = 0;
    uint16 j = 0;

    while(l.id != 0) {

      if(i++ < skip) {
        l = l.previous(lst);
         continue;
       }
      else if(++j > limit)
         break;

      ids[j - 1] = l.ref;

      l = l.previous(lst);

    }

    return (ids);

  }

  /*

     List inventory

     returns Id array

  */
  function inventory(uint skip, uint16 limit) public constant returns (uint[] memory) {

    LinkedList.List storage l = u_samples[msg.sender];
    assert(l.length > 0);
    return list(l.head().ref, skip, limit);

  }


}
