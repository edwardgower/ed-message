/**
 * Created by edgower on 11/13/14.
 *
 * desc: validates that the supplied value is contained within the supplied 'enum'
 */

var validateEnumValue = function (value, enumToCheck) {
    var isValid = false;

    for (var i in enumToCheck) {
        if (value === enumToCheck[i]) {
            isValid = true;
        }
    }
    return isValid;
};
module.exports = validateEnumValue;
