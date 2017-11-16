/**
 * Created by easterCat on 2017/10/18.
 */
const express = require('express');
const router = express.Router();
const _ = require('lodash');

router.post('/createArticle', addOneArticle);
router.get('/articles', getPageArticle);
router.get('/article/:articleid', getOneArticle);
router.delete('/article/:articleid', deleteOneArticle);

const {marked, queryFilter} = require('../utils');

const {
    createArticle,
    getAllArticles,
    getOneArticleById,
    delOneArticleById,
    getAllArticlesCount,
    getAllArticleDate,
    increasePV
} = require('../lib/model/article.model');

const {
    delCommentsById
} = require('../lib/model/comment.model');

// POST /createArticle 创建一篇新文章
function addOneArticle(req, res) {
    let title = req.body.title;
    let content = req.body.content;

    let article = {
        title: title,
        content: content
    };

    createArticle(article).then((result) => {
        result = marked.contentToMarked(result);
        res.send(result);
    });
}

// GET /articles 获取分页的文章
function getPageArticle(req, res) {
    let filter = queryFilter(req);

    return Promise.all([
        getAllArticlesCount(),
        getAllArticles(filter),
        getAllArticleDate(),
    ])
        .then(results => {
            let result = marked.contentsToMarked(results[1]);
            let filterDate = _sortOutDate(results[2]);
            let obj = {
                articles: result,
                count: results[0],
                filterDate: filterDate
            };
            res.send(obj);
        })
        .catch(err => {
            console.log('getPageArticle is error : ', err);
        });


    function _sortOutDate(date) {
        let new_date = date.map(i => {
            return _.pick(i, 'createDate');
        });

        let year_arr = [];
        let filter = {};

        for (let i = 0; i < new_date.length; i++) {
            let year = new Date(new_date[i].createDate).getFullYear();
            if (_.indexOf(year_arr, year) === -1) {
                year_arr.push(year);
            }
        }


        for (let j = 0; j < year_arr.length; j++) {
            let month = new_date.filter((item) => {
                let year = new Date(item.createDate).getFullYear();
                return year === year_arr[j];
            });
            filter[`${year_arr[j]}`] = month;
        }
        return filter;
    }
}

// GET  /article/:id 获取相应id号的文章
function getOneArticle(req, res) {
    let id = req.params.articleid;

    getOneArticleById(id)
        .then((result) => {
            console.log(result);
            result = marked.contentToMarked(result);
            return result;
        })
        .then(result => {
            return increasePV(result._id);
        })
        .then(result => {
            res.send(result);
        })
        .catch((err) => {
            console.log(err);
        });
}

// DELETE /article/:articleid 通过id删除一篇文章
function deleteOneArticle(req, res) {
    let id = req.params.articleid;
    delOneArticleById(id).then((result) => {
        //删除文章后将文章下的留言也一并删除
        delCommentsById(result._id);
        res.send(result);
    });
}

module.exports = router;