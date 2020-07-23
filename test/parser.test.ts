import { tokenize, parse } from '../src/parser.ts';

describe('tokenize (lexer)', () => {
  test('tokenizes symbols', () => {
    const symbols = ['.', '*', '/', '_', '^', '[', ']'];
    const toks = tokenize(symbols.join(''));

    symbols.forEach((sym) => {
      expect(toks.next().value.kind).toBe(sym);
    });

    expect(toks.next().done).toBeTruthy();
  });

  test('tokenizes whitespace as whole tokens', () => {
    const spaces = [' ', '   ', '\n\n', '\t\n ', '\t\n   '];
    const toks = tokenize(spaces.join('.') + '.');

    spaces.forEach((space) => {
      let tok = toks.next().value;
      expect(tok.kind).toBe('WHITESPACE');
      expect(tok.value).toBe(space);
      tok = toks.next().value;
      expect(tok.kind).toBe('.');
    });

    expect(toks.next().done).toBeTruthy();
  });

  test('tokenizes words as whole tokens', () => {
    const words = ['a', 'aa', 'aaa'];
    const toks = tokenize(words.join(' ') + ' ');

    words.forEach((word) => {
      let tok = toks.next().value;
      expect(tok.kind).toBe('WORD');
      expect(tok.value).toBe(word);
      tok = toks.next().value;
      expect(tok.kind).toBe('WHITESPACE');
    });

    expect(toks.next().done).toBeTruthy();
  });

  test('breaks words on whitespace and symbols', () => {
    const breakers = ['.', '*', '/', '_', '^', '[', ']', ' ', '\t', '\n'];
    const word = 'aaa';
    const toks = tokenize(breakers.join(word) + word);

    breakers.slice(0, 7).forEach((breaker) => {
      let tok = toks.next().value;
      expect(tok.kind).toBe(breaker);
      tok = toks.next().value;
      expect(tok.kind).toBe('WORD');
      expect(tok.value).toBe(word);
    });

    breakers.slice(7).forEach((breaker) => {
      let tok = toks.next().value;
      expect(tok.kind).toBe('WHITESPACE');
      tok = toks.next().value;
      expect(tok.kind).toBe('WORD');
      expect(tok.value).toBe(word);
    });

    expect(toks.next().done).toBeTruthy();
  });
});

describe('parse', () => {
  test.each(
    // prettier-ignore
    ['[]',
     '[X]',
     '[X.X]',
     '[X_1^2]',
     '[X^2.X_1]',
     '[X data]',
     '  [  X  data  ]   ',
     '[X [X data] [Y data]]',
     '[X * this is data.]',
     '[XX.YY.ZZ* more data]',
     '[XX /]',
     '[X [XX [] [Y [Z data] ] ] [] ]',
     '[X this_data ^ has./punct* ]',
     '[X*X.X looks incorect, but is valid]',
    ]
  )("accepts the string '%s'", (str) => {
    expect(() => parse(str)).not.toThrow();
  });

  test.each(
    // prettier-ignore
    ['[',
     '[[]',
     '[]]',
     'X[]',
     '[X.]',
     '[X X []]',
     '[X [] X]',
     '[X /this_data ^starts with.punct* ]',
     '[/ data]'
    ]
  )("rejects the string '%s'", (str) => {
    expect(() => parse(str)).toThrow();
  });
});
