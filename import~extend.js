'use strict';

const path = require('path');
const {
  basename,
  dirname,
  extname
} = path;

const fs = require('fs-extra');
const glob = require('glob');
const gulp = global.gulp || require('gulp');
const slash = require('slash');
const utils = require('fepper-utils');
const yaml = require('js-yaml');
const yargs = require('yargs');

const normalize = rawPath => slash(path.normalize(rawPath));
const resolve = rawPath => slash(path.resolve(rawPath));

const conf = global.conf;
const pref = global.pref;
const rootDir = global.rootDir;

const engines = [
  '.erb',
  '.jsp',
  '.hbs',
  '.php',
  '.twig'
];

// Assigning anonymous functions to consts for categorical purposes.
// Named functions are declared further down the list of declarations, after the FpImporter class.
// While it makes some sense to declare getDelimiters there, we want to declare getDelimiters before FpImporter to avoid
// hoisting.
const getDelimiters = (engine) => {
  switch (engine) {
    case '.erb':
      return ['<%', '%>'];

    case '.hbs':
      return ['\\{\\{[^!]', '\\}\\}'];

    case '.jsp':
      return ['<%[^\\-]', '[^\\-]%>'];

    case '.php':
      return ['<\\?', '\\?>'];

    case '.twig':
      return ['\\{[#%\\{]', '[#%\\}]\\}'];
  }
};

const getIndexOfSubString = (string, subString) => {
  if (!subString) {
    return -1;
  }

  return string.indexOf(subString);
};

const getRelativePath = (relPath) => relPath.replace(`${rootDir}/`, '');

// We want to declare sourceDirDefaults, sourceExtDefaults, and targetDirDefaults as convenience objects, with
// properties keyed by type. Since we might mutate the pref object for testing (or any other practical purpose), we need
// to refresh their values each time those objects get consulted.
const refreshPrefs = () => {
  return {
    sourceDirDefaults: {
      assets: utils.backendDirCheck(pref.backend.synced_dirs.assets_dir),
      scripts: utils.backendDirCheck(pref.backend.synced_dirs.scripts_dir),
      styles: utils.backendDirCheck(pref.backend.synced_dirs.styles_dir),
      templates: utils.backendDirCheck(pref.backend.synced_dirs.templates_dir)
    },

    sourceExtDefaults: {
      assets: utils.extNormalize(pref.backend.synced_dirs.assets_ext),
      scripts: utils.extNormalize(pref.backend.synced_dirs.scripts_ext),
      styles: utils.extNormalize(pref.backend.synced_dirs.styles_ext),
      templates: utils.extNormalize(pref.backend.synced_dirs.templates_ext)
    },

    targetDirDefaults: {
      assets: conf.ui.paths.source.images,
      scripts: conf.ui.paths.source.js,
      styles: conf.ui.paths.source.css,
      templates: conf.ui.paths.source.templates
    }
  };
};

const replaceExtname = (file, ext) => file.slice(0, -(extname(file).length)) + ext;

class FpImporter {
  constructor(args) {
    const {
      file,
      type,
      engine,
      data,
      sourceDir,
      sourceExt,
      sourceFile
    } = args;

    this.engine = engine || '';
    this.file = file;
    this.type = type;
    this.data = data;
    this.sourceDir = sourceDir;
    this.sourceExt = sourceExt;
    this.sourceFile = sourceFile;

    const thisFileExists = fs.existsSync(this.file);

    if (!this.data) {
      if (thisFileExists) {
        try {
          const yml = fs.readFileSync(this.file, conf.enc);
          this.data = yaml.safeLoad(yml) || {};
        }
        catch (err) {
          /* istanbul ignore next */
          utils.error(err);
          /* istanbul ignore next */
          return;
        }
      }

      this.data = this.data || {};
      this.data[`${type}_dir`] = utils.backendDirCheck(this.data[`${type}_dir`]) || this.data[`${type}_dir`];
      this.data[`${type}_ext`] = utils.extNormalize(this.data[`${type}_ext`]) || this.data[`${type}_ext`];
    }

    this.data[`${type}_dir`] = this.data[`${type}_dir`] ? this.data[`${type}_dir`].trim() : '';
    this.data[`${type}_ext`] = this.data[`${type}_ext`] ? this.data[`${type}_ext`].trim() : '';

    const {
      sourceDirDefaults,
      sourceExtDefaults
    } = refreshPrefs();

    // These conditional assignments should be ok because the main method will error and return if there is a problem
    // with the local and global prefs.
    if (!this.sourceDir) {
      this.sourceDir = this.data[`${type}_dir`] || sourceDirDefaults[type] || '';
    }

    if (!this.sourceExt) {
      this.sourceExt = this.data[`${type}_ext`] || sourceExtDefaults[type] || '';
    }

    if (!this.sourceFile) {
      this.sourceFile = this.sourceDir + '/' + basename(this.file, '.yml') + this.sourceExt;
    }

    if (type === 'templates') {
      this.targetMustacheFile = this.file.replace(/\.yml$/, conf.ui.patternExtension);
    }
  }

