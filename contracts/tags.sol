pragma solidity ^0.4.15;

import "/Users/lendodd/dev/lib/ethereum/linkedlist.sol";
import "/Users/lendodd/dev/lib/ethereum/id.sol";

contract Tags is Id {

  using LinkedList for *;

  struct Tagged {
    uint[] links;
    address owner;
  }

  mapping(bytes16 => uint) private ru_tags;

  mapping(uint => bytes16) private iu_tags;

  LinkedList.List private l_tags;

  mapping(uint => Tagged) private i_tags;

  mapping(uint => mapping(uint => LinkedList.List)) private l_paths;

  mapping(uint => bytes16[][]) internal p_tags;

  uint8 private max;

  /*
    Constructor
  */
  function Tags(uint8 mx) public {
    max = mx;
  }

  /*

    Find links tagged with specified tags

  */
  function lookup(bytes16[] tgs, uint skip, uint16 limit) internal constant returns (LinkedList.Link[] memory) {

    assert(tgs.length <= max);

    uint i    = 0;
    uint16 j  = 0;
    uint pid  = sum(tgs);
    int x     = index(pid, tgs);

    if(x == -1)
      return new LinkedList.Link[](0);

    LinkedList.List storage lp = l_paths[pid][uint(x)];
    LinkedList.Link storage link = lp.tail();

    limit = (lp.length < limit ? uint16(lp.length) : limit);

    LinkedList.Link[] memory results = new LinkedList.Link[](limit);

    while(link.id != 0) {

      if(i++ < skip) {
        link = link.previous(lp);
         continue;
       }

      if(++j > limit)
         break;

      results[j - 1] = link;

      link = link.previous(lp);
    }

    return results;

  }

  /*

    Tag an idf

  */
  function tag(uint id, uint pid, bytes16[] tg) internal returns (int) {

    tg = filter(tg);

    Tagged storage tgd = i_tags[id];
    int ix = index(pid, tg);

    require( ((uint(2) ** max) - 1) >= tgd.links.length);

    if(ix == -1) {

      p_tags[pid].push(tg);
      ix = int(p_tags[pid].length - 1);

    }

    LinkedList.Link storage ln = l_paths[pid][uint(ix)].push(id);

    tgd.links.push(ln.id);

    if(tgd.owner == 0x0)
        tgd.owner = msg.sender;

    for(uint i = 0; i < tg.length; i++) {
      if(ru_tags[tg[i]] == 0) {

        id = generateId();
        ru_tags[tg[i]] = id;
        iu_tags[id] = tg[i];
        l_tags.push(id);

      }
    }

    return ix;

  }

  function tags() public constant returns (bytes16[]) {


    LinkedList.Link storage l = l_tags.head();

    bytes16[] memory tgs = new bytes16[](l_tags.length);
    uint i = 0;

    while(l.id != 0) {

      tgs[i++] = iu_tags[l.ref];
      l = l.next(l_tags);

    }

    return (tgs);

  }

  function filter(bytes16[] tgs) internal constant returns (bytes16[] memory) {

    uint count;

    for(uint i = 0; i < tgs.length; i++) {
      if( tgs[i] != bytes16(0) )
        count++;
    }

    bytes16[] memory t = new bytes16[](count);

    i = 0;

    for(uint j = 0; j < tgs.length; j++) {
      if( tgs[i] != bytes16(0) )
        t[i++] = tgs[j];
    }

    return t;

  }

  /*

    Get the index of tags in the multidimensional array

  */
  function index(uint pid, bytes16[] tgs) private constant returns (int) {

    bytes16[][] storage pt = p_tags[pid];

    tgs = filter(tgs);

    for(uint i = 0; i < pt.length; i++) {

      uint count;

      bytes16[] memory tg = filter(pt[i]);

      if(tg.length != tgs.length)
        continue;

      for(uint j = 0; j < tg.length; j++) {

        for(uint k = 0; k < tgs.length; k++) {

          if(tg[j] == tgs[k] && ++count == tgs.length)
            return int(i);

        }

      }

    }

    return int(-1);

  }

  /*

    Sum all bytes in a bytes16 type

  */
  function sum(bytes16 tg) private constant returns (uint) {

    uint result = 0;

    for(uint8 i = 0; i < tg.length; i++) {
      result += uint(tg[i]);
    }

    return result;

  }

  /*

    Sum all bytes in a bytes16[] type array

  */
  function sum(bytes16[] memory tgs) private constant returns (uint) {

    uint result = 0;

    for(uint8 i = 0; i < tgs.length; i++) {
      result += sum(tgs[i]);
    }

    return result;

  }

  /*

    Calculate the sums of each possible combination of tags and output it.

    returns the count, sums, tags

  */
  function paths(bytes16[] memory tgs) private constant returns (uint, uint[] memory, bytes16[][] memory) {

    tgs = filter(tgs);

    uint count = (2 ** tgs.length) - 1;

    uint[] memory s = new uint[](count);
    bytes16[][] memory ts = new bytes16[][](count);

    for(uint i = 1; i <= count; i++) {

      bytes16[] memory tmp = new bytes16[](tgs.length);
      uint k = 0;

      for(uint j = 0; j < tgs.length; j++) {

         if( (i & (uint(1) << j)) != 0 ) {

           tmp[k++] = tgs[j];

         }

      }

      bytes16[] memory t = new bytes16[](k);

      for(uint m = 0; m < k; m++) {
        t[m] = tmp[m];
      }

      s[i - 1]  = sum(t);
      ts[i - 1] = t;
    }

    assert(count == s.length && count == ts.length);

    return (count, s, ts);

  }


}
