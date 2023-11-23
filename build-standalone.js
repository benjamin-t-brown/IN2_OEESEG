// This script is the primary build script for the repo.  It creates a dist folder, copies
// a bunch of stuff into it, minifies the output of the main typescript compilation,
// and minifies the html files+css in the parent folder.

// The output should be a dist folder with the game and all resources inside it
// Other things like iframes and docs are generated elsewhere.

const { exec } = require('child_process');
const fs = require('fs');
const minifyHtml = require('html-minifier').minify;
const path = require('path');

const outputDirName = 'dist';

let config;
try {
  config = JSON.parse(fs.readFileSync(__dirname + '/config.json').toString());
} catch (e) {
  console.log(
    '[WARN] Using config.template.js instead of config.js.  Copy and replace with your configs.'
  );
  config = JSON.parse(
    fs.readFileSync(__dirname + '/config.template.json').toString()
  );
}

let standalone = fs
  .readFileSync(__dirname + '/' + config.standaloneCorePath)
  .toString();
for (let i = 0; i < config.additionalPaths.length; i++) {
  standalone +=
    '\n' +
    fs.readFileSync(__dirname + '/' + config.additionalPaths[i]).toString();
}
standalone += fs.readFileSync(__dirname + '/' + config.mainPath).toString();

const execAsync = async command => {
  return new Promise(resolve => {
    console.log(command);
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error(err, stdout, stderr);
        return;
      }
      resolve(stdout);
    });
  });
};

const build = async () => {
  console.log('Concat files...');

  let htmlFile = fs
    .readFileSync(`${__dirname}/src-js-standalone/index.html`)
    .toString()
    .replace(/<script src="(.*)"><\/script>/g, '');

  const ind = htmlFile.indexOf('// REPLACE_ME');

  htmlFile =
    htmlFile.slice(0, ind - 20) +
    '<script src="main.js"></script>' +
    htmlFile.slice(ind - 20);

  htmlFile = minifyHtml(htmlFile, {
    removeAttributeQuotes: true,
    collapseWhitespace: true,
    html5: true,
    minifyCSS: true,
    minifyJS: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeTagWhitespace: true,
    removeComments: true,
    useShortDoctype: true,
  });

  await execAsync(`rm -rf ${outputDirName}`);
  await execAsync(`mkdir ${outputDirName}`);
  await execAsync(`mkdir ${outputDirName}/assets`);

  fs.writeFileSync(`${__dirname}/${outputDirName}/index.html`, htmlFile);
  fs.writeFileSync(`${__dirname}/${outputDirName}/main.js`, standalone);

  const terserArgs = [
    'passes=3',
    'pure_getters',
    'unsafe',
    'unsafe_math',
    'hoist_funs',
    'toplevel',
    // 'drop_console',
    // 'pure_funcs=[console.info,console.log,console.debug,console.warn]',
    'ecma=9',
  ];
  await execAsync(
    `terser --compress ${terserArgs.join(
      ','
    )} --mangle -o ${__dirname}/${outputDirName}/main.js -- ${__dirname}/${outputDirName}/main.js`
  );

  await execAsync(
    `cp -r src-js-standalone/assets/ ${__dirname}/${outputDirName}/`
  );

  const zipFilePath = path.resolve(`${__dirname}/standalone.zip`);

  console.log('\nZip (command line)...');
  try {
    await execAsync(
      `cd ${outputDirName} && zip -9 ${zipFilePath} index.html *.js assets/img/*.png assets/snd/*.wav assets/font/*.ttf assets/ascii/*.txt`
    );
    console.log(await execAsync(`stat -c '%n %s' ${zipFilePath}`));
  } catch (e) {
    console.log('failed zip', e);
  }

  try {
    const result = await execAsync(`stat -c '%n %s' ${zipFilePath}`);
    const bytes = parseInt(result.split(' ')[1]);
    const kb13 = 13312;
    console.log(
      `${bytes}b of ${kb13}b (${((bytes * 100) / kb13).toFixed(2)}%)`
    );
  } catch (e) {
    console.log('Stat not supported on Mac D:');
  }

  console.log('done');

  // console.log('\nZip (command line)...');
  // await execAsync(
  //   `cd .build && zip -9 ${__dirname}/${outputDirName}.zip main.js`
  // );
  // await execAsync(`mv src.zip dist/main.zip`);
  // try {
  //   const result = await execAsync(`stat -c '%n %s' dist/main.js`);
  //   const resultZip = await execAsync(`stat -c '%n %s' dist/main.zip`);
  //   const bytes = parseInt(result.split(' ')[1]);
  //   const bytesZip = parseInt(resultZip.split(' ')[1]);

  //   console.log('\nmain.js: ' + bytes + 'b | zipped: ' + bytesZip + 'b');
  // } catch (e) {
  //   console.log('Stat not supported on Mac D:');
  // }
};

build();
