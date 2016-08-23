/**
 * @todo Bring a full-fledge Handlebars parser into Pattern Lab, so we can just
 *   drop Handlebars templates from backend to front, and vice-versa, without
 *   modification.
 */
'use strict';

const conf = global.conf;
const pref = global.pref;
const rootDir = global.rootDir;

const fs = require('fs-extra');
const glob = require('glob');
const gulp = require('gulp');
const path = require('path');
const yaml = require('js-yaml');

const utils = require('../../../app/core/lib/utils');

const srcDir = path.normalize(`${rootDir}/${conf.ui.paths.source.root}`);

const engines = [
  'erb',
  'jsp',
  'hbs',
  'php',
  'twig'
];

const sourceDirDefaults = {
  assets: utils.backendDirCheck(pref.backend.synced_dirs.assets_dir) ? pref.backend.synced_dirs.assets_dir : '',
  scripts: utils.backendDirCheck(pref.backend.synced_dirs.scripts_dir) ? pref.backend.synced_dirs.scripts_dir : '',
  styles: utils.backendDirCheck(pref.backend.synced_dirs.styles_dir) ? pref.backend.synced_dirs.styles_dir : '',
  templates: utils.backendDirCheck(pref.backend.synced_dirs.templates_dir) ? pref.backend.synced_dirs.templates_dir : ''
};

const sourceExtDefaults = {
  assets: utils.extCheck(pref.backend.synced_dirs.assets_ext),
  scripts: utils.extCheck(pref.backend.synced_dirs.scripts_ext),
  styles: utils.extCheck(pref.backend.synced_dirs.styles_ext),
  templates: utils.extCheck(pref.backend.synced_dirs.templates_ext)
};

const targetDirDefaults = {
  assets: `${srcDir}/_assets`,
  scripts: `${srcDir}/_scripts/src`,
  styles: `${srcDir}/_styles`,
  templates: `${srcDir}/_patterns/03-templates`
};

// Using an expression instead of a statement only for categorical purposes.
// Keeping consts with consts while defining getDelimiters before FpImporter to
// avoid hoisting.
const getDelimiters = function (engine) {
  switch (engine) {
    case 'erb':
      return ['<%', '%>'];

    case 'jsp':
      return ['<%[^\-]', '[^\-]%>'];

    case 'hbs':
      return ['\\{\\{[^!]', '\\}\\}'];

    case 'php':
      return ['<\\?', '\\?>'];

    case 'twig':
      return ['\\{%', '%\\}'];
  }

  return null;
};

class FpImporter {
  constructor(file, type, engine) {
    this.data;
    this.engine = engine || '';
    this.file = file;
    this.sourceDir;
    this.sourceFile;
    this.type = type;

    var stats;
    var yml;

    try {
      stats = fs.statSync(this.file);
    }
    catch (err) {
      // Fail gracefully.
    }

    // Check if file exists. Read its YAML if it does.
    if (stats && stats.isFile()) {
      try {
        yml = fs.readFileSync(file, conf.enc);
        this.data = yaml.safeLoad(yml);
      }
      catch (err) {
        utils.error(err);
        return;
      }
    }

    this.data = this.data || {};

    // Cast undefined configs as empty strings. Trim defined configs.
    switch (type) {
      case 'assets':
        this.data.assets_dir = this.data.assets_dir || '';
        this.data.assets_ext = this.data.assets_ext || '';
        this.data.assets_dir = this.data.assets_dir.trim();
        this.data.assets_ext = this.data.assets_ext.trim();
        break;

      case 'scripts':
        this.data.scripts_dir = this.data.scripts_dir || '';
        this.data.scripts_ext = this.data.scripts_ext || '';
        this.data.scripts_dir = this.data.scripts_dir.trim();
        this.data.scripts_ext = this.data.scripts_ext.trim();
        break;

      case 'styles':
        this.data.styles_dir = this.data.styles_dir || '';
        this.data.styles_ext = this.data.styles_ext || '';
        this.data.styles_dir = this.data.styles_dir.trim();
        this.data.styles_ext = this.data.styles_ext.trim();
        break;

      case 'templates':
        this.data.templates_dir = this.data.templates_dir || '';
        this.data.templates_ext = this.data.templates_ext || '';
        this.data.templates_dir = this.data.templates_dir.trim();
        this.data.templates_ext = this.data.templates_ext.trim();
        this.targetMustache;
        this.targetMustacheFile = file.replace(/\.yml$/, '.mustache');
        break;
    }
  }

