describe('scheduleBreakAlarm', () => {
  let scheduleBreakAlarm;

  beforeEach(() => {
    jest.resetModules();
    const now = Date.now();
    global.chrome = {
      alarms: {
        create: jest.fn(),
        get: jest.fn((name, cb) => cb({ scheduledTime: now + 60000 })),
        clear: jest.fn(),
      },
      action: {
        setBadgeText: jest.fn(),
        setBadgeBackgroundColor: jest.fn(),
      },
      runtime: { onInstalled: { addListener: jest.fn() }, onStartup: { addListener: jest.fn() }, onMessage: { addListener: jest.fn() } },
      tabs: { create: jest.fn() },
      notifications: { onButtonClicked: { addListener: jest.fn() }, create: jest.fn(), clear: jest.fn() },
      storage: { local: { get: jest.fn(), set: jest.fn() } },
    };
    scheduleBreakAlarm = require('../background').scheduleBreakAlarm;
  });

  test('uses provided initial delay', () => {
    scheduleBreakAlarm(30, 5);
    expect(chrome.alarms.create).toHaveBeenCalledWith('breakReminder', {
      delayInMinutes: 5,
      periodInMinutes: 30,
    });
  });
});

