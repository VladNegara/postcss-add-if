import postcss from 'postcss';
import { describe, expect, it } from '@jest/globals';
import dedent from 'dedent';

import plugin from './';

async function run(input: string, output: string, opts = {}) {
  input = dedent(input);
  output = dedent(output);
  let result = await postcss([plugin(opts)]).process(input, { from: undefined })
  expect(result.css).toBe(output)
  expect(result.warnings().length).toBe(0)
}

describe('The postcss-add-if plugin', () => {
  it('adds the if function', async () => {
    await run(
      `body {
        background: #eeeeee;
        @media print {
          background: white;
        }
      }`,
      `body {
        background: if(media(print): white; else: #eeeeee);
      }`
    )
  });
});
