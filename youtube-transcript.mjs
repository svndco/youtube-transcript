#!/usr/bin/env node

// Required parameters:
// @raycast.schemaVersion 1
// @raycast.title YouTube Transcript
// @raycast.mode silent

// Optional parameters:
// @raycast.icon 🤖

// Documentation:
// @raycast.description Scrape the current URL for the YouTube Transcript.
// @raycast.author jeremyallen
// @raycast.authorURL https://raycast.com/jeremyallen

import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

const logFilePath = path.join(process.cwd(), 'youtube-transcript.log');

async function dynamicImports() {
  const { default: clipboardy } = await import('clipboardy');
  const { default: axios } = await import('axios');
  return { clipboardy, axios };
}

function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}\n`;
  fs.appendFileSync(logFilePath, logMessage);
  console.log(message);
}

function getActiveTabUrl() {
  const script = `
    tell application "Arc"
      set activeTabUrl to URL of active tab of front window
    end tell
    return activeTabUrl
  `;
  try {
    const result = execSync(`osascript -e '${script}'`).toString().trim();
    return result;
  } catch (error) {
    const errorMessage = `Error retrieving active tab URL: ${error.message}`;
    logToFile(errorMessage);
    process.exit(1);
  }
}

function extractVideoId(url) {
  const patterns = [
    /youtu\.be\/([^\?\/]+)/,
    /youtube\.com\/.*v=([^\&\?\"]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  const errorMessage = "Invalid YouTube URL";
  logToFile(errorMessage);
  process.exit(1);
}

async function getTranscript(axios, videoId, language = 'en') {
  const transcriptUrl = `https://www.youtube.com/api/timedtext?lang=${language}&v=${videoId}`;
  logToFile(`Fetching transcript from URL: ${transcriptUrl}`);
  try {
    const response = await axios.get(transcriptUrl);
    logToFile(`Transcript fetch response status: ${response.status}`);
    logToFile(`Transcript fetch response headers: ${JSON.stringify(response.headers)}`);
    logToFile(`Transcript fetch response data: ${response.data}`);
    return response.data || '';
  } catch (error) {
    const errorMessage = `Error fetching transcript: ${error.message}`;
    logToFile(errorMessage);
    process.exit(1);
  }
}

async function copyToClipboardInChunks(clipboardy, text) {
  const maxChunkSize = 1000;
  const chunks = [];

  for (let i = 0; i < text.length; i += maxChunkSize) {
    chunks.push(text.slice(i, i + maxChunkSize));
  }

  for (const chunk of chunks) {
    await clipboardy.write(chunk);
    logToFile(`Copied chunk of length ${chunk.length} to clipboard.`);
  }
}

(async () => {
  const currentUrl = getActiveTabUrl();
  logToFile(`Current URL: ${currentUrl}`);

  const videoId = extractVideoId(currentUrl);
  logToFile(`Video ID: ${videoId}`);

  const { clipboardy, axios } = await dynamicImports();
  const transcript = await getTranscript(axios, videoId);
  logToFile(`Transcript length: ${transcript.length}`);

  const textToCopy = `${currentUrl}\n\n${transcript}`;
  await copyToClipboardInChunks(clipboardy, textToCopy);

  logToFile('Transcript clipped successfully.');
})();
