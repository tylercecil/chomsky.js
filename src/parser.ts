type Token = {
  kind: TokenKind;
  value?: string;
};

type TokenKind =
  | '.'
  | '*'
  | '/'
  | '_'
  | '^'
  | '['
  | ']'
  | 'WORD'
  | 'WHITESPACE'
  | 'EOF';

/**
 * AST representation of a tree after parsing, including all data and metadata
 * nodes will need for rendering.
 */
type Tree = {
  /**
   * Node types are triples, including the base name, as well as possible
   * subscripts and superscripts. A node with no `nodeType` is an empty
   * node (not to be confused with a ∅-node).
   */
  nodeType?: { name: string; sup: string; sub: string };
  /**
   * The name `children` has special meaning for `d3.hierarchy`.
   */
  children: Tree[];
  /**
   * Leaf nodes contain data strings. Additionally, they may mark if they were
   * collapsed, denoting a "hidden subtree".
   */
  leaf?: { data: string; isCollapsed: boolean };
  /**
   * Optionally, nodes may have classes associated with them, allowing for
   * custom user CSS.
   */
  classes?: string[];
};

function Tree(): Tree {
  return { children: [] };
}

/**
 * Parses a given string, returning a Tree object.
 *
 * @param input
 * @returns Resulting tree.
 */
function parse(input: string): Tree {
  const toks = tokenize(input);
  let tok_peek = toks.next().value;

  const root = node();
  accept_ws();
  expect('EOF');
  return root;

  function accept(tokenType: string) {
    accept_ws();
    return accept_ws(tokenType);
  }

  function accept_ws(tokenType = 'WHITESPACE') {
    let tok = null;
    if (tok_peek.kind === tokenType) {
      tok = tok_peek;
      tok_peek = toks.next().value;
    }
    return tok;
  }

  function expect(tokenType: string) {
    const tok = accept(tokenType);
    if (!tok) {
      throw 'Unexpected token!: ' + tok_peek.kind;
    }
    return tok;
  }

  function node() {
    const root = Tree();
    let head = root;

    expect('[');
    accept_ws();
    if (tok_peek.kind == 'WORD') {
      root.nodeType = nodeType();
      while (accept('.')) {
        const newHead = Tree();
        head.children.push(newHead);
        newHead.nodeType = nodeType();
        head = newHead;
      }

      // + '' is to make typescript be quite...
      switch (tok_peek.kind as TokenKind) {
        case '[':
          head.children = nodeList();
          break;
        case '*':
        case '.':
        case '/':
        case '_':
        case '^':
        case 'WORD':
          head.leaf = nodeData();
          break;
      }
    }

    expect(']');

    return root;
  }

  function nodeType() {
    const nt = { name: '', sub: '', sup: '' };
    nt.name = expect('WORD').value as string;

    if (accept('_')) {
      nt.sub = expect('WORD').value as string;
      if (accept('^')) {
        nt.sup = expect('WORD').value as string;
      }
    } else if (accept('^')) {
      nt.sup = expect('WORD').value as string;
      if (accept('_')) {
        nt.sub = expect('WORD').value as string;
      }
    }

    return nt;
  }

  function nodeList() {
    const nodes = [];

    accept_ws();
    while (tok_peek.kind === '[') {
      nodes.push(node());
      accept_ws();
    }

    return nodes;
  }

  function nodeData() {
    let data = '';
    let collapsed = false;

    if (accept('/')) {
      data = '∅';
    } else {
      if (accept('*')) {
        collapsed = true;
      }
      data += expect('WORD').value;
      while (
        tok_peek.kind != '[' &&
        tok_peek.kind != ']' &&
        tok_peek.kind != 'EOF'
      ) {
        data += tok_peek.value ? tok_peek.value : tok_peek.kind;
        tok_peek = toks.next().value;
      }
    }

    return { data: data, isCollapsed: collapsed };
  }
}

/**
 * Returns generator, producing tokens from an input string to be parsed.
 *
 * @param input
 * @returns Generator of tokens.
 */
function* tokenize(input: string): Generator<Token, Token, void> {
  const whitespace = /\s/;
  const symbols = /[.*/_^[\]]/;
  let cur = 0;

  while (cur < input.length) {
    if (symbols.test(input[cur])) {
      yield { kind: input[cur] as TokenKind };
      cur++;
    } else if (whitespace.test(input[cur])) {
      const tok = { kind: 'WHITESPACE' as const, value: '' };
      while (whitespace.test(input[cur])) {
        tok.value = tok.value.concat(input[cur]);
        cur++;
      }
      yield tok;
    } else {
      const tok = { kind: 'WORD' as const, value: '' };
      while (
        cur < input.length &&
        !symbols.test(input[cur]) &&
        !whitespace.test(input[cur])
      ) {
        tok.value = tok.value.concat(input[cur]);
        cur++;
      }
      yield tok;
    }
  }

  return { kind: 'EOF' as const };
}

export { tokenize, parse };
