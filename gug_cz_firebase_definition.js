/**
 * @author Filip Prochazka (@jacktech24)
 */

"use strict";

const MeetupProcessor = require('./meetup_processor');

class GugMeetupProcessor extends MeetupProcessor {

    processEvent(meetupEvent, syncedData, output) {
        if (meetupEvent.status === 'canceled' || meetupEvent.status === 'deleted') {
            output['delete'].push('events/' + meetupEvent.id);
        } else {
            try {
                output['save']['events/' + meetupEvent.id] = {
                    description: meetupEvent.description ? meetupEvent.description : {},
                    duration: meetupEvent.duration ? meetupEvent.duration : -1,
                    meetup_url: this._createEventUrl(meetupEvent),
                    name: meetupEvent.name,
                    time: meetupEvent.time ? meetupEvent.time : -1,
                    venue_id: this._processVenue(syncedData['venues'], meetupEvent.venue, output),
                    chapters: this._findChapters(syncedData['chapters'], [meetupEvent.group.id])
                };
            } catch (e) {
                console.error(e);
            }
        }
        return output;
    }

    eventsFilter(meetupEvent, syncedData) {
        var chapterKeys = Object.keys(syncedData['chapters']);
        for (var i = 0; i < chapterKeys.length; i++) {
            var chapter = syncedData['chapters'][chapterKeys[i]];
            if (chapter['meetup_id'] === meetupEvent.group.id) {
                return true;
            }
        }
        return false;
    }

    _processVenue(venues, meetupVenue, output) {
        var response = {};
        if (meetupVenue) {
            if (meetupVenue.id) {
                response = meetupVenue.id;
                var venueIds = Object.keys(venues);
                var exists = false;
                for (var i = 0; i < venueIds.length; i++) {
                    if (venueIds[i] === meetupVenue.id) {
                        exists = true;
                    }
                }
                if (!exists) {
                    output['save']['venues/' + meetupVenue.id] = {
                        address: this._joinStringIfDefined([
                                meetupVenue['address_1'],
                                meetupVenue['address_2'],
                                meetupVenue['address_3'],
                                meetupVenue['city'],
                                meetupVenue['status']
                            ], ', '),
                        name: meetupVenue.name,
                        location: {
                            lat: meetupVenue.lat,
                            lon: meetupVenue.lon
                        }
                    };
                    output['save_geofire']['venue_' + meetupVenue.id] = [meetupVenue.lat, meetupVenue.lon];
                }
            } else {
                console.log('missing meetup venue ID');
            }
        }
        return response;
    }

    _joinStringIfDefined(strings, delimiter) {
        var output = '';
        strings.forEach(function (part) {
            if (part) {
                output += part + delimiter;
            }
        }.bind(this));
        output = output.substring(0, output.length - delimiter.length);
        return output.trim();
    }

    _createEventUrl(meetupEvent) {
        if (meetupEvent.event_url) {
            return meetupEvent.event_url;
        } else if (meetupEvent.link) {
            return meetupEvent.link;
        } else {
            return 'http://www.meetup.com/' + meetupEvent.group.urlname + '/events/' + meetupEvent.id + '/'
        }
    }

    _findChapters(chapters, meetupIds) {
        var eventChapters = {};
        var chapterKeys = Object.keys(chapters);
        for (var i = 0; i < chapterKeys.length; i++) {
            var chapter = chapters[chapterKeys[i]];
            if (meetupIds.indexOf(chapter['meetup_id']) !== -1) {
                eventChapters[chapterKeys[i]] = true;
            }
        }
        return eventChapters;
    }

}

var dataModel = {
    syncPaths: [
        'chapters', 'orgs', 'venues', 'events'
    ],
    eventsPath: 'events',
    geofirePath: 'geofire',
    getImportGroupUrlNames: function (syncedData) {
        var ids = [];
        var chapterKeys = Object.keys(syncedData['chapters']);
        for (var i = 0; i < chapterKeys.length; i++) {
            var chapter = syncedData['chapters'][chapterKeys[i]];
            ids.push(chapter['meetup_url_name']);
        }
        return ids;
    }
};

module.exports = {
    processor: GugMeetupProcessor,
    dataModel: dataModel
};