/**
 * header.js: Represents the header portion of a ed-message message
 *
 * @module ed-message/header
 * @author edwardgower@gmail.com (Ed Gower)
 *
 * (C) 2014 Ed Gower
 * APACHE 2.0 LICENCE
 *
 */

var granularity = require ('ed-temporal-granularity');
var validateEnum = require (__dirname + '/utils/validateEnumValue');
var stringByteLength = require (__dirname + '/utils/stringByteLength');
// todo: add logging on errors and additional debugging
/**
 Represents the protocol version 1 implementation of the header section of ed-mp

 byte[0] - length 1 byte
 3   2  1
 ____ _ ___
 0000 0 000

 1: protocol version 1 through 7
 2: isComposed flag (event is composed of > 1 other events)
 3: temporalGranularity of the timestamps in the event. correlates to ENUM temporalGranularity

 byte[1] - headerLength: 2 bytes UInt16BE
 byte[3] - payloadLength: 4 bytes UInt32BE
 byte[7] - occurrenceTime: 8 bytes DoubleBE
 byte[15] - detectionTime: 8 bytes DoubleBE
 byte[23] - eventId: 12 bytes String
 byte[35] - eventSource: 12 bytes String
 byte[47] - eventTypeId: Open length String

 @constructor
 @param {string} eventType - A string name greater than zero characters for the event type.
 @param {number} temporalGranularity - Represents a numerical value from the temporalGranularity object.
 @param {string} eventSource - The source of the event, who or what created it.
 @param {boolean=} isComposed - An optional argument that allows can be used to specify that the event
 is composed of other events. Defaults to false.
 */