  setData(data) {
    this.data = data;
  }

  setSourceDir(sourceDir) {
    this.sourceDir = sourceDir;
  }

  replaceTags() {
    var delimiters = getDelimiters(this.engine);
    if (!delimiters) {
      return;
    }

    var code = fs.readFileSync(this.sourceFile, conf.enc);
    var regex;

    if (this.engine === 'hbs') {
      // Do not import commented-out Handlebars tags.
      // Not including the closing HTML comment tag because it causes regex to
      // fail if the closing delimiter is at the end of the line.
      regex = new RegExp(`(^\\s*|[^<][^!][^\\-][^\\-][^\\{][^\\{][^!])${delimiters[0]}[\\S\\s]*?${delimiters[1]}`, 'gm');
    }
    else {
      regex = new RegExp(`${delimiters[0]}[\\S\\s]*?${delimiters[1]}`, 'g');
    }

    fs.writeFileSync(this.file, '');
    if (
      (this.data.templates_dir && this.data.templates_dir !== sourceDirDefaults.templates) ||
      (this.data.templates_ext && this.data.templates_ext !== sourceExtDefaults.templates)
    ) {

      if (this.data.templates_dir && this.data.templates_dir !== sourceDirDefaults.templates) {
        fs.appendFileSync(this.file, `'templates_dir': |2\n`);
        fs.appendFileSync(this.file, `  ${this.data.templates_dir}\n`);
      }
      if (this.data.templates_ext && this.data.templates_ext !== sourceExtDefaults.templates) {
        fs.appendFileSync(this.file, `'templates_ext': |2\n`);
        fs.appendFileSync(this.file, `  ${this.data.templates_ext}\n`);
      }
    }

    this.targetMustache = code;
    if (this.engine === 'jsp') {
      this.writeYml(/<%--[\S\s]*?--%>/g, 'jcomment', ['<%--', '--%>']);
      this.writeYml(/<\/?\w+:[\S\s]*?[^%]>/g, 'jstl', ['<[^%]', '[^%]>']);
    }
    this.writeYml(regex, this.engine);
    fs.writeFileSync(this.targetMustacheFile, this.targetMustache);
  }

  retainMustache() {
    var regex;
    var matches;

    if (this.engine === 'hbs') {
      regex = new RegExp('<!--\\{\\{!\\{\\{[\\S\\s]*?\\}\\}-->', 'g');
    }
    else {
      regex = new RegExp('<!--\\{\\{[\\S\\s]*?\\}\\}-->', 'g');
    }
    matches = this.targetMustache.match(regex);

    if (matches) {
      for (let i = 0; i < matches.length; i++) {
        let key = '';
        let value = '';

        if (this.engine === 'hbs') {
          key = matches[i].slice(7, -3);
          this.targetMustache = this.targetMustache.replace(matches[i], key);
        }
        else {
          key = matches[i].slice(4, -3);
          this.targetMustache = this.targetMustache.replace(matches[i], key);
        }

        key = key.replace(/^\{\{\s*/, '');
        key = key.replace(/\s*\}\}$/, '');
        // Escape reserved YAML characters with backslashes.
        key = key.replace(/([\(\)\*\?\[\]\^\|])/g, '\\$1');
        // Escape single-quotes by duplicating them.
        key = key.replace(/'/g, '\'\'');
        // Can't include the pipe because it breaks the search.
        key = `'${key}': `;

        // Skip duplicate keys.
        let data = fs.readFileSync(this.file, conf.enc);
        if (data.search(key) > -1) {
          continue;
        }

        value = matches[i].replace(/\{\{/g, '\\{\\{');
        value = value.replace(/\}\}/g, '\\}\\}');

        fs.appendFileSync(this.file, `${key}|2\n`);
        fs.appendFileSync(this.file, `  ${value}\n`);
      }
      fs.writeFileSync(this.targetMustacheFile, this.targetMustache);
    }
  }

