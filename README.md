> [!WARNING]
> This plugin is experimental and not intended for production code!

> [!NOTE]
> This plugin is currently under development, so it may undergo significant changes in the near future.

# postcss-add-if

A [PostCSS](https://github.com/postcss/postcss) plugin that refactors rules with nested `@media` and `@supports` queries to make use of [the `if()` function](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/if).

## Tests

To run the tests, follow the steps below:

1. Clone the repository.

```bash
git clone https://github.com/VladNegara/postcss-add-if
cd postcss-add-if
```

2. Install the dependencies.

```bash
npm ci
```

3. Run the tests!

```bash
npx jest
```
