/**
 * Get parameters from URL, e.g., http://localhost/?foo=bar
 * Source: http://stackoverflow.com/questions/979975/how-to-get-the-value-from-url-parameter
 * @param {string} parameter - The name of the parameter, e.g., 'foo'.
 * @return {string} The value of the requested parameter, e.g., 'bar'.
 */
function getURLParameters(parameter) {
	var sURL = window.document.URL.toString();
	if (sURL.indexOf('?') > 0) {
		var arrParams = sURL.split('?');
		var arrURLParams = arrParams[1].split('&');
		var arrParamNames = new Array(arrURLParams.length);
		var arrParamValues = new Array(arrURLParams.length);
		var i = 0;
		for (i = 0; i < arrURLParams.length; i++) {
			var sParam = arrURLParams[i].split('=');
			arrParamNames[i] = sParam[0];
			if (sParam[1] != '') {
			  arrParamValues[i] = unescape(sParam[1]);
			} else {
			  arrParamValues[i] = undefined;
			}
		}

		for (i = 0; i < arrURLParams.length; i++) {
			if (arrParamNames[i] == parameter) {
				JL('IPED Toolkit.Utils').debug('Parameter: ' + parameter + '=' + arrParamValues[i]);
				return arrParamValues[i];
			}
		}
		JL('IPED Toolkit.Utils').debug('No URL parameters found.');
		return;
	}
}