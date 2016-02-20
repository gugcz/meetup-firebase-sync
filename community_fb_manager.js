/**
 * @author Filip Prochazka (@jacktech24)
 */

"use strict";

const EventEmitter = require('events');
const Firebase = require('firebase');
const GeoFire = require('geofire');

class CommunityFirebaseManager extends EventEmitter {

    constructor(urlKey, secret, dataModel) {
        super();
        this._cachedData = {};
        this._syncedCount = 0;
        this._requiredSyncCount = 0;

        this._dataModel = dataModel;
        this._rootFirebase = new Firebase('https://' + urlKey + '.firebaseio.com/');
        this._geoFire = new GeoFire(this._rootFirebase); //todo: utilize this

        var self = this;
        this._rootFirebase.authWithCustomToken(secret, function (error, authData) {
            if (!error) {
                self.emit('auth_success');
                self.on('path_synced', () => {
                    if (self._syncedCount === self._requiredSyncCount) {
                        self.emit('initialized');
                    }
                });
                self._syncInitialData();
            } else {
                console.error('Authorization failed!, invalid token');
                self.emit('auth_error');
            }
        });
    }

    pushEvent(event, processor) {
        if (processor.eventsFilter(event, this._cachedData)) {
            console.log('saving meetup ID:' + event.id + ', NAME: "' + event.name + '"');
            var output = {
                save: {},
                delete: {},
                update: {}
            };
            var self = this;
            var firebaseData = processor.processEvent(event, this._cachedData, output);
            if (firebaseData['save']) {
                var pushPaths = Object.keys(firebaseData['save']);
                pushPaths.forEach((path) => {
                    self._rootFirebase.child(path).set(firebaseData['save'][path]);
                });
            }
            if (firebaseData['delete']) {
                var deletePaths = Object.keys(firebaseData['delete']);
                deletePaths.forEach((path) => {
                    self._rootFirebase.child(path).set(null);
                });
            }
            if (firebaseData['update']) {
                var updatePaths = Object.keys(firebaseData['update']);
                updatePaths.forEach((path) => {
                    self._rootFirebase.child(path).update(firebaseData['update'][path]);
                });
            }
        }
    }

    get syncedData() {
        return this._cachedData;
    }

    _syncInitialData() {
        var self = this;
        this._dataModel.syncPaths.forEach((path) => {
            self._requiredSyncCount++;
            self._syncFirebasePathAndObserve(path);
        });
    }

    _syncFirebasePathAndObserve(path) {
        this._rootFirebase.child(path).once('value', function (snap) {
            this._cachedData[path] = snap.val();
            this._observeFirebasePath(path);
            this._syncedCount++;
            this.emit('path_synced', path);
        }.bind(this));
    }

    _observeFirebasePath(path) {
        var localBase = this._rootFirebase.child(path);
        localBase.on('child_added', function (snap, prevChildKey) {
            this._cachedData[path][snap.key()] = snap.val();
        }.bind(this));
        localBase.on('child_changed', function (snap, prevChildKey) {
            this._cachedData[path][snap.key()] = snap.val();
        }.bind(this));
        localBase.on('child_removed', function (snap, prevChildKey) {
            delete this._cachedData[path][snap.key()];
        }.bind(this));
    }

}

module.exports = CommunityFirebaseManager;