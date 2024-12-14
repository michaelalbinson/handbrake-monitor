'use strict';

const path = require('path');
const fs = require('fs');
const readline = require('readline');
const Stream = require('stream');

const { STATUS, RIP_PROGRESS_CONSTANTS, REVERSE_STATUS_LOOKUP, RIP_REGEXPS_V2} = require('./HBStatus');
const ReaderUtil = require('./ReaderUtil');
const config = require('../../config/properties.json');

/**
 * Supersedes FileReader to use a frame-based time estimate instead of a
 */
class LogReaderV2 {
    /**
     * Constructor for accepting test seam arguments for test contexts
     * @param fileRedirect {string=}
     * @param mockedTime {Date=}
     */
    constructor(fileRedirect, mockedTime) {
        this.testSeam_fileRedirect = fileRedirect;
        this.testSeam_currentTime = mockedTime;
    }

    /**
     * Get an enumeration of the current HandBrake status based on the recent activity in the log file.
     *
     * We sequentially review the whole activity log, so it can be useful to periodically clear out the log file
     * to reduce computation time (but it's generally pretty quick!).
     *
     * @returns {Promise<{currentEncode: string, startTime: string, endTime: string, status: string, statusText: string, eta: string}>}
     */
    getHBStatusItems() {
        let hbPath = path.join(config.handbrakePath.replace('~', require('os').homedir()));
        if (this.testSeam_fileRedirect)
            hbPath = this.testSeam_fileRedirect;

        let inStream = fs.createReadStream(hbPath);
        return new Promise((resolve, reject) => {
            let rl = readline.createInterface(inStream, new Stream());

            this.clearStats();

            rl.on('line', line => {
                this.addLineIfIsIndicator(line);
                this.resolveStatus(line);
            });

            rl.on('error', reject);

            rl.on('close', () => {
                this.status.status = REVERSE_STATUS_LOOKUP[this.status.statusText];
                this.status.eta = this.calcEta();
                resolve(this.status);
            });
        });
    }

    /**
     * Reset all the status items to their default state
     */
    clearStats() {
        this.status = {
            currentEncode: '',
            startTime: '',
            endTime: '',
            statusText: STATUS.QUEUE_COMPLETE,
            totalFrames: -1,
            etaEstimators: [],
            eta: ''
        };
    }

    /**
     * Check if the current line matches a regular expression that yields:
     * 1. The number of chapters in the current encode
     * 2. The line contains a chapter scan completion message
     *
     * Both are used for estimating the time remaining in the encode phase of the rip.
     *
     * @param line {string} a log line from the
     */
    addLineIfIsIndicator(line) {
        if (line.match(RIP_REGEXPS_V2.EXPECTED_FRAME_COUNT))
            this.status.totalFrames = Number(line.match(/\d+ video/)[0].slice(0, -6).trim()); // take the last two characters, which always contains the number of chapters in an encode
        else if (line.match(RIP_REGEXPS_V2.CHAPTER_PROGRESS))
            this.status.etaEstimators.push(line); // just save the whole line, we'll parse out the times out later
    }

    /**
     * Resolve the status of the current rip based on the content in the line passed in
     * @param line
     */
    resolveStatus(line) {
        // by default, the status is the same as it was on the last line
        let lineStatus = ReaderUtil.lineToStatus(line, this.status.statusText);

        switch (lineStatus) {
            case STATUS.SCANNING:
            case STATUS.SCAN_COMPLETE:
                this.clearStats();
                break;
            case STATUS.RIPPING:
                // bail if this isn't the line that switched us to RIPPING
                if (!ReaderUtil.lineContains(line, RIP_PROGRESS_CONSTANTS.ENCODE_STARTED))
                    break;

                this.clearStats();
                this.status.startTime = line.slice(1, 9);
                this.status.currentEncode = ReaderUtil.getEncodeName(line);
                break;
            case STATUS.RIPPING_SUB_SCAN:
            case STATUS.RIPPING_ENCODING:
                this.status.eta = "~";
                break;
            case STATUS.QUEUE_COMPLETE:
                this.status.endTime = line.slice(1, 9);
                break;
        }

        // no matter what, set the status text string
        this.status.statusText = lineStatus;
    }

    /**
     * Calculate the ETA for the current rip -- this seems to be a much closer estimate to the one that HandBrake
     * shows in the UI.
     * @returns {string} The string representing the time remaining in a rip
     */
    calcEta() {
        const status = this.status.statusText
        if (status === STATUS.QUEUE_COMPLETE)
            return '00:00:00';

        if (status !== STATUS.RIPPING_ENCODING && status !== STATUS.RIPPING_SUB_SCAN)
            return '';

        if (this.status.etaEstimators.length < 2)
            return '~';

        const getFrameCount = line => Number(line.match(/frame \d+/)[0].slice(6)); // slice off the word "frame "

        // v2 algorithm:
        // ((runtime / frames so far) * frames left to rip) - time since last checkpoint

        // get the time and framecount for the first and last estimators (chapters)
        // the frame count for the first chapter is always 1, so no need to parse it out
        const firstEstimator = this.status.etaEstimators[0];
        const firstUpdateChapterTime = ReaderUtil.getDateFromTime(firstEstimator.slice(1, 9));

        const lastEstimator = this.status.etaEstimators[this.status.etaEstimators.length - 1];
        const lastUpdateChapterTime = ReaderUtil.getDateFromTime(lastEstimator.slice(1, 9));
        const lastUpdateFrameCount = getFrameCount(lastEstimator);

        // do the math

        // runtime (ms) / frames ripped so far
        const timePerFrame = (lastUpdateChapterTime - firstUpdateChapterTime) / lastUpdateFrameCount;

        const remainingFrames = this.status.totalFrames - lastUpdateFrameCount;

        let currentDate = new Date();
        if (this.testSeam_currentTime)
            currentDate = new Date(this.testSeam_currentTime);

        const msSinceCheckin = (currentDate - lastUpdateChapterTime);
        const timeInSecs = ((timePerFrame * remainingFrames) - msSinceCheckin) / 1000;
        return ReaderUtil.secondsToFormattedTime(timeInSecs);
    }
}

module.exports = LogReaderV2;