  replaceTags() {
    const delimiters = getDelimiters(this.engine);

    /* istanbul ignore if */
    if (!delimiters) {
      return;
    }

    const {
      sourceDirDefaults,
      sourceExtDefaults
    } = refreshPrefs();

    fs.outputFileSync(this.file, '');

    if (this.data.templates_dir !== sourceDirDefaults.templates && this.sourceDir !== sourceDirDefaults.templates) {
      let dir;

      if (this.data.templates_dir) {
        dir = this.data.templates_dir.replace(`${conf.backend_dir}/`, '');
      }
      else {
        dir = this.sourceDir.replace(`${conf.backend_dir}/`, '');
      }

      fs.appendFileSync(this.file, '\'templates_dir\': |2\n');
      fs.appendFileSync(this.file, `  ${dir}\n`);
    }

    if (this.data.templates_ext !== sourceExtDefaults.templates && this.sourceExt !== sourceExtDefaults.templates) {
      fs.appendFileSync(this.file, '\'templates_ext\': |2\n');
      fs.appendFileSync(this.file, `  ${this.data.templates_ext || this.sourceExt}\n`);
    }

    const regex = new RegExp(`${delimiters[0]}[\\S\\s]*?${delimiters[1]}`, 'g');
    let code = fs.readFileSync(this.sourceFile, conf.enc);

    if (this.engine === '.hbs') {

      // Triple-stashes (for leaving rendered HTML unescaped) will not be processed correctly.
      // We need to convert them to {{& which does the same thing.
      code = code.replace(/\{\{\{([\S\s]*?)\}\}\}/g, '{{& $1}}');
    }

    if (this.engine === '.hbs' || this.engine === '.twig') {

      // Do not import Feplet tags nested within HTML comment tags.
      // They might be necessary for use as Fepper code.
      // However since Feplet tags are delimited the same as Handlebars tags,
      // escape commented Feplet here, and restore them later.
      code = code.replace(/<!--\s*\{\{/g, '<!--<%');
      code = code.replace(/\}\}\s*-->/g, '%>-->');
    }

    this.targetMustache = code;

    if (this.engine === '.jsp') {
      this.writeYml(/<%--[\S\s]*?--%>/g, 'jcomment', ['<%--', '--%>']);
      this.writeYml(/<\/?\w+:[\S\s]*?[^%]>/g, 'jstl', ['<[^%]', '[^%]>']);
    }

    this.writeYml(regex, this.engine);
    fs.outputFileSync(this.targetMustacheFile, this.targetMustache);
  }

