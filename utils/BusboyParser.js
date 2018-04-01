/**
 * Created by fuhuo on 2018/4/1.
 */
const Busboy = require('busboy');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const Q = require('q');
const os = require('os');
const util = require('util');

// funcMakeOutputStream with the flowing format
// promise pipeTo(fileInfo, inputStream)

function BusboyParser(req, pipeTo) {
    this.req = req;
    this.fields = {};
    this.promises = [];
    this.pipeTo = pipeTo || fileStream;

    function fileStream(fileInfo = {}, inputStream) {
        let deferred = Q.defer();
        let fileName = fileInfo.fileName || 'no_name';
        let savePath = path.join(os.tmpDir(), fileName);
        let output = fs.createWriteStream(savePath);  // Create a file write stream
        output.on('error', function (error) {
            deferred.reject(error);
        });
        output.on('finish', function () {
            fileInfo.savePath = savePath;
            deferred.resolve(fileInfo);
        });
        inputStream.pipe(output);
        return deferred.promise;
    }
}

BusboyParser.prototype.validate = function () {
    return true;
};

BusboyParser.prototype.parse = function () {
    let deferred = Q.defer();
    let self = this;

    function onFile(fieldname, stream, filename, encoding, mimetype) {
        let fileInfo = {
            'fieldName': fieldname,
            'fileName': filename,
            'encoding': encoding,
            'mimeType': mimetype
        };
        let promise = self.pipeTo(fileInfo, stream);
        self.promises.push(promise);
    }

    function onField(fieldname, val, fieldnameTruncated, valTruncated) {
        fieldname = _.trimEnd(fieldname, '[]');
        if (!_.has(self.fields, fieldname)) {
            self.fields[fieldname] = val;
            return;
        }
        let curValue = self.fields[fieldname];
        if (util.isArray(curValue)) {
            self.fields[fieldname].push(val);
        } else {
            let ary = [];
            ary.push(curValue);
            ary.push(val);
            self.fields[fieldname] = ary;
        }
    }

    function onFinish() {
        if (self.promises.length === 0) {
            deferred.resolve(self.fields);
            return;
        }
        Q.all(self.promises)
            .then(uploadFiles => {
                if (!uploadFiles || !uploadFiles.length) {
                    deferred.resolve(self.fields);
                    return;
                }
                self.fields.fileSize = self.fields.fileSize || uploadFiles.length;

                let fieldNames = uploadFiles.map(file => file.fieldName);
                fieldNames = _.groupBy(fieldNames);
                let sameFields = {};
                _.forOwn(fieldNames, (value, key) => {
                    if (value.length > 1) {
                        sameFields[key] = 0;
                    }
                });

                if (!_.isEmpty(sameFields)) {
                    uploadFiles.forEach(file => {
                        let field = file.fieldName;
                        if (_.has(sameFields, field)) {
                            file.fieldName = `${field}${sameFields[field]}`;
                            sameFields[field]++;
                        }
                    });
                }

                uploadFiles.forEach(file => {
                    if (file.fileId) {
                        self.fields[file.fieldName] = file.fileId;
                    } else if (file.savePath) {
                        self.fields[file.fieldName] = file.savePath;
                    }
                });
                deferred.resolve(self.fields);
            })
            .catch(error => {
                deferred.reject(error);
            });
    }

    //modified by dsj,设置默认field大小为10M，视口数据可能比较大
    let busboy = new Busboy({headers: this.req.headers, limits: {fieldSize: 10 * 1024 * 1024}});

    busboy.on('file', onFile)
    busboy.on('field', onField);
    busboy.on('finish', onFinish);

    this.req.pipe(busboy);
    return deferred.promise;
};

BusboyParser.prototype.parseForm = function () {
    let deferred = Q.defer();
    let self = this;
    let busboy = new Busboy({headers: this.req.headers});
    busboy.on('field', onField);
    busboy.on('finish', onFinish);

    function onField(fieldname, val) {
        if (!self.fields.hasOwnProperty(fieldname)) {
            return self.fields[fieldname] = val;
        }
    }

    function onFinish() {
        return deferred.resolve(self.fields);
    }

    this.req.pipe(busboy);
    return deferred.promise;
};

module.exports = BusboyParser;