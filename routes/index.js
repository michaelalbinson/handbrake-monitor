'use strict';

const FileReader = require('./util/FileReader');
const PeerFetcher = require('./util/PeerFetcher');

const HOST_NAME = require('os').hostname().replace('.local', '');


module.exports = app => {
	/* GET home page. */
	app.get('/', (req, res) => {
		let peerStatuses;
		PeerFetcher.fetchPeerStatuses().then(peerS => {
			peerStatuses = peerS;
			return FileReader.getLastHBStatus();
		}).then(hostStatus => {
			res.render('index', {
				title: '🍹 | Dashboard',
				host: HOST_NAME,
				status: hostStatus.status,
				statusText: hostStatus.statusText,
				startTime: hostStatus.startTime,
				endTime: hostStatus.endTime,
				activity: hostStatus.activity,
				currentEncode: hostStatus.currentEncode,
				peerStatuses
			});
		}).catch(e => {
			console.error(e);
			res.render('error');
		});
	});

	app.get('/checkup', (req, res) => {
		FileReader.getLastHBStatus().then(status => {
			res.send({
				success: true,
				status: status.status,
				statusText: status.statusText,
				startTime: status.startTime,
				endTime: status.endTime,
				activity: status.activity,
				currentEncode: status.currentEncode,
				hostname: HOST_NAME
			});
		}).catch(e => {
			console.error(e);
			res.send({ success: false });
		})
	});

	require('./errors')(app);
}
