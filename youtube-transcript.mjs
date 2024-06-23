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
        logTo 
