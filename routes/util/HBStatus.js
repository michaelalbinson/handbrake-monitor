'use strict';

const HB_QUEUE_STATUS_CONSTANTS = {
	STATUS_QUEUE_COMPLETE: "QueueCore work done",
	STATUS_QUEUE_SCANNED_READY: "ScanCore scan done"
}

const RIP_PROGRESS_CONSTANTS = {
	ENCODE_STARTED: "QueueCore started encoding ",
	ENCODE_ENDED: "QueueCore scan done",
	SCAN_STARTED: 'ScanCore trying to open a physical disc at'
};

const STATUS = {
	SCAN_COMPLETE: 'Scan Complete - Idle',
	QUEUE_COMPLETE: 'Queue Complete - Idle',
	SCANNING: 'Scanning 📀',
	RIPPING: 'Ripping 🍹',
	PEER_UNAVAILABLE: '🚨 Peer Unavailable 🚨'
}

const REVERSE_STATUS_LOOKUP = {};
for (let key in STATUS)
	REVERSE_STATUS_LOOKUP[STATUS[key]] = key;

module.exports = {
	HB_QUEUE_STATUS_CONSTANTS,
	STATUS,
	REVERSE_STATUS_LOOKUP,
	RIP_PROGRESS_CONSTANTS
};
