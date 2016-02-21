/**
 * @author Filip Prochazka (@jacktech24)
 */

"use strict";

const winston = require('winston');
const fs = require('fs');
const CommunityFirebaseManager = require('./community_fb_manager');
const MeetupSync = require('./meetup_sync');

const app = require('./package.json');

winston.exitOnError = false;

winston.info('-----------------------------------------');
winston.info('');
winston.info(app.name + ' ' + app.version);
winston.info(app.description);
winston.info('');
winston.info('-----------------------------------------');
winston.info('');

var params = process.argv.slice(2);

var configFile = __dirname + '/firebase_config.json';
var config;
try {
    fs.accessSync(configFile, fs.R_OK);
    config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
} catch (e) {
    winston.warn('File "' + configFile + '" not found');
}

if (!config || !config['firebase_app_id'] || !config['firebase_app_secret']) {
    winston.error('Missing configuration, make sure you have "firebase_config.json" with all data filled');
    process.exit(1);
    return;
}

var customFirebaseDefinition;
if (!config['firebase_definition']) {
    customFirebaseDefinition = require('./gug_cz_firebase_definition');
    winston.info('Using default Firebase definition "gug_cz_firebase_definition"');
} else {
    try {
        customFirebaseDefinition = require('./' + config['firebase_definition']);
        winston.info('Using custom Firebase definition "' + config['firebase_definition'] + '"');
    } catch (e) {
        winston.error('Firebase definition "' + config['firebase_definition'] + '" loading failed: ' + e.message);
        process.exit(1);
    }
}

winston.info('Initializing connection to Firebase "' + config['firebase_app_id'] + '"');

var fbManager = new CommunityFirebaseManager(config['firebase_app_id'],
    config['firebase_app_secret'], customFirebaseDefinition.dataModel);

fbManager.on('initialized', () => {
    winston.info('Firebase "' + config['firebase_app_id'] + '" initialized & authenticated');
    var meetupSync = new MeetupSync();
    var meetupProcessor = new customFirebaseDefinition.processor();
    meetupSync.on('event_received', (event) => {
        fbManager.pushEvent(event, meetupProcessor);
    });
    fbManager.on('processing_event', (event) => {
        winston.info('Saving meetup (ID:' + event.id + ', NAME: "' + event.name + '")');
    });

    if (params[0] === '--import') {

        winston.info('Importing all existing meetups');

        meetupSync.on('fetch_complete', (count) => {
            winston.info('Import of existing meetups complete, count: ' + count);
            winston.info('App will terminate in 3 seconds...');
            setTimeout(function () {
                process.exit(0);
            }, 3000);
        });
        meetupSync.on('fetch_failed', (urlName, e) => {
            winston.error('Fetching "' + urlName + '" failed: ' + e.message);
        });

        meetupSync.fetchExisting(
            customFirebaseDefinition.dataModel.getImportGroupUrlNames(fbManager.syncedData),
            customFirebaseDefinition.dataModel);
    } else {
        meetupSync.on('stream_connected', (streamUrl) => {
            winston.info('Meetup stream connected: "' + streamUrl + '"');
        });
        meetupSync.connectMeetupStreams();
    }

});

fbManager.on('auth_failed', () => {
    winston.error('Firebase "' + config['firebase_app_id'] + '" initialization failed, invalid app Secret');
    process.exit(1);
});