  writeYml(regex, keyBase, delimiters) {
    delimiters = delimiters || getDelimiters(keyBase);
    if (!delimiters) {
      return;
    }

    var matches = this.targetMustache.match(regex);

    if (matches) {
      for (let i = 0; i < matches.length; i++) {
        let key = '';
        let value = '';
        let values = [];
        let regex = new RegExp(`${delimiters[0]}[\\S\\s]*?${delimiters[1]}`);

        if (i === 0) {
          key = keyBase;
        }
        else {
          key = `${keyBase}_${i}`;
        }

        values = regex.exec(matches[i]);
        value = values[0].replace(/^/gm, '  ');
        value = value.replace(/\{\{/g, '\\{\\{');
        value = value.replace(/\}\}/g, '\\}\\}');

        fs.appendFileSync(this.file, `'${key}': |2\n`);
        fs.appendFileSync(this.file, `${value}\n`);

        this.targetMustache = this.targetMustache.replace(values[0], `{{{ ${key} }}}`);
      }
    }
  }

  main() {
    if ((this.data[`${this.type}_dir`] || sourceDirDefaults[this.type]) && (this.data[`${this.type}_ext`] || sourceExtDefaults[this.type])) {
      if (!this.sourceDir) {
        let nestedDirs = '';
        let sourceDir = '';

        if (this.data[`${this.type}_dir`]) {
          sourceDir = this.data[`${this.type}_dir`];
        }
        else {
          nestedDirs = path.dirname(this.file).replace(targetDirDefaults[this.type].replace(`${rootDir}/`, ''), '');
          sourceDir = sourceDirDefaults[this.type];
        }

        sourceDir = sourceDir + nestedDirs;
        this.sourceDir = utils.backendDirCheck(sourceDir).replace(`${rootDir}/`, '');
      }

      this.sourceExt = this.data[`${this.type}_ext`] || sourceExtDefaults[this.type];
      this.sourceExt = this.sourceExt;
      let basename = path.basename(this.file).replace(/\.yml$/, `.${this.sourceExt}`);
      this.sourceFile = utils.pathResolve(`${this.sourceDir}/${basename}`);

      if (this.type === 'templates') {
        this.replaceTags();
        this.retainMustache();
      }
      else {
        fs.copySync(this.sourceFile, `${path.dirname(this.file)}/${basename}`);

        let dir = this.data[`${this.type}_dir`];
        let ext = this.data[`${this.type}_ext`];

        if (dir || ext) {
          fs.writeFileSync(this.file, '');

          if (dir) {
            fs.appendFileSync(this.file, `'${this.type}_dir': |2\n`);
            fs.appendFileSync(this.file, `  ${dir}\n`);
          }
          if (ext) {
            fs.appendFileSync(this.file, `'${this.type}_ext': |2\n`);
            fs.appendFileSync(this.file, `  ${ext}\n`);
          }
        }
      }

      // Log to console.
      utils.log(`${(this.engine || this.type)} file \x1b[36m%s\x1b[0m imported.`, this.sourceFile);
    }
  }
}

