"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeData = exports.retrieveData = exports.storeData = void 0;
const DEFAULT_EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutes
// TODO: consider its limitations. might have to find an alternative?
const inMemoryCache = {};
function storeData(key, data, expirationTime) {
    expirationTime = expirationTime || DEFAULT_EXPIRATION_TIME;
    inMemoryCache[key] = {
        data,
        expiration: Date.now() + expirationTime,
    };
    // Schedule the removal of the entry after the expiration time
    setTimeout(() => {
        delete inMemoryCache[key];
    }, expirationTime);
}
exports.storeData = storeData;
function retrieveData(key) {
    const cacheEntry = inMemoryCache[key];
    if (cacheEntry && cacheEntry.expiration > Date.now()) {
        return cacheEntry.data;
    }
    return undefined;
}
exports.retrieveData = retrieveData;
function removeData(key) {
    delete inMemoryCache[key];
}
exports.removeData = removeData;
