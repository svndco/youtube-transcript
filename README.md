# YouTube Transcript Scraper

[![YouTube Transcript](https://img.shields.io/badge/YouTube-Transcript-blue)](https://github.com/svndco/youtube-transcript)

This script fetches the transcript of a YouTube video from the active tab in the Arc browser and copies it to the clipboard. The script logs all actions to a file, handling various scenarios like non-YouTube URLs and unavailable transcripts.

## Features

-   Fetch transcript of the currently active YouTube video in Arc Browser.
-   Retry fetching transcripts with available languages if the default language fails.
-   Log actions and errors to `youtube-transcript.log`.
-   Handle invalid URLs by logging and displaying relevant messages.

## Requirements

-   Node.js
-   Arc Browser

## Installation

1. **Clone the Repository**:
    ```sh
    git clone https://github.com/svndco/youtube-transcript.git
    cd youtube-transcript
    ```

2. **Install Dependencies**:
    Ensure dependencies are installed.
    ```sh
    npm install clipboardy axios fs-extra
    ```

3. **Make the Script Executable**:
    Make sure the script is executable.
    ```sh
    chmod +x youtube-transcript.mjs
    ```

## Usage

### From the Terminal

1. **Navigate to the Script Directory**:
    ```sh
    cd /path/to/youtube-transcript/
    ```

2. **Run the Script**:
    ```sh
    node youtube-transcript.mjs
    ```

### From Raycast

1. **Open Raycast**:
    Launch the Raycast app.

2. **Add Script Command**:
    - Go to Extensions
    - Click on Script Commands
    - Create a new script command with the following settings:
        - **Name**: YouTube Transcript
        - **Description**: Fetch transcript for the current YouTube URL in the active tab and copy it to the clipboard.
        - **Script Path**: `/path/to/youtube-transcript.mjs`
        - **Output**: Full Output

3. **Run the Script** in Raycast:
    - Use the Raycast shortcut to open the command palette.
    - Type `YouTube Transcript` and run the script.

## Log File

The script logs output to `youtube-transcript.log` in the script's directory. To review the logs, use the following command:

```sh
cat /path/to/youtube-transcript/youtube-transcript.log
