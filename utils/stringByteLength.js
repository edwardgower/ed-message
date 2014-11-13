/**
 * Created by edgower on 9/24/14.
 *
 * description: Calculate the byte length of a utf8 string, based on lovasoa's response
 * in this thread: http://stackoverflow.com/questions/5515869/string-length-in-bytes-in-javascript
 * and this perf test: http://jsperf.com/utf-8-byte-length
 */
//var testString = 'ȔΛed';
//console.log('string length: ' + testString + ' is: ' + testString.length + ' characters.');
//console.log('string length: ' + testString + ' is: ' + stringByteLength(testString) + ' bytes.');
function stringByteLength (str) {
    // returns the byte length of an utf8 string
    var s = str.length;
    for (var i = str.length - 1; i >= 0; i--) {
        var code = str.charCodeAt (i);
        if (code > 0x7f && code <= 0x7ff) s++;
        else if (code > 0x7ff && code <= 0xffff) s += 2;
        if (code >= 0xDC00 && code <= 0xDFFF) i--; //trail surrogate
    }
    return s;
}
module.exports = stringByteLength;