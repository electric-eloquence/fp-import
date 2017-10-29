# Import extension for Fepper

### WARNING! Importing from the backend will overwrite your frontend files, including YAML!

### Commands

```shell
fp import
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

`fp import` will import assets, scripts, styles, and templates of the type 
corresponding to `pref.backend.synced_dirs.templates_ext` configured in pref.yml. 
This `templates_ext` value must match the spelling of those listed above.

An -f argument may be passed with any of these commands, except for `fp import`, 
for targeting a single file. The target file must be in `ui/source`, either with 
the `.mustache` extension or the `.yml` extension.

The -f argument is required for `fp export`. The `fp export` command functions 
exactly the same as `fp template`, but will target only a single file.
