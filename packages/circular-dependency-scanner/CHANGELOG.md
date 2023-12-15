# 2.1.0

- feat(cli): parse tsconfig/jsconfig to get alias.
- revert(cli): remove `alias` support, use feature listed above instead.
- chore(deps): upgrade dependencies.

# 2.0.0

- feat(cli): add `--throw` option, to make command exit with code 1 when cycles're found, closed [#7](https://github.com/emosheeep/fe-tools/issues/7)
- chore(deps): update big version of major dependencies

## Breaking Change

- refactor(export): adjust exported fields

# 1.1.3

- fix(circular): trailing slash removing error

# 1.1.2

- docs: migrate to monorepo, replace relevant url

# 1.1.1

## docs

- docs: Use remote image instead.
- fix: JavaScript API didn't ignore node_modules by default.

# 1.1.0

## Feats

- feat: More friendly output.

# 1.0.2

## Fixes

- fix: ignores about `node_modules` doesn't effect.

# 1.0.1

## Fixes

- fix: can't run ds command with npm global install.

# 1.0.0

## Features

- feat: Supply JavaScript API and Command Line Tool.
