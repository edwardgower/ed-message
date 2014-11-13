/**
 * Created by edgower on 11/10/14.
 *
 * desc: tests the header used in the event driven network
 */

var should = require ('should');
var granularity = require ('ed-temporal-granularity');
var Header = require ('../header');

describe ('A three argument init of message header instantiation should:', function () {

    var header = new Header ('testEventType', granularity.second, 'abcd-12345yz');

    it ('return an object that is an instance of Header.', function () {
        header.should.be.an.instanceof (Header);
    });
    it ('have a protocol version of 1', function () {
        header.getProtocolVersion ().should.equal (1);
    });
    it ('not be flagged as a composed message.', function () {
        header.isComposed ().should.be.false;
    });
    it ('have a temporal granularity name of second.', function () {
        header.getTemporalGranularityName ().should
            .equal (granularity.properties[granularity.second].name);
    });
    it ('have a temporal granularity value of 2.', function () {
        header.getTemporalGranularity ().should.equal (2);
    });
});