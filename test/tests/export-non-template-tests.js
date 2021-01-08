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

  for (const fileKey of Object.keys(args)) {
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
    process.argv.push('backend/export/assets/asset-svg.svg');

    fp.runSeq(
      'export',
      done
    );
  });

  describe('`fp export` assets', function () {
    const assetsDirFront = conf.ui.paths.source.images;
    const assetsDirFrontSrc = conf.ui.paths.source.imagesSrc;
    const assetsDirBackRel = 'export/assets';
    const assetsDirBack = `${conf.backend_dir}/${assetsDirBackRel}`;
    const assetsDirBackSrc = `${assetsDirBack}/src`;
    const assetBase = 'asset-svg';
    const asset = `${assetsDirFrontSrc}/${assetBase}.svg`;
    const assetYml = `${assetsDirFrontSrc}/${assetBase}.yml`;
    const assetExport = `${assetsDirBackSrc}/${assetBase}.svg`;

    function resetAssetsDir(args = {}) {
      return resetDir(args, assetsDirFront);
    }

    beforeEach(function () {
      resetAssetsDir();
      fs.writeFileSync(asset, '');
    });

    after(function () {
      resetAssetsDir();
    });

    it('exports asset using relative path argument', function (done) {
      const {
        assetExportExistsBefore
      } = resetExportsDir({
        assetExport
      });

      process.argv.push('-f');
      process.argv.push(`${conf.ui.pathsRelative.source.imagesSrc}/${assetBase}.svg`);

      pref.backend.synced_dirs.assets_dir = assetsDirBackRel;
      pref.backend.synced_dirs.assets_ext = '.foo';

      fp.runSeq(
        'export',
        () => {
          const assetExportExistsAfter = fs.existsSync(assetExport);

          expect(assetExportExistsBefore).to.be.false;
          expect(assetExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('errors using undefined assets_dir, and undefined assets_ext', function (done) {
      const {
        assetExportExistsBefore
      } = resetExportsDir({
        assetExport
      });

      process.argv.push('-f');
      process.argv.push(asset);

      delete pref.backend.synced_dirs.assets_dir;
      delete pref.backend.synced_dirs.assets_ext;

      fp.runSeq(
        'export',
        () => {
          const assetExportExistsAfter = fs.existsSync(assetExport);

          expect(assetExportExistsBefore).to.be.false;
          expect(assetExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('exports asset using global assets_dir, and undefined assets_ext', function (done) {
      const {
        assetExportExistsBefore
      } = resetExportsDir({
        assetExport
      });

      process.argv.push('-f');
      process.argv.push(asset);

      pref.backend.synced_dirs.assets_dir = assetsDirBackRel;
      delete pref.backend.synced_dirs.assets_ext;

      fp.runSeq(
        'export',
        () => {
          const assetExportExistsAfter = fs.existsSync(assetExport);

          expect(assetExportExistsBefore).to.be.false;
          expect(assetExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('errors using undefined assets_dir, and global assets_ext', function (done) {
      const {
        assetExportExistsBefore
      } = resetExportsDir({
        assetExport
      });

      process.argv.push('-f');
      process.argv.push(asset);

      delete pref.backend.synced_dirs.assets_dir;
      pref.backend.synced_dirs.assets_ext = '.svg';

      fp.runSeq(
        'export',
        () => {
          const assetExportExistsAfter = fs.existsSync(assetExport);

          expect(assetExportExistsBefore).to.be.false;
          expect(assetExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('exports asset using global assets_dir, and ignore global assets_ext', function (done) {
      const {
        assetExportExistsBefore
      } = resetExportsDir({
        assetExport
      });

      process.argv.push('-f');
      process.argv.push(asset);

      pref.backend.synced_dirs.assets_dir = assetsDirBackRel;
      pref.backend.synced_dirs.assets_ext = '.foo';

      fp.runSeq(
        'export',
        () => {
          const assetExportExistsAfter = fs.existsSync(assetExport);

          expect(assetExportExistsBefore).to.be.false;
          expect(assetExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('exports asset using overriding local assets_dir, and undefined assets_ext', function (done) {
      const assetExport = `${assetsDirBack}/assets_dir-local/${assetBase}.svg`;
      const assetYmlExpectedDir = `assets_dir: |2
  ${assetsDirBackRel}/assets_dir-local
`;
      const {
        assetExportExistsBefore
      } = resetExportsDir({
        assetExport
      });

      process.argv.push('-f');
      process.argv.push(asset);

      pref.backend.synced_dirs.assets_dir = assetsDirBackRel;
      delete pref.backend.synced_dirs.assets_ext;
      fs.writeFileSync(assetYml, assetYmlExpectedDir);

      fp.runSeq(
        'export',
        () => {
          const assetExportExistsAfter = fs.existsSync(assetExport);

          expect(assetExportExistsBefore).to.be.false;
          expect(assetExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('errors using undefined assets_dir, and overriding assets_ext', function (done) {
      const assetExport = `${assetsDirBackSrc}/${assetBase}.foo`;
      const assetYmlExpectedExt = `assets_ext: |2
  .foo
`;
      const {
        assetExportExistsBefore
      } = resetExportsDir({
        assetExport
      });

      process.argv.push('-f');
      process.argv.push(asset);

      delete pref.backend.synced_dirs.assets_dir;
      pref.backend.synced_dirs.assets_ext = '.svg';
      fs.writeFileSync(assetYml, assetYmlExpectedExt);

      fp.runSeq(
        'export',
        () => {
          const assetExportExistsAfter = fs.existsSync(assetExport);

          expect(assetExportExistsBefore).to.be.false;
          expect(assetExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('exports asset using overriding local assets_dir, and ignore global assets_ext', function (done) {
      const assetExport = `${assetsDirBack}/assets_dir-local/${assetBase}.svg`;
      const assetYmlExpectedDir = `assets_dir: |2
  ${assetsDirBackRel}/assets_dir-local
`;
      const {
        assetExportExistsBefore
      } = resetExportsDir({
        assetExport
      });

      process.argv.push('-f');
      process.argv.push(asset);

      pref.backend.synced_dirs.assets_dir = assetsDirBackRel;
      pref.backend.synced_dirs.assets_ext = '.foo';
      fs.writeFileSync(assetYml, assetYmlExpectedDir);

      fp.runSeq(
        'export',
        () => {
          const assetExportExistsAfter = fs.existsSync(assetExport);

          expect(assetExportExistsBefore).to.be.false;
          expect(assetExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('exports asset using global assets_dir, and ignore overriding local assets_ext', function (done) {
      const assetIgnored = `${assetsDirFrontSrc}/${assetBase}.foo`;
      const assetIgnoredExport = `${assetsDirBackSrc}/${assetBase}.foo`;
      const assetYmlExpectedExt = `assets_ext: |2
  .foo
`;
      const {
        assetExportExistsBefore
      } = resetExportsDir({
        assetExport
      });

      process.argv.push('-f');
      process.argv.push(asset);

      pref.backend.synced_dirs.assets_dir = assetsDirBackRel;
      pref.backend.synced_dirs.assets_ext = '.svg';
      fs.writeFileSync(asset, '');
      fs.writeFileSync(assetIgnored, '');
      fs.writeFileSync(assetYml, assetYmlExpectedExt);

      fp.runSeq(
        'export',
        () => {
          const assetExportExistsAfter = fs.existsSync(assetExport);
          const assetIgnoredExportExistsAfter = fs.existsSync(assetIgnoredExport);

          expect(assetExportExistsBefore).to.be.false;
          expect(assetExportExistsAfter).to.be.true;
          expect(assetIgnoredExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('exports asset using overriding local assets_dir, and ignore overriding local assets_ext', function (done) {
      const asset = `${assetsDirFrontSrc}/${assetBase}.foo`;
      const assetExport = `${assetsDirBack}/assets_dir-local/${assetBase}.foo`;
      const assetYmlExpectedDir = `assets_dir: |2
  ${assetsDirBackRel}/assets_dir-local
`;
      const assetYmlExpectedExt = `assets_ext: |2
  .foo
`;
      const {
        assetExportExistsBefore
      } = resetExportsDir({
        assetExport
      });

      process.argv.push('-f');
      process.argv.push(asset);

      pref.backend.synced_dirs.assets_dir = assetsDirBackRel;
      pref.backend.synced_dirs.assets_ext = '.svg';
      fs.writeFileSync(asset, '');
      fs.writeFileSync(assetYml, assetYmlExpectedDir + assetYmlExpectedExt);

      fp.runSeq(
        'export',
        () => {
          const assetExportExistsAfter = fs.existsSync(assetExport);

          expect(assetExportExistsBefore).to.be.false;
          expect(assetExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('errors if global assets_dir points to a nonexistent directory', function (done) {
      const {
        assetExportExistsBefore
      } = resetExportsDir({
        assetExport
      });

      process.argv.push('-f');
      process.argv.push(asset);

      pref.backend.synced_dirs.assets_dir = 'nonex/assets';
      pref.backend.synced_dirs.assets_ext = '.svg';

      fp.runSeq(
        'export',
        () => {
          const assetExportExistsAfter = fs.existsSync(assetExport);

          expect(assetExportExistsBefore).to.be.false;
          expect(assetExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('exports asset, and ignore assets_ext if global assets_ext mismatches actual extension', function (done) {
      const {
        assetExportExistsBefore
      } = resetExportsDir({
        assetExport
      });

      process.argv.push('-f');
      process.argv.push(asset);

      pref.backend.synced_dirs.assets_dir = assetsDirBackRel;
      pref.backend.synced_dirs.assets_ext = '.bar';

      fp.runSeq(
        'export',
        () => {
          const assetExportExistsAfter = fs.existsSync(assetExport);

          expect(assetExportExistsBefore).to.be.false;
          expect(assetExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('errors if local assets_dir points to a nonexistent directory', function (done) {
      const assetYmlExpectedDir = `assets_dir: |2
  nonex/assets
`;
      const {
        assetExportExistsBefore
      } = resetExportsDir({
        assetExport
      });

      process.argv.push('-f');
      process.argv.push(asset);

      pref.backend.synced_dirs.assets_dir = assetsDirBackRel;
      pref.backend.synced_dirs.assets_ext = '.svg';
      fs.writeFileSync(assetYml, assetYmlExpectedDir);

      fp.runSeq(
        'export',
        () => {
          const assetExportExistsAfter = fs.existsSync(assetExport);

          expect(assetExportExistsBefore).to.be.false;
          expect(assetExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('exports asset, and ignore assets_ext if local assets_ext mismatches actual extension', function (done) {
      const assetYmlExpectedExt = `assets_ext: |2
  .foo
`;
      const {
        assetExportExistsBefore
      } = resetExportsDir({
        assetExport
      });

      process.argv.push('-f');
      process.argv.push(asset);

      pref.backend.synced_dirs.assets_dir = assetsDirBackRel;
      pref.backend.synced_dirs.assets_ext = '.svg';
      fs.writeFileSync(assetYml, assetYmlExpectedExt);

      fp.runSeq(
        'export',
        () => {
          const assetExportExistsAfter = fs.existsSync(assetExport);

          expect(assetExportExistsBefore).to.be.false;
          expect(assetExportExistsAfter).to.be.true;

          done();
        }
      );
    });
  });

  describe('`fp export` scripts', function () {
    const scriptsDirFront = conf.ui.paths.source.js;
    const scriptsDirFrontSrc = conf.ui.paths.source.jsSrc;
    const scriptsDirBackRel = 'export/scripts';
    const scriptsDirBack = `${conf.backend_dir}/${scriptsDirBackRel}`;
    const scriptsDirBackSrc = `${scriptsDirBack}/src`;
    const scriptBase = 'script-js';
    const script = `${scriptsDirFrontSrc}/${scriptBase}.js`;
    const scriptYml = `${scriptsDirFrontSrc}/${scriptBase}.yml`;
    const scriptExport = `${scriptsDirBackSrc}/${scriptBase}.js`;

    function resetScriptsDir(args = {}) {
      return resetDir(args, scriptsDirFront);
    }

    beforeEach(function () {
      resetScriptsDir();
      fs.writeFileSync(script, '');
    });

    after(function () {
      resetScriptsDir();
    });

    it('exports script using relative path argument', function (done) {
      const {
        scriptExportExistsBefore
      } = resetExportsDir({
        scriptExport
      });

      process.argv.push('-f');
      process.argv.push(`${conf.ui.pathsRelative.source.jsSrc}/${scriptBase}.js`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBackRel;
      pref.backend.synced_dirs.scripts_ext = '.foo';

      fp.runSeq(
        'export',
        () => {
          const scriptExportExistsAfter = fs.existsSync(scriptExport);

          expect(scriptExportExistsBefore).to.be.false;
          expect(scriptExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('errors using undefined scripts_dir, and undefined scripts_ext', function (done) {
      const {
        scriptExportExistsBefore
      } = resetExportsDir({
        scriptExport
      });

      process.argv.push('-f');
      process.argv.push(script);

      delete pref.backend.synced_dirs.scripts_dir;
      delete pref.backend.synced_dirs.scripts_ext;

      fp.runSeq(
        'export',
        () => {
          const scriptExportExistsAfter = fs.existsSync(scriptExport);

          expect(scriptExportExistsBefore).to.be.false;
          expect(scriptExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('exports script using global scripts_dir, and undefined scripts_ext', function (done) {
      const {
        scriptExportExistsBefore
      } = resetExportsDir({
        scriptExport
      });

      process.argv.push('-f');
      process.argv.push(script);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBackRel;
      delete pref.backend.synced_dirs.scripts_ext;

      fp.runSeq(
        'export',
        () => {
          const scriptExportExistsAfter = fs.existsSync(scriptExport);

          expect(scriptExportExistsBefore).to.be.false;
          expect(scriptExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('errors using undefined scripts_dir, and global scripts_ext', function (done) {
      const {
        scriptExportExistsBefore
      } = resetExportsDir({
        scriptExport
      });

      process.argv.push('-f');
      process.argv.push(script);

      delete pref.backend.synced_dirs.scripts_dir;
      pref.backend.synced_dirs.scripts_ext = '.js';

      fp.runSeq(
        'export',
        () => {
          const scriptExportExistsAfter = fs.existsSync(scriptExport);

          expect(scriptExportExistsBefore).to.be.false;
          expect(scriptExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('exports script using global scripts_dir, and ignore global scripts_ext', function (done) {
      const {
        scriptExportExistsBefore
      } = resetExportsDir({
        scriptExport
      });

      process.argv.push('-f');
      process.argv.push(script);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBackRel;
      pref.backend.synced_dirs.scripts_ext = '.foo';

      fp.runSeq(
        'export',
        () => {
          const scriptExportExistsAfter = fs.existsSync(scriptExport);

          expect(scriptExportExistsBefore).to.be.false;
          expect(scriptExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('exports script using overriding local scripts_dir, and undefined scripts_ext', function (done) {
      const scriptExport = `${scriptsDirBack}/scripts_dir-local/${scriptBase}.js`;
      const scriptYmlExpectedDir = `scripts_dir: |2
  ${scriptsDirBackRel}/scripts_dir-local
`;
      const {
        scriptExportExistsBefore
      } = resetExportsDir({
        scriptExport
      });

      process.argv.push('-f');
      process.argv.push(script);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBackRel;
      delete pref.backend.synced_dirs.scripts_ext;
      fs.writeFileSync(scriptYml, scriptYmlExpectedDir);

      fp.runSeq(
        'export',
        () => {
          const scriptExportExistsAfter = fs.existsSync(scriptExport);

          expect(scriptExportExistsBefore).to.be.false;
          expect(scriptExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('errors using undefined scripts_dir, and overriding scripts_ext', function (done) {
      const scriptExport = `${scriptsDirBackSrc}/${scriptBase}.foo`;
      const scriptYmlExpectedExt = `scripts_ext: |2
  .foo
`;
      const {
        scriptExportExistsBefore
      } = resetExportsDir({
        scriptExport
      });

      process.argv.push('-f');
      process.argv.push(script);

      delete pref.backend.synced_dirs.scripts_dir;
      pref.backend.synced_dirs.scripts_ext = '.js';
      fs.writeFileSync(scriptYml, scriptYmlExpectedExt);

      fp.runSeq(
        'export',
        () => {
          const scriptExportExistsAfter = fs.existsSync(scriptExport);

          expect(scriptExportExistsBefore).to.be.false;
          expect(scriptExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('exports script using overriding local scripts_dir, and ignore global scripts_ext', function (done) {
      const scriptExport = `${scriptsDirBack}/scripts_dir-local/${scriptBase}.js`;
      const scriptYmlExpectedDir = `scripts_dir: |2
  ${scriptsDirBackRel}/scripts_dir-local
`;
      const {
        scriptExportExistsBefore
      } = resetExportsDir({
        scriptExport
      });

      process.argv.push('-f');
      process.argv.push(script);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBackRel;
      pref.backend.synced_dirs.scripts_ext = '.foo';
      fs.writeFileSync(scriptYml, scriptYmlExpectedDir);

      fp.runSeq(
        'export',
        () => {
          const scriptExportExistsAfter = fs.existsSync(scriptExport);

          expect(scriptExportExistsBefore).to.be.false;
          expect(scriptExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('exports script using global scripts_dir, and ignore overriding local scripts_ext', function (done) {
      const scriptIgnored = `${scriptsDirFrontSrc}/${scriptBase}.foo`;
      const scriptIgnoredExport = `${scriptsDirBackSrc}/${scriptBase}.foo`;
      const scriptYmlExpectedExt = `scripts_ext: |2
  .foo
`;
      const {
        scriptExportExistsBefore
      } = resetExportsDir({
        scriptExport
      });

      process.argv.push('-f');
      process.argv.push(script);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBackRel;
      pref.backend.synced_dirs.scripts_ext = '.js';
      fs.writeFileSync(script, '');
      fs.writeFileSync(scriptIgnored, '');
      fs.writeFileSync(scriptYml, scriptYmlExpectedExt);

      fp.runSeq(
        'export',
        () => {
          const scriptExportExistsAfter = fs.existsSync(scriptExport);
          const scriptIgnoredExportExistsAfter = fs.existsSync(scriptIgnoredExport);

          expect(scriptExportExistsBefore).to.be.false;
          expect(scriptExportExistsAfter).to.be.true;
          expect(scriptIgnoredExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('exports script using overriding local scripts_dir, and ignore overriding local scripts_ext', function (done) {
      const script = `${scriptsDirFrontSrc}/${scriptBase}.foo`;
      const scriptExport = `${scriptsDirBack}/scripts_dir-local/${scriptBase}.foo`;
      const scriptYmlExpectedDir = `scripts_dir: |2
  ${scriptsDirBackRel}/scripts_dir-local
`;
      const scriptYmlExpectedExt = `scripts_ext: |2
  .foo
`;
      const {
        scriptExportExistsBefore
      } = resetExportsDir({
        scriptExport
      });

      process.argv.push('-f');
      process.argv.push(script);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBackRel;
      pref.backend.synced_dirs.scripts_ext = '.js';
      fs.writeFileSync(script, '');
      fs.writeFileSync(scriptYml, scriptYmlExpectedDir + scriptYmlExpectedExt);

      fp.runSeq(
        'export',
        () => {
          const scriptExportExistsAfter = fs.existsSync(scriptExport);

          expect(scriptExportExistsBefore).to.be.false;
          expect(scriptExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('errors if global scripts_dir points to a nonexistent directory', function (done) {
      const {
        scriptExportExistsBefore
      } = resetExportsDir({
        scriptExport
      });

      process.argv.push('-f');
      process.argv.push(script);

      pref.backend.synced_dirs.scripts_dir = 'nonex/scripts';
      pref.backend.synced_dirs.scripts_ext = '.js';

      fp.runSeq(
        'export',
        () => {
          const scriptExportExistsAfter = fs.existsSync(scriptExport);

          expect(scriptExportExistsBefore).to.be.false;
          expect(scriptExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('exports script, and ignore scripts_ext if global scripts_ext mismatches actual extension', function (done) {
      const {
        scriptExportExistsBefore
      } = resetExportsDir({
        scriptExport
      });

      process.argv.push('-f');
      process.argv.push(script);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBackRel;
      pref.backend.synced_dirs.scripts_ext = '.bar';

      fp.runSeq(
        'export',
        () => {
          const scriptExportExistsAfter = fs.existsSync(scriptExport);

          expect(scriptExportExistsBefore).to.be.false;
          expect(scriptExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('errors if local scripts_dir points to a nonexistent directory', function (done) {
      const scriptYmlExpectedDir = `scripts_dir: |2
  nonex/scripts
`;
      const {
        scriptExportExistsBefore
      } = resetExportsDir({
        scriptExport
      });

      process.argv.push('-f');
      process.argv.push(script);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBackRel;
      pref.backend.synced_dirs.scripts_ext = '.js';
      fs.writeFileSync(scriptYml, scriptYmlExpectedDir);

      fp.runSeq(
        'export',
        () => {
          const scriptExportExistsAfter = fs.existsSync(scriptExport);

          expect(scriptExportExistsBefore).to.be.false;
          expect(scriptExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('exports script, and ignore scripts_ext if local scripts_ext mismatches actual extension', function (done) {
      const scriptYmlExpectedExt = `scripts_ext: |2
  .foo
`;
      const {
        scriptExportExistsBefore
      } = resetExportsDir({
        scriptExport
      });

      process.argv.push('-f');
      process.argv.push(script);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBackRel;
      pref.backend.synced_dirs.scripts_ext = '.js';
      fs.writeFileSync(scriptYml, scriptYmlExpectedExt);

      fp.runSeq(
        'export',
        () => {
          const scriptExportExistsAfter = fs.existsSync(scriptExport);

          expect(scriptExportExistsBefore).to.be.false;
          expect(scriptExportExistsAfter).to.be.true;

          done();
        }
      );
    });
  });

  describe('`fp export` styles', function () {
    const stylesDirFront = conf.ui.paths.source.css;
    const stylesDirFrontBld = conf.ui.paths.source.cssBld;
    const stylesDirBackRel = 'export/styles';
    const stylesDirBack = `${conf.backend_dir}/${stylesDirBackRel}`;
    const stylesDirBackBld = `${stylesDirBack}/bld`;
    const styleBase = 'style-css';
    const style = `${stylesDirFrontBld}/${styleBase}.css`;
    const styleYml = `${stylesDirFrontBld}/${styleBase}.yml`;
    const styleExport = `${stylesDirBackBld}/${styleBase}.css`;

    function resetStylesDir(args = {}) {
      return resetDir(args, stylesDirFront);
    }

    beforeEach(function () {
      resetStylesDir();
      fs.writeFileSync(style, '');
    });

    after(function () {
      resetStylesDir();
    });

    it('exports style using relative path argument', function (done) {
      const {
        styleExportExistsBefore
      } = resetExportsDir({
        styleExport
      });

      process.argv.push('-f');
      process.argv.push(`${conf.ui.pathsRelative.source.cssBld}/${styleBase}.css`);

      pref.backend.synced_dirs.styles_dir = stylesDirBackRel;
      pref.backend.synced_dirs.styles_ext = '.foo';

      fp.runSeq(
        'export',
        () => {
          const styleExportExistsAfter = fs.existsSync(styleExport);

          expect(styleExportExistsBefore).to.be.false;
          expect(styleExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('errors using undefined styles_dir, and undefined styles_ext', function (done) {
      const {
        styleExportExistsBefore
      } = resetExportsDir({
        styleExport
      });

      process.argv.push('-f');
      process.argv.push(style);

      delete pref.backend.synced_dirs.styles_dir;
      delete pref.backend.synced_dirs.styles_ext;

      fp.runSeq(
        'export',
        () => {
          const styleExportExistsAfter = fs.existsSync(styleExport);

          expect(styleExportExistsBefore).to.be.false;
          expect(styleExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('exports style using global styles_dir, and undefined styles_ext', function (done) {
      const {
        styleExportExistsBefore
      } = resetExportsDir({
        styleExport
      });

      process.argv.push('-f');
      process.argv.push(style);

      pref.backend.synced_dirs.styles_dir = stylesDirBackRel;
      delete pref.backend.synced_dirs.styles_ext;

      fp.runSeq(
        'export',
        () => {
          const styleExportExistsAfter = fs.existsSync(styleExport);

          expect(styleExportExistsBefore).to.be.false;
          expect(styleExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('errors using undefined styles_dir, and global styles_ext', function (done) {
      const {
        styleExportExistsBefore
      } = resetExportsDir({
        styleExport
      });

      process.argv.push('-f');
      process.argv.push(style);

      delete pref.backend.synced_dirs.styles_dir;
      pref.backend.synced_dirs.styles_ext = '.css';

      fp.runSeq(
        'export',
        () => {
          const styleExportExistsAfter = fs.existsSync(styleExport);

          expect(styleExportExistsBefore).to.be.false;
          expect(styleExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('exports style using global styles_dir, and ignore global styles_ext', function (done) {
      const {
        styleExportExistsBefore
      } = resetExportsDir({
        styleExport
      });

      process.argv.push('-f');
      process.argv.push(style);

      pref.backend.synced_dirs.styles_dir = stylesDirBackRel;
      pref.backend.synced_dirs.styles_ext = '.foo';

      fp.runSeq(
        'export',
        () => {
          const styleExportExistsAfter = fs.existsSync(styleExport);

          expect(styleExportExistsBefore).to.be.false;
          expect(styleExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('exports style using overriding local styles_dir, and undefined styles_ext', function (done) {
      const styleExport = `${stylesDirBack}/styles_dir-local/${styleBase}.css`;
      const styleYmlExpectedDir = `styles_dir: |2
  ${stylesDirBackRel}/styles_dir-local
`;
      const {
        styleExportExistsBefore
      } = resetExportsDir({
        styleExport
      });

      process.argv.push('-f');
      process.argv.push(style);

      pref.backend.synced_dirs.styles_dir = stylesDirBackRel;
      delete pref.backend.synced_dirs.styles_ext;
      fs.writeFileSync(styleYml, styleYmlExpectedDir);

      fp.runSeq(
        'export',
        () => {
          const styleExportExistsAfter = fs.existsSync(styleExport);

          expect(styleExportExistsBefore).to.be.false;
          expect(styleExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('errors using undefined styles_dir, and overriding styles_ext', function (done) {
      const styleExport = `${stylesDirBackBld}/${styleBase}.foo`;
      const styleYmlExpectedExt = `styles_ext: |2
  .foo
`;
      const {
        styleExportExistsBefore
      } = resetExportsDir({
        styleExport
      });

      process.argv.push('-f');
      process.argv.push(style);

      delete pref.backend.synced_dirs.styles_dir;
      pref.backend.synced_dirs.styles_ext = '.css';
      fs.writeFileSync(styleYml, styleYmlExpectedExt);

      fp.runSeq(
        'export',
        () => {
          const styleExportExistsAfter = fs.existsSync(styleExport);

          expect(styleExportExistsBefore).to.be.false;
          expect(styleExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('exports style using overriding local styles_dir, and ignore global styles_ext', function (done) {
      const styleExport = `${stylesDirBack}/styles_dir-local/${styleBase}.css`;
      const styleYmlExpectedDir = `styles_dir: |2
  ${stylesDirBackRel}/styles_dir-local
`;
      const {
        styleExportExistsBefore
      } = resetExportsDir({
        styleExport
      });

      process.argv.push('-f');
      process.argv.push(style);

      pref.backend.synced_dirs.styles_dir = stylesDirBackRel;
      pref.backend.synced_dirs.styles_ext = '.foo';
      fs.writeFileSync(styleYml, styleYmlExpectedDir);

      fp.runSeq(
        'export',
        () => {
          const styleExportExistsAfter = fs.existsSync(styleExport);

          expect(styleExportExistsBefore).to.be.false;
          expect(styleExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('exports style using global styles_dir, and ignore overriding local styles_ext', function (done) {
      const styleIgnored = `${stylesDirFrontBld}/${styleBase}.foo`;
      const styleIgnoredExport = `${stylesDirBackBld}/${styleBase}.foo`;
      const styleYmlExpectedExt = `styles_ext: |2
  .foo
`;
      const {
        styleExportExistsBefore
      } = resetExportsDir({
        styleExport
      });

      process.argv.push('-f');
      process.argv.push(style);

      pref.backend.synced_dirs.styles_dir = stylesDirBackRel;
      pref.backend.synced_dirs.styles_ext = '.css';
      fs.writeFileSync(style, '');
      fs.writeFileSync(styleIgnored, '');
      fs.writeFileSync(styleYml, styleYmlExpectedExt);

      fp.runSeq(
        'export',
        () => {
          const styleExportExistsAfter = fs.existsSync(styleExport);
          const styleIgnoredExportExistsAfter = fs.existsSync(styleIgnoredExport);

          expect(styleExportExistsBefore).to.be.false;
          expect(styleExportExistsAfter).to.be.true;
          expect(styleIgnoredExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('exports style using overriding local styles_dir, and ignore overriding local styles_ext', function (done) {
      const style = `${stylesDirFrontBld}/${styleBase}.foo`;
      const styleExport = `${stylesDirBack}/styles_dir-local/${styleBase}.foo`;
      const styleYmlExpectedDir = `styles_dir: |2
  ${stylesDirBackRel}/styles_dir-local
`;
      const styleYmlExpectedExt = `styles_ext: |2
  .foo
`;
      const {
        styleExportExistsBefore
      } = resetExportsDir({
        styleExport
      });

      process.argv.push('-f');
      process.argv.push(style);

      pref.backend.synced_dirs.styles_dir = stylesDirBackRel;
      pref.backend.synced_dirs.styles_ext = '.css';
      fs.writeFileSync(style, '');
      fs.writeFileSync(styleYml, styleYmlExpectedDir + styleYmlExpectedExt);

      fp.runSeq(
        'export',
        () => {
          const styleExportExistsAfter = fs.existsSync(styleExport);

          expect(styleExportExistsBefore).to.be.false;
          expect(styleExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('errors if global styles_dir points to a nonexistent directory', function (done) {
      const {
        styleExportExistsBefore
      } = resetExportsDir({
        styleExport
      });

      process.argv.push('-f');
      process.argv.push(style);

      pref.backend.synced_dirs.styles_dir = 'nonex/styles';
      pref.backend.synced_dirs.styles_ext = '.css';

      fp.runSeq(
        'export',
        () => {
          const styleExportExistsAfter = fs.existsSync(styleExport);

          expect(styleExportExistsBefore).to.be.false;
          expect(styleExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('exports style, and ignore styles_ext if global styles_ext mismatches actual extension', function (done) {
      const {
        styleExportExistsBefore
      } = resetExportsDir({
        styleExport
      });

      process.argv.push('-f');
      process.argv.push(style);

      pref.backend.synced_dirs.styles_dir = stylesDirBackRel;
      pref.backend.synced_dirs.styles_ext = '.bar';

      fp.runSeq(
        'export',
        () => {
          const styleExportExistsAfter = fs.existsSync(styleExport);

          expect(styleExportExistsBefore).to.be.false;
          expect(styleExportExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('errors if local styles_dir points to a nonexistent directory', function (done) {
      const styleYmlExpectedDir = `styles_dir: |2
  nonex/styles
`;
      const {
        styleExportExistsBefore
      } = resetExportsDir({
        styleExport
      });

      process.argv.push('-f');
      process.argv.push(style);

      pref.backend.synced_dirs.styles_dir = stylesDirBackRel;
      pref.backend.synced_dirs.styles_ext = '.css';
      fs.writeFileSync(styleYml, styleYmlExpectedDir);

      fp.runSeq(
        'export',
        () => {
          const styleExportExistsAfter = fs.existsSync(styleExport);

          expect(styleExportExistsBefore).to.be.false;
          expect(styleExportExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('exports style, and ignore styles_ext if local styles_ext mismatches actual extension', function (done) {
      const styleYmlExpectedExt = `styles_ext: |2
  .foo
`;
      const {
        styleExportExistsBefore
      } = resetExportsDir({
        styleExport
      });

      process.argv.push('-f');
      process.argv.push(style);

      pref.backend.synced_dirs.styles_dir = stylesDirBackRel;
      pref.backend.synced_dirs.styles_ext = '.css';
      fs.writeFileSync(styleYml, styleYmlExpectedExt);

      fp.runSeq(
        'export',
        () => {
          const styleExportExistsAfter = fs.existsSync(styleExport);

          expect(styleExportExistsBefore).to.be.false;
          expect(styleExportExistsAfter).to.be.true;

          done();
        }
      );
    });
  });
});
