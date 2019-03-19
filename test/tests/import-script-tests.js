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

const scriptsDirFront = conf.ui.paths.source.js;
const scriptsDirFrontSrc = conf.ui.paths.source.jsSrc;
const scriptsDirFrontSrcRel = conf.ui.pathsRelative.source.jsSrc;
const scriptsDirBack = 'import/scripts';
const scriptsDirBackNonex = 'nonex/scripts';
const scriptsDirBackSub = `${scriptsDirBack}/scripts_dir-global`;
const scriptBase = 'script-js';
const script = `${scriptsDirFrontSrc}/${scriptBase}.js`;
const scriptYml = `${scriptsDirFrontSrc}/${scriptBase}.yml`;
const scriptYmlExpectedExt = `'scripts_ext': |2
  .js
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

function resetScriptsDir(args = {}) {
  diveSync(scriptsDirFront, (err, file) => {
    fs.unlinkSync(file);
  });

  const returnObj = {};

  for (let fileKey of Object.keys(args)) {
    returnObj[`${fileKey}ExistsBefore`] = fs.existsSync(args[fileKey]);
  }

  return returnObj;
}

describe('fp import:script', function () {
  before(function () {
    pref.backend.synced_dirs = {};
  });

  beforeEach(function () {
    resetArgv();
  });

  after(function () {
    resetScriptsDir();
  });

  it('should error with no -f argument', function (done) {
    fp.runSequence(
      'import:script',
      done
    );
  });

  // Test success and error cases. The error cases should pass as tests.
  // For backend -f arguments, when local yml and global yml differ, always fail and emit error.
  // This prevents overwriting local settings on the frontend meant for something else on the backend.
  describe('fp import:script with backend -f argument', function () {
    const scriptsDirBackSrc = `${scriptsDirBack}/src`;

    it('should import using absolute path argument', function (done) {
      const scriptYmlExpectedDir = `'scripts_dir': |2
  ${scriptsDirBackSrc}
`;
      const {
        scriptExistsBefore,
        scriptYmlExistsBefore
      } = resetScriptsDir({
        script,
        scriptYml
      });

      process.argv.push('-f');
      process.argv.push(`${conf.backend_dir}/${scriptsDirBackSrc}/${scriptBase}.js`);

      delete pref.backend.synced_dirs.scripts_dir;
      delete pref.backend.synced_dirs.scripts_ext;

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlExistsAfter = fs.existsSync(scriptYml);
          const scriptYmlActual = fs.readFileSync(scriptYml, conf.enc);

          expect(pref.backend.synced_dirs.scripts_dir).to.not.exist;
          expect(pref.backend.synced_dirs.scripts_ext).to.not.exist;
          expect(scriptExistsBefore).to.be.false;
          expect(scriptYmlExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;
          expect(scriptYmlExistsAfter).to.be.true;
          expect(scriptYmlActual).to.equal(scriptYmlExpectedDir + scriptYmlExpectedExt);

          done();
        }
      );
    });

    it('should import using undefined scripts_dir, and undefined scripts_ext', function (done) {
      const scriptYmlExpectedDir = `'scripts_dir': |2
  ${scriptsDirBackSrc}
