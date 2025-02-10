interface TrieNode {
  [key: string]: TrieNode | boolean;
}

export class WordTrie {
  root: TrieNode;

  constructor() {
    this.root = {};
  }

  add(word: string) {
    let node = this.root;
    for (const char of word.toLowerCase()) {
      if (!node[char]) {
        node[char] = {};
      }
      node = node[char] as TrieNode;
    }
    node.isEnd = true;
  }

  has(word: string): boolean {
    let node = this.root;
    for (const char of word.toLowerCase()) {
      if (!node[char]) return false;
      node = node[char] as TrieNode;
    }
    return node.isEnd === true;
  }
}
