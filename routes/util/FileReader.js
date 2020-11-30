'use strict';

const path = require('path');
const fs = require('fs');
const readline = require('readline');

const { HBQueueStatus, STATUS} = require('./HBStatus');
const config = require('../../config/properties.json');


class FileReader {
	static getLastHBStatus() {
		return this.readLastHBStatus().then(line => {
			if (line.includes(HBQueueStatus.STATUS_QUEUE_SCANNED_READY))
				return STATUS.SCAN_COMPLETE
			else if (line.includes(HBQueueStatus.STATUS_QUEUE_COMPLETE))
				return STATUS.QUEUE_COMPLETE;
			else
				return STATUS.WORKING;
		});
	}

	static readLastHBStatus() {
		const hbPath = path.join(config.handbrakePath.replace('~', require('os').homedir()));
		return this.readLastLine(hbPath);
	}

	static readLastLine(filePath) {
		let inStream = fs.createReadStream(filePath);
		return new Promise((resolve, reject)=> {
			let rl = readline.createInterface(inStream, process.stdout);

			let lastLine = '';
			rl.on('line', line => {
				lastLine = line;
			});

			rl.on('error', reject)

			rl.on('close', () => {
				resolve(lastLine)
			});
		});
	}
}

module.exports = FileReader;
