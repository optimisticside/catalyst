/**
 * Requires a file in a promise for clean
 * error handling.
 * @param {string} filePath The path to the file to require.
 * @returns {Promise<any>} The data exported by the file.
*/
module.exports = async filePath => {
	return require(filePath);
}