  retainMustache() {
    /* istanbul ignore if */
    if (!this.targetMustache) {
      return;
    }

    let regex;
    let matches;

    if (this.engine === '.hbs' || this.engine === '.twig') {
      regex = new RegExp('<!--<%[\\S\\s]*?%>-->', 'g');
    }
    else {
      regex = new RegExp('<!--\\{\\{[\\S\\s]*?\\}\\}-->', 'g');
    }

    matches = this.targetMustache.match(regex);

    if (matches) {
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        let key = match.slice(4, -3);
        let value = '';

        if (this.engine === '.hbs' || this.engine === '.twig') {
          key = '{{' + key.slice(2, -2) + '}}';
        }

        this.targetMustache = this.targetMustache.replace(match, key);

        key = key.replace(/^\{\{\s*/, '');
        key = key.replace(/\s*\}\}$/, '');
        // Escape reserved YAML characters with backslashes.
        // eslint-disable-next-line no-useless-escape
        key = key.replace(/([\(\)\*\?\[\]\^\|])/g, '\\$1');
        // Escape single-quotes by duplicating them.
        key = key.replace(/'/g, '\'\'');
        // Can't include the pipe because it breaks the indexOf() search. But must include everything before.
        key = `'${key}': `;

        // Skip duplicate keys.
        let data = fs.readFileSync(this.file, conf.enc);

        /* istanbul ignore if */
        if (data.indexOf(key) > -1) {
          continue;
        }

        if (this.engine === '.hbs' || this.engine === '.twig') {
          value = match.replace(/<%/g, '\\{\\{');
          value = value.replace(/%>/g, '\\}\\}');
        }
        else {
          value = match.replace(/\{\{/g, '\\{\\{');
          value = value.replace(/\}\}/g, '\\}\\}');
        }

        value = value.replace(/^/gm, '  ');

        fs.appendFileSync(this.file, `${key}|2\n`);
        fs.appendFileSync(this.file, `${value}\n`);
      }

      fs.outputFileSync(this.targetMustacheFile, this.targetMustache);
    }
  }

  writeYml(regex_, engine, delimiters_) {
    const delimiters = delimiters_ || getDelimiters(engine);

    /* istanbul ignore if */
    if (!delimiters) {
      return;
    }

    const keyBase = engine[0] === '.' ? engine.slice(1) : engine;
    const matches = this.targetMustache.match(regex_);

    if (matches) {
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        let key = '';
        let regex = new RegExp(`${delimiters[0]}[\\S\\s]*?${delimiters[1]}`);

        if (i === 0) {
          key = keyBase;
        }
        else {
          key = `${keyBase}_${i}`;
        }

        const values = regex.exec(match);
        let value = values[0].replace(/^/gm, '  ');
        value = value.replace(/\{\{/g, '\\{\\{');
        value = value.replace(/\}\}/g, '\\}\\}');

        fs.appendFileSync(this.file, `'${key}': |2\n`);
        fs.appendFileSync(this.file, `${value}\n`);

        this.targetMustache = this.targetMustache.replace(values[0], `{{{ ${key} }}}`);
      }
    }
  }

  main() {
    const {
      sourceDirDefaults,
      sourceExtDefaults
    } = refreshPrefs();

    if (!this.data[`${this.type}_dir`] && !sourceDirDefaults[this.type] && !this.sourceDir) {
      return;
    }

    /* istanbul ignore if */
    if (!this.data[`${this.type}_ext`] && !sourceExtDefaults[this.type] && !this.sourceExt) {
      return;
    }

    if (this.data[`${this.type}_dir`] && !utils.backendDirCheck(this.data[`${this.type}_dir`])) {
      utils.error('Error: %s must exist!', this.data[`${this.type}_dir`]);

      return;
    }

    if (!fs.existsSync(this.sourceFile)) {
      const sourceFileRel = getRelativePath(this.sourceFile);

      utils.error(`Error: ${sourceFileRel} must exist!`);

      return;
    }

    const dir = this.data[`${this.type}_dir`].replace(`${conf.backend_dir}/`, '');
    const ext = this.data[`${this.type}_ext`];

    if (dir || ext) {
      fs.outputFileSync(this.file, '');
    }

    if (this.type === 'templates') {
      this.replaceTags();
      this.retainMustache();
    }
    else {
      fs.copySync(this.sourceFile, replaceExtname(this.file, this.sourceExt));

      if (dir) {
        fs.appendFileSync(this.file, `'${this.type}_dir': |2\n`);
        fs.appendFileSync(this.file, `  ${dir}\n`);
      }

      if (ext) {
        fs.appendFileSync(this.file, `'${this.type}_ext': |2\n`);
        fs.appendFileSync(this.file, `  ${ext}\n`);
      }
    }

    // Log to console.
    utils.log(`${(this.engine || this.type)} file \x1b[36m%s\x1b[0m imported.`, this.sourceFile);
  }
}

