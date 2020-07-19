// interface Token {
//  type: string;
//  value?: string;
//}

function* tokenizer(input) {
  const whitespace = /\s/;
  const symbols = /[.*/_^[\]]/;
  let cur = 0;

  while (cur < input.length) {
    if (symbols.test(input[cur])) {
      yield { type: input[cur] };
      cur++;
    } else if (whitespace.test(input[cur])) {
      const tok = { type: 'WHITESPACE', value: '' };
      while (whitespace.test(input[cur])) {
        tok.value = tok.value.concat(input[cur]);
        cur++;
      }
      yield tok;
    } else {
      const tok = { type: 'WORD', value: '' };
      while (cur < input.length && !symbols.test(input[cur]) && !whitespace.test(input[cur])) {
        tok.value = tok.value.concat(input[cur]);
        cur++;
      }
      yield tok;
    }
  }
}

export { tokenizer };
