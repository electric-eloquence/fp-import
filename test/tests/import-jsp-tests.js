'use strict';

const fs = require('fs-extra');
const path = require('path');

const diveSync = require('diveSync');
const expect = require('chai').expect;

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
const templateBase = 'template-jsp';
const template = `${templatesDirFront}/${templateBase}.mustache`;
const templateYml = `${templatesDirFront}/${templateBase}.yml`;

const templateMustacheExpected = `{{{ jcomment }}}
{{{ jsp }}}
{{{ jcomment_1 }}}
{{{ jsp_1 }}}
{{{ jsp_2 }}}
{{{ jstl }}}/properties.xml{{{ jstl_1 }}}
{{{ jstl_2 }}}
  {{{ jstl_3 }}}
  {{{ jstl_4 }}}
{{{ jstl_5 }}}
{{{ jsp_3 }}}
<div>
  {{{ jsp_4 }}}
</div>
{{# templates-responsive_footer }}
  {{> 03-templates/responsive_footer }}
{{/ templates-responsive_footer }}
`;
const templateYmlExpectedExt = `'templates_ext': |2
  .jsp
`;
const templateYmlExpected = `'jcomment': |2
  <%--<%@ page import="com.frontend.taglib.jsparch.JspArchitectureTagSupport" %>--%>
'jcomment_1': |2
  <%--
  <%@ page import="com.frontend.util.PageValidator" %>
  <%@ include file="/properties/get.jsp" %>
  --%>
'jstl': |2
  <c:set var="data_xml">
'jstl_1': |2
  </c:set>
'jstl_2': |2
  <c:catch var="data_error">
'jstl_3': |2
  <c:import var="data_xmldoc" url="\${data_xml}" />
'jstl_4': |2
  <x:parse var="data" xml="\${data_xmldoc}" />
'jstl_5': |2
  </c:catch>
'jsp': |2
  <%@ page import="com.frontend.util.JspUtils" %>
'jsp_1': |2
  <%@ taglib prefix="c" uri="/shared/tlds/c.tld" %>
'jsp_2': |2
  <%@ taglib prefix="x" uri="/shared/tlds/x.tld" %>
'jsp_3': |2
  <%
    String maincomponent = JspUtils.getAttr(request, "maincomponent", false);
    String section = JspUtils.getAttr(request, "section", false);
    String which_mode = "secondary";
    String section_id = section.toLowerCase().replace(' ', '_');
    if {
      (section_id.equals("homepage")) which_mode = "primary";
    }
    else if {
      (section_id.equals("broadband")) which_mode = "broadband";
    }
  %>
'jsp_4': |2
  <% JspUtils.include(maincomponent); %>
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

describe('fp import:jsp', function () {
  before(function () {
    pref.backend.synced_dirs = {};
  });

  beforeEach(function () {
    resetArgv();
  });

  after(function () {
    resetTemplatesDir();
  });

  it('should error with no -f argument', function (done) {
    fp.runSequence(
      'import:jsp',
      done
    );
  });

  // Test success and error cases. The error cases should pass as tests.
  // For backend -f arguments, when local yml and global yml differ, always fail and emit error.
  // This prevents overwriting local settings on the frontend meant for something else on the backend.
  describe('`fp import:jsp` with backend -f argument', function () {
    const subdir = 'argv.f-backend';
    const templatesDirFrontSub = `${templatesDirFront}/${subdir}`;
    const templatesDirBackSub = `${templatesDirBack}/${subdir}`;
    const templateYmlExpectedDir = `'templates_dir': |2
  ${templatesDirBackSub}
