const path = require('path');
const fs = require('fs');
const executeFile = require('../utils/exec.js');

async function loadDir(dirPath, dest, isRecursive) {
	const files = fs.readdirSync(dirPath);
	const promises = files.map(async file => {
		const fileType = path.extname(file);
		const fileName = path.basename(file, fileType);
		const filePath = path.join(dirPath, file);
		const fileStat = fs.statSync(filePath);

		if (fileStat.isFile() && [ '.js', '.mjs' ].indexOf(fileType) != -1) {
			executeFile(filePath).then(data => {
				dest[fileName] = data;
			});
		} else if (fileStat.isDirectory() && isRecursive) {
			dest[fileName] = {};
			await loadDir(filePath, dest[fileName], isRecursive);
		}
	});

	await Promise.all(promises);
}

/**
 * Loads a directory into a dictionary.
 * @param {string} dirPath The path to the directory.
 * @param {object} dest The object to load the directory entries into.
 * @param {boolean} isRecursive Wehther sub-directories should be loaded.
*/
module.exports = (dirPath, ...rest) => {
	return loadDir(path.join(module.parent.path, dirPath), ...rest);
};
