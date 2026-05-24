import { PluginCreator } from "postcss";

export type PluginOptions = {
  maxDeclarations?: number,
  minQueries?: number,
};

const creator: PluginCreator<PluginOptions> = (opts?: PluginOptions) => {
  const options = Object.assign(
    // Default options
    {
      maxDeclarations: 1,
      minQueries: 1,
    },
    // Provided options
    opts,
  );

  return {
    postcssPlugin: 'postcss-add-if',
  };
}

creator.postcss = true;

export default creator;