`;

    it('should import using absolute path argument', function (done) {
      const {
        templateExistsBefore,
        templateYmlExistsBefore
      } = resetTemplatesDir({
        template,
        templateYml
      });

      process.argv.push('-f');
      process.argv.push(`${conf.backend_dir}/${templatesDirBackSub}/${templateBase}.jsp`);

      delete pref.backend.synced_dirs.templates_dir;
      delete pref.backend.synced_dirs.templates_ext;

      fp.runSequence(
        'import:jsp',
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

    it('should import using undefined templates_dir, and undefined templates_ext', function (done) {
      const {
        templateExistsBefore,
        templateYmlExistsBefore
      } = resetTemplatesDir({
        template,
        templateYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.jsp`);

      delete pref.backend.synced_dirs.templates_dir;
      delete pref.backend.synced_dirs.templates_ext;

      fp.runSequence(
        'import:jsp',
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

    it('should import using global templates_dir, and undefined templates_ext', function (done) {
      const {
        templateExistsBefore,
        templateYmlExistsBefore
      } = resetTemplatesDir({
        template,
        templateYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.jsp`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      delete pref.backend.synced_dirs.templates_ext;

      fp.runSequence(
        'import:jsp',
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

    it('should import using undefined templates_dir, and global templates_ext', function (done) {
      const {
        templateExistsBefore,
        templateYmlExistsBefore
      } = resetTemplatesDir({
        template,
        templateYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.jsp`);

      delete pref.backend.synced_dirs.templates_dir;
      pref.backend.synced_dirs.templates_ext = '.jsp';

      fp.runSequence(
        'import:jsp',
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

    it('should import using global templates_dir, and global templates_ext', function (done) {
      const {
        templateExistsBefore,
        templateYmlExistsBefore
      } = resetTemplatesDir({
        template,
        templateYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.jsp`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      pref.backend.synced_dirs.templates_ext = '.jsp';

      fp.runSequence(
        'import:jsp',
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

    it('should error using conflicting templates_dir, and undefined templates_ext', function (done) {
      const templateYmlExpected = `templates_dir: ${templatesDirBackNonex}`;
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.jsp`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      delete pref.backend.synced_dirs.templates_ext;
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSequence(
        'import:jsp',
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

    it('should error using undefined templates_dir, and conflicting templates_ext', function (done) {
      const templateYmlExpected = 'templates_ext: .foo';
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.jsp`);

      delete pref.backend.synced_dirs.templates_dir;
      pref.backend.synced_dirs.templates_ext = '.jsp';
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSequence(
        'import:jsp',
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

    it('should error using conflicting templates_dir, and global templates_ext', function (done) {
      const templateYmlExpected = `templates_dir: ${templatesDirBackNonex}`;
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.jsp`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      pref.backend.synced_dirs.templates_ext = '.jsp';
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSequence(
        'import:jsp',
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

    it('should error using global templates_dir, and conflicting templates_ext', function (done) {
      const templateYmlExpected = 'templates_ext: .foo';
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.jsp`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      pref.backend.synced_dirs.templates_ext = '.jsp';
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSequence(
        'import:jsp',
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

    it('should error using conflicting templates_dir, and conflicting templates_ext', function (done) {
      const templateYmlExpected = `templates_dir: ${templatesDirBackNonex}\ntemplates_ext: .foo`;
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.jsp`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      pref.backend.synced_dirs.templates_ext = '.jsp';
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSequence(
        'import:jsp',
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

    it('should import even if global templates_dir points to a nonexistent directory', function (done) {
      const {
        templateExistsBefore,
        templateYmlExistsBefore
      } = resetTemplatesDir({
        template,
        templateYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.jsp`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackNonex;
      delete pref.backend.synced_dirs.templates_ext;

      fp.runSequence(
        'import:jsp',
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

    it('should import even if global templates_ext mismatches arg extension', function (done) {
      const {
        templateExistsBefore,
        templateYmlExistsBefore
      } = resetTemplatesDir({
        template,
        templateYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.jsp`);

      delete pref.backend.synced_dirs.templates_dir;
      pref.backend.synced_dirs.templates_ext = '.foo';

      fp.runSequence(
        'import:jsp',
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

    it('should error using local templates_dir that points to a nonexistent directory', function (done) {
      const templateYmlExpected = `templates_dir: ${templatesDirBackNonex}`;
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.jsp`);

      delete pref.backend.synced_dirs.templates_dir;
      delete pref.backend.synced_dirs.templates_ext;
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSequence(
        'import:jsp',
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

    it('should error using local templates_ext that mismatches arg extension', function (done) {
      const templateYmlExpected = 'templates_ext: .foo';
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.jsp`);

      delete pref.backend.synced_dirs.templates_dir;
      delete pref.backend.synced_dirs.templates_ext;
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSequence(
        'import:jsp',
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

    it('should import using global templates_dir that nests the arg path', function (done) {
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
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.jsp`);

      pref.backend.synced_dirs.templates_dir = templatesDirBack;
      delete pref.backend.synced_dirs.templates_ext;

      fp.runSequence(
        'import:jsp',
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

    it('should import where local templates_dir is nested by global templates_dir, and immediately nests -f argument\
', function (done) {
      const template = `${templatesDirFrontSub}/${templateBase}.mustache`;
      const templateYml = `${templatesDirFrontSub}/${templateBase}.yml`;
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.jsp`);

      pref.backend.synced_dirs.templates_dir = templatesDirBack;
      delete pref.backend.synced_dirs.templates_ext;
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSequence(
        'import:jsp',
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

    it('should error where local templates_dir is nested by global templates_dir, but does not immediately nest -f \
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
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.jsp`);

      pref.backend.synced_dirs.templates_dir = 'import';
      delete pref.backend.synced_dirs.templates_ext;
      fs.ensureDirSync(templateDir);
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSequence(
        'import:jsp',
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

    it('should error where local templates_dir nests global local templates_dir, and therefore cannot immediately nest \
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
      process.argv.push(`backend/${templatesDirBackSub}/${templateBase}.jsp`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      delete pref.backend.synced_dirs.templates_ext;
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSequence(
        'import:jsp',
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
  describe('`fp import:jsp` with frontend -f argument and conf.ui.patternExtension', function () {
    const subdir = 'templates_dir-global';
    const templatesDirBackSub = `${templatesDirBack}/${subdir}`;
    const templateYmlExpectedDir = `'templates_dir': |2
  ${templatesDirBackSub}
`;

    it('should import using absolute path argument', function (done) {
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
      pref.backend.synced_dirs.templates_ext = '.jsp';

      fp.runSequence(
        'import:jsp',
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

    it('should error using undefined templates_dir, and undefined templates_ext', function (done) {
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

      fp.runSequence(
        'import:jsp',
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

    it('should error using global templates_dir, and undefined templates_ext', function (done) {
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

      fp.runSequence(
        'import:jsp',
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

    it('should error using undefined templates_dir, and global templates_ext', function (done) {
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
      pref.backend.synced_dirs.templates_ext = '.jsp';

      fp.runSequence(
        'import:jsp',
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

    it('should import using global templates_dir, and global templates_ext', function (done) {
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
      pref.backend.synced_dirs.templates_ext = '.jsp';

      fp.runSequence(
        'import:jsp',
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

    it('should error using overriding local templates_dir, and undefined templates_ext', function (done) {
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

      fp.runSequence(
        'import:jsp',
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

    it('should error using undefined templates_dir, and overriding local templates_ext', function (done) {
      const templateYmlExpected = 'templates_ext: .foo';
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.mustache`);

      delete pref.backend.synced_dirs.templates_dir;
      pref.backend.synced_dirs.templates_ext = '.jsp';
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSequence(
        'import:jsp',
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

    it('should import using overriding local templates_dir, and global templates_ext', function (done) {
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
      pref.backend.synced_dirs.templates_ext = '.jsp';
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSequence(
        'import:jsp',
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

    it('should import using global templates_dir, and overriding local templates_ext', function (done) {
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

      fp.runSequence(
        'import:jsp',
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

    it('should import using overriding local templates_dir, and overriding local templates_ext', function (done) {
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

      fp.runSequence(
        'import:jsp',
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

    it('should error if global templates_dir points to a nonexistent directory', function (done) {
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
      pref.backend.synced_dirs.templates_ext = '.jsp';

      fp.runSequence(
        'import:jsp',
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

    it('should error if global templates_ext mismatches actual extension', function (done) {
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

      fp.runSequence(
        'import:jsp',
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

    it('should error if local templates_dir points to a nonexistent directory', function (done) {
      const templateYmlExpectedDir = `templates_dir: |2
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
      pref.backend.synced_dirs.templates_ext = '.jsp';
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSequence(
        'import:jsp',
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

    it('should error if local templates_ext mismatches actual extension', function (done) {
      const templateYmlExpected = 'templates_ext: .foo';
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.mustache`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      pref.backend.synced_dirs.templates_ext = '.jsp';
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSequence(
        'import:jsp',
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
  describe('`fp import:jsp` with frontend -f argument and .yml extension', function () {
    const subdir = 'templates_dir-global';
    const templatesDirBackSub = `${templatesDirBack}/${subdir}`;
    const templateYmlExpectedDir = `'templates_dir': |2
  ${templatesDirBackSub}
`;

    it('should import using absolute path argument', function (done) {
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFront}/${templateBase}.yml`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      pref.backend.synced_dirs.templates_ext = '.jsp';
      fs.writeFileSync(templateYml, '');

      fp.runSequence(
        'import:jsp',
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

    it('should error using undefined templates_dir, and undefined templates_ext', function (done) {
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

      fp.runSequence(
        'import:jsp',
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

    it('should error using global templates_dir, and undefined templates_ext', function (done) {
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

      fp.runSequence(
        'import:jsp',
        () => {
          const templateExistsAfter = fs.existsSync(template);

          expect(pref.backend.synced_dirs.templates_ext).to.not.exist;
          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('should error using undefined templates_dir, and global templates_ext', function (done) {
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.yml`);

      delete pref.backend.synced_dirs.templates_dir;
      pref.backend.synced_dirs.templates_ext = '.jsp';
      fs.writeFileSync(templateYml, '');

      fp.runSequence(
        'import:jsp',
        () => {
          const templateExistsAfter = fs.existsSync(template);

          expect(pref.backend.synced_dirs.templates_dir).to.not.exist;
          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('should import using global templates_dir, and global templates_ext', function (done) {
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.yml`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      pref.backend.synced_dirs.templates_ext = '.jsp';
      fs.writeFileSync(templateYml, '');

      fp.runSequence(
        'import:jsp',
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

    it('should error using overriding local templates_dir, and undefined templates_ext', function (done) {
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

      fp.runSequence(
        'import:jsp',
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

    it('should error using undefined templates_dir, and overriding local templates_ext', function (done) {
      const templateYmlExpected = 'templates_ext: .foo';
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.yml`);

      delete pref.backend.synced_dirs.templates_dir;
      pref.backend.synced_dirs.templates_ext = '.jsp';
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSequence(
        'import:jsp',
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

    it('should import using overriding local templates_dir, and global templates_ext', function (done) {
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
      pref.backend.synced_dirs.templates_ext = '.jsp';
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSequence(
        'import:jsp',
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

    it('should import using global templates_dir, and overriding local templates_ext', function (done) {
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

      fp.runSequence(
        'import:jsp',
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

    it('should import using overriding local templates_dir, and overriding local templates_ext', function (done) {
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

      fp.runSequence(
        'import:jsp',
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

    it('should error if global templates_dir points to a nonexistent directory', function (done) {
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.yml`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackNonex;
      pref.backend.synced_dirs.templates_ext = '.jsp';
      fs.writeFileSync(templateYml, '');

      fp.runSequence(
        'import:jsp',
        () => {
          const templateExistsAfter = fs.existsSync(template);

          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('should error if global templates_ext mismatches actual extension', function (done) {
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

      fp.runSequence(
        'import:jsp',
        () => {
          const templateExistsAfter = fs.existsSync(template);

          expect(templateExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('should error if local templates_dir points to a nonexistent directory', function (done) {
      const templateYmlExpectedDir = `templates_dir: |2
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
      pref.backend.synced_dirs.templates_ext = '.jsp';
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSequence(
        'import:jsp',
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

    it('should error if local templates_ext mismatches actual extension', function (done) {
      const templateYmlExpected = 'templates_ext: .foo';
      const {
        templateExistsBefore
      } = resetTemplatesDir({
        template
      });

      process.argv.push('-f');
      process.argv.push(`${templatesDirFrontRel}/${templateBase}.yml`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackSub;
      pref.backend.synced_dirs.templates_ext = '.jsp';
      fs.writeFileSync(templateYml, templateYmlExpected);

      fp.runSequence(
        'import:jsp',
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