function Header (eventType, temporalGranularity, eventSource, isComposed) {

    // if user accidentally omits the 'new' keyword, this will silently correct the problem...
    if (!(this instanceof Header))
        return new Header (eventType, temporalGranularity, eventSource, isComposed);

    /**
     * Protocol version for this release
     * @const {number}
     */
    var PROTOCOL_VERSION = 1;
    /**
     * This denotes size in bytes of the fixed portion of the header
     * @const {number}
     * @private
     */
    var _FIXED_HEADER_SIZE = 47;
    /**
     * Private variable for the buffer
     * @private {buffer}
     */
    var _buffer;

    //test the arguments
    if (arguments.length < 3 || arguments.length > 4) {
        throw new Error ('function ed-mp.Header called with ' + arguments.length + ' arguments, but ' +
        'expects either 3 or 4.');
    }

    // typeof will fail if a new String object is passed in i.e. Header(new String('event..
    if (typeof eventType != 'string' && ( eventType.length === 0) || eventType > (65535 - _FIXED_HEADER_SIZE)) {
        throw  new Error ('eventType argument is of type ' + typeof eventType + ' and has a length ' +
        'of ' + eventType.length + '. eventType should be a string of length > 0 and less tha' +
        65535 - _FIXED_HEADER_SIZE);
    } else {
        // create a new buffer for the header that is the sum of the fixed and variable length elements
        _buffer = new Buffer (_FIXED_HEADER_SIZE + stringByteLength (eventType));
        _buffer[0] = PROTOCOL_VERSION;

        // we can access this locally via buffer.length but when the header and payload buffer.concat we will need this
        _buffer.writeUInt16BE (_buffer.length, 1);
        _buffer.write (eventType, _FIXED_HEADER_SIZE);

    }

    // check that the value provided is within the granularity object
    if (!validateEnum (temporalGranularity, granularity)) {
        throw new Error ('temporalGranularity argument ' + temporalGranularity + ' is not contained ' +
        'within the temporalGranularity object, please provide a valid value');
    } else {
        _buffer[0] |= (temporalGranularity << 4);
    }

    // check that the third argument is valid
    if (typeof eventSource !== 'string' || stringByteLength (eventSource) !== 12) {
        throw new Error ('eventSource argument is not of type string or eventSource byte length is ' +
        'not equal to 12. typeof: ' + typeof eventSource + ' byte length: ' + stringByteLength (eventSource));
    } else {
        _buffer.write (eventSource, 35);
    }

    // if the fourth argument 'isComposed' has been provided and is a boolean set it here
    if (arguments.length === 4 && typeof isComposed === 'boolean') {
        // if the 4th bit (mask 8) != _composed flip the bit
        if (!Boolean (_buffer[0] & 8) == isComposed) {
            _buffer[0] ^= 8;
        }
    }

    // define the 'this' properties
    Object.defineProperties (this, {
        /**
         * FIXED_HEADER_SIZE is used to determine the beginning of the variable length section of the header
         * @const {number}
         */
        'FIXED_HEADER_SIZE': {
            value: _FIXED_HEADER_SIZE,
            enumerable: true,
            configurable: false,
            writable: false
        },
        /**
         * A reference to the buffer representation of the header
         * @type {buffer}
         */
        'buffer': {
            value: _buffer,
            enumerable: true,
            configurable: false,
            writable: false
        }
    });
}
Object.defineProperties (Header.prototype, {
    /**
     * @returns {number} The version number for this implementation of the ed-mp protocol
     */
    'getProtocolVersion': {
        value: function () {
            return (this.buffer[0] & 7);
        },
        enumerable: true,
        configurable: false,
        writable: false
    },
    /**
     * @returns {number} The length in bytes of the header UInt16BE (up to: 65,535)
     */
    'getHeaderLength': {
        value: function () {
            return (this.buffer.readUInt16BE (1));
        },
        enumerable: true,
        configurable: false,
        writable: false
    },
    /**
     * @returns {number} The length in bytes of the payload UInt32BE (up to: 4,294,967,295)
     */
    'getPayloadLength': {
        value: function () {
            return (this.buffer.readUInt32BE (3));
        },
        enumerable: true,
        configurable: false,
        writable: false
    },
    /**
     * Sets the payload length in the header. Expects a number that conforms to UInt32BE and therefore has
     * a maximum value of 4,294,967,295 bytes
     * @param {number}
     */
    'setPayloadLength': {
        value: function (payloadLength) {
            // make sure payloadLength is a number and doesn't exceed the maximum U32bit int value
            if (typeof payloadLength !== 'number' || payloadLength > 4294967295) {
                throw new Error ('setPayloadLength expects a number parameter <= 4,294,967,295')
            } else {
                this.buffer.writeUInt32BE (payloadLength, 3);
            }
        },
        enumerable: true,
        configurable: false,
        writable: false
    },
    /**
     * @returns {string} Gets the string representation of the temporal granularity, this is the same for all
     * instances of each @see{getEventType}
     */
    'getTemporalGranularity': {
        value: function () {
            return (this.buffer[0] >> 4);
        },
        enumerable: true,
        configurable: false,
        writable: false
    },
    /**
     * @returns {string} Gets the string representation of the temporal granularity, this is the same for all
     * instances of each @see{getEventType}
     */
    'getTemporalGranularityName': {
        value: function () {
            return (granularity.properties[this.buffer[0] >> 4].name);
        },
        enumerable: true,
        configurable: false,
        writable: false
    },
    /**
     * @returns {boolean} gets a boolean that determines whether the event is composed of other events,
     * this is the same for all instances of each @see{getEventType}
     */
    'isComposed': {
        value: function () {
            return Boolean (this.buffer[0] & 8);
        },
        enumerable: true,
        configurable: false,
        writable: false
    },
    /**
     * Toggles the boolean flag isComposed, this is the same for all instances of each @see{getEventType}
     * @param {boolean}
     */
    'setComposed': {
        value: function (composed) {
            if (typeof composed !== 'boolean') {
                throw new Error ('composed argument is typeof ' + typeof composed + ' expected typeof boolean')
            }
            else if (!Boolean (this.buffer[0] & 8) == composed) {
                this.buffer[0] ^= 8;
            }
        },
        enumerable: true,
        configurable: false,
        writable: false
    },
    /**
     * @returns {string} gets the eventType. Event Types provide a template for event messages of their type
     * the following properties are all constant for a given type @see{isComposed}, @see{getTemporalGranularity},
     * @see{getHeaderLength}
     */
    'getEventType': {
        value: function () {
            return this.buffer.toString ('utf8', this.FIXED_HEADER_SIZE, this.getHeaderLength ())
        },
        enumerable: true,
        configurable: false,
        writable: false
    },
    /**
     * @returns {number} A number representing the occurrence time of the event DoubleBE that can be converted to a
     * javascript date object (this represents the number of milliseconds that have elapsed since UTC time began
     */
    'getOccurrenceTime': {
        value: function () {
            return this.buffer.readDoubleBE (7);
        },
        enumerable: true,
        configurable: false,
        writable: false
    },
    /**
     * Sets the occurrence time (number of milliseconds) of the event. DoubleBE.
     * @param {number}
     */
    'setOccurrenceTime': {
        value: function (occurrenceTime) {
            // make sure occurrenceTime is a number and doesn't exceed the maximum double value
            if (typeof occurrenceTime !== 'number' || occurrenceTime > (2E+63 - 1)) {
                throw new Error ('setOccurrenceTime expects a number parameter <= 2E+63 -1')
            } else {
                this.buffer.writeDoubleBE (occurrenceTime, 7);
            }
        },
        enumerable: true,
        configurable: false,
        writable: false
    },
    /**
     * @returns {number} A number representing the detection time of the event DoubleBE that can be converted to a
     * javascript date object (this represents the number of milliseconds that have elapsed since UTC time began
     */
    'getDetectionTime': {
        value: function () {
            return this.buffer.readDoubleBE (15);
        },
        enumerable: true,
        configurable: false,
        writable: false
    },
    /**
     * Sets the detection time (number of milliseconds) of the event. DoubleBE.
     * @param {number}
     */
    'setDetectionTime': {
        value: function (detectionTime) {
            // make sure occurrenceTime is a number and doesn't exceed the maximum double value
            if (typeof detectionTime !== 'number' || detectionTime > (2E+63 - 1)) {
                throw new Error ('setDetectionTime expects a number parameter <= 2E+63 -1')
            } else {
                this.buffer.writeDoubleBE (detectionTime, 15);
            }
        },
        enumerable: true,
        configurable: false,
        writable: false
    },
    /**
     * @returns {string} The eventId is a string, 12 bytes long that represents the unique id for this event
     */
    'getEventId': {
        value: function () {
            return this.buffer.toString ('utf8', 23, 35);
        },
        enumerable: true,
        configurable: false,
        writable: false
    },
    /**
     * sets the eventId for a specific instance of this event. The Id is a unique 12 byte string
     * @param {string}
     */
    'setEventId': {
        value: function (eventId) {
            if (typeof eventId !== 'string' || stringByteLength (eventId) !== 12) {
                throw new Error ('setEventId expects a string parameter 12 bytes in length. eventId ' +
                'is a ' + typeof eventId + ' and has a length of ' + stringByteLength (eventId) + ' bytes');
            } else {
                this.buffer.write (eventId, 23);
            }
        },
        enumerable: true,
        configurable: false,
        writable: false
    },
    /**
     * @returns {string} The event source is a unique Id for the producer of all instances of this event type
     * originating from that producer. The string Id is 12 bytes long
     */
    'getEventSource': {
        value: function () {
            return this.buffer.toString ('utf8', 35, 47);
        },
        enumerable: true,
        configurable: false,
        writable: false
    }
});
/**
 * @export
 * @type {Header}
 */
module.exports = Header;