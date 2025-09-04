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
 */
function scheduleBreakAlarm(intervalInMinutes) {
  chrome.alarms.clear('breakReminder', () => {
    chrome.alarms.create('breakReminder', {
      delayInMinutes: intervalInMinutes,
      periodInMinutes: intervalInMinutes,
    });
  });
}

// On installation or startup, restore any existing alarm if the user had
// previously activated reminders.
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['interval', 'active'], (data) => {
    if (data.active && typeof data.interval === 'number' && data.interval > 0) {
      scheduleBreakAlarm(data.interval);
    }
  });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['interval', 'active'], (data) => {
    if (data.active && typeof data.interval === 'number' && data.interval > 0) {
      scheduleBreakAlarm(data.interval);
    }
  });
});

// Listen for messages from the popup to start or stop reminders.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'start' && typeof message.interval === 'number') {
    scheduleBreakAlarm(message.interval);
  } else if (message && message.type === 'stop') {
    chrome.alarms.clear('breakReminder');
  }
});

// When the alarm triggers, display a notification to the user.
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm && alarm.name === 'breakReminder') {
    chrome.notifications.create('', {
      type: 'basic',
      iconUrl: 'icons/icon_128.png',
      title: 'Time for a break!',
      message: 'Step away from your screen, stretch, hydrate or rest your eyes.',
      priority: 2,
    });
  }
});
