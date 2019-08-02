/**
 * 编译项目
 */
const process = require('child_process');

const rollup = require('rollup');
const rollupTypescript = require('rollup-plugin-typescript');
const uglify = require('rollup-plugin-uglify');

let version = require('./package.json').version;
let banner =
`/**
 * DYMEditor
 *
 * @version ${version}
 */`;

async function build() {
    // main
    const bundle = await rollup.rollup({
        input: './src/index.ts',
        plugins: [
            rollupTypescript()
            ,uglify.uglify()
        ]
    });
    
    await bundle.write({
        banner: banner,
        format: 'umd',
        name: 'XEditor',
        file: './dist/editor.js'
        
    }).then(() => {
        cp();
    });
}

function cp() {
    process.exec('cp -rf ./src/editor.css ./src/fileupload.js ./src/icons/ ./dist/');
}

// run
build();
