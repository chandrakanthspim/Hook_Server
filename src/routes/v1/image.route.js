const express = require('express');
const auth = require('../../middlewares/auth');
const config = require('../../config/config');
const MongoClient = require('mongodb').MongoClient;
const mongoClient = new MongoClient(config.mongoose.url);
const GridFSBucket = require('mongodb').GridFSBucket;
const fs = require('fs');

const router = express.Router();

const imageViewController = async (req, res) => {
  try {
    await mongoClient.connect();

    const database = mongoClient.db('test');

    const imageBucket = new GridFSBucket(database, {
      bucketName: 'photos',
    });
    // var mimetype = mime.getType(req.params.filename);
    // console.log(mimetype);
    let downloadStream = imageBucket.openDownloadStreamByName(req.params.filename);
    // res.setHeader('Content-disposition', 'attachment; filename=' + req.params.filename);
    res.setHeader('Content-type', 'image/png');
    downloadStream
      .pipe(fs.createWriteStream('./' + req.params.filename))
      .on('error', function (error) {
        console.log('error' + error);
        res.status(404).json({
          msg: error.message,
        });
      })
      .on('finish', function () {
        console.log('done!');
        // res.send('Downloaded successfully!');
      });
    downloadStream.on('data', function (data) {
      return res.status(200).write(data);
    });
    downloadStream.on('error', function (err) {
      return res.status(404).send({ message: 'Cannot download the Image!', err: err });
    });
    downloadStream.on('end', () => {
      return res.end();
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Error Something went wrong',
      error,
    });
  }
};

router.route('/:filename').get(imageViewController);
// router.route('/getProjectImages/:projectId').get(imageListController);

module.exports = router;