function exportBackendFile(argv) {
  // Exports a single file only. Therefore, check for -f argument
  if (!argv || !argv.f) {
    utils.error('Error: needs -f argument!');

    return;
  }

  const {
    sourceDirDefaults,
    sourceExtDefaults,
    targetDirDefaults
  } = refreshPrefs();
  let fileFrontend;

  if (fs.existsSync(argv.f)) {
    fileFrontend = normalize(argv.f);
  }
  else {
    fileFrontend = normalize(`${rootDir}/${argv.f}`);
  }

  /* istanbul ignore if */
  if (!fs.existsSync(dirname(fileFrontend))) {
    utils.error(`Error: invalid path! Must be relative to ${conf.ui.pathsRelative.source.root}/, or else absolute.`);

    return;
  }

  // Validate that this is a frontend file.
  /* istanbul ignore if */
  if (getIndexOfSubString(fileFrontend, conf.ui.paths.source.root) !== 0) {
    utils.error(`Error: invalid path! Must be in the ${conf.ui.pathsRelative.source.root}/ directory.`);

    return;
  }

  // All types except templates.
  for (let i in targetDirDefaults) {
    /* istanbul ignore if */
    if (!targetDirDefaults.hasOwnProperty(i)) {
      continue;
    }

    const type = i;
    const sourceDirDefault = sourceDirDefaults[type];
    const sourceExtDefault = sourceExtDefaults[type];
    const targetDirDefault = targetDirDefaults[type];

    if (getIndexOfSubString(fileFrontend, targetDirDefault) !== 0) {
      continue;
    }

    const fileYml = replaceExtname(fileFrontend, '.yml');

    if (type === 'templates') {

      // This makes it easy to parse the data.
      const fpImporter = new FpImporter({
        file: fileYml,
        type
      });

      // Validate

      // Exit if FpImporter failed to find or parse the .yml file.
      // Error message should have been printed by the FpImporter constructor.
      /* istanbul ignore if */
      if (!fpImporter.data) {
        return;
      }

      let {
        data
      } = fpImporter;

      if (
        (!data['templates_dir'] && !sourceDirDefaults.templates) ||
        (data['templates_dir'] && !utils.backendDirCheck(data['templates_dir']))
      ) {
        utils.error(`Error: 'templates_dir' must be set in pref.yml or ${getRelativePath(fileYml)} and must exist!`);

        return;
      }

      if (!data['templates_ext'] && !sourceExtDefault) {
        utils.error(`Error: 'templates_ext' must be set in pref.yml or ${getRelativePath(fileYml)}!`);

        return;
      }

      const templater = global.fepper.tasks.templater;
      const nestedDirs = dirname(fileFrontend).replace(`${targetDirDefaults.templates}`, '');
      const sourceDirDefault = utils.backendDirCheck(sourceDirDefaults.templates + nestedDirs);

      templater.templateProcess(fileFrontend, sourceDirDefault, sourceExtDefaults.templates, rootDir, conf, pref);

      return;
    }

    // type !== 'templates'
    else {
      let data = {};

      if (fs.existsSync(fileYml)) {
        try {
          const yml = fs.readFileSync(fileYml, conf.enc);
          data = yaml.safeLoad(yml) || {};
        }
        catch (err) {
          // Fail gracefully.
          /* istanbul ignore next */
          return;
        }
      }

      if (
        (!data[`${type}_dir`] && !sourceDirDefault) ||
        (data[`${type}_dir`] && !utils.backendDirCheck(data[`${type}_dir`]))
      ) {
        utils.error(`Error: '${type}_dir' must be set in pref.yml or ${getRelativePath(fileYml)} and must exist!`);

        return;
      }

      let sourceDir;

      if (data[`${type}_dir`]) {
        sourceDir = utils.backendDirCheck(data[`${type}_dir`]);
      }
      else if (sourceDirDefault) {
        const nestedDirs = dirname(fileFrontend).replace(targetDirDefault, '');

        sourceDir = sourceDirDefault + nestedDirs;
      }

      // For non-templates, ignore _ext setting.
      const sourceFile = `${sourceDir}/${basename(fileFrontend)}`;

      try {
        fs.ensureDirSync(sourceDir);
      }
      catch (err) {
        /* istanbul ignore next */
        utils.error(err);
        /* istanbul ignore next */
        return;
      }

      try {
        fs.copySync(fileFrontend, sourceFile);
      }
      catch (err) {
        /* istanbul ignore next */
        utils.error(err);
        /* istanbul ignore next */
        return;
      }

      // Log to console.
      utils.log(`${type} file \x1b[36m%s\x1b[0m exported.`, fileFrontend);

      return;
    }
  }
}

