
"use strict";

const MeetupProcessor = require('./meetup_processor');

class GugMeetupProcessor extends MeetupProcessor {

    processEvent(meetupEvent, syncedData) {
        var output = {};
        output['events/' + meetupEvent.id] = {
            description: meetupEvent.description,
            duration: meetupEvent.duration,
            meetup_url: meetupEvent.event_url,
            name: meetupEvent.name,
            time: meetupEvent.time,
            venue: meetupEvent.venue,
            chapters: this._findChapters(syncedData['chapters'], [meetupEvent.group.id])
        };

        return output;
    }

    _findChapters(chapters, meetupIds) {
        var eventChapters = {};
        var chapterKeys = Object.keys(chapters);
        for (var i = 0; i < chapterKeys.length; i++) {
            var chapter = chapters[chapterKeys[i]];
            if(meetupIds.indexOf(chapter['meetup_id']) !== -1) {
                eventChapters.push(chapterKeys[i], true);
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