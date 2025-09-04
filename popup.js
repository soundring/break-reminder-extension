/*
 * Popup script for Break Reminder extension.
 *
 * Provides a user-friendly interface to enable or disable break reminders,
 * configure the interval, and display a countdown until the next break.
 * Settings are persisted in chrome.storage.local.
 */

document.addEventListener('DOMContentLoaded', () => {
  const intervalInput = document.getElementById('interval');
  const toggle = document.getElementById('toggle');
  const statusEl = document.getElementById('status');
  const countdownEl = document.getElementById('countdown');

  let countdownId;

  // Load saved settings and update UI accordingly
  chrome.storage.local.get(['interval', 'active'], (data) => {
    if (typeof data.interval === 'number' && data.interval > 0) {
      intervalInput.value = data.interval;
    }
    updateStatus(Boolean(data.active));
  });

  // Handle toggle switch
  toggle.addEventListener('change', () => {
    const mins = parseInt(intervalInput.value, 10);
    if (toggle.checked) {
      if (!isNaN(mins) && mins > 0) {
        chrome.storage.local.set({ interval: mins, active: true }, () => {
          chrome.runtime.sendMessage({ type: 'start', interval: mins });
          updateStatus(true);
        });
      } else {
        statusEl.textContent = 'Please enter a valid number of minutes.';
        toggle.checked = false;
      }
    } else {
      chrome.storage.local.set({ active: false }, () => {
        chrome.runtime.sendMessage({ type: 'stop' });
        updateStatus(false);
      });
    }
  });

  /**
   * Update the status message and countdown depending on whether reminders
   * are active.
   * @param {boolean} active
   */
  function updateStatus(active) {
    toggle.checked = active;
    if (active) {
      statusEl.textContent = 'Break reminders are active.';
      startCountdown();
    } else {
      statusEl.textContent = 'Break reminders are stopped.';
      stopCountdown();
    }
  }

  function startCountdown() {
    stopCountdown();
    updateCountdown();
    countdownId = setInterval(updateCountdown, 1000);
  }

  function stopCountdown() {
    clearInterval(countdownId);
    countdownEl.textContent = 'Next break in: --';
  }

  function updateCountdown() {
    chrome.alarms.get('breakReminder', (alarm) => {
      if (alarm) {
        const diff = alarm.scheduledTime - Date.now();
        if (diff > 0) {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          countdownEl.textContent = `Next break in: ${minutes}m ${seconds}s`;
        } else {
          countdownEl.textContent = 'Next break soon...';
        }
      }
    });
  }
});

