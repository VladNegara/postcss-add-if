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

describe('The postcss-add-if plugin with default options', () => {
  describe('given a rule with no nested at-rules', () => {
    it('leaves the rule unchanged', async () => {
      await run(
        `p {
          font-size: 1.1rem;
          font-weight: 500;
        }`,
        `p {
          font-size: 1.1rem;
          font-weight: 500;
        }`,
      );
    });
  });

  describe('given a rule with one nested at-rule', () => {
    describe('if the at-rule contains one declaration', () => {
      describe('if the declaration does not conflict with one defined in the rule', () => {
        it('does not refactor an @media rule with a media type', async () => {
          await run(
            `section {
              font-size: 14px;
              @media screen {
                max-width: 90%;
              }
            }`,
            `section {
              font-size: 14px;
              @media screen {
                max-width: 90%;
              }
            }`,
          )
        });
      });

      describe('if the declaration conflicts with one previously defined in the rule', () => {
        it('refactors an @media rule with a media type', async () => {
          await run(
            `body {
              background: #eeeeee;
              @media print {
                background: white;
              }
            }`,
            `body {
              background: if(media(print): white; else: #eeeeee)
            }`,
          );
        });

        it('refactors an @media rule with a media feature', async () => {
          await run(
            `a {
              text-decoration: none;
              @media (hover: hover) {
                text-decoration: underline;
              }
            }`,
            `a {
              text-decoration: if(media((hover: hover)): underline; else: none)
            }`,
          );
        });
      });

      describe('if the declaration conflicts with one defined later in the rule', () => {
        it('does not refactor an @media rule with a media type', async () => {
          await run(
            `h1 {
              @media screen {
                font-weight: 900;
              }
              font-weight: 700;
            }`,
            `h1 {
              @media screen {
                font-weight: 900;
              }
              font-weight: 700;
            }`,
          )
        });
      });
    });
  });
});

describe('The postcss-add-if plugin with a maximum declaration count of 1', () => {
  
});
