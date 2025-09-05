// Background service worker for Break Reminder extension.
//
// This script listens for messages from the popup to start or stop the break
// reminders and manages alarms accordingly. When an alarm fires, it sends a
// desktop notification encouraging the user to take a break. The alarm is
// scheduled to repeat at the configured interval.

/**
 * Create or reset a repeating alarm with the given interval.
 *
 * @param {number} intervalInMinutes Interval between alarms in minutes
 * @param {number} [initialDelay] Optional initial delay before the first alarm
 */
function scheduleBreakAlarm(intervalInMinutes, initialDelay = intervalInMinutes) {
  chrome.alarms.create('breakReminder', {
    delayInMinutes: initialDelay,
    periodInMinutes: intervalInMinutes,
  });
  // Alarm used to refresh the badge text with the remaining time.
  chrome.alarms.create('badgeUpdate', {
    delayInMinutes: 0,
    periodInMinutes: 1,
  });
  updateBadge();
}

/**
 * Show the minutes remaining until the next break in the badge text.
 */
function updateBadge() {
  chrome.alarms.get('breakReminder', (alarm) => {
    if (alarm) {
      const minutes = Math.ceil((alarm.scheduledTime - Date.now()) / 60000);
      chrome.action.setBadgeText({ text: String(minutes) });
      chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  });
}

// On installation or startup, restore any existing alarm if the user had
// previously activated reminders.
function restoreAlarmFromStorage() {
  chrome.storage.local.get(['interval', 'active'], (data) => {
    if (data.active && typeof data.interval === 'number' && data.interval > 0) {
      scheduleBreakAlarm(data.interval);
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  });
}

chrome.runtime.onInstalled.addListener((details) => {
  restoreAlarmFromStorage();
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
  }
});
chrome.runtime.onStartup.addListener(restoreAlarmFromStorage);

// Listen for messages from the popup to start or stop reminders.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'start' && typeof message.interval === 'number') {
    scheduleBreakAlarm(message.interval);
  } else if (message && message.type === 'stop') {
    chrome.alarms.clear('breakReminder');
    chrome.alarms.clear('badgeUpdate');
    chrome.action.setBadgeText({ text: '' });
  }
});

// When the alarm triggers, display a notification to the user.
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm && alarm.name === 'breakReminder') {
      chrome.notifications.create('breakNotification', {
        type: 'basic',
        iconUrl: 'icon_128.png',
        title: 'Time for a break!',
        message: 'Step away from your screen, stretch, hydrate or rest your eyes.',
        priority: 2,
        buttons: [
          { title: 'Snooze 5 min' },
          { title: 'Stop reminders' },
        ],
        requireInteraction: false,
      });
    updateBadge();
  } else if (alarm && alarm.name === 'badgeUpdate') {
    updateBadge();
  }
});

// Handle notification button clicks for snoozing or stopping reminders.
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId === 'breakNotification') {
    if (buttonIndex === 0) {
      chrome.storage.local.get(['interval'], (data) => {
        if (typeof data.interval === 'number') {
          scheduleBreakAlarm(data.interval, 5);
        }
      });
    } else if (buttonIndex === 1) {
      chrome.storage.local.set({ active: false }, () => {
        chrome.alarms.clear('breakReminder');
        chrome.alarms.clear('badgeUpdate');
        chrome.action.setBadgeText({ text: '' });
      });
    }
    chrome.notifications.clear(notificationId);
  }
});

// Expose functions for testing.
if (typeof module !== 'undefined') {
  module.exports = { scheduleBreakAlarm };
}
