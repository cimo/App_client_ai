(function () {
  if (typeof ReadableStream === "undefined") {
    return;
  }

  if (!ReadableStream.prototype.values) {
    ReadableStream.prototype.values = async function* () {
      const reader = this.getReader();

      try {
        while (true) {
          const result = await reader.read();

          if (result.done) {
            return;
          }

          yield result.value;
        }
      } finally {
        reader.releaseLock();
      }
    };
  }

  if (!ReadableStream.prototype[Symbol.asyncIterator]) {
    ReadableStream.prototype[Symbol.asyncIterator] = ReadableStream.prototype.values;
  }
})();