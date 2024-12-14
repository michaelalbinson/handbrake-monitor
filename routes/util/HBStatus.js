'use strict';


// constants used to grep out the current state of HandBrake
const RIP_PROGRESS_CONSTANTS = {
	ENCODE_STARTED: [
		'QueueCore started encoding ',
		'fr.handbrake.HandBrakeXPCService started encoding ',
	],
	ENCODE_ENDED: [
		'QueueCore scan done',
		'fr.handbrake.HandBrakeXPCService scan done',
	],
	SCAN_STARTED:          'ScanCore trying to open a physical disc at',
	QUEUE_SCANNED_READY:   'ScanCore scan done',
	ENCODING_PASS_STARTED: 'Starting Task: Encoding Pass',
	SUB_SCAN_STARTED:      'Starting Task: Subtitle Scan',
	QUEUE_COMPLETE: [
		'QueueCore work done',
		'fr.handbrake.HandBrakeXPCService work done'
	]
};

const RIP_REGEXPS = {
	CHAPTER_PROGRESS: /sync: "Chapter .* at frame/i,
	TITLE_NUMBER:     /title \d{1,2}, chapter\(s\) 1 to \d{1,2}/i
};

const RIP_REGEXPS_V2 = {
	EXPECTED_FRAME_COUNT: /sync: expecting \d+ video frames/i,
	CHAPTER_PROGRESS: /sync: "Chapter .* at frame \d+/i,
};

// status types and human-readable text representations
const STATUS = {
	QUEUE_COMPLETE:   'Queue Complete - Idle',
	SCAN_COMPLETE:    'Scan Complete - Idle',
	SCANNING:         '📀 Scanning',
	RIPPING:          '🍹 Ripping',
	RIPPING_ENCODING: '🍹 Ripping - Encoding',
	RIPPING_SUB_SCAN: '🍹 Ripping - Subtitle Scan',
	PEER_UNAVAILABLE: '🚨 Peer Unavailable 🚨'
};

// build a reverse lookup map, so you can get the status name from the status text
const REVERSE_STATUS_LOOKUP = {};
for (let key in STATUS)
	REVERSE_STATUS_LOOKUP[STATUS[key]] = key;

module.exports = {
	STATUS,
	REVERSE_STATUS_LOOKUP,
	RIP_PROGRESS_CONSTANTS,
	RIP_REGEXPS,
	RIP_REGEXPS_V2
};
