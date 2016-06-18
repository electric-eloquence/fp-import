/**
 * @todo Bring a full-fledge Handlebars parser into Pattern Lab, so we can just
 *   drop Handlebars templates from backend to front, and vice-versa, without
 *   modification.
 */
'use strict';

const conf = global.conf;
const pref = global.pref;

const fs = require('fs-extra');
const glob = require('glob');
const gulp = require('gulp');
const path = require('path');
const yaml = require('js-yaml');

const utils = require('../../../core/lib/utils');

const ROOT_DIR = utils.rootDir();

const sourceDirDefaults = {
  assets: utils.backendDirCheck(ROOT_DIR, pref.backend.synced_dirs.assets_dir) ? pref.backend.synced_dirs.assets_dir : '',
  scripts: utils.backendDirCheck(ROOT_DIR, pref.backend.synced_dirs.scripts_dir) ? pref.backend.synced_dirs.scripts_dir : '',
  styles: utils.backendDirCheck(ROOT_DIR, pref.backend.synced_dirs.styles_dir) ? pref.backend.synced_dirs.styles_dir : '',
  templates: utils.backendDirCheck(ROOT_DIR, pref.backend.synced_dirs.templates_dir) ? pref.backend.synced_dirs.templates_dir : ''
};

const sourceExtDefaults = {
  assets: utils.extCheck(pref.backend.synced_dirs.assets_ext),
  scripts: utils.extCheck(pref.backend.synced_dirs.scripts_ext),
  styles: utils.extCheck(pref.backend.synced_dirs.styles_ext),
  templates: utils.extCheck(pref.backend.synced_dirs.templates_ext)
};

const targetDirDefaults = {
  assets: `${ROOT_DIR}/${conf.src}/assets`,
  scripts: `${ROOT_DIR}/${conf.src}/scripts/src`,
  styles: `${ROOT_DIR}/${conf.src}/styles`,
  templates: `${ROOT_DIR}/${conf.src}/_patterns/03-templates`
};

// Using an expression instead of a statement only for categorical purposes.
// Keeping consts with consts while defining getDelimiters before FpImporter to
// avoid hoisting.
const getDelimiters = function (engine) {
  switch (engine) {
    case 'erb':
    case 'jsp':
      return ['<%', '%>'];

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
    this.assetsDir = '';
    this.data;
    this.engine = engine || '';
    this.file = file;
    this.scriptsDir = '';
    this.sourceDir;
    this.sourceFile;
    this.stylesDir = '';
    this.targetMustache;
    this.targetMustacheFile = file.replace(/\.yml$/, '.mustache');
    this.templatesDir = '';
    this.templatesExt = '';
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

    // Cast undefined configs as empty strings.
    switch (type) {
      case 'assets':
        this.data.assets_dir = this.data.assets_dir || '';
        this.data.assets_ext = this.data.assets_ext || '';
        break;

      case 'scripts':
        this.data.scripts_dir = this.data.scripts_dir || '';
        this.data.scripts_ext = this.data.scripts_ext || '';
        break;

      case 'styles':
        this.data.styles_dir = this.data.styles_dir || '';
        this.data.styles_ext = this.data.styles_ext || '';
        break;

      case 'templates':
        this.data.templates_dir = this.data.templates_dir || '';
        this.data.templates_ext = this.data.templates_ext || '';
        break;
    }
  }

  setData(data) {
    this.data = data;
  }

  replaceTags() {
    var delimiters = getDelimiters(this.engine);
    if (!delimiters) {
      return;
    }

    var code = fs.readFileSync(this.sourceFile, conf.enc);
    var regex = new RegExp(`${delimiters[0]}(.|\\s)*?${delimiters[1]}`, 'g');

    fs.writeFileSync(this.file, '');
    if (this.data.templates_dir && this.data.templates_dir.trim() !== sourceDirDefaults.templates) {
      fs.appendFileSync(this.file, '"templates_dir": |2\n');
      fs.appendFileSync(this.file, `  ${this.data.templates_dir}`);
    }
    if (this.data.templates_ext && this.data.templates_ext.trim() !== sourceExtDefaults.templates) {
      fs.appendFileSync(this.file, '"templates_ext": |2\n');
      fs.appendFileSync(this.file, `  ${this.data.templates_ext}`);
    }

    this.targetMustache = code;
    this.writeYml(regex, this.engine);
    if (this.engine === 'jsp') {
      this.writeYml(/<\/?\w+:(.|\s)*?>/g, 'jstl');
    }
    fs.writeFileSync(this.targetMustacheFile, this.targetMustache);
  }

  retainMustache() {
    var regex = new RegExp('<!--\\{\\{(.|\\s)*?\\}\\}-->', 'g');
    var matches = this.targetMustache.match(regex);

    if (matches) {
      for (let i = 0; i < matches.length; i++) {
        if (this.engine === 'hbs') {
          this.targetMustache = this.targetMustache.replace(matches[i], `{{${matches[i].slice(7, -3)}`);
        }
        else {
          this.targetMustache = this.targetMustache.replace(matches[i], matches[i].slice(4, -3));
        }
      }
      fs.writeFileSync(this.targetMustacheFile, this.targetMustache);
    }
  }

  writeYml(regex, engine) {
    var matches = this.targetMustache.match(regex);

    if (matches) {
      for (let i = 0; i < matches.length; i++) {
        let key = '';
        let value = '';

        if (i === 0) {
          key = engine;
        }
        else {
          key = `${engine}_${i}`;
        }
        value = matches[i].replace(/^/gm, '  ');
        fs.appendFileSync(this.file, `"${key}": |2\n`);
        fs.appendFileSync(this.file, `${value}\n`);
        this.targetMustache = this.targetMustache.replace(matches[i], `{{ ${key} }}`);
      }
    }
  }

  main() {
    if ((this.data[`${this.type}_dir`] || sourceDirDefaults[this.type]) && (this.data[`${this.type}_ext`] || sourceExtDefaults[this.type])) {
      this.sourceDir = utils.backendDirCheck(ROOT_DIR, this.data[`${this.type}_dir`]).replace(`${ROOT_DIR}/`, '');
      this.sourceExt = this.data[`${this.type}_ext`] || sourceExtDefaults[this.type];
      this.sourceExt = this.sourceExt.trim();
      this.sourceFile = this.sourceDir + '/' + path.basename(this.file).replace(/\.yml$/, `.${this.sourceExt}`);

      if (this.type === 'templates') {
        this.replaceTags();
        this.retainMustache();
      }
      else {
        fs.copySync(this.sourceFile, path.dirname(this.file));
      }

      // Log to console.
      utils.log(`${this.engine} file \x1b[36m%s\x1b[0m imported.`, this.sourceFile);
    }
  }
}

