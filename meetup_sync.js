/**
 * @author Filip Prochazka (@jacktech24)
 */

"use strict";

const fs = require('fs');
const EventEmitter = require('events');
const request = require('request');

var keepLastFetchFile = __dirname + '/.meetup_firebase_last_sync';

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
            var i = 0;
            var fetchedMeetups = 0;
            var endLoop = function () {
                this.emit('fetch_complete', fetchedMeetups);
            }.bind(this);
            var continueLoop = function () {
                if (i < meetupGroupUrlNames.length) {
                    let urlName = meetupGroupUrlNames[i];
                    i++;
                    if (urlName) {
                        request('https://api.meetup.com/' + urlName + '/events?&sign=true&photo-host=public&page=0&status=past,upcoming,proposed',
                            function (error, response, body) {
                                if (error) {
                                    this.emit('fetch_failed', urlName, error);
                                    return;
                                }
                                try {
                                    var events = JSON.parse(body);
                                    var ids = Object.keys(events);
                                    for (var i = 0; i < ids.length; i++) {
                                        this.emit('event_received', events[ids[i]]);
                                    }
                                    fetchedMeetups += ids.length;
                                } catch (e) {
                                    this.emit('fetch_failed', urlName, e);
                                }
                                continueLoop();
                            }.bind(this));
                    } else {
                        continueLoop();
                    }
                } else {
                    endLoop();
                }
            }.bind(this);
            continueLoop();
        }
    }

    connectMeetupStreams() {
        //meetup event stream
        var eventStreamUrl = 'http://stream.meetup.com/2/open_events';
        if (this._lastMTime) {
            eventStreamUrl += '?since_mtime=' + this._lastMTime;
        }

        request(eventStreamUrl)
            .on('data', function (e) {
                try {
                    var event = JSON.parse(e.toString('utf8').trim().replace('\n\r', ''));
                    this._lastMTime = event.mtime;
                    this._saveLastMTime();
                    this.emit('event_received', event);
                } catch (ex) {
                    this.emit('event_parse_failed', ex);
                }
            }.bind(this));
        this.emit('stream_connected', eventStreamUrl);
    }

    _saveLastMTime() {
        fs.writeFile(keepLastFetchFile, JSON.stringify({last_m_time: this._lastMTime}));
    }

}

module.exports = MeetupSync;