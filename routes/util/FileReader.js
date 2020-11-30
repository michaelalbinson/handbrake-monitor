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
	 * @returns {Promise<{currentEncode: string, startTime: string, status: string, statusText: string}>}
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
				if (line.includes(RIP_PROGRESS_CONSTANTS.ENCODE_STARTED)) {
					const encodeStartedIdx = line.indexOf(RIP_PROGRESS_CONSTANTS.ENCODE_STARTED);
					stats.statusText = STATUS.RIPPING;
					stats.endTime = '';
					stats.startTime = line.slice(1, 9);
					stats.currentEncode = line.slice(encodeStartedIdx + RIP_PROGRESS_CONSTANTS.ENCODE_STARTED.length);
					if (stats.currentEncode.endsWith('.m4v') || stats.currentEncode.endsWith('.mp4'))
						stats.currentEncode = stats.currentEncode.replace('.m4v', '').replace('.mp4', '');
				} else if (line.includes(RIP_PROGRESS_CONSTANTS.QUEUE_SCANNED_READY)) {
					stats.statusText = STATUS.SCAN_COMPLETE;
					stats.startTime = '';
					stats.endTime = '';
				} else if (line.includes(RIP_PROGRESS_CONSTANTS.QUEUE_COMPLETE)) {
					stats.statusText = STATUS.QUEUE_COMPLETE;
					stats.endTime = line.slice(1, 9);
				} else if (line.includes(RIP_PROGRESS_CONSTANTS.SCAN_STARTED)) {
					stats.statusText = STATUS.SCANNING;
					stats.startTime = '';
					stats.endTime = '';
				}
			});

			rl.on('error', reject)

			rl.on('close', () => {
				stats.status = REVERSE_STATUS_LOOKUP[stats.statusText];

				resolve(stats);
			});
		});
	}
}

module.exports = FileReader;
