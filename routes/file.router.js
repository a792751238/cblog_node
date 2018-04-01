/**
 * Created by easterCat on 2017/10/25.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const {uploadPath} = require('../config/default');
const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const Q = require('q');
const readChunk = require('read-chunk');
const imageType = require('image-type');
const sizeOf = require('image-size');
const BusboyParser = require('../utils/BusboyParser');
const parsePictures = require('../utils/parsePictures');
const mongo = require('../utils/mongo');
const streamBuffers = require('stream-buffers');

router.post('/picture', uploadPictures);
router.get('/picture/:pic_id', backPicture);

const {
    getPicAndSaved,
    findPicById,
    findPic,
    removePicture
} = require('../lib/file/models/file.model');

//通过id返回一张图片
function backPicture(req, res) {
    let id = req.params.pic_id;

    if (id) {
        findPicById(id)
            .then((result) => {
                let pic_path = path.join(result.path, result.filename);
                fs.readFile(pic_path, 'binary', (error, file) => {
                    if (error) {
                        res.send(error);
                    } else {
                        res.writeHead(200, {'Content-Type': 'image/jpeg'});
                        res.write(file, 'binary');
                        res.end();
                    }
                });
            });
    } else {
        res.send("can't get the id");
    }
}

//上传一张图片并且保存在upload文件夹中
async function uploadPictures(req, res) {
    let data = await new BusboyParser(req, mongo.setFile.bind(mongo))
        .parse()
        .then(data => {
            console.log('處理后的數據', data)
            if (_.isEmpty(data)) {
                throw new Error('data is null')
            }
            return parsePictures(data)
        })
        .catch(error => {
            console.log('上傳圖片出現錯誤，错误原因=>', error)
        })

    res.send(data);
}

module.exports = router;