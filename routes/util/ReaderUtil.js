'use strict';

const {RIP_PROGRESS_CONSTANTS, STATUS} = require("./HBStatus");

class ReaderUtil {
    /**
     * Add leading zeros to a number if it is less than 10, otherwise, convert the number to a string and return it
     * @param num {number} the number to potentially pad
     * @returns {string} the padded, stringified number
     */
    static padWithZeros(num) {
        // allow negatives to pass through, although we shouldn't see any!
        if (num < 10 && num >= 0)
            return '0' + num;

        return String(num);
    }

    /**
     *
     * @param line {string}
     * @param keyPhrases {string|string[]}
     * @returns {boolean|*}
     */
    static lineContains(line, keyPhrases) {
        if (typeof keyPhrases === 'string')
            return line.includes(keyPhrases)

        // otherwise, it's an array of key phrases
        for (let phrase of keyPhrases) {
            if (line.includes(phrase))
                return true;
        }

        return false;
    }

    /**
     *
     * @param line {string}
     * @returns {string}
     */
    static getEncodeName(line) {
        for (let phrase of RIP_PROGRESS_CONSTANTS.ENCODE_STARTED) {
            if (!line.includes(phrase))
                continue;

            const encodeStartedIdx = line.indexOf(phrase);
            let currentEncode = line.slice(encodeStartedIdx + phrase.length);
            if (currentEncode.endsWith('.m4v') || currentEncode.endsWith('.mp4'))
                currentEncode = currentEncode.replace('.m4v', '').replace('.mp4', '');

            return currentEncode;
        }

        return 'ERROR';
    }

    static lineToStatus(line, defaultStatus) {
        if (ReaderUtil.lineContains(line, RIP_PROGRESS_CONSTANTS.ENCODE_STARTED))
            return STATUS.RIPPING;
        else if (ReaderUtil.lineContains(line, RIP_PROGRESS_CONSTANTS.SCAN_STARTED))
            return STATUS.SCANNING;
        else if (ReaderUtil.lineContains(line, RIP_PROGRESS_CONSTANTS.QUEUE_SCANNED_READY))
            return STATUS.SCAN_COMPLETE;
        else if (ReaderUtil.lineContains(line, RIP_PROGRESS_CONSTANTS.SUB_SCAN_STARTED))
            return STATUS.RIPPING_SUB_SCAN
        else if (ReaderUtil.lineContains(line, RIP_PROGRESS_CONSTANTS.ENCODING_PASS_STARTED))
            return STATUS.RIPPING_ENCODING;
        else if (ReaderUtil.lineContains(line, RIP_PROGRESS_CONSTANTS.QUEUE_COMPLETE))
            return STATUS.QUEUE_COMPLETE;

        return defaultStatus;
    }

    static getDateFromTime(stringTime) {
        const parts = stringTime.split(':');
        const d = new Date();
        d.setHours(parts[0]);
        d.setMinutes(parts[1]);
        d.setSeconds(parts[2]);
        return d;
    }

    static secondsToFormattedTime(timeInSeconds) {
        if (timeInSeconds < 0)
            return "Almost done...";

        // break the number of seconds back out into hours:minutes:seconds and return it
        const hours = Math.floor(timeInSeconds / 3600)
        const minutes = Math.floor((timeInSeconds - (hours * 3600)) / 60);
        const seconds = Math.floor((timeInSeconds - (hours * 3600) - (minutes * 60)));
        return `${ReaderUtil.padWithZeros(hours)}:${ReaderUtil.padWithZeros(minutes)}:${ReaderUtil.padWithZeros(seconds)}`;
    }
}

module.exports = ReaderUtil;