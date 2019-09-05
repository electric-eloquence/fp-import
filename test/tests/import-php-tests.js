'use strict';

const fs = require('fs-extra');
const path = require('path');

const diveSync = require('diveSync');
const {expect} = require('chai');

// Instantiate a gulp instance and assign it to the fp const.
process.env.ROOT_DIR = path.normalize(`${__dirname}/..`);
const fp = require('fepper/tasker');

const conf = global.conf;
const pref = global.pref;

require('../../import~extend');

const templatesDirFront = conf.ui.paths.source.templates;
const templatesDirFrontRel = conf.ui.pathsRelative.source.templates;
const templatesDirBack = 'import/templates';
const templatesDirBackNonex = 'nonex/templates';
const templateBase = 'template-php';
const template = `${templatesDirFront}/${templateBase}.mustache`;
const templateYml = `${templatesDirFront}/${templateBase}.yml`;

const templateMustacheExpected = `{{{ php }}}
{{{ php_1 }}}
{{{ php_2 }}}
<div>
  {{{ php_3 }}}
</div>
{{# templates-responsive_footer }}
  {{> 03-templates/responsive_footer }}
{{/ templates-responsive_footer }}
`;
const templateYmlExpectedExt = `'templates_ext': |2
  .php
`;
const templateYmlExpected = `'php': |2
  <?php require 'fileutils'; ?>
'php_1': |2
  <?php require 'rexml/parsers/pullparser'; ?>
'php_2': |2
  <?php
    class Pub {
      public static $checker = 'pubcheck';
      public static $callout_limit = 15;
      public static $output_dir = '.pubtmp';
      public static $meta_dir = 'META-INF';
      public static $oebps_dir = 'OEBPS';
      public static $zipper = 'zip';
    }
  ?>
'php_3': |2
  <?php echo Pub::$checker; ?>
'# templates-responsive_footer': |2
  <!--\\{\\{# templates-responsive_footer \\}\\}-->
'> 03-templates/responsive_footer': |2
  <!--\\{\\{> 03-templates/responsive_footer \\}\\}-->
'/ templates-responsive_footer': |2
  <!--\\{\\{/ templates-responsive_footer \\}\\}-->
`;

function resetArgv() {
  if (process.argv.indexOf('-f') > -1) {
    let i = process.argv.length;

    while (i--) {
      if (process.argv.pop() === '-f') {
        break;
      }
    }
  }
}

function resetTemplatesDir(args = {}) {
  diveSync(templatesDirFront, (err, file) => {
    fs.unlinkSync(file);
  });

  const returnObj = {};

  for (let fileKey of Object.keys(args)) {
    returnObj[`${fileKey}ExistsBefore`] = fs.existsSync(args[fileKey]);
  }

  return returnObj;
}

