const { loadAndSetUserConfigurations, config } = require('./config');
const { processVocabulary } = require('./vocabulary');
const { generateCases, generateEvents, generateEventsThreaded} = require('./data');
const { saveToCSV, saveToSQL, saveSqlSchema } = require('./output');
const { generateSchemaSql } = require('./sql_generator');
const util = require('./util');
const pluralize = require('pluralize');

async function main() {
  loadAndSetUserConfigurations();
  const vocabulary = processVocabulary();

  const cases = generateCases(config.NUMBER_OF_CASES);
  const events = await generateEventsThreaded(cases);
  if (config.SHOW_PROGRESS) {
    console.log('Writing data to files.');
  }
  if (config.OUTPUT_FORMAT === 'csv') {
    saveToCSV(`out/${fileNameForCases()}.csv`, cases);
    saveToCSV(`out/${fileNameForEvents(events.length)}.csv`, events);
  } else if (config.OUTPUT_FORMAT === 'sql') {
    let schema = generateSchemaSql(vocabulary.schema);
    saveSqlSchema('out/schema.sql', schema);
    
    saveToSQL(`out/${fileNameForCases()}.sql`, cases, 'TICKETS');
  } else {
    throw new Error(
      `Invalid format: "${config.OUTPUT_FORMAT}". To see a list of valid formats, please rerun with the -help option`
    );
  }
  if (config.SHOW_PROGRESS) {
    console.log('Done!');
  }
}

function fileNameForCases() {
  const prefix = pluralize.plural(config.FILE_NAME_PREFIX);
  return `${prefix}-${util.formatNumber(config.NUMBER_OF_CASES)}`
}

function fileNameForEvents(numOfEvents) {
  const prefix = pluralize.singular(config.FILE_NAME_PREFIX);
  return `${prefix}Events-${util.formatNumber(numOfEvents)}`
}

main().catch((error) => console.error(error));
