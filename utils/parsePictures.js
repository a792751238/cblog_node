/**
 * Created by Dion on 16/7/9.
 */

const fs = require('fs');
const Q = require('q');
const mongo = require('./mongo');
const generateThumbnail = require('./thumbnail');

module.exports = data => {
    let size = parseInt(data.fileSize, 0);

    if (!size || size === 1) {
        return single();
    } else {
        return multiple();
    }

    function single() {
        if (data.picture0) {
            data.picture = data.picture0;
        }
        if (!data.picture) return Q.fcall(() => []);

        if (data.thumbnail) {
            return Q.fcall(() => [{
                picture: data.picture,
                thumbnail: data.thumbnail
            }]);
        } else {
            return getThumbnail(data.picture)
                .then(thumbnailId => {
                    return [{
                        picture: data.picture,
                        thumbnail: thumbnailId
                    }];
                });
        }
    }

    function multiple() {
        let pictures = [];
        for (let i = 0; i < size; ++i) {
            pictures.push({
                picture: data['picture' + i] || null,
                thumbnail: data['thumbnail' + i] || null
            });
        }

        return Q.all(pictures.map(item => {
            if (item.picture && item.thumbnail) {
                return Q.fcall(() => item);
            } else {
                return getThumbnail(item.picture)
                    .then(thumbnailId => {
                        return {
                            picture: item.picture,
                            thumbnail: thumbnailId
                        };
                    });
            }
        }));
    }
};

function getThumbnail(picture) {
    if (!picture) return Q.fcall(() => null);//如果picture是null，会导致这个方法没有返回promise值，最终导致55行的then方法出错
    let tmp_file_path = null;
    let tmp_thumbnail_path = null;

    return mongo.getFile(picture)
        .then(filePath => {
            tmp_file_path = filePath;
            //这一步需要ImageMagick
            return generateThumbnail(filePath);
        })
        .then(thumbnail => {
            if (!thumbnail) return null;
            tmp_thumbnail_path = thumbnail;
            return mongo.addFile(thumbnail)
                .then(file => file.fileId);
        })
        .finally(() => {
            if (tmp_file_path) fs.unlink(tmp_file_path);
            if (tmp_thumbnail_path) fs.unlink(tmp_thumbnail_path);
        });
}