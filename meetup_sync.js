/**
 * @author Filip Prochazka (@jacktech24)
 */

"use strict";

const fs = require('fs');
const EventEmitter = require('events');
const request = require('request');

var keepLastFetchFile = '.meetup_firebase_last_sync';

class MeetupSync extends EventEmitter {

    contructor() {
        try {
            fs.accessSync(keepLastFetchFile, fs.R_OK | fs.W_OK);
            var config = JSON.parse(fs.readFileSync(keepLastFetchFile, 'utf8'));
            if (config['last_m_time']) {
                this._lastMTime = config['last_m_time'];
            }
        } catch (e) {
        }
    }

    fetchExisting(meetupGroupUrlNames) {
        if (meetupGroupUrlNames) {
            meetupGroupUrlNames.forEach(function (urlName) {
                if (urlName) {
                    console.log('Fetching all meetups for group "' + urlName + '"');
                    request('https://api.meetup.com/' + urlName + '/events?&sign=true&photo-host=public&page=0',
                        function (error, response, body) {
                            if(error) {
                                console.error('Fetching meetups for group "' + urlName + '" failed');
                                console.error(error);
                                return;
                            }
                            try {
                                var events = JSON.parse(body);
                                var ids = Object.keys(events);
                                console.log('Fetched ' + ids.length + ' meetups for group "' + urlName + '"');
                                for (var i = 0; i < ids.length; i++) {
                                    this.emit('event_received', events[ids[i]]);
                                }
                            } catch (e) {
                                console.error('Fetching meetups for group "' + urlName + '" failed');
                                console.error(e);
                            }
                        }.bind(this));
                }
            }.bind(this));
        }
    }

    connectMeetupStreams() {
        //meetup event stream
        var eventStreamUrl = 'http://stream.meetup.com/2/open_events';
        if (this._lastMTime) {
            eventStreamUrl += '?since_mtime=' + this._lastMTime;
        }

        request(eventStreamUrl).on('data', function (e) {
            try {
                var event = JSON.parse(e.toString('utf8').trim().replace('\n\r', ''));
                this._lastMTime = event.mtime;
                this._saveLastMTime();
                this.emit('event_received', event);
            } catch (ex) {
                this.emit('event_parse_failed', ex);
            }
        }.bind(this));
    }

    _saveLastMTime() {
        fs.writeFile(keepLastFetchFile, JSON.stringify({last_m_time: this._lastMTime}));
    }

}

module.exports = MeetupSync;