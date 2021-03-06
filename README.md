# meetup-firebase-sync
A script for syncing Meetup.com data with Firebase database in NodeJS.

## Features
- fetches events and venues from selected Meetup groups
- saves data to Firebase where it can be easily used my many Firebase UI libraries
- supports custom Firebase structure
- includes initial data import and then real-time updates using [OpenEvents Stream API](http://www.meetup.com/meetup_api/docs/stream/2/open_events/)
- uses [GeoFire](https://github.com/firebase/geofire/) for venue locations - can be used for geo-queries

## Requirements

 - NodeJS 5.6
 - Always-running server with persistent connection to Meetup API. We recommend ComputeEngine micro VM.

## Installation (Linux):

__1) Install package__
```
user@machine:~# npm install gugcz/meetup-firebase-sync
```

__2) Go to installation directory__
```
user@machine:~# cd node_modules/meetup-firebase-sync
```

__3) Configure Firebase__

Create file: 'firebase_config.json', example content:

```json
{
  "firebase_app_id": "<YOUR_FIREBASE_APP_ID>",
  "firebase_app_secret": "<YOUR_FIREBASE_APP_SECRET>"
}
```

## How to use:

__Import existing meetups to Firebase__
```
user@machine:~# node sync.js --import
```
or
```
user@machine:~# ./bin/meetup-sync --import
```

__Fetch new meetups / edits / removals and push them to Firebase__
```
user@machine:~# node sync.js
```
or
```
user@machine:~# ./bin/meetup-sync
```

## Custom Firebase structure

You may notice that we are using Firebase structure that is suitable for us, if it isn't for you, then go and write your own Firebase definition,
then just add to configuration file this:
```
{
  ... ,
  "firebase_definition": "<YOUR_DEFINITION_JS_FILENAME>"
}
```

If you take a look, we have our own definition in [gug_cz_firebase_definition.js](gug_cz_firebase_definition.js), so you can inspire how to write yours. The important parts are as follows:

```javascript
"use strict";

const MeetupProcessor = require('./meetup_processor');

class YouCustomMeetupProcessor extends MeetupProcessor {
  processEvent(meetupEvent, syncedData, output) {
    //your meetupEvent processing, data you want to store in Firebase push to output (see definition)
  }   
  
  eventsFilter(meetupEvent, syncedData) {
    //this method returns true if you want to pass this event to method above or it's not for your (typically check your meetup id here)
  }
}

var dataModel = {
    syncPaths: [
        //list of paths in your Firebase DB you want to have available to the MeetupProcessor above (syncedData parameters)
        'events', 'path1', ...
    ],
    eventsPath: 'events', //path to where you store events in your Firebase DB
    geofirePath: 'geofire', //path to where you store GeoFire data in your Firebase DB
    getImportGroupUrlNames: function (syncedData) {
        //this method returns array of url names of groups you want to import data from
        return ['MyGroup'];
    }
};

module.exports = {
    processor: GugMeetupProcessor,
    dataModel: dataModel
};
```
## Roadmap
 - simplify configuration - it should be more declarative, less code
 - add information about ```output``` variable and how to use it, for now check [gug_cz_firebase_definition.js](gug_cz_firebase_definition.js)
