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
			res.render('index', { host: HOST_NAME, status: hostStatus, peerStatuses });
		}).catch(e => {
			console.error(e);
			res.render('error');
		});
	});

	app.get('/checkup', (req, res) => {
		FileReader.getLastHBStatus().then(status => {
			res.send({ success: true, status: status, hostname: HOST_NAME })
		}).catch(e => {
			console.error(e);
			res.send({ success: false });
		})
	});

	require('./errors')(app);
}
