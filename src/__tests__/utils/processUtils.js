/**
 * Test utilities for mocking process and child_process operations
 * Provides utilities to mock spawning processes in tests
 */

/**
 * Mock process object with spy capabilities
 */
export class MockProcess {
  constructor(options = {}) {
    this.pid = options.pid || 12345;
    this.exitCode = options.exitCode || null;
    this.killed = false;
    this.listeners = {};
    this.signals = [];
  }

  kill(signal = "SIGTERM") {
    this.signals.push(signal);
    this.killed = true;
    this.exitCode = 1;
    this._emit("exit", this.exitCode);
    return true;
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return this;
  }

  once(event, callback) {
    const wrappedCallback = (...args) => {
      callback(...args);
      this.removeListener(event, wrappedCallback);
    };
    return this.on(event, wrappedCallback);
  }

  removeListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback
      );
    }
    return this;
  }

  _emit(event, ...args) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(...args));
    }
  }

  getSignals() {
    return this.signals;
  }
}

/**
 * Create a mock spawn function that returns a MockProcess
 */
export function createMockSpawn(options = {}) {
  const processes = [];

  const spawn = (...args) => {
    const mockProcess = new MockProcess(options);
    processes.push({
      command: args[0],
      args: args[1] || [],
      process: mockProcess,
    });
    return mockProcess;
  };

  spawn.getProcesses = () => processes;
  spawn.clear = () => {
    processes.length = 0;
  };
  spawn.getLastProcess = () => processes[processes.length - 1];

  return spawn;
}

/**
 * Create a mock child_process module
 */
export function createMockChildProcess() {
  const mockSpawn = createMockSpawn();

  return {
    spawn: mockSpawn,
    exec: (command, callback) => {
      const mockProcess = new MockProcess();
      setTimeout(() => {
        callback(null, "", "");
      }, 0);
      return mockProcess;
    },
    execFile: (file, args, callback) => {
      const mockProcess = new MockProcess();
      setTimeout(() => {
        callback(null, "", "");
      }, 0);
      return mockProcess;
    },
  };
}

/**
 * Track all spawned processes for assertion
 */
export class ProcessTracker {
  constructor() {
    this.spawnedProcesses = [];
    this.killedProcesses = [];
  }

  trackSpawn(command, args) {
    const mockProcess = new MockProcess();
    this.spawnedProcesses.push({ command, args, process: mockProcess });
    
    const originalKill = mockProcess.kill.bind(mockProcess);
    mockProcess.kill = (signal) => {
      this.killedProcesses.push({ command, signal: signal || "SIGTERM" });
      return originalKill(signal);
    };

    return mockProcess;
  }

  getSpawnedProcesses() {
    return this.spawnedProcesses;
  }

  getKilledProcesses() {
    return this.killedProcesses;
  }

  clear() {
    this.spawnedProcesses = [];
    this.killedProcesses = [];
  }
}
