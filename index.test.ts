import postcss from 'postcss';
import { describe, expect, it } from '@jest/globals';
import dedent from 'dedent';

import plugin from './index'
import type { PluginOptions } from './index';

async function expectChanged(input: string, output: string, opts = {}) {
  input = dedent(input);
  output = dedent(output);
  const result = await postcss([plugin(opts)]).process(input, { from: undefined });
  expect(result.css).toBe(output);
  expect(result.warnings().length).toBe(0);
}

async function expectUnchanged(input: string, opts: PluginOptions = {}) {
  await expectChanged(input, input, opts);
}

describe('The postcss-add-if plugin with default options', () => {
  describe('given a rule with no nested at-rules', () => {
    it('leaves the rule unchanged', async () => {
      await expectUnchanged(
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
          await expectUnchanged(
            `section {
              font-size: 14px;
              @media screen {
                max-width: 90%;
              }
            }`,
          );
        });

        it('does not refactor an @media rule with a media feature', async () => {
          await expectUnchanged(
            `.folded-indicator::after {
              @media (device-posture: folded) {
                content: "Device folded!";
              }
            }`,
          );
        });

        it('does not refactor an @supports rule with declaration syntax', async () => {
          await expectUnchanged(
            `h2 {
              font-weight: bold;
              @supports (font-size: 1.5rem) {
                font-size: 1.5rem;
              }
            }`,
          );
        });

        it('does not refactor an @supports rule with function syntax', async () => {
          await expectUnchanged(
            `blockquote {
              font-style: italic;
              @supports font-format(open-type) {
                font-family: Roboto;
              }
            }`,
          );
        });
      });

      describe('if the declaration conflicts with one previously defined in the rule', () => {
        it('refactors an @media rule with a media type', async () => {
          await expectChanged(
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
          await expectChanged(
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

        it('refactors an @supports rule with declaration syntax', async () => {
          await expectChanged(
            `main {
              display: grid;
              @supports (display: grid-lanes) {
                display: grid-lanes;
              }
            }`,
            `main {
              display: if(supports((display: grid-lanes)): grid-lanes; else: grid)
            }`,
          );
        });

        it('refactors an @supports rule with function syntax', async () => {
          await expectChanged(
            `em {
              font-weight: bold;
              @supports (font-tech: variations) {
                font-weight: 698;
              }
            }`,
            `em {
              font-weight: if(supports((font-tech: variations)): 698; else: bold)
            }`,
          )
        });
      });

      describe('if the declaration conflicts with one defined later in the rule', () => {
        it('does not refactor an @media rule with a media type', async () => {
          await expectUnchanged(
            `h1 {
              @media screen {
                font-weight: 900;
              }
              font-weight: 700;
            }`,
          );
        });

        it('does not refactor an @media rule with a media feature', async () => {
          await expectUnchanged(
            `header {
              @media (dynamic-range: high) {
                background: green;
              }
              background: red;
            }`,
          );
        });

        it('does not refactor an @supports rule with declaration syntax', async () => {
          await expectUnchanged(
            `span.gradient {
              @supports (background-clip: text;) {
                background-clip: text;
              }
              background-clip: content-box;
            }`,
          );
        });
      });
    });

    describe('if the at-rule contains two declarations', () => {
      describe('if only the first declaration conflicts with a previously defined one', () => {
        it('does not refactor an @media rule with a media type', async () => {
          await expectUnchanged(
            `div.important > aside p {
              font-size: 13px;
              letter-spacing: 0.1em;
              @media print {
                letter-spacing: 0.15em;
                color: #101010;
              }
            }`,
          );
        });
      });

      describe('if only the second declaration conflicts with a previously defined one', () => {
        it('does not refactor an @media rule with a media type', async () => {
          await expectUnchanged(
            `p:first-child::first-line {
              font-size: 1.1em;
              color: #da1;
              @media print {
                font-family: Calibri;
                color: #ddd;
              }
            }`,
          );
        });
      });

      describe('if both declarations conflict with previously defined ones in the rule', () => {
        it('refactors an @media rule with a media feature', async () => {
          await expectChanged(
            `nav.main-navigation {
              display: flex;
              flex-direction: column;
              gap: 1em;
              @media (display-mode: browser) {
                flex-direction: row;
                gap: 10px;
              }
            }`,
            `nav.main-navigation {
              display: flex;
              flex-direction: if(media((display-mode: browser)): row; else: column);
              gap: if(media((display-mode: browser)): 10px; else: 1em)
            }`,
          );
        });
      });
    });
  });

  describe('given a rule with two nested at-rules', () => {
    describe('if each at-rule contains one declaration', () => {
      describe('if neither declaration conflicts with one defined in the rule', () => {
        describe('if the two declarations also do not conflict with each other', () => {
          it('does not refactor @media rules with media types', async () => {
            await expectUnchanged(
              `nav a:link {
                color: blue;
                @media screen {
                  font-decoration: underline;
                }
                @media print {
                  display: inline-block;
                }
              }`
            );
          });
        });

        describe('if the two declarations conflict with each other', () => {
          it('does not refactor @media rules with media types', async () => {
            await expectUnchanged(
              `article {
                width: 100%;
                background: #dfddb4;
                @media screen {
                  font-size: 1.1em;
                }
                @media print {
                  font-size: 4vw;
                }
              }`,
            );
          });
        });
      });

      describe('if only the declaration in the first at-rule conflicts with a previously defined one', () => {
        it('refactors only the first @media rule with a media type', async () => {
          await expectChanged(
            `a:active {
              color: purple;
              @media screen {
                color: red;
              }
              @media print {
                font-style: italic;
              }
            }`,
            `a:active {
              color: if(media(screen): red; else: purple);
              @media print {
                font-style: italic;
              }
            }`,
          );
        });
      });

      describe('if both declarations conflict with the same previously defined one in the rule', () => {
        it('refactors two @media rules with media types', async () => {
          await expectChanged(
            `:root {
              color: darkgrey;
              @media screen {
                color: #111111;
              }
              @media print {
                color: #303030;
              }
            }`,
            `:root {
              color: if(media(print): #303030; media(screen): #111111; else: darkgrey)
            }`,
          );
        });
      });
    });
  });
});

describe('The postcss-add-if plugin with a maximum declaration count of 1', () => {
  const opts: PluginOptions = { maxDeclarations: 1 };

  describe('given a rule with one nested at-rule', () => {
    describe('if the at-rule contains one declaration', () => {
      describe('if the declaration conflicts with one previously defined in the rule', () => {
        it('refactors an @media rule with a media type', async () => {
          await expectChanged(
            `q {
              font-style: italic;
              color: grey;
              @media print {
                color: #333;
              }
            }`,
            `q {
              font-style: italic;
              color: if(media(print): #333; else: grey)
            }`,
            opts,
          )
        });
      });
    });

    describe('if the at-rule contains two declarations', () => {
      describe('if both declarations conflict with previously defined ones', () => {
        it('does not refactor an @media rule with a media type', async () => {
          await expectUnchanged(
            `div {
              margin: 0 2em;
              padding: 1rem;
              @media print {
                padding: 12px;
                margin: 0;
              }
            }`,
            opts,
          );
        });
      });
    });
  });
});
