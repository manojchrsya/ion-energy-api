const StreamArray = require('stream-json/streamers/StreamArray');
const { Writable } = require('stream');
const fs = require('fs');
const path = require('path');
const ThermoMeter = require('../models/ThermoMeter');

const BATCH_SIZE = 10000;

class ThermoMeterController {
  // eslint-disable-next-line class-methods-use-this
  async create(options) {
    return new ThermoMeter(options).save();
  }

  // eslint-disable-next-line class-methods-use-this
  async bulkInsert(options) {
    return ThermoMeter.insertMany(options);
  }

  // eslint-disable-next-line class-methods-use-this
  async getData() {
    // we can make it dynamic as of now use static value
    const serialNumber = 'THERM0001';
    const start = new Date('2015').valueOf();
    const end = new Date('2016').valueOf();
    return ThermoMeter.find({ ts: { $gt: start, $lt: end }, serialNumber })
      .sort({ ts: -1 })
      .select({ ts: 1, val: 1 })
      .skip(0)
      .limit(500);
  }

  // eslint-disable-next-line class-methods-use-this
  list(options = {}) {
    const query = {};
    const skip = options.skip || 0;
    const limit = options.limit || 10;
    return ThermoMeter.find(query)
      .sort({ ts: -1 })
      .select({ ts: 1, val: 1, serialNumber: 1 })
      .skip(skip)
      .limit(limit);
  }

  // eslint-disable-next-line class-methods-use-this
  importData({ uploadDir, targetFile, filename }) {
    const self = this;
    const fileStream = fs.createReadStream(targetFile);
    const jsonStream = StreamArray.withParser();
    let rows = [];
    const processingStream = new Writable({
      async write({ value }, _encoding, callback) {
        while (rows.length < BATCH_SIZE) {
          value.serialNumber = filename.replace('.rar', '');
          rows.push(value);
          return callback();
        }
        await self.bulkInsert(rows);
        rows = [];
        callback();
      },
      objectMode: true,
    });
    fileStream.pipe(jsonStream.input);
    jsonStream.pipe(processingStream);
    // eslint-disable-next-line arrow-body-style
    processingStream.on('finish', () => {
      if (fs.existsSync(targetFile)) {
        fs.unlinkSync(targetFile);
      }
      if (fs.existsSync(path.join(uploadDir, filename))) {
        fs.unlinkSync(path.join(uploadDir, filename));
      }
      // TODO :: send notification to user about the process has been complete.
    });
  }
}

module.exports = ThermoMeterController;
