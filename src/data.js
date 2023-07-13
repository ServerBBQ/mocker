const { faker } = require("@faker-js/faker");
const moment = require("moment");
const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");
const os = require("os");
const { getRandomString, getVocabulary, processVocabulary } = require("./vocabulary");
const { config } = require("./config");
const { showProgress } = require("./progress");
const { sleep, splitArrayIntoPieces } = require("./util")




function generateCases(numCases) {
  const cases = [];
  let vocabulary = getVocabulary();

  for (let i = 1; i <= numCases; i++) {
    const caseRecord = {};

    vocabulary.schema.cases.columns.forEach((field) => {
      if (field.primary_key) {
        caseRecord._id = i;
        caseRecord[field.display_name] = i;
      } else {
        caseRecord[field.display_name] = getRandomString(field.name);
      }
    });

    cases.push(caseRecord);
    if (config.SHOW_PROGRESS && i % config.PROGRESS_INTERVAL == 0) {
      showProgress((i / numCases) * 100, (text = "Generating cases"));
    }
  }

  if (config.SHOW_PROGRESS) {
    showProgress(100, (text = "Generating cases"));
    process.stdout.write("\n");
  }
  return cases;
}

function generateEvents(cases) {
  const initialEvent = getVocabulary().initialEvent;
  const finalEvent = getVocabulary().finalEvent;
  const transitions = [];
  const numCases = cases.length;

  let caseNumber = 0,
    eventId = 1;
  for (const caseRecord of cases) {
    const numTransitions = faker.number.int({
      min: config.MIN_EVENTS,
      max: config.MAX_EVENTS,
    });
    caseNumber++;

    const vocabulary = getVocabulary();
    const startDate = faker.date.past({ years: config.TIMEFRAME_IN_YEARS });
    let currentDate = moment(startDate);

    let eventName,
      previousEvent;

    for (let i = 0; i < numTransitions; i++) {
      const event = {};
      if (i === 0) {
        eventName = initialEvent;
      } else if (i === numTransitions - 1) {
        eventName = finalEvent;
      } else {
        eventName = getRandomString(previousEvent);
      }

      previousEvent = eventName;
      
      vocabulary.schema.events.columns.forEach((field) => {
        if (field.primary_key) {
          event[field.display_name] = event._id = eventId++;
        } else if (field.foreign_key) {
          event[field.display_name] = caseRecord._id;
        } else if (field.event_action) {
          event[field.display_name] = eventName;
        } else if (field.event_date) {
          event[field.display_name] = currentDate.format(
            "YYYY-MM-DD HH:mm:ss.SSS"
          );
        } else {
          event[field.display_name] = getRandomString(field.name);
        }
      });

      transitions.push(event);

      if (eventName === finalEvent) break;

      currentDate.add({
        days: faker.number.int({
          min: config.MIN_DAYS_BETWEEN_EVENTS,
          max: config.MAX_DAYS_BETWEEN_EVENTS,
        }),
        hours: faker.number.int({
          min: config.MIN_HOURS_BETWEEN_EVENTS,
          max: config.MAX_HOURS_BETWEEN_EVENTS,
        }),
        minutes: faker.number.int({
          min: config.MIN_MINUTES_BETWEEN_EVENTS,
          max: config.MAX_MINUTES_BETWEEN_EVENTS,
        }),
      });
    }
    if (config.SHOW_PROGRESS && caseNumber % config.PROGRESS_INTERVAL == 0 && isMainThread) {
      showProgress(
        (caseNumber / numCases) * 100,
        (text = "Generating transitions")
      );
    }
  }
  if (config.SHOW_PROGRESS && isMainThread) {
    showProgress(1 * 100, (text = "Generating transitions"));
    process.stdout.write("\n");
  }
  return transitions;
}

async function generateEventsThreaded(cases) {
  const threads = os.cpus().length;
  let splitCases = splitArrayIntoPieces(cases, threads);
  let workers = [];
  let data = [];
  let workersFinished = 0;
  
  for (let i = 0; i < threads; i++) {
    const worker = new Worker(__filename, {
      workerData: {
	      function: "generateEvents",
	      cases: splitCases[i]
      }
    })
    
    worker.on("message", msg => data.push(msg));
    worker.on("error", err => console.error(err));
    worker.on("exit", code => {
      console.log(`Worker exited with code ${code}.`);
      workersFinished++;
    });
    
    workers.push(worker);
  }
  
  while (workersFinished != threads) {
    await sleep(1000);
  }
  return data;
}

if (!isMainThread) {
 const functionName = workerData.function;
 switch (functionName) {
   case 'generateEvents':
     const vocabulary = processVocabulary();
     cases = workerData.cases;
     events = generateEvents(cases);
     parentPort.postMessage(events);
     break;
 }  
}


module.exports = { generateCases, generateEvents, generateEventsThreaded };
