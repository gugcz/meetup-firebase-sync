/**
 * @author Filip Prochazka (@jacktech24)
 */

"use strict";

const fs = require('fs');
const CommunityFirebaseManager = require('./community_fb_manager');
const MeetupSync = require('./meetup_sync');

const customFirebaseDefinition = require('./gug_cz_firebase_definition');

var params = process.argv.slice(2);

var configFile = __dirname + '/firebase_config.json';
var config;
try {
    fs.accessSync(configFile, fs.R_OK);
    config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
} catch (e) {
    console.log('"' + configFile + '" not found');
}

if (!config || !config['firebase_app_id'] || !config['firebase_app_secret']) {
    console.log('Missing configuration, make sure you have "firebase_config.json" with all data filled');
    process.exit(1);
    return;
}

var fbManager = new CommunityFirebaseManager(config['firebase_app_id'],
    config['firebase_app_secret'], customFirebaseDefinition.dataModel);

fbManager.on('initialized', () => {
    console.log('Firebase initialized & authenticated');
    var meetupSync = new MeetupSync();
    var meetupProcessor = new customFirebaseDefinition.processor();
    meetupSync.on('event_received', (event) => {
        fbManager.pushEvent(event, meetupProcessor);
    });

    if(params[0] === '--import') {
        console.log('Importing all existing meetups');
        meetupSync.on('fetch_complete', (count) => {
            console.log('\n\nImport of existing meetups complete, count: ' + count);
            console.log('App will terminate in 3 seconds...');
            setTimeout(function() {
                process.exit(0);
            }, 3000);
        });
        meetupSync.fetchExisting(
            customFirebaseDefinition.dataModel.getImportGroupUrlNames(fbManager.syncedData));
    } else {
        meetupSync.connectMeetupStreams();
    }

});

fbManager.on('auth_failed', () => {
    console.error('Firebase initialization failed, invalid app Secret');
    process.exit(1);
});