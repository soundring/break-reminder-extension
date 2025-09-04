/*
 * Popup script for Break Reminder extension.
 *
 * Provides a simple UI that allows the user to set the interval between break
 * notifications, start the reminder schedule, and stop it. The current
 * interval and activation state are stored in chrome.storage.local so they
 * persist across browser sessions. Communication with the background service
 * worker is done via messages to start or stop alarms.
 */

document.addEventListener('DOMContentLoaded', () => {
  const intervalInput = document.getElementById('interval');
  const startBtn = document.getElementById('start');
  const stopBtn = document.getElementById('stop');
  const statusEl = document.getElementById('status');

  // Load saved settings and update UI accordingly
  chrome.storage.local.get(['interval', 'active'], (data) => {
    if (typeof data.interval === 'number' && data.interval > 0) {
      intervalInput.value = data.interval;
    }
    updateStatus(Boolean(data.active));
  });

  // Handle start button
  startBtn.addEventListener('click', () => {
    const mins = parseInt(intervalInput.value, 10);
    if (!isNaN(mins) && mins > 0) {
      chrome.storage.local.set({ interval: mins, active: true }, () => {
        // Tell background script to schedule the alarm
        chrome.runtime.sendMessage({ type: 'start', interval: mins });
        updateStatus(true);
      });
    } else {
      statusEl.textContent = 'Please enter a valid number of minutes.';
    }
  });

  // Handle stop button
  stopBtn.addEventListener('click', () => {
    chrome.storage.local.set({ active: false }, () => {
      // Tell background script to clear any existing alarms
      chrome.runtime.sendMessage({ type: 'stop' });
      updateStatus(false);
    });
  });

  /**
   * Update the status message in the popup to reflect whether the reminder
   * schedule is active or stopped.
   *
   * @param {boolean} active Whether reminders are currently active
   */
  function updateStatus(active) {
    if (active) {
      statusEl.textContent = 'Break reminders are active.';
    } else {
      statusEl.textContent = 'Break reminders are stopped.';
    }
  }
});
