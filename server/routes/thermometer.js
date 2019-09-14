const express = require('express');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const Unrar = require('node-unrar');

const ThermoMeter = require('../controllers/ThermoMeter');

const router = express.Router();
const thermoMeterInstance = new ThermoMeter();
const uploadDir = './uploads';

// Get all ThermoMeter Logs
router.get('/', async (req, res) => {
  const data = await thermoMeterInstance.list(req.query);
  return res.send(data);
});

router.get('/getDetails', async (req, res) => {
  const data = await thermoMeterInstance.getData();
  return res.send(data);
});

// eslint-disable-next-line arrow-body-style
router.post('/upload', async (req, res) => {
  req.pipe(req.busboy);
  req.busboy.on('file', (_fieldname, file, filename) => {
    // validate file should be rar file
    if (filename.split('.').pop() !== 'rar') {
      return res.status('400').send({ message: 'invalid file type' });
    }
    // Create a write stream of the new file
    const fstream = fs.createWriteStream(path.join(uploadDir, filename));
    // Pipe it trough
    file.pipe(fstream);
    // On finish of the upload
    fstream.on('close', () => {
      const rar = new Unrar(path.join(uploadDir, filename));
      const targetFile = path.join(uploadDir, filename.replace('.rar', '.json'));
      if (fs.existsSync(targetFile)) {
        fs.unlinkSync(targetFile);
      }
      rar.extract(path.join(uploadDir), null, (error) => {
        if (error) {
          return res.status(400).send({ message: error.message });
        }
        // insert all data in backgroud
        cp.fork(thermoMeterInstance.importData({
          uploadDir,
          targetFile,
          filename,
        }), { silent: true });
        return res.send({ message: 'file uploaded succesfully.' });
      });
    });
  });
});

module.exports = router;
