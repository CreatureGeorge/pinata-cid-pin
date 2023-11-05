const fs = require('fs');
const pinataSDK = require('@pinata/sdk');

//add your api and secret api key below for your pinata account
const api_key = ""
const api_secret = ""
//if you get errors and have to retry replace with the error file
const inputFile = 'disco-cids.txt';

const pinata = new pinataSDK({ pinataApiKey: api_key, pinataSecretApiKey: api_secret})

//where your cids are
const fileContents = fs.readFileSync(inputFile, 'utf-8');
const cids = fileContents.split('\n').filter(cid => cid !== '');

console.log('Total CIDs to pin:', cids.length);

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const RATE_LIMIT_PER_MINUTE = 165;
const delayBetweenRequests = 60000 / RATE_LIMIT_PER_MINUTE;

async function pinCIDsSequentially() {
  const errors = [];
  const startTime = Date.now(); // Capture the start time

  for (let index = 0; index < cids.length; index++) {
    const cid = cids[index];
    try {
      await pinata.pinByHash(cid);
    } catch (err) {
      errors.push(cid);
    }

    // Calculate the progress and error count
    const progressPercent = ((index + 1) / cids.length) * 100;
    const errorCount = errors.length;
    const totalCount = index + 1; // Total attempted so far

    // Calculate elapsed time and estimated total time
    const elapsedTime = Date.now() - startTime;
    const estimatedTotalTime = (elapsedTime / (index + 1)) * cids.length;
    const estimatedTimeRemaining = estimatedTotalTime - elapsedTime;

    // Format the estimated time remaining into minutes and seconds
    const estimatedMinutes = Math.floor(estimatedTimeRemaining / 60000);
    const estimatedSeconds = Math.floor((estimatedTimeRemaining % 60000) / 1000);

    // Update the progress log with errors, total count, and estimated time remaining
    process.stdout.write(`Progress: ${progressPercent.toFixed(2)}% - ${errorCount} Errors - ${totalCount}/${cids.length} CIDs processed - Est. Time Remaining: ${estimatedMinutes}m ${estimatedSeconds}s\r`);

    // Wait for the specified delay before continuing
    await delay(delayBetweenRequests);
  }

  // Move to the next line once we're done
  console.log('\nTotal Errored CIDs to retry:', errors.length);

  if (errors.length > 0) {
    fs.writeFileSync('error_cids.txt', errors.join('\n'), 'utf-8');
  }
}

// Call the async function to start the process
pinCIDsSequentially();