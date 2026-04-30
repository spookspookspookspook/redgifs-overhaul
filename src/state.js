// src/state.js

let tagFilters = [];
let userFilters = [];
const subscribers = new Set();

export function initStorage() {
    tagFilters = GM_getValue('rgf_tags', []);
    userFilters = GM_getValue('rgf_users', []);
}

export function saveStorage() {
    GM_setValue('rgf_tags', tagFilters);
    GM_setValue('rgf_users', userFilters);
    notifySubscribers();
}

export function getTagFilters() {
    return tagFilters;
}

export function getUserFilters() {
    return userFilters;
}

export function addTagFilter(tag) {
    if (!tagFilters.includes(tag)) {
        tagFilters.push(tag);
        saveStorage();
        return true;
    }
    return false;
}

export function removeTagFilter(index) {
    tagFilters.splice(index, 1);
    saveStorage();
}

export function addUserFilter(user) {
    if (!userFilters.includes(user)) {
        userFilters.push(user);
        saveStorage();
        return true;
    }
    return false;
}

export function removeUserFilter(index) {
    userFilters.splice(index, 1);
    saveStorage();
}

export function subscribe(callback) {
    subscribers.add(callback);
}

export function unsubscribe(callback) {
    subscribers.delete(callback);
}

export function clearTagFilters() {
    tagFilters = [];
    saveStorage();
}

export function clearUserFilters() {
    userFilters = [];
    saveStorage();
}

function notifySubscribers() {
    subscribers.forEach(cb => cb());
}