describe('fp import:php', function () {
  before(function () {
    pref.backend.synced_dirs = {};
  });

  beforeEach(function () {
    resetArgv();
  });

  after(function () {
    resetTemplatesDir();
  });

  it('errors with no -f argument', function (done) {
    fp.runSeq(
      'import:php',
      done
    );
  });

  // Test success and error cases. The error cases should pass as tests.
  // For backend -f arguments, when local yml and global yml differ, always fail and emit error.
  // This prevents overwriting local settings on the frontend meant for something else on the backend.
  describe('`fp import:php` with backend -f argument', function () {
    const subdir = 'argv.f-backend';
    const templatesDirFrontSub = `${templatesDirFront}/${subdir}`;
    const templatesDirBackSub = `${templatesDirBack}/${subdir}`;
    const templateYmlExpectedDir = `'templates_dir': |2
  ${templatesDirBackSub}
`;

    it('imports using absolute path argument', function (done) {
      const {
        templateExistsBefore,
        templateYmlExistsBefore
      } = resetTemplatesDir({
        template,
        templateYml
      });

      process.argv.push('-f');
      process.argv.push(`${conf.backend_dir}/${templatesDirBackSub}/${templateBase}.php`);

      delete pref.backend.synced_dirs.templates_dir;
      delete pref.backend.synced_dirs.templates_ext;

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);
          const templateMustacheActual = fs.readFileSync(template, conf.enc);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(pref.backend.synced_dirs.templates_dir).to.not.exist;
          expect(pref.backend.synced_dirs.templates_ext).to.not.exist;
          expect(templateExistsBefore).to.be.false;
          expect(templateYmlExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.true;
          expect(templateYmlExistsAfter).to.be.true;
          expect(templateMustacheActual).to.equal(templateMustacheExpected);
          expect(templateYmlActual).to.equal(templateYmlExpectedDir + templateYmlExpectedExt + templateYmlExpected);

          done();
        }
      );
    });

    it('imports using undefined templates_dir, and undefined templates_ext', function (done) {
      const {
        templateExistsBefore,
        templateYmlExistsBefore
      } = resetTemplatesDir({
        template,
        templateYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.php`);

      delete pref.backend.synced_dirs.templates_dir;
      delete pref.backend.synced_dirs.templates_ext;

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);
          const templateMustacheActual = fs.readFileSync(template, conf.enc);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(pref.backend.synced_dirs.templates_dir).to.not.exist;
          expect(pref.backend.synced_dirs.templates_ext).to.not.exist;
          expect(templateExistsBefore).to.be.false;
          expect(templateYmlExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.true;
          expect(templateYmlExistsAfter).to.be.true;
          expect(templateMustacheActual).to.equal(templateMustacheExpected);
          expect(templateYmlActual).to.equal(templateYmlExpectedDir + templateYmlExpectedExt + templateYmlExpected);

          done();
        }
      );
    });

    it('imports using global templates_dir, and undefined templates_ext', function (done) {
      const {
        templateExistsBefore,
        templateYmlExistsBefore
      } = resetTemplatesDir({
        template,
        templateYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.php`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      delete pref.backend.synced_dirs.templates_ext;

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);
          const templateMustacheActual = fs.readFileSync(template, conf.enc);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(pref.backend.synced_dirs.templates_ext).to.not.exist;
          expect(templateExistsBefore).to.be.false;
          expect(templateYmlExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.true;
          expect(templateYmlExistsAfter).to.be.true;
          expect(templateMustacheActual).to.equal(templateMustacheExpected);
          expect(templateYmlActual).to.equal(templateYmlExpectedExt + templateYmlExpected);

          done();
        }
      );
    });

    it('imports using undefined templates_dir, and global templates_ext', function (done) {
      const {
        templateExistsBefore,
        templateYmlExistsBefore
      } = resetTemplatesDir({
        template,
        templateYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.php`);

      delete pref.backend.synced_dirs.templates_dir;
      pref.backend.synced_dirs.templates_ext = '.php';

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);
          const templateMustacheActual = fs.readFileSync(template, conf.enc);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(pref.backend.synced_dirs.templates_dir).to.not.exist;
          expect(templateExistsBefore).to.be.false;
          expect(templateYmlExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.true;
          expect(templateYmlExistsAfter).to.be.true;
          expect(templateMustacheActual).to.equal(templateMustacheExpected);
          expect(templateYmlActual).to.equal(templateYmlExpectedDir + templateYmlExpected);

          done();
        }
      );
    });

    it('imports using global templates_dir, and global templates_ext', function (done) {
      const {
        templateExistsBefore,
        templateYmlExistsBefore
      } = resetTemplatesDir({
        template,
        templateYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.php`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      pref.backend.synced_dirs.templates_ext = '.php';

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);
          const templateMustacheActual = fs.readFileSync(template, conf.enc);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(templateExistsBefore).to.be.false;
          expect(templateYmlExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.true;
          expect(templateYmlExistsAfter).to.be.true;
          expect(templateMustacheActual).to.equal(templateMustacheExpected);
          expect(templateYmlActual).to.equal(templateYmlExpected);

          done();
        }
      );
    });

    it('errors using conflicting templates_dir, and undefined templates_ext', function (done) {
      const templateYmlExpected = `templates_dir: ${templatesDirBackNonex}`;
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.php`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      delete pref.backend.synced_dirs.templates_ext;
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(pref.backend.synced_dirs.templates_ext).to.not.exist;
          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;
          expect(templateYmlExistsAfter).to.be.true;
          expect(templateYmlActual).to.equal(templateYmlExpected);

          done();
        }
      );
    });

    it('errors using undefined templates_dir, and conflicting templates_ext', function (done) {
      const templateYmlExpected = 'templates_ext: .foo';
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.php`);

      delete pref.backend.synced_dirs.templates_dir;
      pref.backend.synced_dirs.templates_ext = '.php';
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(pref.backend.synced_dirs.templates_dir).to.not.exist;
          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;
          expect(templateYmlExistsAfter).to.be.true;
          expect(templateYmlActual).to.equal(templateYmlExpected);

          done();
        }
      );
    });

    it('errors using conflicting templates_dir, and global templates_ext', function (done) {
      const templateYmlExpected = `templates_dir: ${templatesDirBackNonex}`;
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.php`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      pref.backend.synced_dirs.templates_ext = '.php';
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;
          expect(templateYmlExistsAfter).to.be.true;
          expect(templateYmlActual).to.equal(templateYmlExpected);

          done();
        }
      );
    });

    it('errors using global templates_dir, and conflicting templates_ext', function (done) {
      const templateYmlExpected = 'templates_ext: .foo';
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.php`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      pref.backend.synced_dirs.templates_ext = '.php';
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;
          expect(templateYmlExistsAfter).to.be.true;
          expect(templateYmlActual).to.equal(templateYmlExpected);

          done();
        }
      );
    });

    it('errors using conflicting templates_dir, and conflicting templates_ext', function (done) {
      const templateYmlExpected = `templates_dir: ${templatesDirBackNonex}\ntemplates_ext: .foo`;
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.php`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      pref.backend.synced_dirs.templates_ext = '.php';
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;
          expect(templateYmlExistsAfter).to.be.true;
          expect(templateYmlActual).to.equal(templateYmlExpected);

          done();
        }
      );
    });

    it('imports even if global templates_dir points to a nonexistent directory', function (done) {
      const {
        templateExistsBefore,
        templateYmlExistsBefore
      } = resetTemplatesDir({
        template,
        templateYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.php`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackNonex;
      delete pref.backend.synced_dirs.templates_ext;

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);
          const templateMustacheActual = fs.readFileSync(template, conf.enc);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(pref.backend.synced_dirs.templates_ext).to.not.exist;
          expect(templateExistsBefore).to.be.false;
          expect(templateYmlExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.true;
          expect(templateYmlExistsAfter).to.be.true;
          expect(templateMustacheActual).to.equal(templateMustacheExpected);
          expect(templateYmlActual).to.equal(templateYmlExpectedDir + templateYmlExpectedExt + templateYmlExpected);

          done();
        }
      );
    });

    it('imports even if global templates_ext mismatches arg extension', function (done) {
      const {
        templateExistsBefore,
        templateYmlExistsBefore
      } = resetTemplatesDir({
        template,
        templateYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.php`);

      delete pref.backend.synced_dirs.templates_dir;
      pref.backend.synced_dirs.templates_ext = '.foo';

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);
          const templateMustacheActual = fs.readFileSync(template, conf.enc);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(pref.backend.synced_dirs.templates_dir).to.not.exist;
          expect(templateExistsBefore).to.be.false;
          expect(templateYmlExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.true;
          expect(templateYmlExistsAfter).to.be.true;
          expect(templateMustacheActual).to.equal(templateMustacheExpected);
          expect(templateYmlActual).to.equal(templateYmlExpectedDir + templateYmlExpectedExt + templateYmlExpected);

          done();
        }
      );
    });

    it('errors using local templates_dir that points to a nonexistent directory', function (done) {
      const templateYmlExpected = `templates_dir: ${templatesDirBackNonex}`;
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.php`);

      delete pref.backend.synced_dirs.templates_dir;
      delete pref.backend.synced_dirs.templates_ext;
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(pref.backend.synced_dirs.templates_dir).to.not.exist;
          expect(pref.backend.synced_dirs.templates_ext).to.not.exist;
          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;
          expect(templateYmlExistsAfter).to.be.true;
          expect(templateYmlActual).to.equal(templateYmlExpected);

          done();
        }
      );
    });

    it('errors using local templates_ext that mismatches arg extension', function (done) {
      const templateYmlExpected = 'templates_ext: .foo';
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.php`);

      delete pref.backend.synced_dirs.templates_dir;
      delete pref.backend.synced_dirs.templates_ext;
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(pref.backend.synced_dirs.templates_dir).to.not.exist;
          expect(pref.backend.synced_dirs.templates_ext).to.not.exist;
          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;
          expect(templateYmlExistsAfter).to.be.true;
          expect(templateYmlActual).to.equal(templateYmlExpected);

          done();
        }
      );
    });

    it('imports using global templates_dir that nests the arg path', function (done) {
      const template = `${templatesDirFrontSub}/${templateBase}.mustache`;
      const templateYml = `${templatesDirFrontSub}/${templateBase}.yml`;
      const {
        templateExistsBefore,
        templateYmlExistsBefore
      } = resetTemplatesDir({
        template,
        templateYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.php`);

      pref.backend.synced_dirs.templates_dir = templatesDirBack;
      delete pref.backend.synced_dirs.templates_ext;

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);
          const templateMustacheActual = fs.readFileSync(template, conf.enc);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(pref.backend.synced_dirs.templates_ext).to.not.exist;
          expect(templateExistsBefore).to.be.false;
          expect(templateYmlExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.true;
          expect(templateYmlExistsAfter).to.be.true;
          expect(templateMustacheActual).to.equal(templateMustacheExpected);
          expect(templateYmlActual).to.equal(templateYmlExpectedDir + templateYmlExpectedExt + templateYmlExpected);

          done();
        }
      );
    });

    it('imports where local templates_dir is nested by global templates_dir, and immediately nests -f argument\
', function (done) {
      const template = `${templatesDirFrontSub}/${templateBase}.mustache`;
      const templateYml = `${templatesDirFrontSub}/${templateBase}.yml`;
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.php`);

      pref.backend.synced_dirs.templates_dir = templatesDirBack;
      delete pref.backend.synced_dirs.templates_ext;
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);
          const templateMustacheActual = fs.readFileSync(template, conf.enc);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(pref.backend.synced_dirs.templates_ext).to.not.exist;
          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.true;
          expect(templateYmlExistsAfter).to.be.true;
          expect(templateMustacheActual).to.equal(templateMustacheExpected);
          expect(templateYmlActual).to.equal(templateYmlExpectedDir + templateYmlExpectedExt + templateYmlExpected);

          done();
        }
      );
    });

    it('errors where local templates_dir is nested by global templates_dir, but does not immediately nest -f \
argument', function (done) {
      const templateDir = `${templatesDirFront}/templates/${subdir}`;
      const template = `${templateDir}/${templateBase}.mustache`;
      const templateYml = `${templateDir}/${templateBase}.yml`;
      const templateYmlExpected = `templates_dir: ${templatesDirBack}`;
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.php`);

      pref.backend.synced_dirs.templates_dir = 'import';
      delete pref.backend.synced_dirs.templates_ext;
      fs.ensureDirSync(templateDir);
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(pref.backend.synced_dirs.templates_ext).to.not.exist;
          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;
          expect(templateYmlExistsAfter).to.be.true;
          expect(templateYmlActual).to.equal(templateYmlExpected);

          done();
        }
      );
    });

    it('errors where local templates_dir nests global local templates_dir, and therefore cannot immediately nest \
-f argument', function (done) {
      const template = `${templatesDirFront}/${templateBase}.mustache`;
      const templateYml = `${templatesDirFront}/${templateBase}.yml`;
      const templateYmlExpected = `templates_dir: ${templatesDirBack}`;
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.php`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      delete pref.backend.synced_dirs.templates_ext;
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(pref.backend.synced_dirs.templates_ext).to.not.exist;
          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;
          expect(templateYmlExistsAfter).to.be.true;
          expect(templateYmlActual).to.equal(templateYmlExpected);

          done();
        }
      );
    });
  });

  // Test success and error cases. The error cases should pass as tests.
  describe('`fp import:php` with frontend -f argument and conf.ui.patternExtension', function () {
    const subdir = 'templates_dir-global';
    const templatesDirBackSub = `${templatesDirBack}/${subdir}`;
    const templateYmlExpectedDir = `'templates_dir': |2
  ${templatesDirBackSub}
`;

    it('imports using absolute path argument', function (done) {
      const {
        templateExistsBefore,
        templateYmlExistsBefore
      } = resetTemplatesDir({
        template,
        templateYml
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFront}/${templateBase}.mustache`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      pref.backend.synced_dirs.templates_ext = '.php';

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);
          const templateMustacheActual = fs.readFileSync(template, conf.enc);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(templateExistsBefore).to.be.false;
          expect(templateYmlExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.true;
          expect(templateYmlExistsAfter).to.be.true;
          expect(templateMustacheActual).to.equal(templateMustacheExpected);
          expect(templateYmlActual).to.equal(templateYmlExpected);

          done();
        }
      );
    });

    it('errors using undefined templates_dir, and undefined templates_ext', function (done) {
      const {
        templateExistsBefore,
        templateYmlExistsBefore
      } = resetTemplatesDir({
        template,
        templateYml
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.mustache`);

      delete pref.backend.synced_dirs.templates_dir;
      delete pref.backend.synced_dirs.templates_ext;

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);

          expect(pref.backend.synced_dirs.templates_dir).to.not.exist;
          expect(pref.backend.synced_dirs.templates_ext).to.not.exist;
          expect(templateExistsBefore).to.be.false;
          expect(templateYmlExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;
          expect(templateYmlExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors using global templates_dir, and undefined templates_ext', function (done) {
      const {
        templateExistsBefore,
        templateYmlExistsBefore
      } = resetTemplatesDir({
        template,
        templateYml
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.mustache`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      delete pref.backend.synced_dirs.templates_ext;

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);

          expect(pref.backend.synced_dirs.templates_ext).to.not.exist;
          expect(templateExistsBefore).to.be.false;
          expect(templateYmlExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;
          expect(templateYmlExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors using undefined templates_dir, and global templates_ext', function (done) {
      const {
        templateExistsBefore,
        templateYmlExistsBefore
      } = resetTemplatesDir({
        template,
        templateYml
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.mustache`);

      delete pref.backend.synced_dirs.templates_dir;
      pref.backend.synced_dirs.templates_ext = '.php';

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);

          expect(pref.backend.synced_dirs.templates_dir).to.not.exist;
          expect(templateExistsBefore).to.be.false;
          expect(templateYmlExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;
          expect(templateYmlExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('imports using global templates_dir, and global templates_ext', function (done) {
      const {
        templateExistsBefore,
        templateYmlExistsBefore
      } = resetTemplatesDir({
        template,
        templateYml
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.mustache`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      pref.backend.synced_dirs.templates_ext = '.php';

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);
          const templateMustacheActual = fs.readFileSync(template, conf.enc);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(templateExistsBefore).to.be.false;
          expect(templateYmlExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.true;
          expect(templateYmlExistsAfter).to.be.true;
          expect(templateMustacheActual).to.equal(templateMustacheExpected);
          expect(templateYmlActual).to.equal(templateYmlExpected);

          done();
        }
      );
    });

    it('errors using overriding local templates_dir, and undefined templates_ext', function (done) {
      const templateYmlExpected = `templates_dir: ${templatesDirBackNonex}`;
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.mustache`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      delete pref.backend.synced_dirs.templates_ext;
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(pref.backend.synced_dirs.templates_ext).to.not.exist;
          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;
          expect(templateYmlExistsAfter).to.be.true;
          expect(templateYmlActual).to.equal(templateYmlExpected);

          done();
        }
      );
    });

    it('errors using undefined templates_dir, and overriding local templates_ext', function (done) {
      const templateYmlExpected = 'templates_ext: .foo';
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.mustache`);

      delete pref.backend.synced_dirs.templates_dir;
      pref.backend.synced_dirs.templates_ext = '.php';
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(pref.backend.synced_dirs.templates_dir).to.not.exist;
          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;
          expect(templateYmlExistsAfter).to.be.true;
          expect(templateYmlActual).to.equal(templateYmlExpected);

          done();
        }
      );
    });

    it('imports using overriding local templates_dir, and global templates_ext', function (done) {
      const templateYmlExpectedDir = `'templates_dir': |2
  ${templatesDirBack}/templates_dir-local
`;
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.mustache`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      pref.backend.synced_dirs.templates_ext = '.php';
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);
          const templateMustacheActual = fs.readFileSync(template, conf.enc);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.true;
          expect(templateYmlExistsAfter).to.be.true;
          expect(templateMustacheActual).to.equal(templateMustacheExpected);
          expect(templateYmlActual).to.equal(templateYmlExpectedDir + templateYmlExpected);

          done();
        }
      );
    });

    it('imports using global templates_dir, and overriding local templates_ext', function (done) {
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.mustache`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      pref.backend.synced_dirs.templates_ext = '.foo';
      fs.writeFileSync(templateYml, templateYmlExpectedExt);

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);
          const templateMustacheActual = fs.readFileSync(template, conf.enc);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.true;
          expect(templateYmlExistsAfter).to.be.true;
          expect(templateMustacheActual).to.equal(templateMustacheExpected);
          expect(templateYmlActual).to.equal(templateYmlExpectedExt + templateYmlExpected);

          done();
        }
      );
    });

    it('imports using overriding local templates_dir, and overriding local templates_ext', function (done) {
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.mustache`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackNonex;
      pref.backend.synced_dirs.templates_ext = '.foo';
      fs.writeFileSync(templateYml, templateYmlExpectedDir + templateYmlExpectedExt);

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);
          const templateMustacheActual = fs.readFileSync(template, conf.enc);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.true;
          expect(templateYmlExistsAfter).to.be.true;
          expect(templateMustacheActual).to.equal(templateMustacheExpected);
          expect(templateYmlActual).to.equal(templateYmlExpectedDir + templateYmlExpectedExt + templateYmlExpected);

          done();
        }
      );
    });

    it('errors if global templates_dir points to a nonexistent directory', function (done) {
      const {
        templateExistsBefore,
        templateYmlExistsBefore
      } = resetTemplatesDir({
        template,
        templateYml
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.mustache`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackNonex;
      pref.backend.synced_dirs.templates_ext = '.php';

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);

          expect(templateExistsBefore).to.be.false;
          expect(templateYmlExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;
          expect(templateYmlExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors if global templates_ext mismatches actual extension', function (done) {
      const {
        templateExistsBefore,
        templateYmlExistsBefore
      } = resetTemplatesDir({
        template,
        templateYml
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.mustache`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      pref.backend.synced_dirs.templates_ext = '.foo';

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);

          expect(templateExistsBefore).to.be.false;
          expect(templateYmlExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;
          expect(templateYmlExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors if local templates_dir points to a nonexistent directory', function (done) {
      const templateYmlExpectedDir = `'templates_dir': |2
  ${templatesDirBackNonex}
`;
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.mustache`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      pref.backend.synced_dirs.templates_ext = '.php';
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;
          expect(templateYmlExistsAfter).to.be.true;
          expect(templateYmlActual).to.equal(templateYmlExpectedDir);


          done();
        }
      );
    });

    it('errors if local templates_ext mismatches actual extension', function (done) {
      const templateYmlExpected = 'templates_ext: .foo';
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.mustache`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      pref.backend.synced_dirs.templates_ext = '.php';
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlExistsAfter = fs.existsSync(templateYml);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;
          expect(templateYmlExistsAfter).to.be.true;
          expect(templateYmlActual).to.equal(templateYmlExpected);

          done();
        }
      );
    });
  });

  // Test success and error cases. The error cases should pass as tests.
  describe('`fp import:php` with frontend -f argument and .yml extension', function () {
    const subdir = 'templates_dir-global';
    const templatesDirBackSub = `${templatesDirBack}/${subdir}`;
    const templateYmlExpectedDir = `'templates_dir': |2
  ${templatesDirBackSub}
`;

    it('imports using absolute path argument', function (done) {
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFront}/${templateBase}.yml`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      pref.backend.synced_dirs.templates_ext = '.php';
      fs.writeFileSync(templateYml, '');

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateMustacheActual = fs.readFileSync(template, conf.enc);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.true;
          expect(templateMustacheActual).to.equal(templateMustacheExpected);
          expect(templateYmlActual).to.equal(templateYmlExpected);

          done();
        }
      );
    });

    it('errors using undefined templates_dir, and undefined templates_ext', function (done) {
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.yml`);

      delete pref.backend.synced_dirs.templates_dir;
      delete pref.backend.synced_dirs.templates_ext;
      fs.writeFileSync(templateYml, '');

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);

          expect(pref.backend.synced_dirs.templates_dir).to.not.exist;
          expect(pref.backend.synced_dirs.templates_ext).to.not.exist;
          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors using global templates_dir, and undefined templates_ext', function (done) {
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.yml`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      delete pref.backend.synced_dirs.templates_ext;
      fs.writeFileSync(templateYml, '');

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);

          expect(pref.backend.synced_dirs.templates_ext).to.not.exist;
          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors using undefined templates_dir, and global templates_ext', function (done) {
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.yml`);

      delete pref.backend.synced_dirs.templates_dir;
      pref.backend.synced_dirs.templates_ext = '.php';
      fs.writeFileSync(templateYml, '');

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);

          expect(pref.backend.synced_dirs.templates_dir).to.not.exist;
          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('imports using global templates_dir, and global templates_ext', function (done) {
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.yml`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      pref.backend.synced_dirs.templates_ext = '.php';
      fs.writeFileSync(templateYml, '');

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateMustacheActual = fs.readFileSync(template, conf.enc);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.true;
          expect(templateMustacheActual).to.equal(templateMustacheExpected);
          expect(templateYmlActual).to.equal(templateYmlExpected);

          done();
        }
      );
    });

    it('errors using overriding local templates_dir, and undefined templates_ext', function (done) {
      const templateYmlExpected = `templates_dir: ${templatesDirBackNonex}`;
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.yml`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      delete pref.backend.synced_dirs.templates_ext;
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(pref.backend.synced_dirs.templates_ext).to.not.exist;
          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;
          expect(templateYmlActual).to.equal(templateYmlExpected);

          done();
        }
      );
    });

    it('errors using undefined templates_dir, and overriding local templates_ext', function (done) {
      const templateYmlExpected = 'templates_ext: .foo';
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.yml`);

      delete pref.backend.synced_dirs.templates_dir;
      pref.backend.synced_dirs.templates_ext = '.php';
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(pref.backend.synced_dirs.templates_dir).to.not.exist;
          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;
          expect(templateYmlActual).to.equal(templateYmlExpected);

          done();
        }
      );
    });

    it('imports using overriding local templates_dir, and global templates_ext', function (done) {
      const templateYmlExpectedDir = `'templates_dir': |2
  ${templatesDirBack}/templates_dir-local
`;
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.yml`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      pref.backend.synced_dirs.templates_ext = '.php';
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateMustacheActual = fs.readFileSync(template, conf.enc);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.true;
          expect(templateMustacheActual).to.equal(templateMustacheExpected);
          expect(templateYmlActual).to.equal(templateYmlExpectedDir + templateYmlExpected);

          done();
        }
      );
    });

    it('imports using global templates_dir, and overriding local templates_ext', function (done) {
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.yml`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      pref.backend.synced_dirs.templates_ext = '.foo';
      fs.writeFileSync(templateYml, templateYmlExpectedExt);

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateMustacheActual = fs.readFileSync(template, conf.enc);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.true;
          expect(templateMustacheActual).to.equal(templateMustacheExpected);
          expect(templateYmlActual).to.equal(templateYmlExpectedExt + templateYmlExpected);

          done();
        }
      );
    });

    it('imports using overriding local templates_dir, and overriding local templates_ext', function (done) {
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.yml`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackNonex;
      pref.backend.synced_dirs.templates_ext = '.foo';
      fs.writeFileSync(templateYml, templateYmlExpectedDir + templateYmlExpectedExt);

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateMustacheActual = fs.readFileSync(template, conf.enc);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.true;
          expect(templateMustacheActual).to.equal(templateMustacheExpected);
          expect(templateYmlActual).to.equal(templateYmlExpectedDir + templateYmlExpectedExt + templateYmlExpected);

          done();
        }
      );
    });

    it('errors if global templates_dir points to a nonexistent directory', function (done) {
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.yml`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackNonex;
      pref.backend.synced_dirs.templates_ext = '.php';
      fs.writeFileSync(templateYml, '');

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);

          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors if global templates_ext mismatches actual extension', function (done) {
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.yml`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      pref.backend.synced_dirs.templates_ext = '.foo';
      fs.writeFileSync(templateYml, '');

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);

          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors if local templates_dir points to a nonexistent directory', function (done) {
      const templateYmlExpectedDir = `'templates_dir': |2
  ${templatesDirBackNonex}
`;
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.yml`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      pref.backend.synced_dirs.templates_ext = '.php';
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;
          expect(templateYmlActual).to.equal(templateYmlExpectedDir);

          done();
        }
      );
    });

    it('errors if local templates_ext mismatches actual extension', function (done) {
      const templateYmlExpected = 'templates_ext: .foo';
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.yml`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      pref.backend.synced_dirs.templates_ext = '.php';
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSeq(
        'import:php',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;
          expect(templateYmlActual).to.equal(templateYmlExpected);

          done();
        }
      );
    });
  });
});
