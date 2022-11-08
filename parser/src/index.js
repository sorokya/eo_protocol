const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const lexer = require('./lexer');
const parser = require('./parser');
const strip = require('./strip');

function parseInput(text) {
    const lexingResult = lexer.lex(text);
    parser.input = lexingResult.tokens;
    const cst = parser.protocol();

    if (parser.errors.length > 0) {
      throw new Error(parser.errors);
  }

    return strip(cst);
}

yargs(hideBin(process.argv))
  .command('export [language]', 'parses the protocol files and exports code', (yargs) => {
    return yargs
      .positional('language', {
        describe: 'language to export (currently only "rust" is supported)',
        default: 'rust'
      })
  }, (argv) => {
    const {language, directory} = argv;
    const protocolSource = fs.readFileSync(path.join(directory, '/eo.txt'), {
        encoding: 'utf8'
    });

    const cst = parseInput(protocolSource);

    // TODO: export to language
  })
  .option('directory', {
    alias: 'd',
    type: 'string',
    description: 'directory to parse protocol files from',
    default: path.join(__dirname, '../..')
  })
  .parse();




