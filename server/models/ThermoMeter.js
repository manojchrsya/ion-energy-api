const mongoose = require('mongoose');

mongoose.set('useCreateIndex', true);

const { Schema } = mongoose;

const ThermoMeterSchema = new Schema({
  serialNumber: String,
  ts: String,
  val: String,
});

ThermoMeterSchema.index({ ts: 1, val: 1 });

module.exports = mongoose.model('ThermoMeter', ThermoMeterSchema);
