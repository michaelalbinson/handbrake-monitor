'use strict';

const path = require('path');
const fs = require('fs');
const readline = require('readline');
const Stream = require('stream');

const { STATUS, RIP_PROGRESS_CONSTANTS, REVERSE_STATUS_LOOKUP } = require('./HBStatus');
const config = require('../../config/properties.json');


class FileReader {
	/**
	 *
	 * @returns {Promise<{currentEncode: *, startTime: *, endTime: *, status: *, statusText: *}>}
	 */
	static getLastHBStatus() {
		return this.getHBStatusItems();
	}

	/**
	 *
	 * @returns {Promise<{lastLine: string, currentEncode: string, startTime: string}>}
	 */
	static getHBStatusItems() {
		const hbPath = path.join(config.handbrakePath.replace('~', require('os').homedir()));

		let inStream = fs.createReadStream(hbPath);
		return new Promise((resolve, reject)=> {
			let rl = readline.createInterface(inStream, new Stream());

			const stats = {
				currentEncode: '',
				startTime: '',
				endTime: '',
				statusText: STATUS.QUEUE_COMPLETE
			};

			rl.on('line', line => {
				const encodeStartedIdx = line.indexOf(RIP_PROGRESS_CONSTANTS.ENCODE_STARTED);
				if (encodeStartedIdx >= 0) {
					stats.statusText = STATUS.RIPPING;
					stats.endTime = undefined;
					stats.startTime = line.slice(1, 9);
					stats.currentEncode = line.slice(encodeStartedIdx + RIP_PROGRESS_CONSTANTS.ENCODE_STARTED.length);
					if (stats.currentEncode.endsWith('.m4v') || stats.currentEncode.endsWith('.mp4'))
						stats.currentEncode = stats.currentEncode.replace('.m4v', '').replace('.mp4', '');
				}

				if (line.includes(RIP_PROGRESS_CONSTANTS.QUEUE_SCANNED_READY))
					stats.status = STATUS.SCAN_COMPLETE;

				if (line.includes(RIP_PROGRESS_CONSTANTS.QUEUE_COMPLETE)) {
					stats.status = STATUS.QUEUE_COMPLETE;
					stats.endTime = line.slice(1, 9);
				}

				if (line.includes(RIP_PROGRESS_CONSTANTS.SCAN_STARTED))
					stats.status = STATUS.SCANNING;
			});

			rl.on('error', reject)

			rl.on('close', () => {
				stats.status = REVERSE_STATUS_LOOKUP[stats.statusText];

				if (stats.status === STATUS.SCAN_COMPLETE) {
					stats.startTime = undefined;
					stats.endTime = undefined;
				}

				resolve(stats);
			});
		});
	}
}

module.exports = FileReader;
