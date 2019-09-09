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

describe('fp import', function () {
  before(function () {
    pref.backend.synced_dirs = {};

    resetArgv();
  });

  it('errors with an argument', function (done) {
    process.argv.push('-f');
    process.argv.push('backend/import/templates/templates-jsp.jsp');

    fp.runSeq(
      'import',
      done
    );
  });

  describe('`fp import` assets', function () {
    const assetsDirFront = conf.ui.paths.source.images;
    const assetsDirFrontSrc = conf.ui.paths.source.imagesSrc;
    const assetsDirBack = 'import/assets';
    const assetsDirBackSrc = `${assetsDirBack}/src`;
    const assetBase = 'asset-svg';
    const asset = `${assetsDirFrontSrc}/${assetBase}.svg`;
    const asset1 = `${assetsDirFront}/argv.f-backend/${assetBase}.svg`;
    const asset2 = `${assetsDirFront}/assets_dir-global/src/${assetBase}.svg`;
    const asset3 = `${assetsDirFront}/assets_dir-local/${assetBase}.svg`;
    const assetYml = `${assetsDirFrontSrc}/${assetBase}.yml`;
    const assetYml1 = `${assetsDirFront}/argv.f-backend/${assetBase}.yml`;
    const assetYml2 = `${assetsDirFront}/assets_dir-global/src/${assetBase}.yml`;
    const assetYml3 = `${assetsDirFront}/assets_dir-local/${assetBase}.yml`;

    function resetAssetsDir(args = {}) {
      return resetDir(args, assetsDirFront);
    }

    before(function () {
      pref.backend.synced_dirs = {};

      resetArgv();
    });

    after(function () {
      resetAssetsDir();
    });

    it('does not import assets using undefined assets_dir, and undefined assets_ext', function (done) {
      const {
        assetExistsBefore,
        asset1ExistsBefore,
        asset2ExistsBefore,
        asset3ExistsBefore
      } = resetAssetsDir({
        asset,
        asset1,
        asset2,
        asset3
      });

      delete pref.backend.synced_dirs.assets_dir;
      delete pref.backend.synced_dirs.assets_ext;

      fp.runSeq(
        'import',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const asset1ExistsAfter = fs.existsSync(asset1);
          const asset2ExistsAfter = fs.existsSync(asset2);
          const asset3ExistsAfter = fs.existsSync(asset3);

          expect(assetExistsBefore).to.be.false;
          expect(asset1ExistsBefore).to.be.false;
          expect(asset2ExistsBefore).to.be.false;
          expect(asset3ExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.false;
          expect(asset1ExistsAfter).to.be.false;
          expect(asset2ExistsAfter).to.be.false;
          expect(asset3ExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('imports assets using global assets_dir, and undefined assets_ext', function (done) {
      const {
        assetExistsBefore,
        asset1ExistsBefore,
        asset2ExistsBefore,
        asset3ExistsBefore
      } = resetAssetsDir({
        asset,
        asset1,
        asset2,
        asset3
      });

      pref.backend.synced_dirs.assets_dir = assetsDirBack;
      delete pref.backend.synced_dirs.assets_ext;

      fp.runSeq(
        'import',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const asset1ExistsAfter = fs.existsSync(asset1);
          const asset2ExistsAfter = fs.existsSync(asset2);
          const asset3ExistsAfter = fs.existsSync(asset3);

          expect(assetExistsBefore).to.be.false;
          expect(asset1ExistsBefore).to.be.false;
          expect(asset2ExistsBefore).to.be.false;
          expect(asset3ExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;
          expect(asset1ExistsAfter).to.be.true;
          expect(asset2ExistsAfter).to.be.true;
          expect(asset3ExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('does not import assets using undefined assets_dir, and global assets_ext', function (done) {
      const {
        assetExistsBefore,
        asset1ExistsBefore,
        asset2ExistsBefore,
        asset3ExistsBefore
      } = resetAssetsDir({
        asset,
        asset1,
        asset2,
        asset3
      });

      delete pref.backend.synced_dirs.assets_dir;
      pref.backend.synced_dirs.assets_ext = '.svg';

      fp.runSeq(
        'import',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const asset1ExistsAfter = fs.existsSync(asset1);
          const asset2ExistsAfter = fs.existsSync(asset2);
          const asset3ExistsAfter = fs.existsSync(asset3);

          expect(assetExistsBefore).to.be.false;
          expect(asset1ExistsBefore).to.be.false;
          expect(asset2ExistsBefore).to.be.false;
          expect(asset3ExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.false;
          expect(asset1ExistsAfter).to.be.false;
          expect(asset2ExistsAfter).to.be.false;
          expect(asset3ExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('imports assets using global assets_dir, and global assets_ext', function (done) {
      const {
        assetExistsBefore,
        asset1ExistsBefore,
        asset2ExistsBefore,
        asset3ExistsBefore
      } = resetAssetsDir({
        asset,
        asset1,
        asset2,
        asset3
      });

      pref.backend.synced_dirs.assets_dir = assetsDirBack;
      pref.backend.synced_dirs.assets_ext = '.svg';

      fp.runSeq(
        'import',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const asset1ExistsAfter = fs.existsSync(asset1);
          const asset2ExistsAfter = fs.existsSync(asset2);
          const asset3ExistsAfter = fs.existsSync(asset3);

          expect(assetExistsBefore).to.be.false;
          expect(asset1ExistsBefore).to.be.false;
          expect(asset2ExistsBefore).to.be.false;
          expect(asset3ExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;
          expect(asset1ExistsAfter).to.be.true;
          expect(asset2ExistsAfter).to.be.true;
          expect(asset3ExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('does not import assets using overriding local assets_dir, and undefined assets_ext', function (done) {
      const {
        assetExistsBefore,
        asset1ExistsBefore,
        asset2ExistsBefore,
        asset3ExistsBefore
      } = resetAssetsDir({
        asset,
        asset1,
        asset2,
        asset3
      });

      pref.backend.synced_dirs.assets_dir = assetsDirBack;
      delete pref.backend.synced_dirs.assets_ext;
      fs.writeFileSync(assetYml, `'assets_dir': |2
  ${assetsDirBackSrc}/assets_dir-local
`);
      fs.writeFileSync(assetYml1, `'assets_dir': |2
  ${assetsDirBack}/argv.f-backend
`);
      fs.writeFileSync(assetYml2, `'assets_dir': |2
  ${assetsDirBack}/assets_dir-global/bld
`);
      fs.writeFileSync(assetYml3, `'assets_dir': |2
  ${assetsDirBack}/assets_dir-local
`);

      fp.runSeq(
        'import',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const asset1ExistsAfter = fs.existsSync(asset1);
          const asset2ExistsAfter = fs.existsSync(asset2);
          const asset3ExistsAfter = fs.existsSync(asset3);

          expect(assetExistsBefore).to.be.false;
          expect(asset1ExistsBefore).to.be.false;
          expect(asset2ExistsBefore).to.be.false;
          expect(asset3ExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.false;
          expect(asset1ExistsAfter).to.be.false;
          expect(asset2ExistsAfter).to.be.false;
          expect(asset3ExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('does not import assets using undefined assets_dir, and conflicting assets_ext', function (done) {
      const assetYmlExpectedExt = `'assets_ext': |2
  .foo
`;
      const {
        assetExistsBefore,
        asset1ExistsBefore,
        asset2ExistsBefore,
        asset3ExistsBefore
      } = resetAssetsDir({
        asset,
        asset1,
        asset2,
        asset3
      });

      delete pref.backend.synced_dirs.assets_dir;
      pref.backend.synced_dirs.assets_ext = '.svg';
      fs.writeFileSync(assetYml, assetYmlExpectedExt);
      fs.writeFileSync(assetYml1, assetYmlExpectedExt);
      fs.writeFileSync(assetYml2, assetYmlExpectedExt);
      fs.writeFileSync(assetYml3, assetYmlExpectedExt);

      fp.runSeq(
        'import',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const asset1ExistsAfter = fs.existsSync(asset1);
          const asset2ExistsAfter = fs.existsSync(asset2);
          const asset3ExistsAfter = fs.existsSync(asset3);

          expect(assetExistsBefore).to.be.false;
          expect(asset1ExistsBefore).to.be.false;
          expect(asset2ExistsBefore).to.be.false;
          expect(asset3ExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.false;
          expect(asset1ExistsAfter).to.be.false;
          expect(asset2ExistsAfter).to.be.false;
          expect(asset3ExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('imports assets using overriding local assets_dir, and global assets_ext', function (done) {
      const assetYmlExpectedDir = `'assets_dir': |2
  ${assetsDirBack}/assets_dir-local
`;
      const {
        assetExistsBefore,
        asset1ExistsBefore,
        asset2ExistsBefore,
        asset3ExistsBefore
      } = resetAssetsDir({
        asset,
        asset1,
        asset2,
        asset3
      });

      pref.backend.synced_dirs.assets_dir = assetsDirBack;
      pref.backend.synced_dirs.assets_ext = '.svg';
      fs.writeFileSync(assetYml, assetYmlExpectedDir);

      fp.runSeq(
        'import',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const asset1ExistsAfter = fs.existsSync(asset1);
          const asset2ExistsAfter = fs.existsSync(asset2);
          const asset3ExistsAfter = fs.existsSync(asset3);

          expect(assetExistsBefore).to.be.false;
          expect(asset1ExistsBefore).to.be.false;
          expect(asset2ExistsBefore).to.be.false;
          expect(asset3ExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;
          expect(asset1ExistsAfter).to.be.true;
          expect(asset2ExistsAfter).to.be.true;
          expect(asset3ExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('errors using global assets_dir, and overriding local assets_ext', function (done) {
      const asset = `${assetsDirFrontSrc}/${assetBase}.foo`;
      const assetYmlExpectedExt = `'assets_ext': |2
  .foo
`;
      const {
        assetExistsBefore,
        asset1ExistsBefore,
        asset2ExistsBefore,
        asset3ExistsBefore
      } = resetAssetsDir({
        asset,
        asset1,
        asset2,
        asset3
      });

      pref.backend.synced_dirs.assets_dir = assetsDirBack;
      pref.backend.synced_dirs.assets_ext = '.svg';
      fs.writeFileSync(assetYml, assetYmlExpectedExt);

      fp.runSeq(
        'import',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const asset1ExistsAfter = fs.existsSync(asset1);
          const asset2ExistsAfter = fs.existsSync(asset2);
          const asset3ExistsAfter = fs.existsSync(asset3);

          expect(assetExistsBefore).to.be.false;
          expect(asset1ExistsBefore).to.be.false;
          expect(asset2ExistsBefore).to.be.false;
          expect(asset3ExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;
          expect(asset1ExistsAfter).to.be.true;
          expect(asset2ExistsAfter).to.be.true;
          expect(asset3ExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('imports assets using overriding local assets_dir, and overriding local assets_ext', function (done) {
      const asset = `${assetsDirFrontSrc}/${assetBase}.foo`;
      const assetYmlExpectedDir = `'assets_dir': |2
  ${assetsDirBack}/assets_dir-local
`;
      const assetYmlExpectedExt = `'assets_ext': |2
  .foo
`;
      const {
        assetExistsBefore,
        asset1ExistsBefore,
        asset2ExistsBefore
      } = resetAssetsDir({
        asset,
        asset1,
        asset2
      });

      pref.backend.synced_dirs.assets_dir = assetsDirBack;
      pref.backend.synced_dirs.assets_ext = '.svg';
      fs.writeFileSync(assetYml, assetYmlExpectedDir + assetYmlExpectedExt);

      fp.runSeq(
        'import',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const asset1ExistsAfter = fs.existsSync(asset1);
          const asset2ExistsAfter = fs.existsSync(asset2);

          expect(assetExistsBefore).to.be.false;
          expect(asset1ExistsBefore).to.be.false;
          expect(asset2ExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;
          expect(asset1ExistsAfter).to.be.true;
          expect(asset2ExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('does not import assets if global assets_dir points to a nonexistent directory', function (done) {
      const {
        assetExistsBefore,
        asset1ExistsBefore,
        asset2ExistsBefore,
        asset3ExistsBefore
      } = resetAssetsDir({
        asset,
        asset1,
        asset2,
        asset3
      });

      pref.backend.synced_dirs.assets_dir = 'nonex/assets';
      pref.backend.synced_dirs.assets_ext = '.svg';

      fp.runSeq(
        'import',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const asset1ExistsAfter = fs.existsSync(asset1);
          const asset2ExistsAfter = fs.existsSync(asset2);
          const asset3ExistsAfter = fs.existsSync(asset3);

          expect(assetExistsBefore).to.be.false;
          expect(asset1ExistsBefore).to.be.false;
          expect(asset2ExistsBefore).to.be.false;
          expect(asset3ExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.false;
          expect(asset1ExistsAfter).to.be.false;
          expect(asset2ExistsAfter).to.be.false;
          expect(asset3ExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('does not import assets if global assets_ext mismatches actual extension', function (done) {
      const {
        assetExistsBefore,
        asset1ExistsBefore,
        asset2ExistsBefore,
        asset3ExistsBefore
      } = resetAssetsDir({
        asset,
        asset1,
        asset2,
        asset3
      });

      pref.backend.synced_dirs.assets_dir = assetsDirBack;
      pref.backend.synced_dirs.assets_ext = '.bar';

      fp.runSeq(
        'import',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const asset1ExistsAfter = fs.existsSync(asset1);
          const asset2ExistsAfter = fs.existsSync(asset2);
          const asset3ExistsAfter = fs.existsSync(asset3);

          expect(assetExistsBefore).to.be.false;
          expect(asset1ExistsBefore).to.be.false;
          expect(asset2ExistsBefore).to.be.false;
          expect(asset3ExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.false;
          expect(asset1ExistsAfter).to.be.false;
          expect(asset2ExistsAfter).to.be.false;
          expect(asset3ExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors if local assets_dir points to a nonexistent directory', function (done) {
      const assetYmlExpectedDir = `'assets_dir': |2
  nonex/assets
`;
      const {
        assetExistsBefore,
        asset1ExistsBefore,
        asset2ExistsBefore,
        asset3ExistsBefore
      } = resetAssetsDir({
        asset,
        asset1,
        asset2,
        asset3
      });

      pref.backend.synced_dirs.assets_dir = assetsDirBack;
      pref.backend.synced_dirs.assets_ext = '.svg';
      fs.writeFileSync(assetYml, assetYmlExpectedDir);

      fp.runSeq(
        'import',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const asset1ExistsAfter = fs.existsSync(asset1);
          const asset2ExistsAfter = fs.existsSync(asset2);
          const asset3ExistsAfter = fs.existsSync(asset3);

          expect(assetExistsBefore).to.be.false;
          expect(asset1ExistsBefore).to.be.false;
          expect(asset2ExistsBefore).to.be.false;
          expect(asset3ExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.false; // The override which does not import.
          expect(asset1ExistsAfter).to.be.true;
          expect(asset2ExistsAfter).to.be.true;
          expect(asset3ExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('errors if local assets_ext mismatches actual extension', function (done) {
      const assetYmlExpectedExt = `'assets_ext': |2
  .foo
`;
      const {
        assetExistsBefore,
        asset1ExistsBefore,
        asset2ExistsBefore,
        asset3ExistsBefore
      } = resetAssetsDir({
        asset,
        asset1,
        asset2,
        asset3
      });

      pref.backend.synced_dirs.assets_dir = assetsDirBack;
      pref.backend.synced_dirs.assets_ext = '.svg';
      fs.writeFileSync(assetYml2, assetYmlExpectedExt);

      fp.runSeq(
        'import',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const asset1ExistsAfter = fs.existsSync(asset1);
          const asset2ExistsAfter = fs.existsSync(asset2);
          const asset3ExistsAfter = fs.existsSync(asset3);

          expect(assetExistsBefore).to.be.false;
          expect(asset1ExistsBefore).to.be.false;
          expect(asset2ExistsBefore).to.be.false;
          expect(asset3ExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;
          expect(asset1ExistsAfter).to.be.true;
          expect(asset2ExistsAfter).to.be.false; // The override which does not import.
          expect(asset3ExistsAfter).to.be.true;

          done();
        }
      );
    });
  });

  describe('`fp import` scripts', function () {
    const scriptsDirFront = conf.ui.paths.source.js;
    const scriptsDirFrontSrc = conf.ui.paths.source.jsSrc;
    const scriptsDirBack = 'import/scripts';
    const scriptsDirBackSrc = `${scriptsDirBack}/src`;
    const scriptBase = 'script-js';
    const script = `${scriptsDirFrontSrc}/${scriptBase}.js`;
    const script1 = `${scriptsDirFront}/argv.f-backend/${scriptBase}.js`;
    const script2 = `${scriptsDirFront}/scripts_dir-global/src/${scriptBase}.js`;
    const script3 = `${scriptsDirFront}/scripts_dir-local/${scriptBase}.js`;
    const scriptYml = `${scriptsDirFrontSrc}/${scriptBase}.yml`;
    const scriptYml1 = `${scriptsDirFront}/argv.f-backend/${scriptBase}.yml`;
    const scriptYml2 = `${scriptsDirFront}/scripts_dir-global/src/${scriptBase}.yml`;
    const scriptYml3 = `${scriptsDirFront}/scripts_dir-local/${scriptBase}.yml`;

    function resetScriptsDir(args = {}) {
      return resetDir(args, scriptsDirFront);
    }

    before(function () {
      pref.backend.synced_dirs = {};

      resetArgv();
    });

    after(function () {
      resetScriptsDir();
    });

    it('does not import scripts using undefined scripts_dir, and undefined scripts_ext', function (done) {
      const {
        scriptExistsBefore,
        script1ExistsBefore,
        script2ExistsBefore,
        script3ExistsBefore
      } = resetScriptsDir({
        script,
        script1,
        script2,
        script3
      });

      delete pref.backend.synced_dirs.scripts_dir;
      delete pref.backend.synced_dirs.scripts_ext;

      fp.runSeq(
        'import',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const script1ExistsAfter = fs.existsSync(script1);
          const script2ExistsAfter = fs.existsSync(script2);
          const script3ExistsAfter = fs.existsSync(script3);

          expect(scriptExistsBefore).to.be.false;
          expect(script1ExistsBefore).to.be.false;
          expect(script2ExistsBefore).to.be.false;
          expect(script3ExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.false;
          expect(script1ExistsAfter).to.be.false;
          expect(script2ExistsAfter).to.be.false;
          expect(script3ExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('imports scripts using global scripts_dir, and undefined scripts_ext', function (done) {
      const {
        scriptExistsBefore,
        script1ExistsBefore,
        script2ExistsBefore,
        script3ExistsBefore
      } = resetScriptsDir({
        script,
        script1,
        script2,
        script3
      });

      pref.backend.synced_dirs.scripts_dir = scriptsDirBack;
      delete pref.backend.synced_dirs.scripts_ext;

      fp.runSeq(
        'import',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const script1ExistsAfter = fs.existsSync(script1);
          const script2ExistsAfter = fs.existsSync(script2);
          const script3ExistsAfter = fs.existsSync(script3);

          expect(scriptExistsBefore).to.be.false;
          expect(script1ExistsBefore).to.be.false;
          expect(script2ExistsBefore).to.be.false;
          expect(script3ExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;
          expect(script1ExistsAfter).to.be.true;
          expect(script2ExistsAfter).to.be.true;
          expect(script3ExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('does not import scripts using undefined scripts_dir, and global scripts_ext', function (done) {
      const {
        scriptExistsBefore,
        script1ExistsBefore,
        script2ExistsBefore,
        script3ExistsBefore
      } = resetScriptsDir({
        script,
        script1,
        script2,
        script3
      });

      delete pref.backend.synced_dirs.scripts_dir;
      pref.backend.synced_dirs.scripts_ext = '.js';

      fp.runSeq(
        'import',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const script1ExistsAfter = fs.existsSync(script1);
          const script2ExistsAfter = fs.existsSync(script2);
          const script3ExistsAfter = fs.existsSync(script3);

          expect(scriptExistsBefore).to.be.false;
          expect(script1ExistsBefore).to.be.false;
          expect(script2ExistsBefore).to.be.false;
          expect(script3ExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.false;
          expect(script1ExistsAfter).to.be.false;
          expect(script2ExistsAfter).to.be.false;
          expect(script3ExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('imports scripts using global scripts_dir, and global scripts_ext', function (done) {
      const {
        scriptExistsBefore,
        script1ExistsBefore,
        script2ExistsBefore,
        script3ExistsBefore
      } = resetScriptsDir({
        script,
        script1,
        script2,
        script3
      });

      pref.backend.synced_dirs.scripts_dir = scriptsDirBack;
      pref.backend.synced_dirs.scripts_ext = '.js';

      fp.runSeq(
        'import',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const script1ExistsAfter = fs.existsSync(script1);
          const script2ExistsAfter = fs.existsSync(script2);
          const script3ExistsAfter = fs.existsSync(script3);

          expect(scriptExistsBefore).to.be.false;
          expect(script1ExistsBefore).to.be.false;
          expect(script2ExistsBefore).to.be.false;
          expect(script3ExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;
          expect(script1ExistsAfter).to.be.true;
          expect(script2ExistsAfter).to.be.true;
          expect(script3ExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('does not import scripts using overriding local scripts_dir, and undefined scripts_ext', function (done) {
      const {
        scriptExistsBefore,
        script1ExistsBefore,
        script2ExistsBefore,
        script3ExistsBefore
      } = resetScriptsDir({
        script,
        script1,
        script2,
        script3
      });

      pref.backend.synced_dirs.scripts_dir = scriptsDirBack;
      delete pref.backend.synced_dirs.scripts_ext;
      fs.writeFileSync(scriptYml, `'scripts_dir': |2
  ${scriptsDirBackSrc}/scripts_dir-local
`);
      fs.writeFileSync(scriptYml1, `'scripts_dir': |2
  ${scriptsDirBack}/argv.f-backend
`);
      fs.writeFileSync(scriptYml2, `'scripts_dir': |2
  ${scriptsDirBack}/scripts_dir-global/bld
`);
      fs.writeFileSync(scriptYml3, `'scripts_dir': |2
  ${scriptsDirBack}/scripts_dir-local
`);

      fp.runSeq(
        'import',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const script1ExistsAfter = fs.existsSync(script1);
          const script2ExistsAfter = fs.existsSync(script2);
          const script3ExistsAfter = fs.existsSync(script3);

          expect(scriptExistsBefore).to.be.false;
          expect(script1ExistsBefore).to.be.false;
          expect(script2ExistsBefore).to.be.false;
          expect(script3ExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.false;
          expect(script1ExistsAfter).to.be.false;
          expect(script2ExistsAfter).to.be.false;
          expect(script3ExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('does not import scripts using undefined scripts_dir, and conflicting scripts_ext', function (done) {
      const scriptYmlExpectedExt = `'scripts_ext': |2
  .foo
`;
      const {
        scriptExistsBefore,
        script1ExistsBefore,
        script2ExistsBefore,
        script3ExistsBefore
      } = resetScriptsDir({
        script,
        script1,
        script2,
        script3
      });

      delete pref.backend.synced_dirs.scripts_dir;
      pref.backend.synced_dirs.scripts_ext = '.js';
      fs.writeFileSync(scriptYml, scriptYmlExpectedExt);
      fs.writeFileSync(scriptYml1, scriptYmlExpectedExt);
      fs.writeFileSync(scriptYml2, scriptYmlExpectedExt);
      fs.writeFileSync(scriptYml3, scriptYmlExpectedExt);

      fp.runSeq(
        'import',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const script1ExistsAfter = fs.existsSync(script1);
          const script2ExistsAfter = fs.existsSync(script2);
          const script3ExistsAfter = fs.existsSync(script3);

          expect(scriptExistsBefore).to.be.false;
          expect(script1ExistsBefore).to.be.false;
          expect(script2ExistsBefore).to.be.false;
          expect(script3ExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.false;
          expect(script1ExistsAfter).to.be.false;
          expect(script2ExistsAfter).to.be.false;
          expect(script3ExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('imports scripts using overriding local scripts_dir, and global scripts_ext', function (done) {
      const scriptYmlExpectedDir = `'scripts_dir': |2
  ${scriptsDirBack}/scripts_dir-local
`;
      const {
        scriptExistsBefore,
        script1ExistsBefore,
        script2ExistsBefore
      } = resetScriptsDir({
        script,
        script1,
        script2
      });

      pref.backend.synced_dirs.scripts_dir = scriptsDirBack;
      pref.backend.synced_dirs.scripts_ext = '.js';
      fs.writeFileSync(scriptYml, scriptYmlExpectedDir);

      fp.runSeq(
        'import',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const script1ExistsAfter = fs.existsSync(script1);
          const script2ExistsAfter = fs.existsSync(script2);

          expect(scriptExistsBefore).to.be.false;
          expect(script1ExistsBefore).to.be.false;
          expect(script2ExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;
          expect(script1ExistsAfter).to.be.true;
          expect(script2ExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('errors using global scripts_dir, and overriding local scripts_ext', function (done) {
      const script = `${scriptsDirFrontSrc}/${scriptBase}.foo`;
      const scriptYmlExpectedExt = `'scripts_ext': |2
  .foo
`;
      const {
        scriptExistsBefore,
        script1ExistsBefore,
        script2ExistsBefore,
        script3ExistsBefore
      } = resetScriptsDir({
        script,
        script1,
        script2,
        script3
      });

      pref.backend.synced_dirs.scripts_dir = scriptsDirBack;
      pref.backend.synced_dirs.scripts_ext = '.js';
      fs.writeFileSync(scriptYml, scriptYmlExpectedExt);

      fp.runSeq(
        'import',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const script1ExistsAfter = fs.existsSync(script1);
          const script2ExistsAfter = fs.existsSync(script2);
          const script3ExistsAfter = fs.existsSync(script3);

          expect(scriptExistsBefore).to.be.false;
          expect(script1ExistsBefore).to.be.false;
          expect(script2ExistsBefore).to.be.false;
          expect(script3ExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;
          expect(script1ExistsAfter).to.be.true;
          expect(script2ExistsAfter).to.be.true;
          expect(script3ExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('imports scripts using overriding local scripts_dir, and overriding local scripts_ext', function (done) {
      const script = `${scriptsDirFrontSrc}/${scriptBase}.foo`;
      const scriptYmlExpectedDir = `'scripts_dir': |2
  ${scriptsDirBack}/scripts_dir-local
`;
      const scriptYmlExpectedExt = `'scripts_ext': |2
  .foo
`;
      const {
        scriptExistsBefore,
        script1ExistsBefore,
        script2ExistsBefore
      } = resetScriptsDir({
        script,
        script1,
        script2
      });

      pref.backend.synced_dirs.scripts_dir = scriptsDirBack;
      pref.backend.synced_dirs.scripts_ext = '.js';
      fs.writeFileSync(scriptYml, scriptYmlExpectedDir + scriptYmlExpectedExt);

      fp.runSeq(
        'import',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const script1ExistsAfter = fs.existsSync(script1);
          const script2ExistsAfter = fs.existsSync(script2);

          expect(scriptExistsBefore).to.be.false;
          expect(script1ExistsBefore).to.be.false;
          expect(script2ExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;
          expect(script1ExistsAfter).to.be.true;
          expect(script2ExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('does not import scripts if global scripts_dir points to a nonexistent directory', function (done) {
      const {
        scriptExistsBefore,
        script1ExistsBefore,
        script2ExistsBefore,
        script3ExistsBefore
      } = resetScriptsDir({
        script,
        script1,
        script2,
        script3
      });

      pref.backend.synced_dirs.scripts_dir = 'nonex/scripts';
      pref.backend.synced_dirs.scripts_ext = '.js';

      fp.runSeq(
        'import',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const script1ExistsAfter = fs.existsSync(script1);
          const script2ExistsAfter = fs.existsSync(script2);
          const script3ExistsAfter = fs.existsSync(script3);

          expect(scriptExistsBefore).to.be.false;
          expect(script1ExistsBefore).to.be.false;
          expect(script2ExistsBefore).to.be.false;
          expect(script3ExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.false;
          expect(script1ExistsAfter).to.be.false;
          expect(script2ExistsAfter).to.be.false;
          expect(script3ExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('does not import scripts if global scripts_ext mismatches actual extension', function (done) {
      const {
        scriptExistsBefore,
        script1ExistsBefore,
        script2ExistsBefore,
        script3ExistsBefore
      } = resetScriptsDir({
        script,
        script1,
        script2,
        script3
      });

      pref.backend.synced_dirs.scripts_dir = scriptsDirBack;
      pref.backend.synced_dirs.scripts_ext = '.bar';

      fp.runSeq(
        'import',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const script1ExistsAfter = fs.existsSync(script1);
          const script2ExistsAfter = fs.existsSync(script2);
          const script3ExistsAfter = fs.existsSync(script3);

          expect(scriptExistsBefore).to.be.false;
          expect(script1ExistsBefore).to.be.false;
          expect(script2ExistsBefore).to.be.false;
          expect(script3ExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.false;
          expect(script1ExistsAfter).to.be.false;
          expect(script2ExistsAfter).to.be.false;
          expect(script3ExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors if local scripts_dir points to a nonexistent directory', function (done) {
      const scriptYmlExpectedDir = `'scripts_dir': |2
  nonex/scripts
`;
      const {
        scriptExistsBefore,
        script1ExistsBefore,
        script2ExistsBefore,
        script3ExistsBefore
      } = resetScriptsDir({
        script,
        script1,
        script2,
        script3
      });

      pref.backend.synced_dirs.scripts_dir = scriptsDirBack;
      pref.backend.synced_dirs.scripts_ext = '.js';
      fs.writeFileSync(scriptYml, scriptYmlExpectedDir);

      fp.runSeq(
        'import',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const script1ExistsAfter = fs.existsSync(script1);
          const script2ExistsAfter = fs.existsSync(script2);
          const script3ExistsAfter = fs.existsSync(script3);

          expect(scriptExistsBefore).to.be.false;
          expect(script1ExistsBefore).to.be.false;
          expect(script2ExistsBefore).to.be.false;
          expect(script3ExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.false; // The override which does not import.
          expect(script1ExistsAfter).to.be.true;
          expect(script2ExistsAfter).to.be.true;
          expect(script3ExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('errors if local scripts_ext mismatches actual extension', function (done) {
      const scriptYmlExpectedExt = `'scripts_ext': |2
  .foo
`;
      const {
        scriptExistsBefore,
        script1ExistsBefore,
        script2ExistsBefore,
        script3ExistsBefore
      } = resetScriptsDir({
        script,
        script1,
        script2,
        script3
      });

      pref.backend.synced_dirs.scripts_dir = scriptsDirBack;
      pref.backend.synced_dirs.scripts_ext = '.js';
      fs.writeFileSync(scriptYml2, scriptYmlExpectedExt);

      fp.runSeq(
        'import',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const script1ExistsAfter = fs.existsSync(script1);
          const script2ExistsAfter = fs.existsSync(script2);
          const script3ExistsAfter = fs.existsSync(script3);

          expect(scriptExistsBefore).to.be.false;
          expect(script1ExistsBefore).to.be.false;
          expect(script2ExistsBefore).to.be.false;
          expect(script3ExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;
          expect(script1ExistsAfter).to.be.true;
          expect(script2ExistsAfter).to.be.false; // The override which does not import.
          expect(script3ExistsAfter).to.be.true;

          done();
        }
      );
    });
  });

  describe('`fp import` styles', function () {
    const stylesDirFront = conf.ui.paths.source.css;
    const stylesDirFrontBld = conf.ui.paths.source.cssBld;
    const stylesDirBack = 'import/styles';
    const stylesDirBackBld = `${stylesDirBack}/bld`;
    const styleBase = 'style-css';
    const style = `${stylesDirFrontBld}/${styleBase}.css`;
    const style1 = `${stylesDirFront}/argv.f-backend/${styleBase}.css`;
    const style2 = `${stylesDirFront}/styles_dir-global/bld/${styleBase}.css`;
    const style3 = `${stylesDirFront}/styles_dir-local/${styleBase}.css`;
    const styleYml = `${stylesDirFrontBld}/${styleBase}.yml`;
    const styleYml1 = `${stylesDirFront}/argv.f-backend/${styleBase}.yml`;
    const styleYml2 = `${stylesDirFront}/styles_dir-global/bld/${styleBase}.yml`;
    const styleYml3 = `${stylesDirFront}/styles_dir-local/${styleBase}.yml`;

    function resetStylesDir(args = {}) {
      return resetDir(args, stylesDirFront);
    }

    before(function () {
      pref.backend.synced_dirs = {};

      resetArgv();
    });

    after(function () {
      resetStylesDir();
    });

    it('does not import styles using undefined styles_dir, and undefined styles_ext', function (done) {
      const {
        styleExistsBefore,
        style1ExistsBefore,
        style2ExistsBefore,
        style3ExistsBefore
      } = resetStylesDir({
        style,
        style1,
        style2,
        style3
      });

      delete pref.backend.synced_dirs.styles_dir;
      delete pref.backend.synced_dirs.styles_ext;

      fp.runSeq(
        'import',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const style1ExistsAfter = fs.existsSync(style1);
          const style2ExistsAfter = fs.existsSync(style2);
          const style3ExistsAfter = fs.existsSync(style3);

          expect(styleExistsBefore).to.be.false;
          expect(style1ExistsBefore).to.be.false;
          expect(style2ExistsBefore).to.be.false;
          expect(style3ExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.false;
          expect(style1ExistsAfter).to.be.false;
          expect(style2ExistsAfter).to.be.false;
          expect(style3ExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('imports styles using global styles_dir, and undefined styles_ext', function (done) {
      const {
        styleExistsBefore,
        style1ExistsBefore,
        style2ExistsBefore,
        style3ExistsBefore
      } = resetStylesDir({
        style,
        style1,
        style2,
        style3
      });

      pref.backend.synced_dirs.styles_dir = stylesDirBack;
      delete pref.backend.synced_dirs.styles_ext;

      fp.runSeq(
        'import',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const style1ExistsAfter = fs.existsSync(style1);
          const style2ExistsAfter = fs.existsSync(style2);
          const style3ExistsAfter = fs.existsSync(style3);

          expect(styleExistsBefore).to.be.false;
          expect(style1ExistsBefore).to.be.false;
          expect(style2ExistsBefore).to.be.false;
          expect(style3ExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;
          expect(style1ExistsAfter).to.be.true;
          expect(style2ExistsAfter).to.be.true;
          expect(style3ExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('does not import styles using undefined styles_dir, and global styles_ext', function (done) {
      const {
        styleExistsBefore,
        style1ExistsBefore,
        style2ExistsBefore,
        style3ExistsBefore
      } = resetStylesDir({
        style,
        style1,
        style2,
        style3
      });

      delete pref.backend.synced_dirs.styles_dir;
      pref.backend.synced_dirs.styles_ext = '.css';

      fp.runSeq(
        'import',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const style1ExistsAfter = fs.existsSync(style1);
          const style2ExistsAfter = fs.existsSync(style2);
          const style3ExistsAfter = fs.existsSync(style3);

          expect(styleExistsBefore).to.be.false;
          expect(style1ExistsBefore).to.be.false;
          expect(style2ExistsBefore).to.be.false;
          expect(style3ExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.false;
          expect(style1ExistsAfter).to.be.false;
          expect(style2ExistsAfter).to.be.false;
          expect(style3ExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('imports styles using global styles_dir, and global styles_ext', function (done) {
      const {
        styleExistsBefore,
        style1ExistsBefore,
        style2ExistsBefore,
        style3ExistsBefore
      } = resetStylesDir({
        style,
        style1,
        style2,
        style3
      });

      pref.backend.synced_dirs.styles_dir = stylesDirBack;
      pref.backend.synced_dirs.styles_ext = '.css';

      fp.runSeq(
        'import',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const style1ExistsAfter = fs.existsSync(style1);
          const style2ExistsAfter = fs.existsSync(style2);
          const style3ExistsAfter = fs.existsSync(style3);

          expect(styleExistsBefore).to.be.false;
          expect(style1ExistsBefore).to.be.false;
          expect(style2ExistsBefore).to.be.false;
          expect(style3ExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;
          expect(style1ExistsAfter).to.be.true;
          expect(style2ExistsAfter).to.be.true;
          expect(style3ExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('does not import styles using overriding local styles_dir, and undefined styles_ext', function (done) {
      const {
        styleExistsBefore,
        style1ExistsBefore,
        style2ExistsBefore,
        style3ExistsBefore
      } = resetStylesDir({
        style,
        style1,
        style2,
        style3
      });

      pref.backend.synced_dirs.styles_dir = stylesDirBack;
      delete pref.backend.synced_dirs.styles_ext;
      fs.writeFileSync(styleYml, `'styles_dir': |2
  ${stylesDirBackBld}/styles_dir-local
`);
      fs.writeFileSync(styleYml1, `'styles_dir': |2
  ${stylesDirBack}/argv.f-backend
`);
      fs.writeFileSync(styleYml2, `'styles_dir': |2
  ${stylesDirBack}/styles_dir-global/bld
`);
      fs.writeFileSync(styleYml3, `'styles_dir': |2
  ${stylesDirBack}/styles_dir-local
`);

      fp.runSeq(
        'import',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const style1ExistsAfter = fs.existsSync(style1);
          const style2ExistsAfter = fs.existsSync(style2);
          const style3ExistsAfter = fs.existsSync(style3);

          expect(styleExistsBefore).to.be.false;
          expect(style1ExistsBefore).to.be.false;
          expect(style2ExistsBefore).to.be.false;
          expect(style3ExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.false;
          expect(style1ExistsAfter).to.be.false;
          expect(style2ExistsAfter).to.be.false;
          expect(style3ExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('does not import styles using undefined styles_dir, and conflicting styles_ext', function (done) {
      const styleYmlExpectedExt = `'styles_ext': |2
  .foo
`;
      const {
        styleExistsBefore,
        style1ExistsBefore,
        style2ExistsBefore,
        style3ExistsBefore
      } = resetStylesDir({
        style,
        style1,
        style2,
        style3
      });

      delete pref.backend.synced_dirs.styles_dir;
      pref.backend.synced_dirs.styles_ext = '.css';
      fs.writeFileSync(styleYml, styleYmlExpectedExt);
      fs.writeFileSync(styleYml1, styleYmlExpectedExt);
      fs.writeFileSync(styleYml2, styleYmlExpectedExt);
      fs.writeFileSync(styleYml3, styleYmlExpectedExt);

      fp.runSeq(
        'import',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const style1ExistsAfter = fs.existsSync(style1);
          const style2ExistsAfter = fs.existsSync(style2);
          const style3ExistsAfter = fs.existsSync(style3);

          expect(styleExistsBefore).to.be.false;
          expect(style1ExistsBefore).to.be.false;
          expect(style2ExistsBefore).to.be.false;
          expect(style3ExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.false;
          expect(style1ExistsAfter).to.be.false;
          expect(style2ExistsAfter).to.be.false;
          expect(style3ExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('imports styles using overriding local styles_dir, and global styles_ext', function (done) {
      const styleYmlExpectedDir = `'styles_dir': |2
  ${stylesDirBack}/styles_dir-local
`;
      const {
        styleExistsBefore,
        style1ExistsBefore,
        style2ExistsBefore
      } = resetStylesDir({
        style,
        style1,
        style2
      });

      pref.backend.synced_dirs.styles_dir = stylesDirBack;
      pref.backend.synced_dirs.styles_ext = '.css';
      fs.writeFileSync(styleYml, styleYmlExpectedDir);

      fp.runSeq(
        'import',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const style1ExistsAfter = fs.existsSync(style1);
          const style2ExistsAfter = fs.existsSync(style2);

          expect(styleExistsBefore).to.be.false;
          expect(style1ExistsBefore).to.be.false;
          expect(style2ExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;
          expect(style1ExistsAfter).to.be.true;
          expect(style2ExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('imports using global styles_dir, and overriding local styles_ext', function (done) {
      const style = `${stylesDirFrontBld}/${styleBase}.foo`;
      const styleYmlExpectedExt = `'styles_ext': |2
  .foo
`;
      const {
        styleExistsBefore,
        style1ExistsBefore,
        style2ExistsBefore,
        style3ExistsBefore
      } = resetStylesDir({
        style,
        style1,
        style2,
        style3
      });

      pref.backend.synced_dirs.styles_dir = stylesDirBack;
      pref.backend.synced_dirs.styles_ext = '.css';
      fs.writeFileSync(styleYml, styleYmlExpectedExt);

      fp.runSeq(
        'import',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const style1ExistsAfter = fs.existsSync(style1);
          const style2ExistsAfter = fs.existsSync(style2);
          const style3ExistsAfter = fs.existsSync(style3);

          expect(styleExistsBefore).to.be.false;
          expect(style1ExistsBefore).to.be.false;
          expect(style2ExistsBefore).to.be.false;
          expect(style3ExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;
          expect(style1ExistsAfter).to.be.true;
          expect(style2ExistsAfter).to.be.true;
          expect(style3ExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('imports styles using overriding local styles_dir, and overriding local styles_ext', function (done) {
      const style = `${stylesDirFrontBld}/${styleBase}.foo`;
      const styleYmlExpectedDir = `'styles_dir': |2
  ${stylesDirBack}/styles_dir-local
`;
      const styleYmlExpectedExt = `'styles_ext': |2
  .foo
`;
      const {
        styleExistsBefore,
        style1ExistsBefore,
        style2ExistsBefore
      } = resetStylesDir({
        style,
        style1,
        style2
      });

      pref.backend.synced_dirs.styles_dir = stylesDirBack;
      pref.backend.synced_dirs.styles_ext = '.css';
      fs.writeFileSync(styleYml, styleYmlExpectedDir + styleYmlExpectedExt);

      fp.runSeq(
        'import',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const style1ExistsAfter = fs.existsSync(style1);
          const style2ExistsAfter = fs.existsSync(style2);

          expect(styleExistsBefore).to.be.false;
          expect(style1ExistsBefore).to.be.false;
          expect(style2ExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;
          expect(style1ExistsAfter).to.be.true;
          expect(style2ExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('does not import styles if global styles_dir points to a nonexistent directory', function (done) {
      const {
        styleExistsBefore,
        style1ExistsBefore,
        style2ExistsBefore,
        style3ExistsBefore
      } = resetStylesDir({
        style,
        style1,
        style2,
        style3
      });

      pref.backend.synced_dirs.styles_dir = 'nonex/styles';
      pref.backend.synced_dirs.styles_ext = '.css';

      fp.runSeq(
        'import',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const style1ExistsAfter = fs.existsSync(style1);
          const style2ExistsAfter = fs.existsSync(style2);
          const style3ExistsAfter = fs.existsSync(style3);

          expect(styleExistsBefore).to.be.false;
          expect(style1ExistsBefore).to.be.false;
          expect(style2ExistsBefore).to.be.false;
          expect(style3ExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.false;
          expect(style1ExistsAfter).to.be.false;
          expect(style2ExistsAfter).to.be.false;
          expect(style3ExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('does not import styles if global styles_ext mismatches actual extension', function (done) {
      const {
        styleExistsBefore,
        style1ExistsBefore,
        style2ExistsBefore,
        style3ExistsBefore
      } = resetStylesDir({
        style,
        style1,
        style2,
        style3
      });

      pref.backend.synced_dirs.styles_dir = stylesDirBack;
      pref.backend.synced_dirs.styles_ext = '.bar';

      fp.runSeq(
        'import',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const style1ExistsAfter = fs.existsSync(style1);
          const style2ExistsAfter = fs.existsSync(style2);
          const style3ExistsAfter = fs.existsSync(style3);

          expect(styleExistsBefore).to.be.false;
          expect(style1ExistsBefore).to.be.false;
          expect(style2ExistsBefore).to.be.false;
          expect(style3ExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.false;
          expect(style1ExistsAfter).to.be.false;
          expect(style2ExistsAfter).to.be.false;
          expect(style3ExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors if local styles_dir points to a nonexistent directory', function (done) {
      const styleYmlExpectedDir = `'styles_dir': |2
  nonex/styles
`;
      const {
        styleExistsBefore,
        style1ExistsBefore,
        style2ExistsBefore,
        style3ExistsBefore
      } = resetStylesDir({
        style,
        style1,
        style2,
        style3
      });

      pref.backend.synced_dirs.styles_dir = stylesDirBack;
      pref.backend.synced_dirs.styles_ext = '.css';
      fs.writeFileSync(styleYml, styleYmlExpectedDir);

      fp.runSeq(
        'import',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const style1ExistsAfter = fs.existsSync(style1);
          const style2ExistsAfter = fs.existsSync(style2);
          const style3ExistsAfter = fs.existsSync(style3);

          expect(styleExistsBefore).to.be.false;
          expect(style1ExistsBefore).to.be.false;
          expect(style2ExistsBefore).to.be.false;
          expect(style3ExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.false; // The override which does not import.
          expect(style1ExistsAfter).to.be.true;
          expect(style2ExistsAfter).to.be.true;
          expect(style3ExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('errors if local styles_ext mismatches actual extension', function (done) {
      const styleYmlExpectedExt = `'styles_ext': |2
  .foo
`;
      const {
        styleExistsBefore,
        style1ExistsBefore,
        style2ExistsBefore,
        style3ExistsBefore
      } = resetStylesDir({
        style,
        style1,
        style2,
        style3
      });

      pref.backend.synced_dirs.styles_dir = stylesDirBack;
      pref.backend.synced_dirs.styles_ext = '.css';
      fs.writeFileSync(styleYml2, styleYmlExpectedExt);

      fp.runSeq(
        'import',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const style1ExistsAfter = fs.existsSync(style1);
          const style2ExistsAfter = fs.existsSync(style2);
          const style3ExistsAfter = fs.existsSync(style3);

          expect(styleExistsBefore).to.be.false;
          expect(style1ExistsBefore).to.be.false;
          expect(style2ExistsBefore).to.be.false;
          expect(style3ExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;
          expect(style1ExistsAfter).to.be.true;
          expect(style2ExistsAfter).to.be.false; // The override which does not import.
          expect(style3ExistsAfter).to.be.true;

          done();
        }
      );
    });
  });

  describe('`fp import` templates', function () {
    const templatesDirFront = conf.ui.paths.source.templates;
    const templatesDirBack = 'import/templates';
    const templateBase = 'template-jsp';
    const template = `${templatesDirFront}/${templateBase}.mustache`;
    const template1 = `${templatesDirFront}/argv.f-backend/${templateBase}.mustache`;
    const template2 = `${templatesDirFront}/templates_dir-global/${templateBase}.mustache`;
    const template3 = `${templatesDirFront}/templates_dir-local/${templateBase}.mustache`;
    const templateYml = `${templatesDirFront}/${templateBase}.yml`;
    const templateYml1 = `${templatesDirFront}/argv.f-backend/${templateBase}.yml`;
    const templateYml2 = `${templatesDirFront}/templates_dir-global/${templateBase}.yml`;
    const templateYml3 = `${templatesDirFront}/templates_dir-local/${templateBase}.yml`;

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
    const templateYmlExpectedDir1 = `'templates_dir': |2
  ${templatesDirBack}/argv.f-backend
`;
    const templateYmlExpectedDir2 = `'templates_dir': |2
  ${templatesDirBack}/templates_dir-global
`;
    const templateYmlExpectedDir3 = `'templates_dir': |2
  ${templatesDirBack}/templates_dir-local
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

    function resetTemplatesDir(args = {}) {
      return resetDir(args, templatesDirFront);
    }

    before(function () {
      pref.backend.synced_dirs = {};

      resetArgv();
    });

    after(function () {
      resetTemplatesDir();
    });

    it('does not import templates using undefined templates_dir, and undefined templates_ext', function (done) {
      const {
        templateExistsBefore,
        template1ExistsBefore,
        template2ExistsBefore,
        template3ExistsBefore
      } = resetTemplatesDir({
        template,
        template1,
        template2,
        template3
      });

      delete pref.backend.synced_dirs.templates_dir;
      delete pref.backend.synced_dirs.templates_ext;

      fp.runSeq(
        'import',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const template1ExistsAfter = fs.existsSync(template1);
          const template2ExistsAfter = fs.existsSync(template2);
          const template3ExistsAfter = fs.existsSync(template3);

          expect(templateExistsBefore).to.be.false;
          expect(template1ExistsBefore).to.be.false;
          expect(template2ExistsBefore).to.be.false;
          expect(template3ExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;
          expect(template1ExistsAfter).to.be.false;
          expect(template2ExistsAfter).to.be.false;
          expect(template3ExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('does not import templates using global templates_dir, and undefined templates_ext', function (done) {
      const {
        templateExistsBefore,
        template1ExistsBefore,
        template2ExistsBefore,
        template3ExistsBefore
      } = resetTemplatesDir({
        template,
        template1,
        template2,
        template3
      });

      pref.backend.synced_dirs.templates_dir = templatesDirBack;
      delete pref.backend.synced_dirs.templates_ext;

      fp.runSeq(
        'import',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const template1ExistsAfter = fs.existsSync(template1);
          const template2ExistsAfter = fs.existsSync(template2);
          const template3ExistsAfter = fs.existsSync(template3);

          expect(templateExistsBefore).to.be.false;
          expect(template1ExistsBefore).to.be.false;
          expect(template2ExistsBefore).to.be.false;
          expect(template3ExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;
          expect(template1ExistsAfter).to.be.false;
          expect(template2ExistsAfter).to.be.false;
          expect(template3ExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('does not import templates using undefined templates_dir, and global templates_ext', function (done) {
      const {
        templateExistsBefore,
        template1ExistsBefore,
        template2ExistsBefore,
        template3ExistsBefore
      } = resetTemplatesDir({
        template,
        template1,
        template2,
        template3
      });

      delete pref.backend.synced_dirs.templates_dir;
      pref.backend.synced_dirs.templates_ext = '.jsp';

      fp.runSeq(
        'import',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const template1ExistsAfter = fs.existsSync(template1);
          const template2ExistsAfter = fs.existsSync(template2);
          const template3ExistsAfter = fs.existsSync(template3);

          expect(templateExistsBefore).to.be.false;
          expect(template1ExistsBefore).to.be.false;
          expect(template2ExistsBefore).to.be.false;
          expect(template3ExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;
          expect(template1ExistsAfter).to.be.false;
          expect(template2ExistsAfter).to.be.false;
          expect(template3ExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('imports templates using global templates_dir, and global templates_ext', function (done) {
      const {
        templateExistsBefore,
        template1ExistsBefore,
        template2ExistsBefore,
        template3ExistsBefore
      } = resetTemplatesDir({
        template,
        template1,
        template2,
        template3
      });

      pref.backend.synced_dirs.templates_dir = templatesDirBack;
      pref.backend.synced_dirs.templates_ext = '.jsp';

      fp.runSeq(
        'import',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const template1ExistsAfter = fs.existsSync(template1);
          const template2ExistsAfter = fs.existsSync(template2);
          const template3ExistsAfter = fs.existsSync(template3);
          const templateMustacheActual = fs.readFileSync(template, conf.enc);
          const templateMustacheActual1 = fs.readFileSync(template1, conf.enc);
          const templateMustacheActual2 = fs.readFileSync(template2, conf.enc);
          const templateMustacheActual3 = fs.readFileSync(template3, conf.enc);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);
          const templateYmlActual1 = fs.readFileSync(templateYml1, conf.enc);
          const templateYmlActual2 = fs.readFileSync(templateYml2, conf.enc);
          const templateYmlActual3 = fs.readFileSync(templateYml3, conf.enc);

          expect(templateExistsBefore).to.be.false;
          expect(template1ExistsBefore).to.be.false;
          expect(template2ExistsBefore).to.be.false;
          expect(template3ExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.true;
          expect(template1ExistsAfter).to.be.true;
          expect(template2ExistsAfter).to.be.true;
          expect(template3ExistsAfter).to.be.true;
          expect(templateMustacheActual).to.equal(templateMustacheExpected);
          expect(templateMustacheActual1).to.equal(templateMustacheExpected);
          expect(templateMustacheActual2).to.equal(templateMustacheExpected);
          expect(templateMustacheActual3).to.equal(templateMustacheExpected);
          expect(templateYmlActual).to.equal(templateYmlExpected);
          expect(templateYmlActual1).to.equal(templateYmlExpectedDir1 + templateYmlExpected);
          expect(templateYmlActual2).to.equal(templateYmlExpectedDir2 + templateYmlExpected);
          expect(templateYmlActual3).to.equal(templateYmlExpectedDir3 + templateYmlExpected);

          done();
        }
      );
    });

    it('does not import templates using overriding local templates_dir, and undefined templates_ext', function (done) {
      const templateYmlExpectedDir = `'templates_dir': |2
  ${templatesDirBack}/templates_dir-local
`;
      const {
        templateExistsBefore,
        template1ExistsBefore,
        template2ExistsBefore,
        template3ExistsBefore
      } = resetTemplatesDir({
        template,
        template1,
        template2,
        template3
      });

      pref.backend.synced_dirs.templates_dir = templatesDirBack;
      delete pref.backend.synced_dirs.templates_ext;
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSeq(
        'import',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const template1ExistsAfter = fs.existsSync(template1);
          const template2ExistsAfter = fs.existsSync(template2);
          const template3ExistsAfter = fs.existsSync(template3);

          expect(templateExistsBefore).to.be.false;
          expect(template1ExistsBefore).to.be.false;
          expect(template2ExistsBefore).to.be.false;
          expect(template3ExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;
          expect(template1ExistsAfter).to.be.false;
          expect(template2ExistsAfter).to.be.false;
          expect(template3ExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('does not import templates using undefined templates_dir, and conflicting templates_ext', function (done) {
      const templateYmlExpectedExt = `'templates_ext': |2
  .foo
`;
      const {
        templateExistsBefore,
        template1ExistsBefore,
        template2ExistsBefore,
        template3ExistsBefore
      } = resetTemplatesDir({
        template,
        template1,
        template2,
        template3
      });

      delete pref.backend.synced_dirs.templates_dir;
      pref.backend.synced_dirs.templates_ext = '.jsp';
      fs.writeFileSync(templateYml, templateYmlExpectedExt);
      fs.writeFileSync(templateYml1, templateYmlExpectedExt);
      fs.writeFileSync(templateYml2, templateYmlExpectedExt);
      fs.writeFileSync(templateYml3, templateYmlExpectedExt);

      fp.runSeq(
        'import',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const template1ExistsAfter = fs.existsSync(template1);
          const template2ExistsAfter = fs.existsSync(template2);
          const template3ExistsAfter = fs.existsSync(template3);

          expect(templateExistsBefore).to.be.false;
          expect(template1ExistsBefore).to.be.false;
          expect(template2ExistsBefore).to.be.false;
          expect(template3ExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;
          expect(template1ExistsAfter).to.be.false;
          expect(template2ExistsAfter).to.be.false;
          expect(template3ExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('imports templates using overriding local templates_dir, and global templates_ext', function (done) {
      const templateYmlExpectedDir = `'templates_dir': |2
  ${templatesDirBack}/templates_dir-local
`;
      const {
        templateExistsBefore,
        template1ExistsBefore,
        template2ExistsBefore,
        template3ExistsBefore
      } = resetTemplatesDir({
        template,
        template1,
        template2,
        template3
      });

      pref.backend.synced_dirs.templates_dir = templatesDirBack;
      pref.backend.synced_dirs.templates_ext = '.jsp';
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSeq(
        'import',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const template1ExistsAfter = fs.existsSync(template1);
          const template2ExistsAfter = fs.existsSync(template2);
          const template3ExistsAfter = fs.existsSync(template3);
          const templateMustacheActual = fs.readFileSync(template, conf.enc);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);

          expect(templateExistsBefore).to.be.false;
          expect(template1ExistsBefore).to.be.false;
          expect(template2ExistsBefore).to.be.false;
          expect(template3ExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.true;
          expect(template1ExistsAfter).to.be.true;
          expect(template2ExistsAfter).to.be.true;
          expect(template3ExistsAfter).to.be.true;
          expect(templateMustacheActual).to.equal(templateMustacheExpected);
          expect(templateYmlActual).to.equal(templateYmlExpectedDir + templateYmlExpected);

          done();
        }
      );
    });

    it('imports templates using global templates_dir, and overriding local templates_ext', function (done) {
      const templateYmlExpectedExt = `'templates_ext': |2
  .foo
`;
      const {
        templateExistsBefore,
        template1ExistsBefore,
        template2ExistsBefore,
        template3ExistsBefore
      } = resetTemplatesDir({
        template,
        template1,
        template2,
        template3
      });

      pref.backend.synced_dirs.templates_dir = templatesDirBack;
      pref.backend.synced_dirs.templates_ext = '.jsp';
      fs.writeFileSync(templateYml, templateYmlExpectedExt);

      fp.runSeq(
        'import',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const template1ExistsAfter = fs.existsSync(template1);
          const template2ExistsAfter = fs.existsSync(template2);
          const template3ExistsAfter = fs.existsSync(template3);
          const templateMustacheActual = fs.readFileSync(template, conf.enc);
          const templateMustacheActual1 = fs.readFileSync(template1, conf.enc);
          const templateMustacheActual2 = fs.readFileSync(template2, conf.enc);
          const templateMustacheActual3 = fs.readFileSync(template3, conf.enc);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);
          const templateYmlActual1 = fs.readFileSync(templateYml1, conf.enc);
          const templateYmlActual2 = fs.readFileSync(templateYml2, conf.enc);
          const templateYmlActual3 = fs.readFileSync(templateYml3, conf.enc);

          expect(templateExistsBefore).to.be.false;
          expect(template1ExistsBefore).to.be.false;
          expect(template2ExistsBefore).to.be.false;
          expect(template3ExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.true;
          expect(template1ExistsAfter).to.be.true;
          expect(template2ExistsAfter).to.be.true;
          expect(template3ExistsAfter).to.be.true;
          expect(templateMustacheActual).to.equal(templateMustacheExpected);
          expect(templateMustacheActual1).to.equal(templateMustacheExpected);
          expect(templateMustacheActual2).to.equal(templateMustacheExpected);
          expect(templateMustacheActual3).to.equal(templateMustacheExpected);
          expect(templateYmlActual).to.equal(templateYmlExpectedExt + templateYmlExpected);
          expect(templateYmlActual1).to.equal(templateYmlExpectedDir1 + templateYmlExpected);
          expect(templateYmlActual2).to.equal(templateYmlExpectedDir2 + templateYmlExpected);
          expect(templateYmlActual3).to.equal(templateYmlExpectedDir3 + templateYmlExpected);

          done();
        }
      );
    });

    it('imports templates using overriding local templates_dir, and overriding local templates_ext', function (done) {
      const templateYmlExpectedDir = `'templates_dir': |2
  ${templatesDirBack}/templates_dir-local
`;
      const templateYmlExpectedExt = `'templates_ext': |2
  .foo
`;
      const {
        templateExistsBefore,
        template1ExistsBefore,
        template2ExistsBefore,
        template3ExistsBefore
      } = resetTemplatesDir({
        template,
        template1,
        template2,
        template3
      });

      pref.backend.synced_dirs.templates_dir = templatesDirBack;
      pref.backend.synced_dirs.templates_ext = '.jsp';
      fs.writeFileSync(templateYml, templateYmlExpectedDir + templateYmlExpectedExt);

      fp.runSeq(
        'import',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const template1ExistsAfter = fs.existsSync(template1);
          const template2ExistsAfter = fs.existsSync(template2);
          const template3ExistsAfter = fs.existsSync(template3);
          const templateMustacheActual = fs.readFileSync(template, conf.enc);
          const templateMustacheActual1 = fs.readFileSync(template1, conf.enc);
          const templateMustacheActual2 = fs.readFileSync(template2, conf.enc);
          const templateMustacheActual3 = fs.readFileSync(template3, conf.enc);
          const templateYmlActual = fs.readFileSync(templateYml, conf.enc);
          const templateYmlActual1 = fs.readFileSync(templateYml1, conf.enc);
          const templateYmlActual2 = fs.readFileSync(templateYml2, conf.enc);
          const templateYmlActual3 = fs.readFileSync(templateYml3, conf.enc);

          expect(templateExistsBefore).to.be.false;
          expect(template1ExistsBefore).to.be.false;
          expect(template2ExistsBefore).to.be.false;
          expect(template3ExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.true;
          expect(template1ExistsAfter).to.be.true;
          expect(template2ExistsAfter).to.be.true;
          expect(template3ExistsAfter).to.be.true;
          expect(templateMustacheActual).to.equal(templateMustacheExpected);
          expect(templateMustacheActual1).to.equal(templateMustacheExpected);
          expect(templateMustacheActual2).to.equal(templateMustacheExpected);
          expect(templateMustacheActual3).to.equal(templateMustacheExpected);
          expect(templateYmlActual).to.equal(templateYmlExpectedDir + templateYmlExpectedExt + templateYmlExpected);
          expect(templateYmlActual1).to.equal(templateYmlExpectedDir1 + templateYmlExpected);
          expect(templateYmlActual2).to.equal(templateYmlExpectedDir2 + templateYmlExpected);
          expect(templateYmlActual3).to.equal(templateYmlExpectedDir3 + templateYmlExpected);

          done();
        }
      );
    });

    it('does not import templates if global templates_dir points to a nonexistent directory', function (done) {
      const {
        templateExistsBefore,
        template1ExistsBefore,
        template2ExistsBefore,
        template3ExistsBefore
      } = resetTemplatesDir({
        template,
        template1,
        template2,
        template3
      });

      pref.backend.synced_dirs.templates_dir = 'nonex/templates';
      pref.backend.synced_dirs.templates_ext = '.jsp';

      fp.runSeq(
        'import',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const template1ExistsAfter = fs.existsSync(template1);
          const template2ExistsAfter = fs.existsSync(template2);
          const template3ExistsAfter = fs.existsSync(template3);

          expect(templateExistsBefore).to.be.false;
          expect(template1ExistsBefore).to.be.false;
          expect(template2ExistsBefore).to.be.false;
          expect(template3ExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;
          expect(template1ExistsAfter).to.be.false;
          expect(template2ExistsAfter).to.be.false;
          expect(template3ExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('does not import templates if global templates_ext mismatches actual extension', function (done) {
      const {
        templateExistsBefore,
        template1ExistsBefore,
        template2ExistsBefore,
        template3ExistsBefore
      } = resetTemplatesDir({
        template,
        template1,
        template2,
        template3
      });

      pref.backend.synced_dirs.templates_dir = templatesDirBack;
      pref.backend.synced_dirs.templates_ext = '.foo';

      fp.runSeq(
        'import',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const template1ExistsAfter = fs.existsSync(template1);
          const template2ExistsAfter = fs.existsSync(template2);
          const template3ExistsAfter = fs.existsSync(template3);

          expect(templateExistsBefore).to.be.false;
          expect(template1ExistsBefore).to.be.false;
          expect(template2ExistsBefore).to.be.false;
          expect(template3ExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false;
          expect(template1ExistsAfter).to.be.false;
          expect(template2ExistsAfter).to.be.false;
          expect(template3ExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors if local templates_dir points to a nonexistent directory', function (done) {
      const templateYmlExpectedDir = `'templates_dir': |2
  nonex/templates
`;
      const {
        templateExistsBefore,
        template1ExistsBefore,
        template2ExistsBefore,
        template3ExistsBefore
      } = resetTemplatesDir({
        template,
        template1,
        template2,
        template3
      });

      pref.backend.synced_dirs.templates_dir = templatesDirBack;
      pref.backend.synced_dirs.templates_ext = '.jsp';
      fs.writeFileSync(templateYml, templateYmlExpectedDir);

      fp.runSeq(
        'import',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const template1ExistsAfter = fs.existsSync(template1);
          const template2ExistsAfter = fs.existsSync(template2);
          const template3ExistsAfter = fs.existsSync(template3);

          expect(templateExistsBefore).to.be.false;
          expect(template1ExistsBefore).to.be.false;
          expect(template2ExistsBefore).to.be.false;
          expect(template3ExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.false; // The override which does not import.
          expect(template1ExistsAfter).to.be.true;
          expect(template2ExistsAfter).to.be.true;
          expect(template3ExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('errors if local templates_ext mismatches actual extension', function (done) {
      const templateYmlExpectedExt = `'templates_ext': |2
  .foo
`;
      const {
        templateExistsBefore,
        template1ExistsBefore,
        template2ExistsBefore,
        template3ExistsBefore
      } = resetTemplatesDir({
        template,
        template1,
        template2,
        template3
      });

      pref.backend.synced_dirs.templates_dir = templatesDirBack;
      pref.backend.synced_dirs.templates_ext = '.jsp';
      fs.writeFileSync(templateYml2, templateYmlExpectedExt);

      fp.runSeq(
        'import',
        () => {
          const templateExistsAfter = fs.existsSync(template);
          const template1ExistsAfter = fs.existsSync(template1);
          const template2ExistsAfter = fs.existsSync(template2);
          const template3ExistsAfter = fs.existsSync(template3);

          expect(templateExistsBefore).to.be.false;
          expect(template1ExistsBefore).to.be.false;
          expect(template2ExistsBefore).to.be.false;
          expect(template3ExistsBefore).to.be.false;
          expect(templateExistsAfter).to.be.true;
          expect(template1ExistsAfter).to.be.true;
          expect(template2ExistsAfter).to.be.false; // The override which does not import.
          expect(template3ExistsAfter).to.be.true;

          done();
        }
      );
    });
  });
});
