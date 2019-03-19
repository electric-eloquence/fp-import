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

const assetsDirFront = conf.ui.paths.source.images;
const assetsDirFrontSrc = conf.ui.paths.source.imagesSrc;
const assetsDirFrontSrcRel = conf.ui.pathsRelative.source.imagesSrc;
const assetsDirBack = 'import/assets';
const assetsDirBackNonex = 'nonex/assets';
const assetsDirBackSub = `${assetsDirBack}/assets_dir-global`;
const assetBase = 'asset-svg';
const asset = `${assetsDirFrontSrc}/${assetBase}.svg`;
const assetYml = `${assetsDirFrontSrc}/${assetBase}.yml`;
const assetYmlExpectedExt = `'assets_ext': |2
  .svg
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

function resetAssetsDir(args = {}) {
  diveSync(assetsDirFront, (err, file) => {
    fs.unlinkSync(file);
  });

  const returnObj = {};

  for (let fileKey of Object.keys(args)) {
    returnObj[`${fileKey}ExistsBefore`] = fs.existsSync(args[fileKey]);
  }

  return returnObj;
}

describe('fp import:asset', function () {
  before(function () {
    pref.backend.synced_dirs = {};
  });

  beforeEach(function () {
    resetArgv();
  });

  after(function () {
    resetAssetsDir();
  });

  it('should error with no -f argument', function (done) {
    fp.runSequence(
      'import:asset',
      done
    );
  });

  // Test success and error cases. The error cases should pass as tests.
  // For backend -f arguments, when local yml and global yml differ, always fail and emit error.
  // This prevents overwriting local settings on the frontend meant for something else on the backend.
  describe('fp import:asset with backend -f argument', function () {
    const assetsDirBackSrc = `${assetsDirBack}/src`;

    it('should import using absolute path argument', function (done) {
      const assetYmlExpectedDir = `'assets_dir': |2
  ${assetsDirBackSrc}
`;
      const {
        assetExistsBefore,
        assetYmlExistsBefore
      } = resetAssetsDir({
        asset,
        assetYml
      });

      process.argv.push('-f');
      process.argv.push(`${conf.backend_dir}/${assetsDirBackSrc}/${assetBase}.svg`);

      delete pref.backend.synced_dirs.assets_dir;
      delete pref.backend.synced_dirs.assets_ext;

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlExistsAfter = fs.existsSync(assetYml);
          const assetYmlActual = fs.readFileSync(assetYml, conf.enc);

          expect(pref.backend.synced_dirs.assets_dir).to.not.exist;
          expect(pref.backend.synced_dirs.assets_ext).to.not.exist;
          expect(assetExistsBefore).to.be.false;
          expect(assetYmlExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;
          expect(assetYmlExistsAfter).to.be.true;
          expect(assetYmlActual).to.equal(assetYmlExpectedDir + assetYmlExpectedExt);

          done();
        }
      );
    });

    it('should import using undefined assets_dir, and undefined assets_ext', function (done) {
      const assetYmlExpectedDir = `'assets_dir': |2
  ${assetsDirBackSrc}
