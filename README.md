# Import extension for Fepper

### Commands

```shell
fp import:erb
fp import:hbs
fp import:jsp
fp import:php
fp import:twig
fp import:assets
fp import:scripts
fp import:styles
fp export
```

An -f argument may be passed with any of these commands for targeting a single 
file. The target file must be in `patternlab-node/source`, either the .mustache 
or .yml.

The -f argument is optional for all commands except `fp export`. The `fp export` 
command does exactly the same as `fp template`, but will target only a single 
file.