function importBackendFiles(type, engine) {
  var files;

  switch (engine) {
    case 'erb':
    case 'jsp':
    case 'hbs':
    case 'php':
    case 'twig':
      files = glob.sync(`${conf.src}/_patterns/03-templates/**/*.yml`);
      break;
    case 'assets':
      files = glob.sync(`${conf.src}/assets/**/*.yml`);
      break;
    case 'scripts':
      files = glob.sync(`${conf.src}/scripts/src/**/*.yml`);
      break;
    case 'styles':
      files = glob.sync(`${conf.src}/styles/**/*.yml`);
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

  // Allowing a mass import of files under sourceDirDefaults.
  // Skips the files processed in the above block.
  if (sourceDirDefaults[type] && sourceExtDefaults[type]) {
    let dir = sourceDirDefaults[type];
    let ext = sourceExtDefaults[type];
    let files1 = [];

    if (type === 'scripts') {
      files1 = glob.sync(`${ROOT_DIR}/backend/${dir}/**/*(!.min)${ext}`);
    }
    else {
      files1 = glob.sync(`${ROOT_DIR}/backend/${dir}/**/*${ext}`);
    }

    globbed:
    for (let i = 0; i < files1.length; i++) {
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
          data[`${type}_dir`].trim() === path.dirname(files1[i]).replace(`${ROOT_DIR}/backend/`, '') &&
          path.basename(files[j]).replace(/yml$/, sourceExtDefaults[type]) === path.basename(files1[i])
        ) {
          continue globbed;
        }
      }

      let data = {};
      let dirP = '';
      let fileYml = '';
      let fileYmlBasename = '';
      let fpImporter = {};
      let nestedDirs = '';
      let regex = new RegExp(`${sourceExtDefaults[type]}$`);
      let stats = null;

      // Only proceed if the extension matches.
      fileYmlBasename = path.basename(files1[i]).replace(regex, 'yml');
      if (fileYmlBasename === path.basename(files1[i])) {
        continue;
      }

      nestedDirs = path.dirname(files1[i]).replace(`${ROOT_DIR}/backend/${dir}`, '');
      fileYml = targetDirDefaults[type];
      fileYml += nestedDirs;
      dirP = fileYml;
      fileYml += '/' + fileYmlBasename;

      try {
        stats = fs.statSync(fileYml);
      }
      catch (err) {
        // Fail gracefully.
      }

      if (!stats) {
        let stats1 = null;

        try {
          stats1 = fs.statSync(dirP);
        }
        catch (err) {
          // Fail gracefully.
        }

        if (!stats1) {
          fs.mkdirsSync(dirP);
        }

        if (type === 'templates') {
          data.templates_dir = sourceDirDefaults.templates + nestedDirs;
          data.templates_dir += (data.templates_dir.slice(-1) !== '\n') ? '\n' : '';
        }

        fpImporter = new FpImporter(fileYml, type, engine);
        fpImporter.setData(data);
        fpImporter.main();
      }
    }
  }
}

gulp.task('import:erb', function (cb) {
  importBackendFiles('templates', 'erb');
  cb();
});

gulp.task('import:hbs', function (cb) {
  importBackendFiles('templates', 'hbs');
  cb();
});

gulp.task('import:jsp', function (cb) {
  importBackendFiles('templates', 'jsp');
  cb();
});

gulp.task('import:php', function (cb) {
  importBackendFiles('templates', 'php');
  cb();
});

gulp.task('import:twig', function (cb) {
  importBackendFiles('templates', 'twig');
  cb();
});
