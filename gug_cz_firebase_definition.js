
"use strict";

const MeetupProcessor = require('./meetup_processor');

class GugMeetupProcessor extends MeetupProcessor {

    processEvent(meetupEvent, syncedData, output) {
        if(meetupEvent.status === 'canceled' || meetupEvent.status === 'deleted') {
            output['delete']['events/' + meetupEvent.id] = true;
        } else {
            try {
                output['save']['events/' + meetupEvent.id] = {
                    description: meetupEvent.description ? meetupEvent.description : {},
                    duration: meetupEvent.duration ? meetupEvent.duration : -1,
                    meetup_url: meetupEvent.event_url,
                    name: meetupEvent.name,
                    time: meetupEvent.time ? meetupEvent.time : -1,
                    venue: meetupEvent.venue ? meetupEvent.venue : {},
                    chapters: this._findChapters(syncedData['chapters'], [meetupEvent.group.id])
                };
            } catch (e) {
                console.error(e);
            }
        }
        return output;
    }

    _findChapters(chapters, meetupIds) {
        var eventChapters = {};
        var chapterKeys = Object.keys(chapters);
        for (var i = 0; i < chapterKeys.length; i++) {
            var chapter = chapters[chapterKeys[i]];
            if(meetupIds.indexOf(chapter['meetup_id']) !== -1) {
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
    eventsFilter: function (meetupEvent, syncedData) {
        var chapterKeys = Object.keys(syncedData['chapters']);
        for (var i = 0; i < chapterKeys.length; i++) {
            var chapter = syncedData['chapters'][chapterKeys[i]];
            if (chapter['meetup_id'] === meetupEvent.group.id) {
                return true;
            }
        }
        return false;
    },
    eventsPath: 'events'
};

module.exports = {
    processor: GugMeetupProcessor,
    dataModel: dataModel
};