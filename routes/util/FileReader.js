'use strict';

const path = require('path');
const fs = require('fs');
const readline = require('readline');
const Stream = require('stream');

const { HB_QUEUE_STATUS_CONSTANTS, STATUS, RIP_PROGRESS_CONSTANTS, REVERSE_STATUS_LOOKUP } = require('./HBStatus');
const config = require('../../config/properties.json');


class FileReader {
	/**
	 *
	 * @returns {Promise<{currentEncode: *, startTime: *, endTime: *, status: *}>}
	 */
	static getLastHBStatus() {
		return this.getHBStatusItems().then(status => {
			const statsOut = {
				currentEncode: status.currentEncode,
				startTime: status.startTime,
				endTime: 'In Progress'
			};

			let sysStatus = STATUS.WORKING;
			if (status.lastLine.includes(HB_QUEUE_STATUS_CONSTANTS.STATUS_QUEUE_SCANNED_READY)) {
				sysStatus = STATUS.SCAN_COMPLETE;
				statsOut.startTime = undefined;
				statsOut.endTime = undefined;
			} else if (status.lastLine.includes(HB_QUEUE_STATUS_CONSTANTS.STATUS_QUEUE_COMPLETE)) {
				sysStatus = STATUS.QUEUE_COMPLETE;
				statsOut.endTime = status.lastLine.slice(0, 9);
			}

			statsOut.statusText = sysStatus;
			statsOut.status = REVERSE_STATUS_LOOKUP[sysStatus];
			return statsOut;
		});
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
				lastLine: '',
				currentEncode: '',
				startTime: ''
			};

			rl.on('line', line => {
				stats.lastLine = line;
				const encodeStartedIdx = line.indexOf(RIP_PROGRESS_CONSTANTS.ENCODE_STARTED);
				if (encodeStartedIdx >= 0) {
					stats.startTime = line.slice(1, 9);
					stats.currentEncode = line.slice(encodeStartedIdx + RIP_PROGRESS_CONSTANTS.ENCODE_STARTED.length);
					if (stats.currentEncode.endsWith('.m4v') || stats.currentEncode.endsWith('.mp4'))
						stats.currentEncode = stats.currentEncode.replace('.m4v', '').replace('.mp4', '');
				}
			});

			rl.on('error', reject)

			rl.on('close', () => {
				resolve(stats);
			});
		});
	}
}

module.exports = FileReader;
