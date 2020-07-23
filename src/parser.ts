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
 * Returns generator, producing tokens from an input string to be parsed.
 *
 * @param input
 * @returns Generator of tokens.
 */
function* tokenizer(input: string): Generator<Token, Token, void> {
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

export { tokenizer };
