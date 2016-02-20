"use strict";

const fs = require('fs');
const EventEmitter = require('events');
const request = require('request');

class MeetupSync extends EventEmitter {

    connectMeetupStreams(last_mtime) {
        //meetup event stream
        var self = this;
        request('http://stream.meetup.com/2/open_events').on('data', function (e) {
            try {
                var event = JSON.parse(e.toString('utf8').trim().replace('\n\r', ''));
                self.emit('event_received', event);
            } catch (ex) {
                self.emit('event_parse_failed', ex);
            }
        });
    }

}

module.exports = MeetupSync;