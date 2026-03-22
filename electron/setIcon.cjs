const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

exports.default = async function (context) {
  const exePath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.exe`);
  const icoPath = path.join(__dirname, '..', 'build', 'icon.ico');
  const rceditPath = path.join(__dirname, '..', 'node_modules', 'electron-winstaller', 'vendor', 'rcedit.exe');

  if (!fs.existsSync(rceditPath)) {
    console.warn('rcedit not found, skipping icon embedding');
    return;
  }

  // rcedit can't handle non-ASCII filenames, use a temp copy
  const tempExe = path.join(context.appOutDir, '_temp_icon.exe');
  fs.copyFileSync(exePath, tempExe);

  try {
    execFileSync(rceditPath, [tempExe, '--set-icon', icoPath]);
    fs.copyFileSync(tempExe, exePath);
    console.log('  • icon embedded successfully');
  } catch (e) {
    console.warn('  • failed to embed icon:', e.message);
  } finally {
    fs.unlinkSync(tempExe);
  }
};
