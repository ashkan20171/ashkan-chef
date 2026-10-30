/** Runs async mutations one at a time while allowing later tasks after a failure. */
export function createAsyncSerialQueue() {
  let tail = Promise.resolve();
  let pending = 0;

  return {
    run(task) {
      if (typeof task !== 'function') return Promise.reject(new TypeError('Queue task must be a function'));
      pending += 1;
      const result = tail.then(task);
      tail = result.then(() => { pending -= 1; }, () => { pending -= 1; });
      return result;
    },
    get pending() { return pending; },
  };
}
