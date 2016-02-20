/**
 * @author Filip Prochazka (@jacktech24)
 */

"use strict";

const CommunityFirebaseManager = require('./community_fb_manager');
const MeetupSync = require('./meetup_sync');
const customFirebaseDefinition = require('./gug_cz_firebase_definition');

var params;

if (process.argv.length < 4) {
    console.log('Missing params, usage:');
    console.log('node sync_firebase.js "<firebaseAppId>" "<firebaseAppSecret>"');
    return;
} else {
    params = process.argv.slice(2);
}

var fbManager = new CommunityFirebaseManager(params[0], params[1], customFirebaseDefinition.dataModel);

fbManager.on('initialized', () => {
    console.log('Firebase initialized & authenticated');
    var meetupSync = new MeetupSync();
    var meetupProcessor = new customFirebaseDefinition.processor();
    meetupSync.on('event_received', (event) => {
        fbManager.pushEvent(event, meetupProcessor);
    });

    if(params[2] === '--import') {
        console.log('Importing all existing meetups');
        meetupSync.fetchExisting(
            customFirebaseDefinition.dataModel.getImportGroupUrlNames(fbManager.syncedData));
    } else {
        meetupSync.connectMeetupStreams();
    }

});

fbManager.on('auth_failed', () => {
    console.error('Firebase initialization failed, invalid app Secret');
});