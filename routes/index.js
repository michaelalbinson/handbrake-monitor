'use strict';

const LogReader = require('./util/LogReader');
const PeerFetcher = require('./util/PeerFetcher');

const HOST_NAME = require('os').hostname().replace('.local', '');


module.exports = app => {
	/* GET home page. */
	app.get('/', (req, res) => {
		let peerStatuses;
		PeerFetcher.fetchPeerStatuses().then(peerS => {
			peerStatuses = peerS;
			return new LogReader().getHBStatusItems();
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
				eta: hostStatus.eta,
				peerStatuses
			});
		}).catch(e => {
			console.error(e);
			res.render('error');
		});
	});

	app.get('/checkup', (req, res) => {
		new LogReader().getHBStatusItems().then(status => {
			res.send({
				success: true,
				hostname: HOST_NAME,
				status: status.status,
				statusText: status.statusText,
				startTime: status.startTime,
				endTime: status.endTime,
				activity: status.activity,
				eta: status.eta,
				currentEncode: status.currentEncode,
			});
		}).catch(e => {
			console.error(e);
			res.send({ success: false });
		});
	});

	app.get('/checkup-all', (req, res) => {
		let peerStatuses;
		PeerFetcher.fetchPeerStatuses().then(peerS => {
			peerStatuses = peerS;
			return new LogReader().getHBStatusItems();
		}).then(hostStatus => {
			peerStatuses.push({
				hostname: HOST_NAME,
				status: hostStatus.status,
				statusText: hostStatus.statusText,
				startTime: hostStatus.startTime,
				endTime: hostStatus.endTime,
				activity: hostStatus.activity,
				eta: hostStatus.eta,
				currentEncode: hostStatus.currentEncode
			});

			res.send({
				success: true,
				hostData: peerStatuses
			});
		}).catch(e => {
			console.error(e);
			res.render('error');
		});
	});

	require('./errors')(app);
}