function exportBackendFile(argv) {
  // First, check for -f argument, and import single file, and then exit.
  if (!argv || !argv.f) {
    utils.error('Error: need an -f argument!');
    return;
  }

  if (argv.f.indexOf(conf.ui.paths.source.root) !== 0) {
    utils.error(`Error: invalid path! Must be under ${conf.ui.paths.source.root}`);
    return;
  }

  var basename;
  var file = path.normalize(`${rootDir}/${argv.f}`);
  var fpImporter;
  var type;
  var ymlFile;

  for (let i in targetDirDefaults) {
    if (targetDirDefaults.hasOwnProperty(i)) {
      if (file.indexOf(targetDirDefaults[i]) === 0) {
        type = i;

        if (i !== 'templates') {
          if (file.slice(-4) === 'yml') {
            ymlFile = file;
          }
          else {
            ymlFile = file.replace(/\.\w+$/, '.yml');
          }

          fpImporter = new FpImporter(ymlFile, i);

          if (file.slice(-4) === '.yml') {
            file = file.slice(0, -4) + '.' + fpImporter.data[`${i}_ext`];
          }

          basename = path.basename(file);
          fs.copySync(file, rootDir + '/backend/' + fpImporter.data[`${i}_dir`] + '/' + basename);

          // Log to console.
          utils.log(`${type} file \x1b[36m%s\x1b[0m exported.`, file);

          return;
        }
        break;
      }
    }
  }

  if (type !== 'templates') {
    utils.error('Error: Not a valid file for export!');
    return;
  }

  var templater = require('../../../app/core/tasks/templater');
  var nestedDirs = path.dirname(file).replace(`${targetDirDefaults.templates}`, '');
  var sourceDirDefault = utils.backendDirCheck(sourceDirDefaults.templates + nestedDirs);

  templater.templateProcess(file, sourceDirDefault, sourceExtDefaults.templates, rootDir, conf, pref);
}

function importBackendFiles(type, engine, argv) {
  // First, check for -f argument, and import single file, and then exit.
  if (argv && argv.f) {
    if (argv.f.indexOf(conf.ui.paths.source.root) !== 0) {
      utils.error(`Error: invalid path! Must be under ${conf.ui.paths.source.root}`);
      return;
    }

    // Requires relative path, not absolute.
    let file = path.normalize(`${rootDir}/${argv.f}`);
    let fpImporter = {};
    let stats = null;

    try {
      stats = fs.statSync(file);
    }
    catch (err) {
      utils.error(err);
      return;
    }

    // Only process valid files.
    if (stats && stats.isFile()) {
      if (path.extname(file) !== '.yml') {
        file = file.replace(/\.\w+$/, '.yml');
        fs.writeFileSync(file, '');
      }
      fpImporter = new FpImporter(file, type, engine);
      fpImporter.main();
    }

    return;
  }

  let files = [];

  switch (type) {
    case 'assets':
      files = glob.sync(`${srcDir}/_assets/**/*.yml`) || [];
      break;
    case 'scripts':
      files = glob.sync(`${srcDir}/_scripts/src/**/*.yml`) || [];
      break;
    case 'styles':
      files = glob.sync(`${srcDir}/_styles/**/*.yml`) || [];
      break;
    case 'templates':
      files = glob.sync(`${srcDir}/_patterns/03-templates/**/*.yml`) || [];
      break;
  }

  for (let i = 0; i < files.length; i++) {
    let fpImporter = {};
    let stats = null;

    try {
      stats = fs.statSync(files[i]);
    }
    catch (err) {
      // Fail gracefully.
    }

    // Only process valid files.
    if (stats && stats.isFile()) {
      fpImporter = new FpImporter(files[i], type, engine);
      fpImporter.main();
    }
  }

  // Allowing a mass import of files under sourceDirDefaults[type].
  // Skips the files processed in the above block.
  if (sourceDirDefaults[type] && (type !== 'templates' || sourceExtDefaults[type])) {
    let dir = sourceDirDefaults[type];
    let ext = sourceExtDefaults[type] || '.*';
    let files1 = glob.sync(`${rootDir}/backend/${dir}/**/*${ext}`);

    globbed:
    for (let i = 0; i < files1.length; i++) {
      // Do not proceed if default extension is set and this doesn't have it.
      if (sourceExtDefaults[type] && path.extname(files1[i]) !== `.${sourceExtDefaults[type]}`) {
        continue;
      }

      // Do not proceed if this is a minified script.
      if (type === 'scripts' && /\.min\.\w+$/.test(files1[i])) {
        continue;
      }

      // Only proceed if wasn't in processed in for files loop.
      for (let j = 0; j < files.length; j++) {
        let data = null;
        let stats = null;
        let yml = '';

        try {
          stats = fs.statSync(files[j]);
        }
        catch (err) {
          // Fail gracefully.
        }

        // Check if file exists. Read its YAML if it does.
        if (stats && stats.isFile()) {
          try {
            yml = fs.readFileSync(files[j], conf.enc);
            data = yaml.safeLoad(yml);
          }
          catch (err) {
            utils.error(err);
            return;
          }
        }

        data = data || {};

        if (
          data[`${type}_dir`] &&
          data[`${type}_dir`] === path.dirname(files1[i]).replace(`${rootDir}/backend/`, '')
        ) {
          if (sourceExtDefaults[type] && path.basename(files[j]).replace(/yml$/, sourceExtDefaults[type]) === path.basename(files1[i])) {
            continue globbed;
          }
          else if (path.basename(files[j]).slice(0, -4) === path.basename(files1[i]).replace(/\.\w+$/, '')) {
            continue globbed;
          }
        }
      }

      let data = {};
      let dirP = '';
      let fileYml = '';
      let fileYmlBasename = '';
      let fpImporter = {};
      let nestedDirs = '';
      let stats = null;
      let sourceDir = '';

      if (sourceExtDefaults[type]) {
        fileYmlBasename = path.basename(files1[i], sourceExtDefaults[type]) + 'yml';
      }
      else {
        fileYmlBasename = path.basename(files1[i]).replace(/\.\w+$/, '.yml');
      }

      nestedDirs = path.dirname(files1[i]).replace(`${rootDir}/backend/${dir}`, '');
      fileYml = targetDirDefaults[type];
      fileYml += nestedDirs;
      dirP = fileYml;
      fileYml += '/' + fileYmlBasename;
      sourceDir = utils.backendDirCheck(sourceDirDefaults[type] + nestedDirs);

      // Only proceed if a YAML has not been created for this file.
      try {
        stats = fs.statSync(fileYml);
      }
      catch (err) {
        // Fail gracefully.
      }

      if (stats) {
        continue;
      }

      let stats1 = null;

      try {
        stats1 = fs.statSync(dirP);
      }
      catch (err) {
        // Fail gracefully.
      }

      if (!stats1) {
        fs.mkdirpSync(dirP);
      }

      if (type !== 'templates' && path.extname(files1[i]).slice(1) !== sourceExtDefaults[type]) {
        data[`${type}_ext`] = path.extname(files1[i]).slice(1);
      }

      fpImporter = new FpImporter(fileYml, type, engine);
      fpImporter.setData(data);
      fpImporter.setSourceDir(sourceDir);
      fpImporter.main();
    }
  }
}

