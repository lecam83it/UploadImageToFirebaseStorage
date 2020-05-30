"use strict"
const express = require('express');
const app = express();
const { Storage } = require("@google-cloud/storage");
const Multer = require('multer');
const { format } = require('util');
const cors = require('cors');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

app.use(cors());
const storage = new Storage({
  projectId: 'projectdemo-857ef',
  keyFilename: 'google-services.json'
})

const bucket = storage.bucket('projectdemo-857ef.appspot.com');

const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  }
})

app.get('/', function (request, response) {
  response.json({ message: 'Hello' })
});

app.post('/upload-images', multer.array('images'), async function (request, response) {
  try {
    let images = request.files;
    let response_images = [];
    if (!!images) {
      response_images = await Promise.all(images.map(function(image) {
        return uploadImageToStorage(image);
      }));
    }
    response.status(201).json({
      images: response_images
    })
  } catch (error) {
    response.status(500).json({
      images: [],
      error : ''
    })
  }
});

/**
 * Upload the image file to Google Storage
 * @param {Files} images object that will be uploaded to Google Storage
*/

const uploadImageToStorage = (image) => {
  return new Promise(function (resolve, reject) {
    if (!image) {
      reject(`No image-files`);
    }
    let fileName = `${Date.now()}_${image.originalname}`;
    let fileUpload = bucket.file(fileName);

    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: image.mimetype
      }
    });

    blobStream.on('error', function (error) {
      reject('Something is wrong! Unable to upload at the moment.');
    });

    blobStream.on('finish', function () {
      const url = format(`https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${fileUpload.name}?alt=media`);
      resolve(url);
    });
    blobStream.end(image.buffer);
  });
}

app.listen(PORT, function (error) {
  console.log(`Server is running on PORT=${PORT}`)
});