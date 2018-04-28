/**
 * Created by Dion on 16/7/9.
 */

const easyimg = require('easyimage');
const path = require('path');
const os = require('os');
const shortid = require('./shortId');
const logger = require('./logger/log');

module.exports = (img, thumbnail_size) =
>
{
    thumbnail_size = thumbnail_size || 300; // K

    return easyimg.info(img)
            .then(file = > {
            if (
    !file
)
    {
        throw new Error('cannot find the image: ' + img);
    }

    let ratio = 1;
    let fileSize = file.size / 1000;
    if (fileSize > thumbnail_size) {
        ratio = fileSize / thumbnail_size;
    }

    ratio = Math.sqrt(ratio);
    let dst = path.join(os.tmpdir(), shortid());


    return easyimg.thumbnail({
        src: img,
        dst: dst,
        width: file.width / ratio,
        height: file.height / ratio,
        x: 0,
        y: 0
    });
})
.
    then(file = > {
        if (
    !file
)
    {
        throw new Error('create thumbnail failed ' + img);
    }
    return file.path;
})
.
    catch(err = > {
        // logger.error(err);
        throw new Error('this is thumbnail bug =>', err)
        return null
    }
)
}
;