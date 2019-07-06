# Template Import extension for Fepper

[![Known Vulnerabilities][snyk-image]][snyk-url]
[![Mac/Linux Build Status][travis-image]][travis-url]
[![Windows Build Status][appveyor-image]][appveyor-url]
[![Coverage Status][coveralls-image]][coveralls-url]
[![License][license-image]][license-url]

### WARNING! Importing from the backend will overwrite your frontend files!

### Install

```shell
cd extend
npm install --save-dev fp-import
```

### Commands

* [fp import](#fp-import)
* [fp import:erb](#fp-import-erb)
* [fp import:hbs](#fp-import-hbs)
* [fp import:jsp](#fp-import-jsp)
* [fp import:php](#fp-import-php)
* [fp import:twig](#fp-import-twig)
* [fp import:asset](#fp-import-asset)
* [fp import:script](#fp-import-script)
* [fp import:style](#fp-import-style)
* [fp export](#fp-export)

#### <a id="fp-import"></a>`fp import`

`fp import` will import assets, scripts, styles, and templates from the backend 
into the Fepper frontend. This works in the opposite direction of the standard 
Fepper tasks `fp frontend-copy`, `fp template`, and `fp syncback`.

In order for any files to be imported, the following preferences must be set 
(optionally per file type):

* `assets_dir`
* `scripts_dir`
* `styles_dir`
* `templates_dir`
* `templates_ext`

They can be set in one of two ways:

* In `pref.yml` under `backend.synced_dirs`.
* In a `.yml` file with a basename that matches the basename of the file to be 
  imported, in the directory of the destination in the frontend.

The `{file type}_dir` preference must be a directory path relative to the 
`backend` directory in your Fepper project. It must not contain leading or 
trailing slashes. The files in this directory will be imported into the 
corresponding frontend directory as declared in `patternlab-config.json`. Be 
sure to understand that Fepper's naming convention differs from Pattern Lab's, 
but they map intuitively:

* `assets` -> `images`
* `scripts` -> `js`
* `styles` -> `css`

Things may be little tricky regarding the subdirectory nesting of assets, 
scripts, and styles. In the frontend, the `_assets`, `_scripts`, and 
`_styles` directories each have `src` and `bld` subdirectories. This is for the 
purpose of processing source files into builds destined for the consumer.

For assets, scripts, and styles, if `backend.synced_dirs.{file type}_dir` is set 
in `pref.yml`, there must be a corresponding `src` or `bld` directory in the 
backend. If `{file type}_dir` is set in a local `.yml` file, the backend 
directory maps directly to the frontend directory, with no nesting 
subdirectories. `src` and `bld` directories are not necessary in this case.

Templates do not concern themselves with `src` or `bld` subdirectories.

Assets, scripts, and styles will retain their file extensions. Templates will 
not. `fp import` identifies template languages by the extension of the backend 
template, and changes it to `.mustache` for the translated frontend template. 
For the basic `fp import` command, backend template extensions must match these 
spellings exactly:

* `.erb`
* `.hbs`
* `.jsp`
* `.php`
* `.twig`

Templates in the backend can contain Feplet (Mustache) code intended for import 
into the Fepper frontend. They can be left unrendered in the browser by being 
wrapped in HTML comment tags:

```handlebars
<!--{{> 03-templates/partial }}-->
```

This combination of HTML comment and Feplet tags will be imported into the 
Fepper frontend as just Feplet tags. (They will be stripped of the HTML comment 
tags.) The YAML must look like the following so the HTML comment tags get 
reinstated when the frontend template gets exported back to the backend, i.e., 
by running `fp template` or `fp export`. (In YAML, double curly braces must be 
escaped):

```yaml
'> 03-templates/partial': |2
  <!--\{\{> 03-templates/partial \}\}-->
```

---

#### <a id="fp-import-erb"></a>`fp import:erb -f <path to backend file>`<br />`fp import:erb -f <path to frontend file>`

A targeted import for an Embedded Ruby template. This type of import allows for 
alternate file extensions since the language is declared in the command.

#### <a id="fp-import-hbs"></a>`fp import:hbs -f <path to backend file>`<br />`fp import:hbs -f <path to frontend file>`

A targeted import for a Handlebars template. This type of import allows for 
alternate file extensions since the language is declared in the command.

#### <a id="fp-import-jsp"></a>`fp import:jsp -f <path to backend file>`<br />`fp import:jsp -f <path to frontend file>`

A targeted import for a Java Server Pages template. This type of import allows 
for alternate file extensions since the language is declared in the command.

#### <a id="fp-import-php"></a>`fp import:php -f <path to backend file>`<br />`fp import:php -f <path to frontend file>`

A targeted import for a PHP template. This type of import allows for alternate 
file extensions since the language is declared in the command.

#### <a id="fp-import-twig"></a>`fp import:twig -f <path to backend file>`<br />`fp import:twig -f <path to frontend file>`

A targeted import for a Twig template. This type of import allows for alternate 
file extensions since the language is declared in the command.

#### <a id="fp-import-asset"></a>`fp import:asset -f <path to backend file>`<br />`fp import:asset -f <path to frontend file>`

A targeted import for an asset file.

#### <a id="fp-import-script"></a>`fp import:script -f <path to backend file>`<br />`fp import:script -f <path to frontend file>`

A targeted import for a script file.

#### <a id="fp-import-style"></a>`fp import:style -f <path to backend file>`<br />`fp import:style -f <path to frontend file>`

A targeted import for a style file.

#### <a id="fp-export"></a>`fp export -f <path to frontend file>`

A targeted export of a frontend file to the backend. For assets, scripts, and 
styles, this just copies to the backend, like `fp frontend-copy`, except 
targeted. For templates, this translates as well, like `fp template`, except 
targeted.

[snyk-image]: https://snyk.io/test/github/electric-eloquence/fp-import/master/badge.svg
[snyk-url]: https://snyk.io/test/github/electric-eloquence/fp-import/master

[travis-image]: https://img.shields.io/travis/electric-eloquence/fp-import.svg?label=mac%20%26%20linux
[travis-url]: https://travis-ci.org/electric-eloquence/fp-import

[appveyor-image]: https://img.shields.io/appveyor/ci/e2tha-e/fp-import.svg?label=windows
[appveyor-url]: https://ci.appveyor.com/project/e2tha-e/fp-import

[coveralls-image]: https://img.shields.io/coveralls/electric-eloquence/fp-import/master.svg
[coveralls-url]: https://coveralls.io/r/electric-eloquence/fp-import

[license-image]: https://img.shields.io/github/license/electric-eloquence/fp-import.svg
[license-url]: https://raw.githubusercontent.com/electric-eloquence/fp-import/master/LICENSE
