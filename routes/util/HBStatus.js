'use strict';

class HBQueueStatus {
	static STATUS_QUEUE_COMPLETE = "QueueCore work done";
	static STATUS_QUEUE_SCANNED_READY = "ScanCore scan done";
}

const STATUS = {
	SCAN_COMPLETE: 'SCAN_COMPLETE',
	QUEUE_COMPLETE: 'QUEUE_COMPLETE',
	WORKING: 'WORKING',
	PEER_UNAVAILABLE: 'PEER_UNAVAILABLE'
}

module.exports = {
	HBQueueStatus,
	STATUS
};
