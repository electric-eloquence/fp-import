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

function resetDir(args, dir) {
  diveSync(dir, (err, file) => {
    fs.unlinkSync(file);
  });

  const returnObj = {};

  for (let fileKey of Object.keys(args)) {
    returnObj[`${fileKey}ExistsBefore`] = fs.existsSync(args[fileKey]);
  }

  return returnObj;
}

function resetExportsDir(args = {}) {
  return resetDir(args, `${conf.backend_dir}/export`);
}

describe('fp export', function () {
  beforeEach(function () {
    pref.backend.synced_dirs = {};

    resetArgv();
  });

  it('errors with no -f argument', function (done) {
    fp.runSeq(
      'export',
      done
    );
  });

  it('errors if -f argument points to the backend', function (done) {
    process.argv.push('-f');
    process.argv.push('backend/export/templates/templates-erb.erb');

    fp.runSeq(
      'export',
      done
    );
  });

  describe('`fp export` erb templates', function () {
    const templatesDirFront = conf.ui.paths.source.templates;
    const templatesDirBackRel = 'export/templates';
    const templatesDirBack = `${conf.backend_dir}/${templatesDirBackRel}`;
    const templateBase = 'template-erb';
    const template = `${templatesDirFront}/${templateBase}.mustache`;
    const templateYml = `${templatesDirFront}/${templateBase}.yml`;
    const templateExport = `${templatesDirBack}/${templateBase}.erb`;

    const templateExportExpected = `<% require 'fileutils' %>
<% require 'rexml/parsers/pullparser' %>
<%
  class Pub
    CHECKER = "pubcheck"
    STYLESHEET = File.expand_path(File.join(File.dirname(__FILE__), '..', '..', "book.xsl"))
    CALLOUT_PATH = File.join('images', 'callouts')
    CALLOUT_FULL_PATH = File.expand_path(File.join(File.dirname(__FILE__), '..', '..', '..', CALLOUT_PATH))
    CALLOUT_LIMIT = 15
    OUTPUT_DIR = ".pubtmp#{Time.now.to_f.to_s}"
    META_DIR = "META-INF"
    OEBPS_DIR = "OEBPS"
    ZIPPER = "zip"
  end
%>
<div>
  <%= Pub::CHECKER %>
</div>
<!--{{# templates-responsive_footer }}-->
  <!--{{> 03-templates/responsive_footer }}-->
<!--{{/ templates-responsive_footer }}-->
`;
    const templateMustache = `{{{ erb }}}
{{{ erb_1 }}}
{{{ erb_2 }}}
<div>
  {{{ erb_3 }}}
</div>
{{# templates-responsive_footer }}
  {{> 03-templates/responsive_footer }}
{{/ templates-responsive_footer }}
`;
    const templateYmlYaml = `'erb': |2
  <% require 'fileutils' %>
'erb_1': |2
  <% require 'rexml/parsers/pullparser' %>
'erb_2': |2
  <%
    class Pub
      CHECKER = "pubcheck"
      STYLESHEET = File.expand_path(File.join(File.dirname(__FILE__), '..', '..', "book.xsl"))
      CALLOUT_PATH = File.join('images', 'callouts')
      CALLOUT_FULL_PATH = File.expand_path(File.join(File.dirname(__FILE__), '..', '..', '..', CALLOUT_PATH))
      CALLOUT_LIMIT = 15
      OUTPUT_DIR = ".pubtmp#{Time.now.to_f.to_s}"
      META_DIR = "META-INF"
      OEBPS_DIR = "OEBPS"
      ZIPPER = "zip"
    end
  %>
'erb_3': |2
  <%= Pub::CHECKER %>
'# templates-responsive_footer': |2
  <!--\\{\\{# templates-responsive_footer \\}\\}-->
'> 03-templates/responsive_footer': |2
  <!--\\{\\{> 03-templates/responsive_footer \\}\\}-->
'/ templates-responsive_footer': |2
  <!--\\{\\{/ templates-responsive_footer \\}\\}-->
`;

    function resetTemplatesDir(args = {}) {
      return resetDir(args, templatesDirFront);
    }

    beforeEach(function () {
      resetTemplatesDir();
      fs.writeFileSync(template, templateMustache);
      fs.writeFileSync(templateYml, templateYmlYaml);
    });

    after(function () {
      resetTemplatesDir();
    });

    it('errors using undefined templates_dir, and undefined templates_ext', function (done) {
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      delete pref.backend.synced_dirs.templates_dir;
      delete pref.backend.synced_dirs.templates_ext;

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors using global templates_dir, and undefined templates_ext', function (done) {
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      delete pref.backend.synced_dirs.templates_ext;

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors using undefined templates_dir, and global templates_ext', function (done) {
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      delete pref.backend.synced_dirs.templates_dir;
      pref.backend.synced_dirs.templates_ext = '.erb';

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('exports template using global templates_dir, and global templates_ext', function (done) {
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      pref.backend.synced_dirs.templates_ext = '.erb';

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);
          const templateExportActual = fs.readFileSync(templateExport, conf.enc);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.true;
          expect(templateExportActual).to.equal(templateExportExpected);

          done();
        }
      );
    });

    it('errors using overriding local templates_dir, and undefined templates_ext', function (done) {
      const templateExport = `${templatesDirBack}/templates_dir-local/${templateBase}.erb`;
      const templateYmlExpectedDir = `templates_dir: |2
  ${templatesDirBackRel}/templates_dir-local
`;
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      delete pref.backend.synced_dirs.templates_ext;
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors using undefined templates_dir, and overriding templates_ext', function (done) {
      const templateExport = `${templatesDirBack}/${templateBase}.foo`;
      const templateYmlExpectedExt = `templates_ext: |2
  .foo
`;
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      delete pref.backend.synced_dirs.templates_dir;
      pref.backend.synced_dirs.templates_ext = '.erb';
      fs.writeFileSync(templateYml, templateYmlExpectedExt);

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('exports template using overriding local templates_dir, and global templates_ext', function (done) {
      const templateExport = `${templatesDirBack}/templates_dir-local/${templateBase}.erb`;
      const templateYmlExpectedDir = `templates_dir: |2
  ${templatesDirBackRel}/templates_dir-local
`;
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      pref.backend.synced_dirs.templates_ext = '.erb';
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('exports template using global templates_dir, and overriding local templates_ext', function (done) {
      const templateExport = `${templatesDirBack}/${templateBase}.foo`;
      const templateYmlExpectedExt = `templates_ext: |2
  .foo
`;
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      pref.backend.synced_dirs.templates_ext = '.erb';
      fs.writeFileSync(templateYml, templateYmlExpectedExt);

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('errors if global templates_dir points to a nonexistent directory', function (done) {
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = 'nonex/templates';
      pref.backend.synced_dirs.templates_ext = '.erb';

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors if local templates_dir points to a nonexistent directory', function (done) {
      const templateYmlExpectedDir = `templates_dir: |2
  nonex/templates
`;
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      pref.backend.synced_dirs.templates_ext = '.erb';
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });
  });

  describe('`fp export` hbs templates', function () {
    const templatesDirFront = conf.ui.paths.source.templates;
    const templatesDirBackRel = 'export/templates';
    const templatesDirBack = `${conf.backend_dir}/${templatesDirBackRel}`;
    const templateBase = 'template-hbs';
    const template = `${templatesDirFront}/${templateBase}.mustache`;
    const templateYml = `${templatesDirFront}/${templateBase}.yml`;
    const templateExport = `${templatesDirBack}/${templateBase}.hbs`;

    const templateExportExpected = `<!DOCTYPE html>
<html>
  <head>
    <title>
      {{#if page.title}}
        {{page.title}} | {{config.site.name}}
      {{else}}
        {{config.site.name}}
      {{/if}}
    </title>
 	{{> meta-partials/meta_tags}}
  </head>
  <body>
    {{& page.body}}
    <!--{{# templates-responsive_footer }}-->
      <!--{{> 03-templates/responsive_footer }}-->
    <!--{{/ templates-responsive_footer }}-->
  </body>
</html>
`;
    const templateMustache = `<!DOCTYPE html>
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
    const templateYmlYaml = `'hbs': |2
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

    function resetTemplatesDir(args = {}) {
      return resetDir(args, templatesDirFront);
    }

    beforeEach(function () {
      resetTemplatesDir();
      fs.writeFileSync(template, templateMustache);
      fs.writeFileSync(templateYml, templateYmlYaml);
    });

    after(function () {
      resetTemplatesDir();
    });

    it('exports template using relative path argument', function (done) {
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(`${conf.ui.pathsRelative.source.templates}/${templateBase}.mustache`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      pref.backend.synced_dirs.templates_ext = '.hbs';

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);
          const templateExportActual = fs.readFileSync(templateExport, conf.enc);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.true;
          expect(templateExportActual).to.equal(templateExportExpected);

          done();
        }
      );
    });

    it('errors using undefined templates_dir, and undefined templates_ext', function (done) {
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      delete pref.backend.synced_dirs.templates_dir;
      delete pref.backend.synced_dirs.templates_ext;

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors using global templates_dir, and undefined templates_ext', function (done) {
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      delete pref.backend.synced_dirs.templates_ext;

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors using undefined templates_dir, and global templates_ext', function (done) {
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      delete pref.backend.synced_dirs.templates_dir;
      pref.backend.synced_dirs.templates_ext = '.hbs';

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('exports template using global templates_dir, and global templates_ext', function (done) {
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      pref.backend.synced_dirs.templates_ext = '.hbs';

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);
          const templateExportActual = fs.readFileSync(templateExport, conf.enc);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.true;
          expect(templateExportActual).to.equal(templateExportExpected);

          done();
        }
      );
    });

    it('errors using overriding local templates_dir, and undefined templates_ext', function (done) {
      const templateExport = `${templatesDirBack}/templates_dir-local/${templateBase}.hbs`;
      const templateYmlExpectedDir = `templates_dir: |2
  ${templatesDirBackRel}/templates_dir-local
`;
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      delete pref.backend.synced_dirs.templates_ext;
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors using undefined templates_dir, and overriding templates_ext', function (done) {
      const templateExport = `${templatesDirBack}/${templateBase}.foo`;
      const templateYmlExpectedExt = `templates_ext: |2
  .foo
`;
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      delete pref.backend.synced_dirs.templates_dir;
      pref.backend.synced_dirs.templates_ext = '.hbs';
      fs.writeFileSync(templateYml, templateYmlExpectedExt);

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('exports template using overriding local templates_dir, and global templates_ext', function (done) {
      const templateExport = `${templatesDirBack}/templates_dir-local/${templateBase}.hbs`;
      const templateYmlExpectedDir = `templates_dir: |2
  ${templatesDirBackRel}/templates_dir-local
`;
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      pref.backend.synced_dirs.templates_ext = '.hbs';
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('exports template using global templates_dir, and overriding local templates_ext', function (done) {
      const templateExport = `${templatesDirBack}/${templateBase}.foo`;
      const templateYmlExpectedExt = `templates_ext: |2
  .foo
`;
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      pref.backend.synced_dirs.templates_ext = '.hbs';
      fs.writeFileSync(templateYml, templateYmlExpectedExt);

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('errors if global templates_dir points to a nonexistent directory', function (done) {
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = 'nonex/templates';
      pref.backend.synced_dirs.templates_ext = '.hbs';

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors if local templates_dir points to a nonexistent directory', function (done) {
      const templateYmlExpectedDir = `templates_dir: |2
  nonex/templates
`;
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      pref.backend.synced_dirs.templates_ext = '.hbs';
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });
  });

  describe('`fp export` jsp templates', function () {
    const templatesDirFront = conf.ui.paths.source.templates;
    const templatesDirBackRel = 'export/templates';
    const templatesDirBack = `${conf.backend_dir}/${templatesDirBackRel}`;
    const templateBase = 'template-jsp';
    const template = `${templatesDirFront}/${templateBase}.mustache`;
    const templateYml = `${templatesDirFront}/${templateBase}.yml`;
    const templateExport = `${templatesDirBack}/${templateBase}.jsp`;

    const templateExportExpected = `<%--<%@ page import="com.frontend.taglib.jsparch.JspArchitectureTagSupport" %>--%>
<%@ page import="com.frontend.util.JspUtils" %>
<%--
<%@ page import="com.frontend.util.PageValidator" %>
<%@ include file="/properties/get.jsp" %>
--%>
<%@ taglib prefix="c" uri="/shared/tlds/c.tld" %>
<%@ taglib prefix="x" uri="/shared/tlds/x.tld" %>
<c:set var="data_xml">/properties.xml</c:set>
<c:catch var="data_error">
  <c:import var="data_xmldoc" url="\${data_xml}" />
  <x:parse var="data" xml="\${data_xmldoc}" />
</c:catch>
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
<div>
  <% JspUtils.include(maincomponent); %>
</div>
<!--{{# templates-responsive_footer }}-->
  <!--{{> 03-templates/responsive_footer }}-->
<!--{{/ templates-responsive_footer }}-->
`;
    const templateMustache = `{{{ jcomment }}}
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
    const templateYmlYaml = `jcomment: |2
  <%--<%@ page import="com.frontend.taglib.jsparch.JspArchitectureTagSupport" %>--%>
jcomment_1: |2
  <%--
  <%@ page import="com.frontend.util.PageValidator" %>
  <%@ include file="/properties/get.jsp" %>
  --%>
jstl: |2
  <c:set var="data_xml">
jstl_1: |2
  </c:set>
jstl_2: |2
  <c:catch var="data_error">
jstl_3: |2
  <c:import var="data_xmldoc" url="\${data_xml}" />
jstl_4: |2
  <x:parse var="data" xml="\${data_xmldoc}" />
jstl_5: |2
  </c:catch>
jsp: |2
  <%@ page import="com.frontend.util.JspUtils" %>
jsp_1: |2
  <%@ taglib prefix="c" uri="/shared/tlds/c.tld" %>
jsp_2: |2
  <%@ taglib prefix="x" uri="/shared/tlds/x.tld" %>
jsp_3: |2
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
jsp_4: |2
  <% JspUtils.include(maincomponent); %>
'# templates-responsive_footer': |2
  <!--\\{\\{# templates-responsive_footer \\}\\}-->
'> 03-templates/responsive_footer': |2
  <!--\\{\\{> 03-templates/responsive_footer \\}\\}-->
'/ templates-responsive_footer': |2
  <!--\\{\\{/ templates-responsive_footer \\}\\}-->
`;

    function resetTemplatesDir(args = {}) {
      return resetDir(args, templatesDirFront);
    }

    beforeEach(function () {
      resetTemplatesDir();
      fs.writeFileSync(template, templateMustache);
      fs.writeFileSync(templateYml, templateYmlYaml);
    });

    after(function () {
      resetTemplatesDir();
    });

    it('errors using undefined templates_dir, and undefined templates_ext', function (done) {
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      delete pref.backend.synced_dirs.templates_dir;
      delete pref.backend.synced_dirs.templates_ext;

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors using global templates_dir, and undefined templates_ext', function (done) {
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      delete pref.backend.synced_dirs.templates_ext;

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors using undefined templates_dir, and global templates_ext', function (done) {
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      delete pref.backend.synced_dirs.templates_dir;
      pref.backend.synced_dirs.templates_ext = '.jsp';

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('exports template using global templates_dir, and global templates_ext', function (done) {
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      pref.backend.synced_dirs.templates_ext = '.jsp';

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);
          const templateExportActual = fs.readFileSync(templateExport, conf.enc);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.true;
          expect(templateExportActual).to.equal(templateExportExpected);

          done();
        }
      );
    });

    it('errors using overriding local templates_dir, and undefined templates_ext', function (done) {
      const templateExport = `${templatesDirBack}/templates_dir-local/${templateBase}.jsp`;
      const templateYmlExpectedDir = `templates_dir: |2
  ${templatesDirBackRel}/templates_dir-local
`;
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      delete pref.backend.synced_dirs.templates_ext;
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors using undefined templates_dir, and overriding templates_ext', function (done) {
      const templateExport = `${templatesDirBack}/${templateBase}.foo`;
      const templateYmlExpectedExt = `templates_ext: |2
  .foo
`;
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      delete pref.backend.synced_dirs.templates_dir;
      pref.backend.synced_dirs.templates_ext = '.jsp';
      fs.writeFileSync(templateYml, templateYmlExpectedExt);

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('exports template using overriding local templates_dir, and global templates_ext', function (done) {
      const templateExport = `${templatesDirBack}/templates_dir-local/${templateBase}.jsp`;
      const templateYmlExpectedDir = `templates_dir: |2
  ${templatesDirBackRel}/templates_dir-local
`;
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      pref.backend.synced_dirs.templates_ext = '.jsp';
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('exports template using global templates_dir, and overriding local templates_ext', function (done) {
      const templateExport = `${templatesDirBack}/${templateBase}.foo`;
      const templateYmlExpectedExt = `templates_ext: |2
  .foo
`;
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      pref.backend.synced_dirs.templates_ext = '.jsp';
      fs.writeFileSync(templateYml, templateYmlExpectedExt);

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('errors if global templates_dir points to a nonexistent directory', function (done) {
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = 'nonex/templates';
      pref.backend.synced_dirs.templates_ext = '.jsp';

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors if local templates_dir points to a nonexistent directory', function (done) {
      const templateYmlExpectedDir = `templates_dir: |2
  nonex/templates
`;
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      pref.backend.synced_dirs.templates_ext = '.jsp';
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });
  });

  describe('`fp export` php templates', function () {
    const templatesDirFront = conf.ui.paths.source.templates;
    const templatesDirBackRel = 'export/templates';
    const templatesDirBack = `${conf.backend_dir}/${templatesDirBackRel}`;
    const templateBase = 'template-php';
    const template = `${templatesDirFront}/${templateBase}.mustache`;
    const templateYml = `${templatesDirFront}/${templateBase}.yml`;
    const templateExport = `${templatesDirBack}/${templateBase}.php`;

    const templateExportExpected = `<?php require 'fileutils'; ?>
<?php require 'rexml/parsers/pullparser'; ?>
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
<div>
  <?php echo Pub::$checker; ?>
</div>
<!--{{# templates-responsive_footer }}-->
  <!--{{> 03-templates/responsive_footer }}-->
<!--{{/ templates-responsive_footer }}-->
`;
    const templateMustache = `{{{ php }}}
{{{ php_1 }}}
{{{ php_2 }}}
<div>
  {{{ php_3 }}}
</div>
{{# templates-responsive_footer }}
  {{> 03-templates/responsive_footer }}
{{/ templates-responsive_footer }}
`;
    const templateYmlYaml = `'php': |2
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

    function resetTemplatesDir(args = {}) {
      return resetDir(args, templatesDirFront);
    }

    beforeEach(function () {
      resetTemplatesDir();
      fs.writeFileSync(template, templateMustache);
      fs.writeFileSync(templateYml, templateYmlYaml);
    });

    after(function () {
      resetTemplatesDir();
    });

    it('errors using undefined templates_dir, and undefined templates_ext', function (done) {
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      delete pref.backend.synced_dirs.templates_dir;
      delete pref.backend.synced_dirs.templates_ext;

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors using global templates_dir, and undefined templates_ext', function (done) {
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      delete pref.backend.synced_dirs.templates_ext;

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors using undefined templates_dir, and global templates_ext', function (done) {
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      delete pref.backend.synced_dirs.templates_dir;
      pref.backend.synced_dirs.templates_ext = '.php';

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('exports template using global templates_dir, and global templates_ext', function (done) {
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      pref.backend.synced_dirs.templates_ext = '.php';

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);
          const templateExportActual = fs.readFileSync(templateExport, conf.enc);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.true;
          expect(templateExportActual).to.equal(templateExportExpected);

          done();
        }
      );
    });

    it('errors using overriding local templates_dir, and undefined templates_ext', function (done) {
      const templateExport = `${templatesDirBack}/templates_dir-local/${templateBase}.php`;
      const templateYmlExpectedDir = `templates_dir: |2
  ${templatesDirBackRel}/templates_dir-local
`;
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      delete pref.backend.synced_dirs.templates_ext;
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors using undefined templates_dir, and overriding templates_ext', function (done) {
      const templateExport = `${templatesDirBack}/${templateBase}.foo`;
      const templateYmlExpectedExt = `templates_ext: |2
  .foo
`;
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      delete pref.backend.synced_dirs.templates_dir;
      pref.backend.synced_dirs.templates_ext = '.php';
      fs.writeFileSync(templateYml, templateYmlExpectedExt);

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('exports template using overriding local templates_dir, and global templates_ext', function (done) {
      const templateExport = `${templatesDirBack}/templates_dir-local/${templateBase}.php`;
      const templateYmlExpectedDir = `templates_dir: |2
  ${templatesDirBackRel}/templates_dir-local
`;
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      pref.backend.synced_dirs.templates_ext = '.php';
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('exports template using global templates_dir, and overriding local templates_ext', function (done) {
      const templateExport = `${templatesDirBack}/${templateBase}.foo`;
      const templateYmlExpectedExt = `templates_ext: |2
  .foo
`;
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      pref.backend.synced_dirs.templates_ext = '.php';
      fs.writeFileSync(templateYml, templateYmlExpectedExt);

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('errors if global templates_dir points to a nonexistent directory', function (done) {
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = 'nonex/templates';
      pref.backend.synced_dirs.templates_ext = '.php';

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors if local templates_dir points to a nonexistent directory', function (done) {
      const templateYmlExpectedDir = `templates_dir: |2
  nonex/templates
`;
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      pref.backend.synced_dirs.templates_ext = '.php';
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });
  });

  describe('`fp export` twig templates', function () {
    const templatesDirFront = conf.ui.paths.source.templates;
    const templatesDirBackRel = 'export/templates';
    const templatesDirBack = `${conf.backend_dir}/${templatesDirBackRel}`;
    const templateBase = 'template-twig';
    const template = `${templatesDirFront}/${templateBase}.mustache`;
    const templateYml = `${templatesDirFront}/${templateBase}.yml`;
    const templateExport = `${templatesDirBack}/${templateBase}.twig`;

    const templateExportExpected = `<!DOCTYPE html>
<html>
  <head>
    <title>
      {% if page.title %}
        {{ page.title|e }} | {{ config.site.name|e }}
      {% else %}
        {{ config.site.name|e }}
      {% endif %}
    </title>
 	{% include 'meta-partials/meta_tags.twig' %}
  </head>
  <body>
    {% page.body %}
    <!--{{# templates-responsive_footer }}-->
      <!--{{> 03-templates/responsive_footer }}-->
    <!--{{/ templates-responsive_footer }}-->
  </body>
</html>
`;
    const templateMustache = `<!DOCTYPE html>
<html>
  <head>
    <title>
      {{{ twig }}}
        {{{ twig_1 }}} | {{{ twig_2 }}}
      {{{ twig_3 }}}
        {{{ twig_4 }}}
      {{{ twig_5 }}}
    </title>
 	{{{ twig_6 }}}
  </head>
  <body>
    {{{ twig_7 }}}
    {{# templates-responsive_footer }}
      {{> 03-templates/responsive_footer }}
    {{/ templates-responsive_footer }}
  </body>
</html>
`;
    const templateYmlYaml = `'twig': |2
  {% if page.title %}
'twig_1': |2
  \\{\\{ page.title|e \\}\\}
'twig_2': |2
  \\{\\{ config.site.name|e \\}\\}
'twig_3': |2
  {% else %}
'twig_4': |2
  \\{\\{ config.site.name|e \\}\\}
'twig_5': |2
  {% endif %}
'twig_6': |2
  {% include 'meta-partials/meta_tags.twig' %}
'twig_7': |2
  {% page.body %}
'# templates-responsive_footer': |2
  <!--\\{\\{# templates-responsive_footer \\}\\}-->
'> 03-templates/responsive_footer': |2
  <!--\\{\\{> 03-templates/responsive_footer \\}\\}-->
'/ templates-responsive_footer': |2
  <!--\\{\\{/ templates-responsive_footer \\}\\}-->
`;

    function resetTemplatesDir(args = {}) {
      return resetDir(args, templatesDirFront);
    }

    beforeEach(function () {
      resetTemplatesDir();
      fs.writeFileSync(template, templateMustache);
      fs.writeFileSync(templateYml, templateYmlYaml);
    });

    after(function () {
      resetTemplatesDir();
    });

    it('exports template using relative path argument', function (done) {
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(`${conf.ui.pathsRelative.source.templates}/${templateBase}.mustache`);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      pref.backend.synced_dirs.templates_ext = '.twig';

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);
          const templateExportActual = fs.readFileSync(templateExport, conf.enc);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.true;
          expect(templateExportActual).to.equal(templateExportExpected);

          done();
        }
      );
    });

    it('errors using undefined templates_dir, and undefined templates_ext', function (done) {
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      delete pref.backend.synced_dirs.templates_dir;
      delete pref.backend.synced_dirs.templates_ext;

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors using global templates_dir, and undefined templates_ext', function (done) {
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      delete pref.backend.synced_dirs.templates_ext;

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors using undefined templates_dir, and global templates_ext', function (done) {
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      delete pref.backend.synced_dirs.templates_dir;
      pref.backend.synced_dirs.templates_ext = '.twig';

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('exports template using global templates_dir, and global templates_ext', function (done) {
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      pref.backend.synced_dirs.templates_ext = '.twig';

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);
          const templateExportActual = fs.readFileSync(templateExport, conf.enc);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.true;
          expect(templateExportActual).to.equal(templateExportExpected);

          done();
        }
      );
    });

    it('errors using overriding local templates_dir, and undefined templates_ext', function (done) {
      const templateExport = `${templatesDirBack}/templates_dir-local/${templateBase}.twig`;
      const templateYmlExpectedDir = `templates_dir: |2
  ${templatesDirBackRel}/templates_dir-local
`;
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      delete pref.backend.synced_dirs.templates_ext;
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors using undefined templates_dir, and overriding templates_ext', function (done) {
      const templateExport = `${templatesDirBack}/${templateBase}.foo`;
      const templateYmlExpectedExt = `templates_ext: |2
  .foo
`;
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      delete pref.backend.synced_dirs.templates_dir;
      pref.backend.synced_dirs.templates_ext = '.twig';
      fs.writeFileSync(templateYml, templateYmlExpectedExt);

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('exports template using overriding local templates_dir, and global templates_ext', function (done) {
      const templateExport = `${templatesDirBack}/templates_dir-local/${templateBase}.twig`;
      const templateYmlExpectedDir = `templates_dir: |2
  ${templatesDirBackRel}/templates_dir-local
`;
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      pref.backend.synced_dirs.templates_ext = '.twig';
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('exports template using global templates_dir, and overriding local templates_ext', function (done) {
      const templateExport = `${templatesDirBack}/${templateBase}.foo`;
      const templateYmlExpectedExt = `templates_ext: |2
  .foo
`;
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      pref.backend.synced_dirs.templates_ext = '.twig';
      fs.writeFileSync(templateYml, templateYmlExpectedExt);

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('errors if global templates_dir points to a nonexistent directory', function (done) {
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = 'nonex/templates';
      pref.backend.synced_dirs.templates_ext = '.twig';

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors if local templates_dir points to a nonexistent directory', function (done) {
      const templateYmlExpectedDir = `templates_dir: |2
  nonex/templates
`;
      const {
        templateExportExistsBefore
      } = resetExportsDir({
        templateExport
      });

      process.argv.push('-f');
      process.argv.push(template);

      pref.backend.synced_dirs.templates_dir = templatesDirBackRel;
      pref.backend.synced_dirs.templates_ext = '.twig';
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSeq(
        'export',
        () => {
          const templateExportExistsAfter = fs.existsSync(templateExport);

          expect(templateExportExistsBefore).to.be.false;
          expect(templateExportExistsAfter).to.be.false;

          done();
        }
      );
    });
  });
});
