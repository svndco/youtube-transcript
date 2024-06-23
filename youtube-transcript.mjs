#!/usr/bin/env node

// Required parameters:
// @raycast.schemaVersion 1
// @raycast.title YouTube Transcript
// @raycast.mode fullOutput

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
  return false;
}

async function getAvailableLanguages(axios, videoId) {
  const listUrl = `https://www.youtube.com/api/timedtext?type=list&v=${videoId}`;
  logToFile(`Fetching available languages from URL: ${listUrl}`);
  try {
    const response = await axios.get(listUrl);
    logToFile(`Language list fetch response status: ${response.status}`);
    logToFile(`Language list fetch response headers: ${JSON.stringify(response.headers)}`);
    logToFile(`Available languages response data:\n${response.data}`);
    return response.data;
  } catch (error) {
    const errorMessage = `Error fetching available languages: ${error.message}`;
    logToFile(errorMessage);
    process.exit(1);
  }
}

async function getTranscript(axios, videoId, language = 'en') {
  const transcriptUrl = `https://www.youtube.com/api/timedtext?lang=${language}&v=${videoId}`;
  logToFile(`Fetching transcript from URL: ${transcriptUrl}`);
  try {
    const response = await axios.get(transcriptUrl);
    logToFile(`Transcript fetch response status: ${response.status}`);
    logToFile(`Transcript fetch response headers: ${JSON.stringify(response.headers)}`);
    logToFile(`Transcript fetch response data:\n${response.data}`);
    const transcriptIsEmpty = !response.data || response.data.trim().length === 0;
    logToFile(`Transcript is empty? ${transcriptIsEmpty}`);
    return response.data || '';
  } catch (error) {
    const errorMessage = `Error fetching transcript: ${error.message}`;
    logToFile(errorMessage);
    process.exit(1);
  }
}

async function fetchAndCopyTranscript(clipboardy, axios, currentUrl, videoId) {
  if (!videoId) {
    const errorMessage = "Provided URL is not a valid YouTube video";
    logToFile(errorMessage);
    return;
  }
  
  let transcript = await getTranscript(axios, videoId);
  if (!transcript || transcript.trim().length === 0) {
    logToFile(`Transcript not found for language 'en'. Checking available languages...`);
    const languages = await getAvailableLanguages(axios, videoId);
    logToFile(`Available languages:\n${languages}`);
    
    // Retry with another language if available
    const parsedLanguages = languages.match(/lang_code="([^"]+)"/g);
    if (parsedLanguages && parsedLanguages.length > 0) {
      const newLanguage = parsedLanguages[0].split('"')[1];
      logToFile(`Retrying with language: ${newLanguage}`);
      transcript = await getTranscript(axios, videoId, newLanguage);
      logToFile(`Transcript retry fetch response length: ${transcript.length} with language '${newLanguage}'`);
    } else {
      logToFile(`No available languages found for video ID: ${videoId}`);
    }
  }

  logToFile(`Final transcript length: ${transcript.length}`);
  if (!transcript || transcript.trim().length === 0) {
    const noTranscriptMessage = `No transcript available for video ID: ${videoId}`;
    logToFile(noTranscriptMessage);
    return;
  }

  const textToCopy = `${currentUrl}\n\n${transcript}`;
  await copyToClipboardInChunks(clipboardy, textToCopy);

  logToFile('Transcript clipped successfully.');
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
  await fetchAndCopyTranscript(clipboardy, axios, currentUrl, videoId);
})();
