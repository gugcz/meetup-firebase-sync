/**
 * Created by fproch on 2/20/16.
 */

var request = require('request');
var Firebase = require('firebase');
var GeoFire = require('geofire');

var events = [];
var orgs = [];
var chapters = [];
var venues = [];

var gugFirebase = new Firebase("https://gugcz.firebaseio.com/");
var geoFire = new GeoFire(gugFirebase);

gugFirebase.authWithCustomToken('tplDezNMMkdG9ysIgF1wvDqPQDRELlcYPZkcRUpR', function (error, authData) {
    if (!error) {
        console.log('Succesfully authorized with master token :), erasing all data...')
        loadInitialData();
    }
});

function tameTheEventStream() {
    request('http://stream.meetup.com/2/open_events').on('data', function (e) {
        console.log('New event arrived');
        var event = JSON.parse(e.toString('utf8'));
        console.log('Name: ' + event.name);
    });
}

function loadInitialData() {
    loadFirebaseListOnce('events', events);
}

function loadFirebaseListOnce(path, list) {
    gugFirebase.child(path).once('value', function(snap) {
        list = snap.val();
        observeFirebaseList(path, list);
    });
}

function observeFirebaseList(path, list) {
    var localBase = gugFirebase.child(path);
    localBase.on('child_added', function(snap, prevChildKey) {
        list[snap.key()] = snap.val();
    });
    localBase.on('child_changed', function(snap, prevChildKey) {
        list[snap.key()] = snap.val();
    });
    localBase.on('child_removed', function(snap, prevChildKey) {
        delete list[snap.key()];
    });
}