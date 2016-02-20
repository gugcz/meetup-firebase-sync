/**
 * @author Filip Prochazka (@jacktech24)
 */

"use strict";

class MeetupProcessor {

    /**
     * Returns data as you want to store it in firebase
     */
    processEvent(meetupEvent, syncedData, output){
        return output;
    }

    /**
     * Used to filter incoming stream of events to those you want
     * @param meetupEvent Meetup event object (from Meetup API)
     * @param syncedData Data you requested to sync from Firebase (read-only)
     * @returns {boolean} whether to save this event or skip
     */
    eventsFilter(meetupEvent, syncedData) {
        return false;
    }

}

module.exports = MeetupProcessor;