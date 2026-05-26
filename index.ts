import { PluginCreator } from "postcss";
import type { Declaration } from "postcss";
import valueParser from "postcss-value-parser";
import type { FunctionNode } from "postcss-value-parser";

export type PluginOptions = {
  maxDeclarations?: number | "infinite",
};

interface DeclarationStruct {
  baseDeclaration: Declaration,
  atRuleDeclarations: Declaration[],
  ifFunction: FunctionNode,
};

interface DeclarationDict {
  [index: string]: DeclarationStruct,
};

const creator: PluginCreator<PluginOptions> = (opts?: PluginOptions) => {
  const options = Object.assign(
    // Default options
    {
      maxDeclarations: "infinite",
    },
    // Provided options
    opts,
  );

  return {
    postcssPlugin: 'postcss-add-if',
    Rule(rule, helper) {
      let declarationDict: DeclarationDict = {}
      rule.each(node => {
        if (node.type == "decl") {
          let ifFunction: FunctionNode = {
            type: "function",
            value: "if",
            before: "",
            after: "",
            sourceIndex: 0, // TODO: fix this
            sourceEndIndex: 0, // TODO: fix this
            nodes: [
              {
                type: "word",
                value: "else",
                sourceIndex: 0,
                sourceEndIndex: 0,
              },
              {
                type: "div",
                value: ":",
                before: "",
                after: " ",
                sourceIndex: 0,
                sourceEndIndex: 0,
              },
              {
                type: "word",
                value: node.value,
                sourceIndex: 0,
                sourceEndIndex: 0,
              },
            ],
          };
          declarationDict[node.prop] = {
            baseDeclaration: node,
            atRuleDeclarations: [],
            ifFunction,
          };
        }
        if (node.type == "atrule") {
          if (node.name == "media" || node.name == "supports") {
            // If the at-rule contains any nested rule or at-rules, it cannot be
            // easily refactored into the if function. Skip the whole at-rule.
            if (node.some(n => n.type == "atrule" || n.type == "rule")) {
              return;
            }
            // If the at-rule contains a declaration that does not redefine a
            // property declared in the parent rule, an if function is not
            // suitable. Skip the whole at-rule.
            if (node.some(n => n.type == "decl" && !(n.prop in declarationDict))) {
              return;
            }
            // If the at-rule contains more declarations than the maximum count
            // allowed for refactoring, skip it.
            if (options.maxDeclarations != "infinite" && (node.nodes?.filter(n => n.type == "decl").length || 0) > options.maxDeclarations) {
              return;
            }

            node.each(child => {
              if (child.type == "decl") {
                let declarationStruct = declarationDict[child.prop];
                if (declarationStruct) {
                  declarationStruct.atRuleDeclarations.push(child);
                  declarationStruct.ifFunction.nodes.unshift(
                    {
                      type: "function",
                      value: node.name,
                      before: "",
                      after: "",
                      sourceIndex: 0,
                      sourceEndIndex: 0,
                      nodes: [
                        {
                          type: "word",
                          value: node.params,
                          sourceIndex: 0,
                          sourceEndIndex: 0,
                        },
                      ],
                    },
                    {
                      type: "div",
                      value: ":",
                      before: "",
                      after: " ",
                      sourceIndex: 0,
                      sourceEndIndex: 0,
                    },
                    {
                      type: "word",
                      value: child.value,
                      sourceIndex: 0,
                      sourceEndIndex: 0,
                    },
                    {
                      type: "div",
                      value: ";",
                      before: "",
                      after: " ",
                      sourceIndex: 0,
                      sourceEndIndex: 0,
                    },
                  );
                }
              }
            });

            node.remove();
          }
        }
      });
      for (const prop in declarationDict) {
        const declarationStruct = declarationDict[prop];
        if (!declarationStruct.atRuleDeclarations.length) {
          continue;
        }
        declarationStruct.baseDeclaration.value = valueParser.stringify(declarationStruct.ifFunction);
      }
    },
  };
};

creator.postcss = true;

export default creator;
