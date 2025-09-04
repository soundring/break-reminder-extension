const fs = require('fs');
const path = require('path');

describe('popup behavior', () => {
  beforeEach(() => {
    jest.resetModules();
    document.body.innerHTML = fs.readFileSync(
      path.join(__dirname, '..', 'popup.html'),
      'utf8'
    );

    global.chrome = {
      storage: {
        local: {
          get: jest.fn((keys, cb) => cb({})),
          set: jest.fn((data, cb) => cb()),
        },
      },
      runtime: {
        sendMessage: jest.fn(),
      },
    };

    require('../popup.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
  });

  test('shows active status after starting', () => {
    const interval = document.getElementById('interval');
    const startBtn = document.getElementById('start');

    interval.value = '30';
    startBtn.click();

    expect(document.getElementById('status').textContent).toBe(
      'Break reminders are active.'
    );
  });
});