gulp.task('export', function (cb) {
  let argv = require('yargs')(process.argv).argv;

  exportBackendFile(argv);
  cb();
});

gulp.task('import', function (cb) {
  // If an -f argument was submitted, it's probably a mistake.
  let argv = require('yargs')(process.argv).argv;
  if (argv.f) {
    utils.error('Error: do not submit an -f argument for fp import!');
    cb();
    return;
  }

  let templatesExt = null;

  for (let i = 0; i < engines.length; i++) {
    if (sourceExtDefaults.templates === engines[i]) {
      templatesExt = engines[i];
    }
  }

  importBackendFiles('assets');
  importBackendFiles('scripts');
  importBackendFiles('styles');
  if (templatesExt) {
    importBackendFiles('templates', templatesExt);
  }
  cb();
});

gulp.task('import:assets', function (cb) {
  let argv = require('yargs')(process.argv).argv;

  importBackendFiles('assets', null, argv);
  cb();
});

gulp.task('import:scripts', function (cb) {
  let argv = require('yargs')(process.argv).argv;

  importBackendFiles('scripts', null, argv);
  cb();
});

gulp.task('import:styles', function (cb) {
  let argv = require('yargs')(process.argv).argv;

  importBackendFiles('styles', null, argv);
  cb();
});

for (let i = 0; i < engines.length; i++) {
  gulp.task(`import:${engines[i]}`, function (cb) {
    let argv = require('yargs')(process.argv).argv;

    importBackendFiles('templates', engines[i], argv);
    cb();
  });
}