function importBackendFileByArg(type, engine, argv) {
  if (!argv || !argv.f) {
    utils.error('Error: needs -f argument!');

    return;
  }

  const {
    sourceDirDefaults,
    sourceExtDefaults,
    targetDirDefaults
  } = refreshPrefs();
  let file;

  // Convert -f argument to absolute path.
  if (fs.existsSync(dirname(argv.f))) {
    file = resolve(path.normalize(argv.f));
  }
  else {
    file = normalize(`${rootDir}/${argv.f}`);
  }

  // Absolute path must be within the project.
  /* istanbul ignore if */
  if (getIndexOfSubString(file, rootDir) !== 0) {
    utils.error(`Error: invalid path! Must be relative to ${conf.ui.pathsRelative.source.root}/, or else absolute.`);

    return;
  }

  const fileExt = extname(file);
  const sourceDirDefault = sourceDirDefaults[type];
  const sourceExtDefault = sourceExtDefaults[type];
  let targetDirDefault = targetDirDefaults[type];
  let dataLocal = {};
  let fileYml;

  // -f arguments may point to the backend or frontend.
  // Error and return if neither is the case.
  /* istanbul ignore if */
  if (getIndexOfSubString(file, conf.backend_dir) !== 0 && getIndexOfSubString(file, targetDirDefault) !== 0) {
    utils.error('Error: invalid path! The -f argument must be a backend file or a template pattern.');

    return;
  }

  const data = {};
  let sourceDir;

  // Must convert backend path to frontend path to get target path.
  // If backend path, we can only work with sourceDirDefault because we aren't accessing a local .yml file.
  if (getIndexOfSubString(file, conf.backend_dir) === 0) {

    // Must reset targetDirDefault for non-templates if backend path and no sourceDirDefault.
    if (!sourceDirDefault) {
      switch (type) {
        case 'assets':
          targetDirDefault = conf.ui.paths.source.imagesSrc;

          break;

        case 'scripts':
          targetDirDefault = conf.ui.paths.source.jsSrc;

          break;

        case 'styles':
          targetDirDefault = conf.ui.paths.source.cssBld;

          break;
      }
    }

    sourceDir = dirname(file);

    if (getIndexOfSubString(file, sourceDirDefault) === 0) {
      const nestedDirs = sourceDir.replace(sourceDirDefault, '');
      const targetDirPlusNestedDirs = targetDirDefault + nestedDirs;

      fileYml = replaceExtname(file.replace(sourceDirDefault, targetDirDefault), '.yml');

      // Ensure the nested directories exist in the target.
      fs.ensureDirSync(targetDirPlusNestedDirs);
    }
    else {
      fileYml = replaceExtname(`${targetDirDefault}/${basename(file)}`, '.yml');
    }
  }

  // Frontend paths.
  else {

    // Path to YAML file.
    if (fileExt === '.yml') {
      fileYml = file;
    }

    // Path to non-YAML file.
    else {

      fileYml = replaceExtname(file, '.yml');
    }
  }

  // If fileExt === '.yml', it means the .yml file must exist in order to import.
  // In this case, we want the following if condition to succeed, even if the file is nonexistent, so it errors and
  // returns when trying to read the nonexistent file.
  // In other cases where the .yml file is nonexistent, we can refer to global prefs, so no need to error and return.
  if (fileExt === '.yml' || fs.existsSync(fileYml)) {
    try {
      const yml = fs.readFileSync(fileYml, conf.enc);
      dataLocal = yaml.safeLoad(yml) || {};
      dataLocal[`${type}_dir`] = dataLocal[`${type}_dir`] ? dataLocal[`${type}_dir`].trim() : '';
      dataLocal[`${type}_ext`] = dataLocal[`${type}_ext`] ? dataLocal[`${type}_ext`].trim() : '';
    }
    catch (err) {
      /* istanbul ignore next */
      utils.error(err);
      /* istanbul ignore next */
      return;
    }
  }

  let sourceDirLocalChecked = utils.backendDirCheck(dataLocal[`${type}_dir`]);

  // At this point, sourceDir would only be defined for backend paths, so use it to filter backend paths.
  if (sourceDir) {
    const fileRel = getRelativePath(fileYml);

    if (dataLocal[`${type}_dir`]) {

      // Error and return if the backend arg path does not match the _dir pref in the local .yml file.
      // For backend-pointing -f args, we do not actually use the local pref.
      // However, we do want to error if the local pref is wrong.
      if (sourceDirLocalChecked !== sourceDir) {
        utils.error(`Error: invalid path! Must correspond to '${type}_dir' set in ${fileRel}.`);

        return;
      }
    }

    // Need to define sourceDirLocalChecked with dirname of backend file if dataLocal[`${type}_dir`] is empty.
    // This value will be assigned to data[`${type}_dir`] later.
    else {
      sourceDirLocalChecked = sourceDir;
    }

    if (type === 'templates' && dataLocal[`${type}_ext`]) {

      // For templates, error and return if the backend extension does not match the _ext pref in the local .yml file.
      if (dataLocal[`${type}_ext`] && dataLocal[`${type}_ext`] !== fileExt) {
        utils.error(`Error: invalid extension! Must correspond to '${type}_ext' set in ${fileRel}.`);

        return;
      }
    }

    else if (fileExt !== '.yml') {
      dataLocal[`${type}_ext`] = fileExt;
    }

    if (!dataLocal[`${type}_dir`] && !sourceDirDefault) {
      dataLocal[`${type}_dir`] = sourceDir;
    }
  }

  // Frontend paths.
  else {

    // For sourceDir, we're ok with setting it to sourceDirLocalChecked because fpImporter.main will reject wrong
    // _dir and _ext prefs before allowing a wrong sourceDir.
    if (sourceDirLocalChecked) {
      sourceDir = sourceDirLocalChecked;
    }
    else {

      // Make sure not to use targetDirDefault because it might point to a src or bld dir.
      const nestedDirs = dirname(fileYml).replace(targetDirDefaults[type], '');
      sourceDir = sourceDirDefault + nestedDirs;
    }
  }

  data[`${type}_dir`] = dataLocal[`${type}_dir`];
  data[`${type}_ext`] = dataLocal[`${type}_ext`];

  if (!data[`${type}_dir`] && !sourceDirDefault) {
    utils.error(`Error: '${type}_dir' must be set in pref.yml or ${getRelativePath(fileYml)} and must exist!`);

    return;
  }

  let sourceExt;

  if (type === 'templates' || fileExt === '.yml') {
    sourceExt = data[`${type}_ext`] || sourceExtDefault;

    if (!sourceExt) {
      utils.error(`Error: '${type}_ext' must be set in pref.yml or ${getRelativePath(fileYml)}!`);

      return;
    }
  }
  else {
    sourceExt = fileExt;
  }

  let sourceFile;

  if (getIndexOfSubString(file, sourceDir) === 0) {
    sourceFile = file;
  }
  else {
    sourceFile = `${sourceDir}/${basename(fileYml, '.yml') + sourceExt}`;
  }

  const fpImporter = new FpImporter({
    file: fileYml,
    type,
    engine,
    data,
    sourceDir,
    sourceExt,
    sourceFile
  });

  fpImporter.main();
}

