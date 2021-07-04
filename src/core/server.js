const express = require('express');

// This starts the web-server.
module.exports = function(shardingManager, config) {
	const server = express();

	server.get('/updateuser', (req, res) => {
		if (config.apiKeys.indexOf(req.query.apiKey) == -1)
			return res.status(403).end();
		// Finish working on this.
	});

	server.listen(config.port, () => {
		console.log(`Server listening on http://localhost:${config.port}`);
	});
}