`;
      const {
        scriptExistsBefore,
        scriptYmlExistsBefore
      } = resetScriptsDir({
        script,
        scriptYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${scriptsDirBackSrc}/${scriptBase}.js`);

      delete pref.backend.synced_dirs.scripts_dir;
      delete pref.backend.synced_dirs.scripts_ext;

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlExistsAfter = fs.existsSync(scriptYml);
          const scriptYmlActual = fs.readFileSync(scriptYml, conf.enc);

          expect(pref.backend.synced_dirs.scripts_dir).to.not.exist;
          expect(pref.backend.synced_dirs.scripts_ext).to.not.exist;
          expect(scriptExistsBefore).to.be.false;
          expect(scriptYmlExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;
          expect(scriptYmlExistsAfter).to.be.true;
          expect(scriptYmlActual).to.equal(scriptYmlExpectedDir + scriptYmlExpectedExt);

          done();
        }
      );
    });

    it('should import using global scripts_dir, and undefined scripts_ext', function (done) {
      const {
        scriptExistsBefore,
        scriptYmlExistsBefore
      } = resetScriptsDir({
        script,
        scriptYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${scriptsDirBackSrc}/${scriptBase}.js`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBack;
      delete pref.backend.synced_dirs.scripts_ext;

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlExistsAfter = fs.existsSync(scriptYml);
          const scriptYmlActual = fs.readFileSync(scriptYml, conf.enc);

          expect(pref.backend.synced_dirs.scripts_ext).to.not.exist;
          expect(scriptExistsBefore).to.be.false;
          expect(scriptYmlExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;
          expect(scriptYmlExistsAfter).to.be.true;
          expect(scriptYmlActual).to.equal(scriptYmlExpectedExt);

          done();
        }
      );
    });

    it('should import using undefined scripts_dir, and global scripts_ext', function (done) {
      const scriptYmlExpectedDir = `'scripts_dir': |2
  ${scriptsDirBackSrc}
`;
      const {
        scriptExistsBefore,
        scriptYmlExistsBefore
      } = resetScriptsDir({
        script,
        scriptYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${scriptsDirBackSrc}/${scriptBase}.js`);

      delete pref.backend.synced_dirs.scripts_dir;
      pref.backend.synced_dirs.scripts_ext = '.js';

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlExistsAfter = fs.existsSync(scriptYml);
          const scriptYmlActual = fs.readFileSync(scriptYml, conf.enc);

          expect(pref.backend.synced_dirs.scripts_dir).to.not.exist;
          expect(scriptExistsBefore).to.be.false;
          expect(scriptYmlExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;
          expect(scriptYmlExistsAfter).to.be.true;
          expect(scriptYmlActual).to.equal(scriptYmlExpectedDir + scriptYmlExpectedExt);

          done();
        }
      );
    });

    it('should import using global scripts_dir, and global scripts_ext', function (done) {
      const {
        scriptExistsBefore,
        scriptYmlExistsBefore
      } = resetScriptsDir({
        script,
        scriptYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${scriptsDirBackSrc}/${scriptBase}.js`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBack;
      pref.backend.synced_dirs.scripts_ext = '.js';

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlExistsAfter = fs.existsSync(scriptYml);

          expect(scriptExistsBefore).to.be.false;
          expect(scriptYmlExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;
          expect(scriptYmlExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('should error using conflicting scripts_dir, and ignore undefined scripts_ext', function (done) {
      const scriptYmlExpected = `scripts_dir: ${scriptsDirBackNonex}`;
      const {
        scriptExistsBefore
      } = resetScriptsDir({
        script
      });

      process.argv.push('-f');
      process.argv.push(`backend/${scriptsDirBackSrc}/${scriptBase}.js`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBack;
      delete pref.backend.synced_dirs.scripts_ext;
      fs.writeFileSync(scriptYml, scriptYmlExpected);

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlExistsAfter = fs.existsSync(scriptYml);
          const scriptYmlActual = fs.readFileSync(scriptYml, conf.enc);

          expect(pref.backend.synced_dirs.scripts_ext).to.not.exist;
          expect(scriptExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.false;
          expect(scriptYmlExistsAfter).to.be.true;
          expect(scriptYmlActual).to.equal(scriptYmlExpected);

          done();
        }
      );
    });

    it('should import using undefined scripts_dir, and ignore conflicting scripts_ext', function (done) {
      const scriptYmlToIgnore = 'scripts_ext: .foo';
      const {
        scriptExistsBefore
      } = resetScriptsDir({
        script
      });

      process.argv.push('-f');
      process.argv.push(`backend/${scriptsDirBackSrc}/${scriptBase}.js`);

      delete pref.backend.synced_dirs.scripts_dir;
      pref.backend.synced_dirs.scripts_ext = '.js';
      fs.writeFileSync(scriptYml, scriptYmlToIgnore);

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlExistsAfter = fs.existsSync(scriptYml);
          const scriptYmlActual = fs.readFileSync(scriptYml, conf.enc);
          const scriptYmlExpected = `'scripts_dir': |2
  import/scripts/src
'scripts_ext': |2
  .js
`;

          expect(pref.backend.synced_dirs.scripts_dir).to.not.exist;
          expect(scriptExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;
          expect(scriptYmlExistsAfter).to.be.true;
          expect(scriptYmlActual).to.equal(scriptYmlExpected);

          done();
        }
      );
    });

    it('should error using conflicting scripts_dir, and ignore global scripts_ext', function (done) {
      const scriptYmlExpected = `scripts_dir: ${scriptsDirBackNonex}`;
      const {
        scriptExistsBefore
      } = resetScriptsDir({
        script
      });

      process.argv.push('-f');
      process.argv.push(`backend/${scriptsDirBackSrc}/${scriptBase}.js`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBack;
      pref.backend.synced_dirs.scripts_ext = '.js';
      fs.writeFileSync(scriptYml, scriptYmlExpected);

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlExistsAfter = fs.existsSync(scriptYml);
          const scriptYmlActual = fs.readFileSync(scriptYml, conf.enc);

          expect(scriptExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.false;
          expect(scriptYmlExistsAfter).to.be.true;
          expect(scriptYmlActual).to.equal(scriptYmlExpected);

          done();
        }
      );
    });

    it('should import using global scripts_dir, and ignore conflicting scripts_ext', function (done) {
      const scriptYmlToIgnore = 'scripts_ext: .foo';
      const {
        scriptExistsBefore
      } = resetScriptsDir({
        script
      });

      process.argv.push('-f');
      process.argv.push(`backend/${scriptsDirBackSrc}/${scriptBase}.js`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBack;
      pref.backend.synced_dirs.scripts_ext = '.js';
      fs.writeFileSync(scriptYml, scriptYmlToIgnore);

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlExistsAfter = fs.existsSync(scriptYml);
          const scriptYmlActual = fs.readFileSync(scriptYml, conf.enc);
          const scriptYmlExpected = `'scripts_ext': |2
  .js
`;

          expect(scriptExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;
          expect(scriptYmlExistsAfter).to.be.true;
          expect(scriptYmlActual).to.equal(scriptYmlExpected);

          done();
        }
      );
    });

    it('should error using conflicting scripts_dir, and ignore conflicting scripts_ext', function (done) {
      const scriptYmlExpected = `scripts_dir: ${scriptsDirBackNonex}\nscripts_ext: .foo`;
      const {
        scriptExistsBefore
      } = resetScriptsDir({
        script
      });

      process.argv.push('-f');
      process.argv.push(`backend/${scriptsDirBackSrc}/${scriptBase}.js`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBack;
      pref.backend.synced_dirs.scripts_ext = '.js';
      fs.writeFileSync(scriptYml, scriptYmlExpected);

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlExistsAfter = fs.existsSync(scriptYml);
          const scriptYmlActual = fs.readFileSync(scriptYml, conf.enc);

          expect(scriptExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.false;
          expect(scriptYmlExistsAfter).to.be.true;
          expect(scriptYmlActual).to.equal(scriptYmlExpected);

          done();
        }
      );
    });

    it('should import even if global scripts_dir points to a nonexistent directory', function (done) {
      const scriptYmlExpectedDir = `'scripts_dir': |2
  ${scriptsDirBackSrc}
`;
      const {
        scriptExistsBefore,
        scriptYmlExistsBefore
      } = resetScriptsDir({
        script,
        scriptYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${scriptsDirBackSrc}/${scriptBase}.js`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBackNonex;
      delete pref.backend.synced_dirs.scripts_ext;

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlExistsAfter = fs.existsSync(scriptYml);
          const scriptYmlActual = fs.readFileSync(scriptYml, conf.enc);

          expect(pref.backend.synced_dirs.scripts_ext).to.not.exist;
          expect(scriptExistsBefore).to.be.false;
          expect(scriptYmlExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;
          expect(scriptYmlExistsAfter).to.be.true;
          expect(scriptYmlActual).to.equal(scriptYmlExpectedDir + scriptYmlExpectedExt);

          done();
        }
      );
    });

    it('should import even if global scripts_ext mismatches arg extension', function (done) {
      const scriptYmlExpectedDir = `'scripts_dir': |2
  ${scriptsDirBackSrc}
`;
      const {
        scriptExistsBefore,
        scriptYmlExistsBefore
      } = resetScriptsDir({
        script,
        scriptYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${scriptsDirBackSrc}/${scriptBase}.js`);

      delete pref.backend.synced_dirs.scripts_dir;
      pref.backend.synced_dirs.scripts_ext = '.foo';

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlExistsAfter = fs.existsSync(scriptYml);
          const scriptYmlActual = fs.readFileSync(scriptYml, conf.enc);

          expect(pref.backend.synced_dirs.scripts_dir).to.not.exist;
          expect(scriptExistsBefore).to.be.false;
          expect(scriptYmlExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;
          expect(scriptYmlExistsAfter).to.be.true;
          expect(scriptYmlActual).to.equal(scriptYmlExpectedDir + scriptYmlExpectedExt);

          done();
        }
      );
    });

    it('should error using local scripts_dir that points to a nonexistent directory', function (done) {
      const scriptYmlExpected = `scripts_dir: ${scriptsDirBackNonex}`;
      const {
        scriptExistsBefore
      } = resetScriptsDir({
        script
      });

      process.argv.push('-f');
      process.argv.push(`backend/${scriptsDirBackSrc}/${scriptBase}.js`);

      delete pref.backend.synced_dirs.scripts_dir;
      delete pref.backend.synced_dirs.scripts_ext;
      fs.writeFileSync(scriptYml, scriptYmlExpected);

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlExistsAfter = fs.existsSync(scriptYml);
          const scriptYmlActual = fs.readFileSync(scriptYml, conf.enc);

          expect(pref.backend.synced_dirs.scripts_dir).to.not.exist;
          expect(pref.backend.synced_dirs.scripts_ext).to.not.exist;
          expect(scriptExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.false;
          expect(scriptYmlExistsAfter).to.be.true;
          expect(scriptYmlActual).to.equal(scriptYmlExpected);

          done();
        }
      );
    });

    it('should import ignoring local scripts_ext that mismatches arg extension', function (done) {
      const scriptYmlToIgnore = 'scripts_ext: .foo';
      const {
        scriptExistsBefore
      } = resetScriptsDir({
        script
      });

      process.argv.push('-f');
      process.argv.push(`backend/${scriptsDirBackSrc}/${scriptBase}.js`);

      delete pref.backend.synced_dirs.scripts_dir;
      delete pref.backend.synced_dirs.scripts_ext;
      fs.writeFileSync(scriptYml, scriptYmlToIgnore);

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlExistsAfter = fs.existsSync(scriptYml);
          const scriptYmlActual = fs.readFileSync(scriptYml, conf.enc);
          const scriptYmlExpected = `'scripts_dir': |2
  import/scripts/src
'scripts_ext': |2
  .js
`;

          expect(pref.backend.synced_dirs.scripts_dir).to.not.exist;
          expect(pref.backend.synced_dirs.scripts_ext).to.not.exist;
          expect(scriptExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;
          expect(scriptYmlExistsAfter).to.be.true;
          expect(scriptYmlActual).to.equal(scriptYmlExpected);

          done();
        }
      );
    });

    it('should import using global scripts_dir that nests the arg path', function (done) {
      const {
        scriptExistsBefore,
        scriptYmlExistsBefore
      } = resetScriptsDir({
        script,
        scriptYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${scriptsDirBackSrc}/${scriptBase}.js`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBack;
      delete pref.backend.synced_dirs.scripts_ext;

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlExistsAfter = fs.existsSync(scriptYml);
          const scriptYmlActual = fs.readFileSync(scriptYml, conf.enc);

          expect(pref.backend.synced_dirs.scripts_ext).to.not.exist;
          expect(scriptExistsBefore).to.be.false;
          expect(scriptYmlExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;
          expect(scriptYmlExistsAfter).to.be.true;
          expect(scriptYmlActual).to.equal(scriptYmlExpectedExt);

          done();
        }
      );
    });

    it('should import where local scripts_dir is nested by global scripts_dir, and immediately nests -f argument\
', function (done) {
      const scriptYmlExpectedDir = `'scripts_dir': |2
  ${scriptsDirBackSrc}
`;
      const {
        scriptExistsBefore,
        scriptYmlExistsBefore
      } = resetScriptsDir({
        script,
        scriptYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${scriptsDirBackSrc}/${scriptBase}.js`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBack;
      delete pref.backend.synced_dirs.scripts_ext;
      fs.writeFileSync(scriptYml, scriptYmlExpectedDir);

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlExistsAfter = fs.existsSync(scriptYml);
          const scriptYmlActual = fs.readFileSync(scriptYml, conf.enc);

          expect(pref.backend.synced_dirs.scripts_ext).to.not.exist;
          expect(scriptExistsBefore).to.be.false;
          expect(scriptYmlExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;
          expect(scriptYmlExistsAfter).to.be.true;
          expect(scriptYmlActual).to.equal(scriptYmlExpectedDir + scriptYmlExpectedExt);

          done();
        }
      );
    });

    it('should error where local scripts_dir is nested by global scripts_dir, but does not immediately nest -f argument\
', function (done) {
      const scriptDir = `${scriptsDirFront}/scripts/argv.f-backend`;
      const script = `${scriptDir}/${scriptBase}.js`;
      const scriptYml = `${scriptDir}/${scriptBase}.yml`;
      const scriptYmlExpected = `scripts_dir: ${scriptsDirBack}`;
      const {
        scriptExistsBefore
      } = resetScriptsDir({
        script
      });

      process.argv.push('-f');
      process.argv.push(`backend/${scriptsDirBack}/argv.f-backend/${scriptBase}.js`);

      pref.backend.synced_dirs.scripts_dir = 'import';
      delete pref.backend.synced_dirs.scripts_ext;
      fs.ensureDirSync(scriptDir);
      fs.writeFileSync(scriptYml, scriptYmlExpected);

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlExistsAfter = fs.existsSync(scriptYml);
          const scriptYmlActual = fs.readFileSync(scriptYml, conf.enc);

          expect(pref.backend.synced_dirs.scripts_ext).to.not.exist;
          expect(scriptExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.false;
          expect(scriptYmlExistsAfter).to.be.true;
          expect(scriptYmlActual).to.equal(scriptYmlExpected);

          done();
        }
      );
    });

    it('should error where local scripts_dir nests global local scripts_dir, and therefore cannot immediately nest -f \
argument', function (done) {
      const script = `${scriptsDirFrontSrc}/${scriptBase}.js`;
      const scriptYml = `${scriptsDirFrontSrc}/${scriptBase}.yml`;
      const scriptYmlExpected = `scripts_dir: ${scriptsDirBack}`;
      const {
        scriptExistsBefore
      } = resetScriptsDir({
        script
      });

      process.argv.push('-f');
      process.argv.push(`backend/${scriptsDirBackSub}/src/${scriptBase}.js`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBackSub;
      delete pref.backend.synced_dirs.scripts_ext;
      fs.writeFileSync(scriptYml, scriptYmlExpected);

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);

          expect(pref.backend.synced_dirs.scripts_ext).to.not.exist;
          expect(scriptExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.false;

          done();
        }
      );
    });
  });

  // Test success and error cases. The error cases should pass as tests.
  describe('fp import:script with frontend -f argument and script extension', function () {
    it('should import using absolute path argument', function (done) {
      const {
        scriptExistsBefore
      } = resetScriptsDir({
        script
      });

      process.argv.push('-f');
      process.argv.push(`${scriptsDirFrontSrc}/${scriptBase}.js`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBackSub;
      pref.backend.synced_dirs.scripts_ext = '.js';

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);

          expect(scriptExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('should error using undefined scripts_dir, and undefined scripts_ext', function (done) {
      const {
        scriptExistsBefore,
        scriptYmlExistsBefore
      } = resetScriptsDir({
        script,
        scriptYml
      });

      process.argv.push('-f');
      process.argv.push(`${scriptsDirFrontSrcRel}/${scriptBase}.js`);

      delete pref.backend.synced_dirs.scripts_dir;
      delete pref.backend.synced_dirs.scripts_ext;

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlExistsAfter = fs.existsSync(scriptYml);

          expect(pref.backend.synced_dirs.scripts_dir).to.not.exist;
          expect(pref.backend.synced_dirs.scripts_ext).to.not.exist;
          expect(scriptExistsBefore).to.be.false;
          expect(scriptYmlExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.false;
          expect(scriptYmlExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('should import using global scripts_dir, and undefined scripts_ext', function (done) {
      const {
        scriptExistsBefore
      } = resetScriptsDir({
        script
      });

      process.argv.push('-f');
      process.argv.push(`${scriptsDirFrontSrcRel}/${scriptBase}.js`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBackSub;
      delete pref.backend.synced_dirs.scripts_ext;

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);

          expect(pref.backend.synced_dirs.scripts_ext).to.not.exist;
          expect(scriptExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('should error using undefined scripts_dir, and global scripts_ext', function (done) {
      const {
        scriptExistsBefore,
        scriptYmlExistsBefore
      } = resetScriptsDir({
        script,
        scriptYml
      });

      process.argv.push('-f');
      process.argv.push(`${scriptsDirFrontSrcRel}/${scriptBase}.js`);

      delete pref.backend.synced_dirs.scripts_dir;
      pref.backend.synced_dirs.scripts_ext = '.js';

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlExistsAfter = fs.existsSync(scriptYml);

          expect(pref.backend.synced_dirs.scripts_dir).to.not.exist;
          expect(scriptExistsBefore).to.be.false;
          expect(scriptYmlExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.false;
          expect(scriptYmlExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('should import using global scripts_dir, and global scripts_ext', function (done) {
      const {
        scriptExistsBefore
      } = resetScriptsDir({
        script
      });

      process.argv.push('-f');
      process.argv.push(`${scriptsDirFrontSrcRel}/${scriptBase}.js`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBackSub;
      pref.backend.synced_dirs.scripts_ext = '.js';

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);

          expect(scriptExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('should error using undefined scripts_dir, and overriding local scripts_ext', function (done) {
      const scriptYmlExpected = 'scripts_ext: .foo';
      const {
        scriptExistsBefore
      } = resetScriptsDir({
        script
      });

      process.argv.push('-f');
      process.argv.push(`${scriptsDirFrontSrcRel}/${scriptBase}.js`);

      delete pref.backend.synced_dirs.scripts_dir;
      pref.backend.synced_dirs.scripts_ext = '.js';
      fs.writeFileSync(scriptYml, scriptYmlExpected);

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlExistsAfter = fs.existsSync(scriptYml);
          const scriptYmlActual = fs.readFileSync(scriptYml, conf.enc);

          expect(pref.backend.synced_dirs.scripts_dir).to.not.exist;
          expect(scriptExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.false;
          expect(scriptYmlExistsAfter).to.be.true;
          expect(scriptYmlActual).to.equal(scriptYmlExpected);

          done();
        }
      );
    });

    it('should import using overriding local scripts_dir, and global scripts_ext', function (done) {
      const scriptYmlExpectedDir = `'scripts_dir': |2
  ${scriptsDirBack}/scripts_dir-local
`;
      const {
        scriptExistsBefore
      } = resetScriptsDir({
        script
      });

      process.argv.push('-f');
      process.argv.push(`${scriptsDirFrontSrcRel}/${scriptBase}.js`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBack;
      pref.backend.synced_dirs.scripts_ext = '.js';
      fs.writeFileSync(scriptYml, scriptYmlExpectedDir);

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlExistsAfter = fs.existsSync(scriptYml);
          const scriptYmlActual = fs.readFileSync(scriptYml, conf.enc);

          expect(scriptExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;
          expect(scriptYmlExistsAfter).to.be.true;
          expect(scriptYmlActual).to.equal(scriptYmlExpectedDir);

          done();
        }
      );
    });

    it('should import using global scripts_dir, and overriding local scripts_ext', function (done) {
      const {
        scriptExistsBefore
      } = resetScriptsDir({
        script
      });

      process.argv.push('-f');
      process.argv.push(`${scriptsDirFrontSrcRel}/${scriptBase}.js`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBack;
      pref.backend.synced_dirs.scripts_ext = '.foo';
      fs.writeFileSync(scriptYml, scriptYmlExpectedExt);

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlExistsAfter = fs.existsSync(scriptYml);
          const scriptYmlActual = fs.readFileSync(scriptYml, conf.enc);

          expect(scriptExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;
          expect(scriptYmlExistsAfter).to.be.true;
          expect(scriptYmlActual).to.equal(scriptYmlExpectedExt);

          done();
        }
      );
    });

    it('should import using overriding local scripts_dir, and overriding local scripts_ext', function (done) {
      const scriptYmlExpectedDir = `'scripts_dir': |2
  ${scriptsDirBack}/scripts_dir-local
`;
      const {
        scriptExistsBefore
      } = resetScriptsDir({
        script
      });

      process.argv.push('-f');
      process.argv.push(`${scriptsDirFrontSrcRel}/${scriptBase}.js`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBackNonex;
      pref.backend.synced_dirs.scripts_ext = '.foo';
      fs.writeFileSync(scriptYml, scriptYmlExpectedDir + scriptYmlExpectedExt);

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlExistsAfter = fs.existsSync(scriptYml);
          const scriptYmlActual = fs.readFileSync(scriptYml, conf.enc);

          expect(scriptExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;
          expect(scriptYmlExistsAfter).to.be.true;
          expect(scriptYmlActual).to.equal(scriptYmlExpectedDir + scriptYmlExpectedExt);

          done();
        }
      );
    });

    it('should error if global scripts_dir points to a nonexistent directory', function (done) {
      const {
        scriptExistsBefore,
        scriptYmlExistsBefore
      } = resetScriptsDir({
        script,
        scriptYml
      });

      process.argv.push('-f');
      process.argv.push(`${scriptsDirFrontSrcRel}/${scriptBase}.js`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBackNonex;
      pref.backend.synced_dirs.scripts_ext = '.js';

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlExistsAfter = fs.existsSync(scriptYml);

          expect(scriptExistsBefore).to.be.false;
          expect(scriptYmlExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.false;
          expect(scriptYmlExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('should import ignoring global scripts_ext that mismatches arg extension', function (done) {
      const {
        scriptExistsBefore,
        scriptYmlExistsBefore
      } = resetScriptsDir({
        script,
        scriptYml
      });

      process.argv.push('-f');
      process.argv.push(`${scriptsDirFrontSrcRel}/${scriptBase}.js`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBack;
      pref.backend.synced_dirs.scripts_ext = '.foo';

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlExistsAfter = fs.existsSync(scriptYml);

          expect(scriptExistsBefore).to.be.false;
          expect(scriptYmlExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;
          expect(scriptYmlExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('should error if local scripts_dir points to a nonexistent directory', function (done) {
      const scriptYmlExpectedDir = `'scripts_dir': |2
  ${scriptsDirBackNonex}
`;
      const {
        scriptExistsBefore
      } = resetScriptsDir({
        script
      });

      process.argv.push('-f');
      process.argv.push(`${scriptsDirFrontSrcRel}/${scriptBase}.js`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBack;
      pref.backend.synced_dirs.scripts_ext = '.js';
      fs.writeFileSync(scriptYml, scriptYmlExpectedDir);

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlExistsAfter = fs.existsSync(scriptYml);
          const scriptYmlActual = fs.readFileSync(scriptYml, conf.enc);

          expect(scriptExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.false;
          expect(scriptYmlExistsAfter).to.be.true;
          expect(scriptYmlActual).to.equal(scriptYmlExpectedDir);


          done();
        }
      );
    });

    it('should import ignoring local scripts_ext that mismatches arg extension', function (done) {
      const scriptYmlExpectedExt = `'scripts_ext': |2
  .bar
`;
      const {
        scriptExistsBefore,
        scriptYmlExistsBefore
      } = resetScriptsDir({
        script,
        scriptYml
      });

      process.argv.push('-f');
      process.argv.push(`${scriptsDirFrontSrcRel}/${scriptBase}.js`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBack;
      pref.backend.synced_dirs.scripts_ext = '.js';
      fs.writeFileSync(scriptYml, scriptYmlExpectedExt);

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlExistsAfter = fs.existsSync(scriptYml);
          const scriptYmlActual = fs.readFileSync(scriptYml, conf.enc);

          expect(scriptExistsBefore).to.be.false;
          expect(scriptYmlExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;
          expect(scriptYmlExistsAfter).to.be.true;
          expect(scriptYmlActual).to.equal(scriptYmlExpectedExt);

          done();
        }
      );
    });
  });

  // Test success and error cases. The error cases should pass as tests.
  describe('fp import:script with frontend -f argument and .yml extension', function () {
    it('should import using absolute path argument', function (done) {
      const {
        scriptExistsBefore
      } = resetScriptsDir({
        script
      });

      process.argv.push('-f');
      process.argv.push(`${scriptsDirFrontSrc}/${scriptBase}.yml`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBack;
      pref.backend.synced_dirs.scripts_ext = '.js';
      fs.writeFileSync(scriptYml, '');

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlActual = fs.readFileSync(scriptYml, conf.enc);

          expect(scriptExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;
          expect(scriptYmlActual).to.equal('');

          done();
        }
      );
    });

    it('should error using undefined scripts_dir, and undefined scripts_ext', function (done) {
      const {
        scriptExistsBefore
      } = resetScriptsDir({
        script
      });

      process.argv.push('-f');
      process.argv.push(`${scriptsDirFrontSrcRel}/${scriptBase}.yml`);

      delete pref.backend.synced_dirs.scripts_dir;
      delete pref.backend.synced_dirs.scripts_ext;
      fs.writeFileSync(scriptYml, '');

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);

          expect(pref.backend.synced_dirs.scripts_dir).to.not.exist;
          expect(pref.backend.synced_dirs.scripts_ext).to.not.exist;
          expect(scriptExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('should error using global scripts_dir, and undefined scripts_ext', function (done) {
      const {
        scriptExistsBefore
      } = resetScriptsDir({
        script
      });

      process.argv.push('-f');
      process.argv.push(`${scriptsDirFrontSrcRel}/${scriptBase}.yml`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBack;
      delete pref.backend.synced_dirs.scripts_ext;
      fs.writeFileSync(scriptYml, '');

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);

          expect(pref.backend.synced_dirs.scripts_ext).to.not.exist;
          expect(scriptExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('should error using undefined scripts_dir, and global scripts_ext', function (done) {
      const {
        scriptExistsBefore
      } = resetScriptsDir({
        script
      });

      process.argv.push('-f');
      process.argv.push(`${scriptsDirFrontSrcRel}/${scriptBase}.yml`);

      delete pref.backend.synced_dirs.scripts_dir;
      pref.backend.synced_dirs.scripts_ext = '.js';
      fs.writeFileSync(scriptYml, '');

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);

          expect(pref.backend.synced_dirs.scripts_dir).to.not.exist;
          expect(scriptExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('should import using global scripts_dir, and global scripts_ext', function (done) {
      const {
        scriptExistsBefore
      } = resetScriptsDir({
        script
      });

      process.argv.push('-f');
      process.argv.push(`${scriptsDirFrontSrcRel}/${scriptBase}.yml`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBack;
      pref.backend.synced_dirs.scripts_ext = '.js';
      fs.writeFileSync(scriptYml, '');

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlActual = fs.readFileSync(scriptYml, conf.enc);

          expect(scriptExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;
          expect(scriptYmlActual).to.equal('');

          done();
        }
      );
    });

    it('should error using undefined scripts_dir, and overriding local scripts_ext', function (done) {
      const scriptYmlExpected = 'scripts_ext: .foo';
      const {
        scriptExistsBefore
      } = resetScriptsDir({
        script
      });

      process.argv.push('-f');
      process.argv.push(`${scriptsDirFrontSrcRel}/${scriptBase}.yml`);

      delete pref.backend.synced_dirs.scripts_dir;
      pref.backend.synced_dirs.scripts_ext = '.js';
      fs.writeFileSync(scriptYml, scriptYmlExpected);

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlActual = fs.readFileSync(scriptYml, conf.enc);

          expect(pref.backend.synced_dirs.scripts_dir).to.not.exist;
          expect(scriptExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.false;
          expect(scriptYmlActual).to.equal(scriptYmlExpected);

          done();
        }
      );
    });

    it('should import using overriding local scripts_dir, and global scripts_ext', function (done) {
      const scriptYmlExpectedDir = `'scripts_dir': |2
  ${scriptsDirBack}/scripts_dir-local
`;
      const {
        scriptExistsBefore
      } = resetScriptsDir({
        script
      });

      process.argv.push('-f');
      process.argv.push(`${scriptsDirFrontSrcRel}/${scriptBase}.yml`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBack;
      pref.backend.synced_dirs.scripts_ext = '.js';
      fs.writeFileSync(scriptYml, scriptYmlExpectedDir);

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlActual = fs.readFileSync(scriptYml, conf.enc);

          expect(scriptExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;
          expect(scriptYmlActual).to.equal(scriptYmlExpectedDir);

          done();
        }
      );
    });

    it('should import using global scripts_dir, and overriding local scripts_ext', function (done) {
      const {
        scriptExistsBefore
      } = resetScriptsDir({
        script
      });

      process.argv.push('-f');
      process.argv.push(`${scriptsDirFrontSrcRel}/${scriptBase}.yml`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBack;
      pref.backend.synced_dirs.scripts_ext = '.foo';
      fs.writeFileSync(scriptYml, scriptYmlExpectedExt);

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlActual = fs.readFileSync(scriptYml, conf.enc);

          expect(scriptExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;
          expect(scriptYmlActual).to.equal(scriptYmlExpectedExt);

          done();
        }
      );
    });

    it('should import using overriding local scripts_dir, and overriding local scripts_ext', function (done) {
      const scriptYmlExpectedDir = `'scripts_dir': |2
  ${scriptsDirBack}/scripts_dir-local
`;
      const {
        scriptExistsBefore
      } = resetScriptsDir({
        script
      });

      process.argv.push('-f');
      process.argv.push(`${scriptsDirFrontSrcRel}/${scriptBase}.yml`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBackNonex;
      pref.backend.synced_dirs.scripts_ext = '.foo';
      fs.writeFileSync(scriptYml, scriptYmlExpectedDir + scriptYmlExpectedExt);

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlActual = fs.readFileSync(scriptYml, conf.enc);

          expect(scriptExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.true;
          expect(scriptYmlActual).to.equal(scriptYmlExpectedDir + scriptYmlExpectedExt);

          done();
        }
      );
    });

    it('should error if global scripts_dir points to a nonexistent directory', function (done) {
      const {
        scriptExistsBefore
      } = resetScriptsDir({
        script
      });

      process.argv.push('-f');
      process.argv.push(`${scriptsDirFrontSrcRel}/${scriptBase}.yml`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBackNonex;
      pref.backend.synced_dirs.scripts_ext = '.js';
      fs.writeFileSync(scriptYml, '');

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);

          expect(scriptExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('should error if global scripts_ext mismatches actual extension', function (done) {
      const {
        scriptExistsBefore
      } = resetScriptsDir({
        script
      });

      process.argv.push('-f');
      process.argv.push(`${scriptsDirFrontSrcRel}/${scriptBase}.yml`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBack;
      pref.backend.synced_dirs.scripts_ext = '.bar';
      fs.writeFileSync(scriptYml, '');

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);

          expect(scriptExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('should error if local scripts_dir points to a nonexistent directory', function (done) {
      const scriptYmlExpectedDir = `'scripts_dir': |2
  ${scriptsDirBackNonex}
`;
      const {
        scriptExistsBefore
      } = resetScriptsDir({
        script
      });

      process.argv.push('-f');
      process.argv.push(`${scriptsDirFrontSrcRel}/${scriptBase}.yml`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBack;
      pref.backend.synced_dirs.scripts_ext = '.js';
      fs.writeFileSync(scriptYml, scriptYmlExpectedDir);

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlActual = fs.readFileSync(scriptYml, conf.enc);

          expect(scriptExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.false;
          expect(scriptYmlActual).to.equal(scriptYmlExpectedDir);

          done();
        }
      );
    });

    it('should error if local scripts_ext mismatches actual extension', function (done) {
      const scriptYmlExpectedExt = `'scripts_ext': |2
  .bar
`;
      const {
        scriptExistsBefore
      } = resetScriptsDir({
        script
      });

      process.argv.push('-f');
      process.argv.push(`${scriptsDirFrontSrcRel}/${scriptBase}.yml`);

      pref.backend.synced_dirs.scripts_dir = scriptsDirBack;
      pref.backend.synced_dirs.scripts_ext = '.js';
      fs.writeFileSync(scriptYml, scriptYmlExpectedExt);

      fp.runSequence(
        'import:script',
        () => {
          const scriptExistsAfter = fs.existsSync(script);
          const scriptYmlActual = fs.readFileSync(scriptYml, conf.enc);

          expect(scriptExistsBefore).to.be.false;
          expect(scriptExistsAfter).to.be.false;
          expect(scriptYmlActual).to.equal(scriptYmlExpectedExt);

          done();
        }
      );
    });
  });
});