function importBackendFiles(type, engine) {
  const {
    sourceDirDefaults,
    sourceExtDefaults,
    targetDirDefaults
  } = refreshPrefs();
  const sourceDirDefault = sourceDirDefaults[type];
  const sourceExtDefault = sourceExtDefaults[type];
  const targetDirDefault = targetDirDefaults[type];
  const filesYml = glob.sync(targetDirDefault + '/**/*.yml');

  // Glob .yml files in the Fepper frontend.
  for (let i = 0; i < filesYml.length; i++) {
    const fileYml = filesYml[i];
    let stat;

    try {
      stat = fs.statSync(fileYml);
    }
    catch (err) {
      /* istanbul ignore next */
      utils.error(err);
      /* istanbul ignore next */
      continue;
    }

    /* istanbul ignore if */
    if (!stat || !stat.isFile()) {
      continue;
    }

    let data = {};
    let fpImporter = {};

    try {
      const yml = fs.readFileSync(fileYml, conf.enc);
      data = yaml.safeLoad(yml) || {};
    }
    catch (err) {
      /* istanbul ignore next */
      utils.error(err);
      /* istanbul ignore next */
      continue;
    }

    let sourceDir;

    // Recognize nested frontend files, and their nesting directory structure.
    // This is only necessary if they do not have local _dir set.
    if (!data[`${type}_dir`] && sourceDirDefault) {
      const fileYmlDir = dirname(fileYml);

      if (fileYmlDir !== targetDirDefault) {
        const nestedDirs = fileYmlDir.replace(targetDirDefault, '');
        sourceDir = sourceDirDefault + nestedDirs;
      }
    }

    // These assignments should be ok because the main method will error and return if there is a problem with the local
    // and global prefs.
    sourceDir = sourceDir || utils.backendDirCheck(data[`${type}_dir`]) || sourceDirDefault;
    const sourceExt = utils.extNormalize(data[`${type}_ext`]) || sourceExtDefault;

    // Since we're identifying the backend file by the frontend .yml file, we cannot continue if we do not have the
    // extension of the backend file.
    if (!sourceExt) {
      continue;
    }

    const sourceFileBasename = basename(fileYml, '.yml') + sourceExt;
    const sourceFile = `${sourceDir}/${sourceFileBasename}`;

    fpImporter = new FpImporter({
      file: fileYml,
      type,
      engine,
      data,
      sourceDir,
      sourceExt,
      sourceFile
    });

    fpImporter.main();
  }

  // Mass import of files under sourceDirDefault. Globs the backend.
  // OK for sourceExtDefault to be empty if type is not templates.
  if (sourceDirDefault && (sourceExtDefault || type !== 'templates')) {
    const ext = sourceExtDefault || '.*';
    const filesBackend = glob.sync(`${sourceDirDefault}/**/*${ext}`);

    globbedBackend:
    for (let i = 0; i < filesBackend.length; i++) {
      const fileBackend = filesBackend[i];
      let stat;

      try {
        stat = fs.statSync(fileBackend);
      }
      catch (err) {
        /* istanbul ignore next */
        utils.error(err);
        /* istanbul ignore next */
        continue;
      }

      if (!stat || !stat.isFile()) {
        continue;
      }

      const fileBackendDir = dirname(fileBackend);
      const fileBackendExt = extname(fileBackend);
      const fileYmlBasename = basename(fileBackend, fileBackendExt) + '.yml';
      const nestedDirs = fileBackendDir.replace(sourceDirDefault, '');
      let data = {};

      // Assemble frontend .yml file path.
      let fileYml = targetDirDefault;
      fileYml += nestedDirs;
      const targetDirPlusNestedDirs = fileYml;
      fileYml += '/' + fileYmlBasename;

      // Do not proceed if template was imported in by globbing the frontend for .yml files.
      for (let j = 0; j < filesYml.length; j++) {
        if (filesYml[j] === fileYml) {
          continue globbedBackend;
        }
      }

      fs.ensureDirSync(targetDirPlusNestedDirs);

      // Optionally, try to load local data.
      /* istanbul ignore if */
      if (fs.existsSync(fileYml)) {
        try {
          const yml = fs.readFileSync(fileYml, conf.enc);
          data = yaml.safeLoad(yml) || {};
        }
        catch (err) {
          utils.error(err);
        }
      }

      // These assignments should be ok because the main method will error and return if there is a problem with the
      // local and global prefs.
      const sourceDir = utils.backendDirCheck(data[`${type}_dir`]) || (sourceDirDefault + nestedDirs);
      const sourceFile = fileBackend;
      let sourceExt;

      // Do not proceed if the _dir pref does not correspond to the dirname of the backend file.
      /* istanbul ignore if */
      if (sourceDir !== fileBackendDir) {
        continue;
      }

      if (type === 'templates') {
        sourceExt = utils.extNormalize(data[`${type}_ext`]) || sourceExtDefault;

        // Do not proceed if the _ext pref does not match the extname of the backend file.
        /* istanbul ignore if */
        if (sourceExt !== fileBackendExt) {
          continue;
        }
      }
      else {
        sourceExt = fileBackendExt;
      }

      const fpImporter = new FpImporter({
        file: fileYml,
        type,
        engine,
        data,
        sourceDir,
        sourceExt,
        sourceFile
      });

      fpImporter.main();
    }
  }
}

