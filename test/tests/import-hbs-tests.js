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
const templateBase = 'template-hbs';
const template = `${templatesDirFront}/${templateBase}.mustache`;
const templateYml = `${templatesDirFront}/${templateBase}.yml`;

const templateMustacheExpected = `<!DOCTYPE html>
<html>
  <head>
    <title>
      {{{ hbs }}}
        {{{ hbs_1 }}} | {{{ hbs_2 }}}
      {{{ hbs_3 }}}
        {{{ hbs_4 }}}
      {{{ hbs_5 }}}
    </title>
 	{{{ hbs_6 }}}
  </head>
  <body>
    {{{ hbs_7 }}}
    {{# templates-responsive_footer }}
      {{> 03-templates/responsive_footer }}
    {{/ templates-responsive_footer }}
  </body>
</html>
`;
const templateYmlExpectedExt = `'templates_ext': |2
  .hbs
`;
const templateYmlExpected = `'hbs': |2
  \\{\\{#if page.title\\}\\}
'hbs_1': |2
  \\{\\{page.title\\}\\}
'hbs_2': |2
  \\{\\{config.site.name\\}\\}
'hbs_3': |2
  \\{\\{else\\}\\}
'hbs_4': |2
  \\{\\{config.site.name\\}\\}
'hbs_5': |2
  \\{\\{/if\\}\\}
'hbs_6': |2
  \\{\\{> meta-partials/meta_tags\\}\\}
'hbs_7': |2
  \\{\\{& page.body\\}\\}
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

describe('fp import:hbs', function () {
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
      'import:hbs',
      done
    );
  });

  // Test success and error cases. The error cases should pass as tests.
  // For backend -f arguments, when local yml and global yml differ, always fail and emit error.
  // This prevents overwriting local settings on the frontend meant for something else on the backend.
  describe('`fp import:hbs` with backend -f argument', function () {
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
      process.argv.push(`${conf.backend_dir}/${templatesDirBackSub}/${templateBase}.hbs`);

      delete pref.backend.synced_dirs.templates_dir;
      delete pref.backend.synced_dirs.templates_ext;

      fp.runSeq(
        'import:hbs',
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
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.hbs`);

      delete pref.backend.synced_dirs.templates_dir;
      delete pref.backend.synced_dirs.templates_ext;

      fp.runSeq(
        'import:hbs',
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
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.hbs`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      delete pref.backend.synced_dirs.templates_ext;

      fp.runSeq(
        'import:hbs',
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
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.hbs`);

      delete pref.backend.synced_dirs.templates_dir;
      pref.backend.synced_dirs.templates_ext = '.hbs';

      fp.runSeq(
        'import:hbs',
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
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.hbs`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      pref.backend.synced_dirs.templates_ext = '.hbs';

      fp.runSeq(
        'import:hbs',
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
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.hbs`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      delete pref.backend.synced_dirs.templates_ext;
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSeq(
        'import:hbs',
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
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.hbs`);

      delete pref.backend.synced_dirs.templates_dir;
      pref.backend.synced_dirs.templates_ext = '.hbs';
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSeq(
        'import:hbs',
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
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.hbs`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      pref.backend.synced_dirs.templates_ext = '.hbs';
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSeq(
        'import:hbs',
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
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.hbs`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      pref.backend.synced_dirs.templates_ext = '.hbs';
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSeq(
        'import:hbs',
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
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.hbs`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      pref.backend.synced_dirs.templates_ext = '.hbs';
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSeq(
        'import:hbs',
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
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.hbs`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackNonex;
      delete pref.backend.synced_dirs.templates_ext;

      fp.runSeq(
        'import:hbs',
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
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.hbs`);

      delete pref.backend.synced_dirs.templates_dir;
      pref.backend.synced_dirs.templates_ext = '.foo';

      fp.runSeq(
        'import:hbs',
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
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.hbs`);

      delete pref.backend.synced_dirs.templates_dir;
      delete pref.backend.synced_dirs.templates_ext;
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSeq(
        'import:hbs',
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
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.hbs`);

      delete pref.backend.synced_dirs.templates_dir;
      delete pref.backend.synced_dirs.templates_ext;
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSeq(
        'import:hbs',
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
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.hbs`);

      pref.backend.synced_dirs.templates_dir = templatesDirBack;
      delete pref.backend.synced_dirs.templates_ext;

      fp.runSeq(
        'import:hbs',
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
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.hbs`);

      pref.backend.synced_dirs.templates_dir = templatesDirBack;
      delete pref.backend.synced_dirs.templates_ext;
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSeq(
        'import:hbs',
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

    it('errors where local templates_dir is nested by global templates_dir, but does not immediately nest -f argument\
', function (done) {
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
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.hbs`);

      pref.backend.synced_dirs.templates_dir = 'import';
      delete pref.backend.synced_dirs.templates_ext;
      fs.ensureDirSync(templateDir);
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSeq(
        'import:hbs',
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

    it('errors where local templates_dir nests global local templates_dir, and therefore cannot immediately nest -f \
argument', function (done) {
      const template = `${templatesDirFront}/${templateBase}.mustache`;
      const templateYml = `${templatesDirFront}/${templateBase}.yml`;
      const templateYmlExpected = `templates_dir: ${templatesDirBack}`;
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.hbs`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      delete pref.backend.synced_dirs.templates_ext;
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSeq(
        'import:hbs',
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
  describe('`fp import:hbs` with frontend -f argument and conf.ui.patternExtension', function () {
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
      pref.backend.synced_dirs.templates_ext = '.hbs';

      fp.runSeq(
        'import:hbs',
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
        'import:hbs',
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
        'import:hbs',
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
      pref.backend.synced_dirs.templates_ext = '.hbs';

      fp.runSeq(
        'import:hbs',
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
      pref.backend.synced_dirs.templates_ext = '.hbs';

      fp.runSeq(
        'import:hbs',
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
        'import:hbs',
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
      pref.backend.synced_dirs.templates_ext = '.hbs';
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSeq(
        'import:hbs',
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
      pref.backend.synced_dirs.templates_ext = '.hbs';
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSeq(
        'import:hbs',
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
        'import:hbs',
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
        'import:hbs',
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
      pref.backend.synced_dirs.templates_ext = '.hbs';

      fp.runSeq(
        'import:hbs',
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
        'import:hbs',
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
      pref.backend.synced_dirs.templates_ext = '.hbs';
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSeq(
        'import:hbs',
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
      pref.backend.synced_dirs.templates_ext = '.hbs';
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSeq(
        'import:hbs',
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
  describe('`fp import:hbs` with frontend -f argument and .yml extension', function () {
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
      pref.backend.synced_dirs.templates_ext = '.hbs';
      fs.writeFileSync(templateYml, '');

      fp.runSeq(
        'import:hbs',
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
        'import:hbs',
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
        'import:hbs',
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
      pref.backend.synced_dirs.templates_ext = '.hbs';
      fs.writeFileSync(templateYml, '');

      fp.runSeq(
        'import:hbs',
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
      pref.backend.synced_dirs.templates_ext = '.hbs';
      fs.writeFileSync(templateYml, '');

      fp.runSeq(
        'import:hbs',
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
        'import:hbs',
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
      pref.backend.synced_dirs.templates_ext = '.hbs';
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSeq(
        'import:hbs',
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
      pref.backend.synced_dirs.templates_ext = '.hbs';
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSeq(
        'import:hbs',
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
        'import:hbs',
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
        'import:hbs',
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
      pref.backend.synced_dirs.templates_ext = '.hbs';
      fs.writeFileSync(templateYml, '');

      fp.runSeq(
        'import:hbs',
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
        'import:hbs',
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
      pref.backend.synced_dirs.templates_ext = '.hbs';
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSeq(
        'import:hbs',
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
      pref.backend.synced_dirs.templates_ext = '.hbs';
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSeq(
        'import:hbs',
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
