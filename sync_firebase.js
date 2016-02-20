/**
 * Created by fproch on 2/20/16.
 */

"use strict";

const fs = require('fs');
const CommunityFirebaseManager = require('./community_fb_manager');
const MeetupSync = require('./meetup_sync');
const customFirebaseDefinition = require('./gug_cz_firebase_definition');

var params;

if (process.argv.length < 4) {
    console.log('Missing params, usage:');
    console.log('node sync_firebase.js "<firebaseAppId> <firebaseAppSecret>"');
    return;
} else {
    params = process.argv.slice(2);
}

var configFile = '.meetup_firebase_sync_config';

var config;
try {
    fs.accessSync(configFile, fs.R_OK | fs.W_OK);
} catch (e) {

}
if (fs.exists(configFile)) {
    config = fs.readFileSync(configFile, 'utf8');
} else {
    config = {};
}

var fbManager = new CommunityFirebaseManager(params[0], params[1], customFirebaseDefinition.dataModel);

fbManager.on('initialized', () => {
    console.log('Firebase initialized & authenticated');
    var meetupSync = new MeetupSync();
    var meetupProcessor = new customFirebaseDefinition.processor();
    meetupSync.on('event_received', (event) => {
        fbManager.pushEvent(event, meetupProcessor, customFirebaseDefinition.dataModel.eventsFilter);
    });

    meetupSync.connectMeetupStreams();
});

fbManager.on('auth_failed', () => {
    console.error('Firebase initialization failed, invalid app Secret');
});