// Declare gulp tasks.

gulp.task('export', function (cb) {
  const argv = yargs(process.argv).argv;

  exportBackendFile(argv);

  cb();
});

gulp.task('import', function (cb) {
  // If an -f argument was submitted, it's probably a mistake.
  const argv = yargs(process.argv).argv;

  if (argv.f) {
    utils.error('Error: `fp import` (with no subtask) does not recognize -f argument!');

    cb();
    return;
  }

  const {
    sourceExtDefaults
  } = refreshPrefs();
  let templatesExt;

  for (let i = 0; i < engines.length; i++) {
    const engine = engines[i];

    if (sourceExtDefaults.templates === engine) {
      templatesExt = engine;
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

gulp.task('import:asset', function (cb) {
  const argv = yargs(process.argv).argv;

  importBackendFileByArg('assets', null, argv);

  cb();
});

gulp.task('import:script', function (cb) {
  const argv = yargs(process.argv).argv;

  importBackendFileByArg('scripts', null, argv);

  cb();
});

gulp.task('import:style', function (cb) {
  const argv = yargs(process.argv).argv;

  importBackendFileByArg('styles', null, argv);

  cb();
});

for (let i = 0; i < engines.length; i++) {
  const engine = engines[i];

  gulp.task(`import:${engine.slice(1)}`, function (cb) {
    const argv = yargs(process.argv).argv;

    importBackendFileByArg('templates', engine, argv);

    cb();
  });
}

gulp.task('import:help', function (cb) {
  let out = `
Fepper Import Extension

Use:
    <task> [<additional args>...]

Tasks:
    fp import           Import assets, scripts, styles, and templates from backend to frontend.
    fp import:erb       Import an Embedded Ruby template.
    fp import:hbs       Import a Handlebars template.
    fp import:jsp       Import a Java Server Pages template.
    fp import:php       Import a PHP template.
    fp import:twig      Import a Twig template. 
    fp import:asset     Import an asset file.
    fp import:script    Import a script file.
    fp import:style     Import a style file.
    fp export           Export an asset, script, style, or template file from frontend to backend.
    fp import:help      Print fp-import tasks and descriptions.
`;

  utils.info(out);
  cb();
});

// Export tasks in case users want to run them without gulp.

exports.exportBackendFile = exportBackendFile;
exports.importBackendFileByArg = importBackendFileByArg;
exports.importBackendFiles = importBackendFiles;