`;
      const {
        assetExistsBefore,
        assetYmlExistsBefore
      } = resetAssetsDir({
        asset,
        assetYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${assetsDirBackSrc}/${assetBase}.svg`);

      delete pref.backend.synced_dirs.assets_dir;
      delete pref.backend.synced_dirs.assets_ext;

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlExistsAfter = fs.existsSync(assetYml);
          const assetYmlActual = fs.readFileSync(assetYml, conf.enc);

          expect(pref.backend.synced_dirs.assets_dir).to.not.exist;
          expect(pref.backend.synced_dirs.assets_ext).to.not.exist;
          expect(assetExistsBefore).to.be.false;
          expect(assetYmlExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;
          expect(assetYmlExistsAfter).to.be.true;
          expect(assetYmlActual).to.equal(assetYmlExpectedDir + assetYmlExpectedExt);

          done();
        }
      );
    });

    it('should import using global assets_dir, and undefined assets_ext', function (done) {
      const {
        assetExistsBefore,
        assetYmlExistsBefore
      } = resetAssetsDir({
        asset,
        assetYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${assetsDirBackSrc}/${assetBase}.svg`);

      pref.backend.synced_dirs.assets_dir = assetsDirBack;
      delete pref.backend.synced_dirs.assets_ext;

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlExistsAfter = fs.existsSync(assetYml);
          const assetYmlActual = fs.readFileSync(assetYml, conf.enc);

          expect(pref.backend.synced_dirs.assets_ext).to.not.exist;
          expect(assetExistsBefore).to.be.false;
          expect(assetYmlExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;
          expect(assetYmlExistsAfter).to.be.true;
          expect(assetYmlActual).to.equal(assetYmlExpectedExt);

          done();
        }
      );
    });

    it('should import using undefined assets_dir, and global assets_ext', function (done) {
      const assetYmlExpectedDir = `'assets_dir': |2
  ${assetsDirBackSrc}
`;
      const {
        assetExistsBefore,
        assetYmlExistsBefore
      } = resetAssetsDir({
        asset,
        assetYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${assetsDirBackSrc}/${assetBase}.svg`);

      delete pref.backend.synced_dirs.assets_dir;
      pref.backend.synced_dirs.assets_ext = '.svg';

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlExistsAfter = fs.existsSync(assetYml);
          const assetYmlActual = fs.readFileSync(assetYml, conf.enc);

          expect(pref.backend.synced_dirs.assets_dir).to.not.exist;
          expect(assetExistsBefore).to.be.false;
          expect(assetYmlExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;
          expect(assetYmlExistsAfter).to.be.true;
          expect(assetYmlActual).to.equal(assetYmlExpectedDir + assetYmlExpectedExt);

          done();
        }
      );
    });

    it('should import using global assets_dir, and global assets_ext', function (done) {
      const {
        assetExistsBefore,
        assetYmlExistsBefore
      } = resetAssetsDir({
        asset,
        assetYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${assetsDirBackSrc}/${assetBase}.svg`);

      pref.backend.synced_dirs.assets_dir = assetsDirBack;
      pref.backend.synced_dirs.assets_ext = '.svg';

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlExistsAfter = fs.existsSync(assetYml);

          expect(assetExistsBefore).to.be.false;
          expect(assetYmlExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;
          expect(assetYmlExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('should error using conflicting assets_dir, and ignore undefined assets_ext', function (done) {
      const assetYmlExpected = `assets_dir: ${assetsDirBackNonex}`;
      const {
        assetExistsBefore
      } = resetAssetsDir({
        asset
      });

      process.argv.push('-f');
      process.argv.push(`backend/${assetsDirBackSrc}/${assetBase}.svg`);

      pref.backend.synced_dirs.assets_dir = assetsDirBack;
      delete pref.backend.synced_dirs.assets_ext;
      fs.writeFileSync(assetYml, assetYmlExpected);

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlExistsAfter = fs.existsSync(assetYml);
          const assetYmlActual = fs.readFileSync(assetYml, conf.enc);

          expect(pref.backend.synced_dirs.assets_ext).to.not.exist;
          expect(assetExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.false;
          expect(assetYmlExistsAfter).to.be.true;
          expect(assetYmlActual).to.equal(assetYmlExpected);

          done();
        }
      );
    });

    it('should import using undefined assets_dir, and ignore conflicting assets_ext', function (done) {
      const assetYmlToIgnore = 'assets_ext: .foo';
      const {
        assetExistsBefore
      } = resetAssetsDir({
        asset
      });

      process.argv.push('-f');
      process.argv.push(`backend/${assetsDirBackSrc}/${assetBase}.svg`);

      delete pref.backend.synced_dirs.assets_dir;
      pref.backend.synced_dirs.assets_ext = '.svg';
      fs.writeFileSync(assetYml, assetYmlToIgnore);

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlExistsAfter = fs.existsSync(assetYml);
          const assetYmlActual = fs.readFileSync(assetYml, conf.enc);
          const assetYmlExpected = `'assets_dir': |2
  import/assets/src
'assets_ext': |2
  .svg
`;

          expect(pref.backend.synced_dirs.assets_dir).to.not.exist;
          expect(assetExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;
          expect(assetYmlExistsAfter).to.be.true;
          expect(assetYmlActual).to.equal(assetYmlExpected);

          done();
        }
      );
    });

    it('should error using conflicting assets_dir, and ignore global assets_ext', function (done) {
      const assetYmlExpected = `assets_dir: ${assetsDirBackNonex}`;
      const {
        assetExistsBefore
      } = resetAssetsDir({
        asset
      });

      process.argv.push('-f');
      process.argv.push(`backend/${assetsDirBackSrc}/${assetBase}.svg`);

      pref.backend.synced_dirs.assets_dir = assetsDirBack;
      pref.backend.synced_dirs.assets_ext = '.svg';
      fs.writeFileSync(assetYml, assetYmlExpected);

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlExistsAfter = fs.existsSync(assetYml);
          const assetYmlActual = fs.readFileSync(assetYml, conf.enc);

          expect(assetExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.false;
          expect(assetYmlExistsAfter).to.be.true;
          expect(assetYmlActual).to.equal(assetYmlExpected);

          done();
        }
      );
    });

    it('should import using global assets_dir, and ignore conflicting assets_ext', function (done) {
      const assetYmlToIgnore = 'assets_ext: .foo';
      const {
        assetExistsBefore
      } = resetAssetsDir({
        asset
      });

      process.argv.push('-f');
      process.argv.push(`backend/${assetsDirBackSrc}/${assetBase}.svg`);

      pref.backend.synced_dirs.assets_dir = assetsDirBack;
      pref.backend.synced_dirs.assets_ext = '.svg';
      fs.writeFileSync(assetYml, assetYmlToIgnore);

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlExistsAfter = fs.existsSync(assetYml);
          const assetYmlActual = fs.readFileSync(assetYml, conf.enc);
          const assetYmlExpected = `'assets_ext': |2
  .svg
`;

          expect(assetExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;
          expect(assetYmlExistsAfter).to.be.true;
          expect(assetYmlActual).to.equal(assetYmlExpected);

          done();
        }
      );
    });

    it('should error using conflicting assets_dir, and ignore conflicting assets_ext', function (done) {
      const assetYmlExpected = `assets_dir: ${assetsDirBackNonex}\nassets_ext: .foo`;
      const {
        assetExistsBefore
      } = resetAssetsDir({
        asset
      });

      process.argv.push('-f');
      process.argv.push(`backend/${assetsDirBackSrc}/${assetBase}.svg`);

      pref.backend.synced_dirs.assets_dir = assetsDirBack;
      pref.backend.synced_dirs.assets_ext = '.svg';
      fs.writeFileSync(assetYml, assetYmlExpected);

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlExistsAfter = fs.existsSync(assetYml);
          const assetYmlActual = fs.readFileSync(assetYml, conf.enc);

          expect(assetExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.false;
          expect(assetYmlExistsAfter).to.be.true;
          expect(assetYmlActual).to.equal(assetYmlExpected);

          done();
        }
      );
    });

    it('should import even if global assets_dir points to a nonexistent directory', function (done) {
      const assetYmlExpectedDir = `'assets_dir': |2
  ${assetsDirBackSrc}
`;
      const {
        assetExistsBefore,
        assetYmlExistsBefore
      } = resetAssetsDir({
        asset,
        assetYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${assetsDirBackSrc}/${assetBase}.svg`);

      pref.backend.synced_dirs.assets_dir = assetsDirBackNonex;
      delete pref.backend.synced_dirs.assets_ext;

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlExistsAfter = fs.existsSync(assetYml);
          const assetYmlActual = fs.readFileSync(assetYml, conf.enc);

          expect(pref.backend.synced_dirs.assets_ext).to.not.exist;
          expect(assetExistsBefore).to.be.false;
          expect(assetYmlExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;
          expect(assetYmlExistsAfter).to.be.true;
          expect(assetYmlActual).to.equal(assetYmlExpectedDir + assetYmlExpectedExt);

          done();
        }
      );
    });

    it('should import even if global assets_ext mismatches arg extension', function (done) {
      const assetYmlExpectedDir = `'assets_dir': |2
  ${assetsDirBackSrc}
`;
      const {
        assetExistsBefore,
        assetYmlExistsBefore
      } = resetAssetsDir({
        asset,
        assetYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${assetsDirBackSrc}/${assetBase}.svg`);

      delete pref.backend.synced_dirs.assets_dir;
      pref.backend.synced_dirs.assets_ext = '.foo';

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlExistsAfter = fs.existsSync(assetYml);
          const assetYmlActual = fs.readFileSync(assetYml, conf.enc);

          expect(pref.backend.synced_dirs.assets_dir).to.not.exist;
          expect(assetExistsBefore).to.be.false;
          expect(assetYmlExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;
          expect(assetYmlExistsAfter).to.be.true;
          expect(assetYmlActual).to.equal(assetYmlExpectedDir + assetYmlExpectedExt);

          done();
        }
      );
    });

    it('should error using local assets_dir that points to a nonexistent directory', function (done) {
      const assetYmlExpected = `assets_dir: ${assetsDirBackNonex}`;
      const {
        assetExistsBefore
      } = resetAssetsDir({
        asset
      });

      process.argv.push('-f');
      process.argv.push(`backend/${assetsDirBackSrc}/${assetBase}.svg`);

      delete pref.backend.synced_dirs.assets_dir;
      delete pref.backend.synced_dirs.assets_ext;
      fs.writeFileSync(assetYml, assetYmlExpected);

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlExistsAfter = fs.existsSync(assetYml);
          const assetYmlActual = fs.readFileSync(assetYml, conf.enc);

          expect(pref.backend.synced_dirs.assets_dir).to.not.exist;
          expect(pref.backend.synced_dirs.assets_ext).to.not.exist;
          expect(assetExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.false;
          expect(assetYmlExistsAfter).to.be.true;
          expect(assetYmlActual).to.equal(assetYmlExpected);

          done();
        }
      );
    });

    it('should import ignoring local assets_ext that mismatches arg extension', function (done) {
      const assetYmlToIgnore = 'assets_ext: .foo';
      const {
        assetExistsBefore
      } = resetAssetsDir({
        asset
      });

      process.argv.push('-f');
      process.argv.push(`backend/${assetsDirBackSrc}/${assetBase}.svg`);

      delete pref.backend.synced_dirs.assets_dir;
      delete pref.backend.synced_dirs.assets_ext;
      fs.writeFileSync(assetYml, assetYmlToIgnore);

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlExistsAfter = fs.existsSync(assetYml);
          const assetYmlActual = fs.readFileSync(assetYml, conf.enc);
          const assetYmlExpected = `'assets_dir': |2
  import/assets/src
'assets_ext': |2
  .svg
`;

          expect(pref.backend.synced_dirs.assets_dir).to.not.exist;
          expect(pref.backend.synced_dirs.assets_ext).to.not.exist;
          expect(assetExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;
          expect(assetYmlExistsAfter).to.be.true;
          expect(assetYmlActual).to.equal(assetYmlExpected);

          done();
        }
      );
    });

    it('should import using global assets_dir that nests the arg path', function (done) {
      const {
        assetExistsBefore,
        assetYmlExistsBefore
      } = resetAssetsDir({
        asset,
        assetYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${assetsDirBackSrc}/${assetBase}.svg`);

      pref.backend.synced_dirs.assets_dir = assetsDirBack;
      delete pref.backend.synced_dirs.assets_ext;

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlExistsAfter = fs.existsSync(assetYml);
          const assetYmlActual = fs.readFileSync(assetYml, conf.enc);

          expect(pref.backend.synced_dirs.assets_ext).to.not.exist;
          expect(assetExistsBefore).to.be.false;
          expect(assetYmlExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;
          expect(assetYmlExistsAfter).to.be.true;
          expect(assetYmlActual).to.equal(assetYmlExpectedExt);

          done();
        }
      );
    });

    it('should import where local assets_dir is nested by global assets_dir, and immediately nests -f argument\
', function (done) {
      const assetYmlExpectedDir = `'assets_dir': |2
  ${assetsDirBackSrc}
`;
      const {
        assetExistsBefore,
        assetYmlExistsBefore
      } = resetAssetsDir({
        asset,
        assetYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${assetsDirBackSrc}/${assetBase}.svg`);

      pref.backend.synced_dirs.assets_dir = assetsDirBack;
      delete pref.backend.synced_dirs.assets_ext;
      fs.writeFileSync(assetYml, assetYmlExpectedDir);

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlExistsAfter = fs.existsSync(assetYml);
          const assetYmlActual = fs.readFileSync(assetYml, conf.enc);

          expect(pref.backend.synced_dirs.assets_ext).to.not.exist;
          expect(assetExistsBefore).to.be.false;
          expect(assetYmlExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;
          expect(assetYmlExistsAfter).to.be.true;
          expect(assetYmlActual).to.equal(assetYmlExpectedDir + assetYmlExpectedExt);

          done();
        }
      );
    });

    it('should error where local assets_dir is nested by global assets_dir, but does not immediately nest -f argument\
', function (done) {
      const assetDir = `${assetsDirFront}/assets/argv.f-backend`;
      const asset = `${assetDir}/${assetBase}.svg`;
      const assetYml = `${assetDir}/${assetBase}.yml`;
      const assetYmlExpected = `assets_dir: ${assetsDirBack}`;
      const {
        assetExistsBefore
      } = resetAssetsDir({
        asset
      });

      process.argv.push('-f');
      process.argv.push(`backend/${assetsDirBack}/argv.f-backend/${assetBase}.svg`);

      pref.backend.synced_dirs.assets_dir = 'import';
      delete pref.backend.synced_dirs.assets_ext;
      fs.ensureDirSync(assetDir);
      fs.writeFileSync(assetYml, assetYmlExpected);

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlExistsAfter = fs.existsSync(assetYml);
          const assetYmlActual = fs.readFileSync(assetYml, conf.enc);

          expect(pref.backend.synced_dirs.assets_ext).to.not.exist;
          expect(assetExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.false;
          expect(assetYmlExistsAfter).to.be.true;
          expect(assetYmlActual).to.equal(assetYmlExpected);

          done();
        }
      );
    });

    it('should error where local assets_dir nests global local assets_dir, and therefore cannot immediately nest -f \
argument', function (done) {
      const asset = `${assetsDirFrontSrc}/${assetBase}.svg`;
      const assetYml = `${assetsDirFrontSrc}/${assetBase}.yml`;
      const assetYmlExpected = `assets_dir: ${assetsDirBack}`;
      const {
        assetExistsBefore
      } = resetAssetsDir({
        asset
      });

      process.argv.push('-f');
      process.argv.push(`backend/${assetsDirBackSub}/src/${assetBase}.svg`);

      pref.backend.synced_dirs.assets_dir = assetsDirBackSub;
      delete pref.backend.synced_dirs.assets_ext;
      fs.writeFileSync(assetYml, assetYmlExpected);

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);

          expect(pref.backend.synced_dirs.assets_ext).to.not.exist;
          expect(assetExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.false;

          done();
        }
      );
    });
  });

  // Test success and error cases. The error cases should pass as tests.
  describe('fp import:asset with frontend -f argument and asset extension', function () {
    it('should import using absolute path argument', function (done) {
      const {
        assetExistsBefore
      } = resetAssetsDir({
        asset
      });

      process.argv.push('-f');
      process.argv.push(`${assetsDirFrontSrc}/${assetBase}.svg`);

      pref.backend.synced_dirs.assets_dir = assetsDirBackSub;
      pref.backend.synced_dirs.assets_ext = '.svg';

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);

          expect(assetExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('should error using undefined assets_dir, and undefined assets_ext', function (done) {
      const {
        assetExistsBefore,
        assetYmlExistsBefore
      } = resetAssetsDir({
        asset,
        assetYml
      });

      process.argv.push('-f');
      process.argv.push(`${assetsDirFrontSrcRel}/${assetBase}.svg`);

      delete pref.backend.synced_dirs.assets_dir;
      delete pref.backend.synced_dirs.assets_ext;

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlExistsAfter = fs.existsSync(assetYml);

          expect(pref.backend.synced_dirs.assets_dir).to.not.exist;
          expect(pref.backend.synced_dirs.assets_ext).to.not.exist;
          expect(assetExistsBefore).to.be.false;
          expect(assetYmlExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.false;
          expect(assetYmlExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('should import using global assets_dir, and undefined assets_ext', function (done) {
      const {
        assetExistsBefore
      } = resetAssetsDir({
        asset
      });

      process.argv.push('-f');
      process.argv.push(`${assetsDirFrontSrcRel}/${assetBase}.svg`);

      pref.backend.synced_dirs.assets_dir = assetsDirBackSub;
      delete pref.backend.synced_dirs.assets_ext;

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);

          expect(pref.backend.synced_dirs.assets_ext).to.not.exist;
          expect(assetExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('should error using undefined assets_dir, and global assets_ext', function (done) {
      const {
        assetExistsBefore,
        assetYmlExistsBefore
      } = resetAssetsDir({
        asset,
        assetYml
      });

      process.argv.push('-f');
      process.argv.push(`${assetsDirFrontSrcRel}/${assetBase}.svg`);

      delete pref.backend.synced_dirs.assets_dir;
      pref.backend.synced_dirs.assets_ext = '.svg';

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlExistsAfter = fs.existsSync(assetYml);

          expect(pref.backend.synced_dirs.assets_dir).to.not.exist;
          expect(assetExistsBefore).to.be.false;
          expect(assetYmlExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.false;
          expect(assetYmlExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('should import using global assets_dir, and global assets_ext', function (done) {
      const {
        assetExistsBefore
      } = resetAssetsDir({
        asset
      });

      process.argv.push('-f');
      process.argv.push(`${assetsDirFrontSrcRel}/${assetBase}.svg`);

      pref.backend.synced_dirs.assets_dir = assetsDirBackSub;
      pref.backend.synced_dirs.assets_ext = '.svg';

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);

          expect(assetExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('should error using undefined assets_dir, and overriding local assets_ext', function (done) {
      const assetYmlExpected = 'assets_ext: .foo';
      const {
        assetExistsBefore
      } = resetAssetsDir({
        asset
      });

      process.argv.push('-f');
      process.argv.push(`${assetsDirFrontSrcRel}/${assetBase}.svg`);

      delete pref.backend.synced_dirs.assets_dir;
      pref.backend.synced_dirs.assets_ext = '.svg';
      fs.writeFileSync(assetYml, assetYmlExpected);

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlExistsAfter = fs.existsSync(assetYml);
          const assetYmlActual = fs.readFileSync(assetYml, conf.enc);

          expect(pref.backend.synced_dirs.assets_dir).to.not.exist;
          expect(assetExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.false;
          expect(assetYmlExistsAfter).to.be.true;
          expect(assetYmlActual).to.equal(assetYmlExpected);

          done();
        }
      );
    });

    it('should import using overriding local assets_dir, and global assets_ext', function (done) {
      const assetYmlExpectedDir = `'assets_dir': |2
  ${assetsDirBack}/assets_dir-local
`;
      const {
        assetExistsBefore
      } = resetAssetsDir({
        asset
      });

      process.argv.push('-f');
      process.argv.push(`${assetsDirFrontSrcRel}/${assetBase}.svg`);

      pref.backend.synced_dirs.assets_dir = assetsDirBack;
      pref.backend.synced_dirs.assets_ext = '.svg';
      fs.writeFileSync(assetYml, assetYmlExpectedDir);

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlExistsAfter = fs.existsSync(assetYml);
          const assetYmlActual = fs.readFileSync(assetYml, conf.enc);

          expect(assetExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;
          expect(assetYmlExistsAfter).to.be.true;
          expect(assetYmlActual).to.equal(assetYmlExpectedDir);

          done();
        }
      );
    });

    it('should import using global assets_dir, and overriding local assets_ext', function (done) {
      const {
        assetExistsBefore
      } = resetAssetsDir({
        asset
      });

      process.argv.push('-f');
      process.argv.push(`${assetsDirFrontSrcRel}/${assetBase}.svg`);

      pref.backend.synced_dirs.assets_dir = assetsDirBack;
      pref.backend.synced_dirs.assets_ext = '.foo';
      fs.writeFileSync(assetYml, assetYmlExpectedExt);

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlExistsAfter = fs.existsSync(assetYml);
          const assetYmlActual = fs.readFileSync(assetYml, conf.enc);

          expect(assetExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;
          expect(assetYmlExistsAfter).to.be.true;
          expect(assetYmlActual).to.equal(assetYmlExpectedExt);

          done();
        }
      );
    });

    it('should import using overriding local assets_dir, and overriding local assets_ext', function (done) {
      const assetYmlExpectedDir = `'assets_dir': |2
  ${assetsDirBack}/assets_dir-local
`;
      const {
        assetExistsBefore
      } = resetAssetsDir({
        asset
      });

      process.argv.push('-f');
      process.argv.push(`${assetsDirFrontSrcRel}/${assetBase}.svg`);

      pref.backend.synced_dirs.assets_dir = assetsDirBackNonex;
      pref.backend.synced_dirs.assets_ext = '.foo';
      fs.writeFileSync(assetYml, assetYmlExpectedDir + assetYmlExpectedExt);

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlExistsAfter = fs.existsSync(assetYml);
          const assetYmlActual = fs.readFileSync(assetYml, conf.enc);

          expect(assetExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;
          expect(assetYmlExistsAfter).to.be.true;
          expect(assetYmlActual).to.equal(assetYmlExpectedDir + assetYmlExpectedExt);

          done();
        }
      );
    });

    it('should error if global assets_dir points to a nonexistent directory', function (done) {
      const {
        assetExistsBefore,
        assetYmlExistsBefore
      } = resetAssetsDir({
        asset,
        assetYml
      });

      process.argv.push('-f');
      process.argv.push(`${assetsDirFrontSrcRel}/${assetBase}.svg`);

      pref.backend.synced_dirs.assets_dir = assetsDirBackNonex;
      pref.backend.synced_dirs.assets_ext = '.svg';

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlExistsAfter = fs.existsSync(assetYml);

          expect(assetExistsBefore).to.be.false;
          expect(assetYmlExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.false;
          expect(assetYmlExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('should import ignoring global assets_ext that mismatches arg extension', function (done) {
      const {
        assetExistsBefore,
        assetYmlExistsBefore
      } = resetAssetsDir({
        asset,
        assetYml
      });

      process.argv.push('-f');
      process.argv.push(`${assetsDirFrontSrcRel}/${assetBase}.svg`);

      pref.backend.synced_dirs.assets_dir = assetsDirBack;
      pref.backend.synced_dirs.assets_ext = '.foo';

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlExistsAfter = fs.existsSync(assetYml);

          expect(assetExistsBefore).to.be.false;
          expect(assetYmlExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;
          expect(assetYmlExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('should error if local assets_dir points to a nonexistent directory', function (done) {
      const assetYmlExpectedDir = `'assets_dir': |2
  ${assetsDirBackNonex}
`;
      const {
        assetExistsBefore
      } = resetAssetsDir({
        asset
      });

      process.argv.push('-f');
      process.argv.push(`${assetsDirFrontSrcRel}/${assetBase}.svg`);

      pref.backend.synced_dirs.assets_dir = assetsDirBack;
      pref.backend.synced_dirs.assets_ext = '.svg';
      fs.writeFileSync(assetYml, assetYmlExpectedDir);

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlExistsAfter = fs.existsSync(assetYml);
          const assetYmlActual = fs.readFileSync(assetYml, conf.enc);

          expect(assetExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.false;
          expect(assetYmlExistsAfter).to.be.true;
          expect(assetYmlActual).to.equal(assetYmlExpectedDir);


          done();
        }
      );
    });

    it('should import ignoring local assets_ext that mismatches arg extension', function (done) {
      const assetYmlExpectedExt = `'assets_ext': |2
  .bar
`;
      const {
        assetExistsBefore,
        assetYmlExistsBefore
      } = resetAssetsDir({
        asset,
        assetYml
      });

      process.argv.push('-f');
      process.argv.push(`${assetsDirFrontSrcRel}/${assetBase}.svg`);

      pref.backend.synced_dirs.assets_dir = assetsDirBack;
      pref.backend.synced_dirs.assets_ext = '.svg';
      fs.writeFileSync(assetYml, assetYmlExpectedExt);

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlExistsAfter = fs.existsSync(assetYml);
          const assetYmlActual = fs.readFileSync(assetYml, conf.enc);

          expect(assetExistsBefore).to.be.false;
          expect(assetYmlExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;
          expect(assetYmlExistsAfter).to.be.true;
          expect(assetYmlActual).to.equal(assetYmlExpectedExt);

          done();
        }
      );
    });
  });

  // Test success and error cases. The error cases should pass as tests.
  describe('fp import:asset with frontend -f argument and .yml extension', function () {
    it('should import using absolute path argument', function (done) {
      const {
        assetExistsBefore
      } = resetAssetsDir({
        asset
      });

      process.argv.push('-f');
      process.argv.push(`${assetsDirFrontSrc}/${assetBase}.yml`);

      pref.backend.synced_dirs.assets_dir = assetsDirBack;
      pref.backend.synced_dirs.assets_ext = '.svg';
      fs.writeFileSync(assetYml, '');

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlActual = fs.readFileSync(assetYml, conf.enc);

          expect(assetExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;
          expect(assetYmlActual).to.equal('');

          done();
        }
      );
    });

    it('should error using undefined assets_dir, and undefined assets_ext', function (done) {
      const {
        assetExistsBefore
      } = resetAssetsDir({
        asset
      });

      process.argv.push('-f');
      process.argv.push(`${assetsDirFrontSrcRel}/${assetBase}.yml`);

      delete pref.backend.synced_dirs.assets_dir;
      delete pref.backend.synced_dirs.assets_ext;
      fs.writeFileSync(assetYml, '');

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);

          expect(pref.backend.synced_dirs.assets_dir).to.not.exist;
          expect(pref.backend.synced_dirs.assets_ext).to.not.exist;
          expect(assetExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('should error using global assets_dir, and undefined assets_ext', function (done) {
      const {
        assetExistsBefore
      } = resetAssetsDir({
        asset
      });

      process.argv.push('-f');
      process.argv.push(`${assetsDirFrontSrcRel}/${assetBase}.yml`);

      pref.backend.synced_dirs.assets_dir = assetsDirBack;
      delete pref.backend.synced_dirs.assets_ext;
      fs.writeFileSync(assetYml, '');

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);

          expect(pref.backend.synced_dirs.assets_ext).to.not.exist;
          expect(assetExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('should error using undefined assets_dir, and global assets_ext', function (done) {
      const {
        assetExistsBefore
      } = resetAssetsDir({
        asset
      });

      process.argv.push('-f');
      process.argv.push(`${assetsDirFrontSrcRel}/${assetBase}.yml`);

      delete pref.backend.synced_dirs.assets_dir;
      pref.backend.synced_dirs.assets_ext = '.svg';
      fs.writeFileSync(assetYml, '');

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);

          expect(pref.backend.synced_dirs.assets_dir).to.not.exist;
          expect(assetExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('should import using global assets_dir, and global assets_ext', function (done) {
      const {
        assetExistsBefore
      } = resetAssetsDir({
        asset
      });

      process.argv.push('-f');
      process.argv.push(`${assetsDirFrontSrcRel}/${assetBase}.yml`);

      pref.backend.synced_dirs.assets_dir = assetsDirBack;
      pref.backend.synced_dirs.assets_ext = '.svg';
      fs.writeFileSync(assetYml, '');

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlActual = fs.readFileSync(assetYml, conf.enc);

          expect(assetExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;
          expect(assetYmlActual).to.equal('');

          done();
        }
      );
    });

    it('should error using undefined assets_dir, and overriding local assets_ext', function (done) {
      const assetYmlExpected = 'assets_ext: .foo';
      const {
        assetExistsBefore
      } = resetAssetsDir({
        asset
      });

      process.argv.push('-f');
      process.argv.push(`${assetsDirFrontSrcRel}/${assetBase}.yml`);

      delete pref.backend.synced_dirs.assets_dir;
      pref.backend.synced_dirs.assets_ext = '.svg';
      fs.writeFileSync(assetYml, assetYmlExpected);

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlActual = fs.readFileSync(assetYml, conf.enc);

          expect(pref.backend.synced_dirs.assets_dir).to.not.exist;
          expect(assetExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.false;
          expect(assetYmlActual).to.equal(assetYmlExpected);

          done();
        }
      );
    });

    it('should import using overriding local assets_dir, and global assets_ext', function (done) {
      const assetYmlExpectedDir = `'assets_dir': |2
  ${assetsDirBack}/assets_dir-local
`;
      const {
        assetExistsBefore
      } = resetAssetsDir({
        asset
      });

      process.argv.push('-f');
      process.argv.push(`${assetsDirFrontSrcRel}/${assetBase}.yml`);

      pref.backend.synced_dirs.assets_dir = assetsDirBack;
      pref.backend.synced_dirs.assets_ext = '.svg';
      fs.writeFileSync(assetYml, assetYmlExpectedDir);

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlActual = fs.readFileSync(assetYml, conf.enc);

          expect(assetExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;
          expect(assetYmlActual).to.equal(assetYmlExpectedDir);

          done();
        }
      );
    });

    it('should import using global assets_dir, and overriding local assets_ext', function (done) {
      const {
        assetExistsBefore
      } = resetAssetsDir({
        asset
      });

      process.argv.push('-f');
      process.argv.push(`${assetsDirFrontSrcRel}/${assetBase}.yml`);

      pref.backend.synced_dirs.assets_dir = assetsDirBack;
      pref.backend.synced_dirs.assets_ext = '.foo';
      fs.writeFileSync(assetYml, assetYmlExpectedExt);

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlActual = fs.readFileSync(assetYml, conf.enc);

          expect(assetExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;
          expect(assetYmlActual).to.equal(assetYmlExpectedExt);

          done();
        }
      );
    });

    it('should import using overriding local assets_dir, and overriding local assets_ext', function (done) {
      const assetYmlExpectedDir = `'assets_dir': |2
  ${assetsDirBack}/assets_dir-local
`;
      const {
        assetExistsBefore
      } = resetAssetsDir({
        asset
      });

      process.argv.push('-f');
      process.argv.push(`${assetsDirFrontSrcRel}/${assetBase}.yml`);

      pref.backend.synced_dirs.assets_dir = assetsDirBackNonex;
      pref.backend.synced_dirs.assets_ext = '.foo';
      fs.writeFileSync(assetYml, assetYmlExpectedDir + assetYmlExpectedExt);

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlActual = fs.readFileSync(assetYml, conf.enc);

          expect(assetExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.true;
          expect(assetYmlActual).to.equal(assetYmlExpectedDir + assetYmlExpectedExt);

          done();
        }
      );
    });

    it('should error if global assets_dir points to a nonexistent directory', function (done) {
      const {
        assetExistsBefore
      } = resetAssetsDir({
        asset
      });

      process.argv.push('-f');
      process.argv.push(`${assetsDirFrontSrcRel}/${assetBase}.yml`);

      pref.backend.synced_dirs.assets_dir = assetsDirBackNonex;
      pref.backend.synced_dirs.assets_ext = '.svg';
      fs.writeFileSync(assetYml, '');

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);

          expect(assetExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('should error if global assets_ext mismatches actual extension', function (done) {
      const {
        assetExistsBefore
      } = resetAssetsDir({
        asset
      });

      process.argv.push('-f');
      process.argv.push(`${assetsDirFrontSrcRel}/${assetBase}.yml`);

      pref.backend.synced_dirs.assets_dir = assetsDirBack;
      pref.backend.synced_dirs.assets_ext = '.bar';
      fs.writeFileSync(assetYml, '');

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);

          expect(assetExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('should error if local assets_dir points to a nonexistent directory', function (done) {
      const assetYmlExpectedDir = `'assets_dir': |2
  ${assetsDirBackNonex}
`;
      const {
        assetExistsBefore
      } = resetAssetsDir({
        asset
      });

      process.argv.push('-f');
      process.argv.push(`${assetsDirFrontSrcRel}/${assetBase}.yml`);

      pref.backend.synced_dirs.assets_dir = assetsDirBack;
      pref.backend.synced_dirs.assets_ext = '.svg';
      fs.writeFileSync(assetYml, assetYmlExpectedDir);

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlActual = fs.readFileSync(assetYml, conf.enc);

          expect(assetExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.false;
          expect(assetYmlActual).to.equal(assetYmlExpectedDir);

          done();
        }
      );
    });

    it('should error if local assets_ext mismatches actual extension', function (done) {
      const assetYmlExpectedExt = `'assets_ext': |2
  .bar
`;
      const {
        assetExistsBefore
      } = resetAssetsDir({
        asset
      });

      process.argv.push('-f');
      process.argv.push(`${assetsDirFrontSrcRel}/${assetBase}.yml`);

      pref.backend.synced_dirs.assets_dir = assetsDirBack;
      pref.backend.synced_dirs.assets_ext = '.svg';
      fs.writeFileSync(assetYml, assetYmlExpectedExt);

      fp.runSequence(
        'import:asset',
        () => {
          const assetExistsAfter = fs.existsSync(asset);
          const assetYmlActual = fs.readFileSync(assetYml, conf.enc);

          expect(assetExistsBefore).to.be.false;
          expect(assetExistsAfter).to.be.false;
          expect(assetYmlActual).to.equal(assetYmlExpectedExt);

          done();
        }
      );
    });
  });
});
