'use strict';

const path = require('path');
const fs = require('fs');
const readline = require('readline');
const Stream = require('stream');

const { STATUS, RIP_PROGRESS_CONSTANTS, REVERSE_STATUS_LOOKUP, RIP_REGEXPS } = require('./HBStatus');
const config = require('../../config/properties.json');


class FileReader {
	constructor(fileRedirect, mockedTime) {
		this.testSeam_fileRedirect = fileRedirect;
		this.testSeam_currentTime = mockedTime;
	}

	/**
	 *
	 * @returns {Promise<{currentEncode: string, startTime: string, status: string, statusText: string}>}
	 */
	getHBStatusItems() {
		let hbPath = path.join(config.handbrakePath.replace('~', require('os').homedir()));
		if (this.testSeam_fileRedirect)
			hbPath = this.testSeam_fileRedirect;

		let inStream = fs.createReadStream(hbPath);
		return new Promise((resolve, reject)=> {
			let rl = readline.createInterface(inStream, new Stream());

			this.status = {};
			this.clearStats();

			rl.on('line', line => {
				this.addLineIfIsIndicator(line);
				this.resolveStatus(line);
			});

			rl.on('error', reject)

			rl.on('close', () => {
				this.status.status = REVERSE_STATUS_LOOKUP[this.status.statusText];
				this.status.eta = this.calcEta();
				resolve(this.status);
			});
		});
	}

	clearStats() {
		this.status.currentEncode = '';
		this.status.startTime = '';
		this.status.endTime = '';
		this.status.statusText = STATUS.QUEUE_COMPLETE;
		this.status.numChapters = -1
		this.status.etaEstimators = [];
		this.status.eta = '';
	}

	addLineIfIsIndicator(line) {
		if (line.match(RIP_REGEXPS.TITLE_NUMBER))
			this.status.numChapters = Number(line.slice(-2).trim());
		else if (line.match(RIP_REGEXPS.CHAPTER_PROGRESS))
			this.status.etaEstimators.push(line);
	}

	resolveStatus(line) {
		// by default, the status is the same as it was on the last line
		let lineStatus = this.status.statusText;
		if (line.includes(RIP_PROGRESS_CONSTANTS.ENCODE_STARTED))
			lineStatus = STATUS.RIPPING;
		else if (line.includes(RIP_PROGRESS_CONSTANTS.SCAN_STARTED))
			lineStatus = STATUS.SCANNING;
		else if (line.includes(RIP_PROGRESS_CONSTANTS.QUEUE_SCANNED_READY))
			lineStatus = STATUS.SCAN_COMPLETE;
		else if (line.includes(RIP_PROGRESS_CONSTANTS.SUB_SCAN_STARTED))
			lineStatus = STATUS.RIPPING_SUB_SCAN
		else if (line.includes(RIP_PROGRESS_CONSTANTS.ENCODING_PASS_STARTED))
			lineStatus = STATUS.RIPPING_ENCODING;
		else if (line.includes(RIP_PROGRESS_CONSTANTS.QUEUE_COMPLETE))
			lineStatus = STATUS.QUEUE_COMPLETE;

		switch (lineStatus) {
			case STATUS.SCANNING:
			case STATUS.SCAN_COMPLETE:
				this.clearStats();
				break;
			case STATUS.RIPPING:
				// bail if this isn't the line that switched us to RIPPING
				if (!line.includes(RIP_PROGRESS_CONSTANTS.ENCODE_STARTED))
					break;

				const encodeStartedIdx = line.indexOf(RIP_PROGRESS_CONSTANTS.ENCODE_STARTED);
				this.clearStats();
				this.status.startTime = line.slice(1, 9);
				let currentEncode = line.slice(encodeStartedIdx + RIP_PROGRESS_CONSTANTS.ENCODE_STARTED.length);
				if (currentEncode.endsWith('.m4v') || currentEncode.endsWith('.mp4'))
					currentEncode = currentEncode.replace('.m4v', '').replace('.mp4', '');

				this.status.currentEncode = currentEncode;
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

	calcEta() {
		const status = this.status.statusText
		if (status === STATUS.QUEUE_COMPLETE)
			return '00:00:00';

		if (status !== STATUS.RIPPING_ENCODING && status !== STATUS.RIPPING_SUB_SCAN)
			return '';

		const numEstimators = this.status.etaEstimators.length;
		const numRemainingChapters = this.status.numChapters - numEstimators;
		if (this.status.etaEstimators.length < 2)
			return '~';

		const etaDates = this.status.etaEstimators.map(est => {
			const parts = est.slice(1, 9).split(':');
			const d = new Date();
			d.setHours(parts[0]);
			d.setMinutes(parts[1]);
			d.setSeconds(parts[2]);
			return d;
		});

		// calculate the difference between each successful rip notification
		const dateDiffs = [];
		for (let i = 1; i < etaDates.length; i++)
			dateDiffs.push(etaDates[i] - etaDates[i - 1]);

		// just in case, likely not used anymore
		if (dateDiffs.length === 0)
			return '00:00:00';

		// sum and average
		let sum = 0;
		for (let i = 0; i < dateDiffs.length; i++)
			sum += dateDiffs[i];

		let currentDate = new Date();
		if (this.testSeam_currentTime)
			currentDate = new Date(this.testSeam_currentTime);

		// take the average of all the chapter rip times, multiply it
		const avg = (sum / dateDiffs.length);
		const secondsSinceCheckin = (currentDate - etaDates[etaDates.length - 1]);
		const timeInSecs = ((avg * numRemainingChapters) - secondsSinceCheckin) / 1000;

		// break the number of seconds back out into hours:minutes:seconds
		const hours = Math.floor(timeInSecs / 3600)
		const minutes = Math.floor((timeInSecs - (hours * 3600)) / 60);
		const seconds = Math.floor((timeInSecs - (hours * 3600) - (minutes * 60)));

		return `${this.padWithZeros(hours)}:${this.padWithZeros(minutes)}:${this.padWithZeros(seconds)}`;
	}

	padWithZeros(num) {
		if (num < 10)
			return '0' + num;

		return String(num);
	}
}

module.exports = FileReader;
