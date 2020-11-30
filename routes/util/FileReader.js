'use strict';

const path = require('path');
const fs = require('fs');
const readline = require('readline');
const Stream = require('stream');

const { HB_QUEUE_STATUS_CONSTANTS, STATUS, RIP_PROGRESS_CONSTANTS } = require('./HBStatus');
const config = require('../../config/properties.json');


class FileReader {
	/**
	 *
	 * @returns {Promise<{currentEncode: *, status: *}>}
	 */
	static getLastHBStatus() {
		return this.getHBStatusItems().then(status => {
			const statsOut = {
				currentEncode: status.currentEncode
			};

			let sysStatus = STATUS.WORKING;
			if (status.lastLine.includes(HB_QUEUE_STATUS_CONSTANTS.STATUS_QUEUE_SCANNED_READY))
				sysStatus = STATUS.SCAN_COMPLETE
			else if (status.lastLine.includes(HB_QUEUE_STATUS_CONSTANTS.STATUS_QUEUE_COMPLETE))
				sysStatus = STATUS.QUEUE_COMPLETE;

			statsOut.status = sysStatus;
			return statsOut;
		});
	}

	/**
	 *
	 * @returns {Promise<{lastLine: string, currentEncode: string}>}
	 */
	static getHBStatusItems() {
		const hbPath = path.join(config.handbrakePath.replace('~', require('os').homedir()));

		let inStream = fs.createReadStream(hbPath);
		return new Promise((resolve, reject)=> {
			let rl = readline.createInterface(inStream, new Stream());

			let currentEncode = '';
			let lastLine = '';
			rl.on('line', line => {
				lastLine = line;
				const encodeStartedIdx = line.indexOf(RIP_PROGRESS_CONSTANTS.ENCODE_STARTED);
				if (encodeStartedIdx >= 0) {
					currentEncode = line.slice(encodeStartedIdx + RIP_PROGRESS_CONSTANTS.ENCODE_STARTED.length);
					if (currentEncode.endsWith('.m4v') || currentEncode.endsWith('.mp4'))
						currentEncode = currentEncode.replace('.m4v', '').replace('.mp4', '');
				}
			});

			rl.on('error', reject)

			rl.on('close', () => {
				resolve({ lastLine, currentEncode });
			});
		});
	}
}

module.exports = FileReader;
