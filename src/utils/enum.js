/**
 * Creates an enumeration from an array of options.
 * @param {Array<string>} data The data to add to the object.
 * @returns {Object} The object containing the options.
*/
module.exports = (data) => {
	var enumData = {};
	for (var i = 0; i < data.length; i++) {
		enumData[data[i]] = i + 1;
	}
	return enumData;
}