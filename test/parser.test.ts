describe('lexer and parser tests', () => {
  test('lexer tokenizes symbols', () => {
    const toks = tokenizer('.*/_^[]');
    expect(toks.next().type).toBe('.');
    expect(toks.next().type).toBe('*');
    expect(toks.next().type).toBe('/');
    expect(toks.next().type).toBe('_');
    expect(toks.next().type).toBe('^');
    expect(toks.next().type).toBe('[');
    expect(toks.next().type).toBe(']');
  });
});
