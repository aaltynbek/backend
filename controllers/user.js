const mysqlDb = require('../services/mysql');
const userModel = require('../models/user');
const Jimp = require('jimp');
const fs = require('fs');

var book = [];
const data = {
    getUsers: (req, res) => {
        const email = req.body.email;
        mysqlDb.query('SELECT user_id, email, name FROM users WHERE email=?', [email], (err, user)=>{
            if(err) {
                res.send({
                    success: false
                })
            }
            else{
                res.send({
                    success: true,
                    user: user
                })
            }
        })
    },
    allBooks: (req, res) => {
        // const email = req.body.email;
        mysqlDb.query('SELECT book_id, title, name, author, rented, users.user_id FROM books INNER JOIN users on books.user_id = users.user_id ', (error, books)=>{
            if(error) {
                res.send({
                    success: false
                })
            }
            else{
                res.send({
                    success: true,
                    books: books
                })
            }
        })
    },
    rentedBooks: (req, res) => {
        // const email = req.body.email;
        mysqlDb.query('SELECT book_id, title, name, author, users.user_id FROM books INNER JOIN users on books.user_id = users.user_id  WHERE rented=true', (error, books)=>{
            if(error) {
                res.send({
                    success: false
                })
            }
            else{
                res.send({
                    success: true,
                    books: books
                })
            }
        })
    },
    myBooks: (req, res) => {
        const user_id = req.body.user_id;
        mysqlDb.query('SELECT book_id, title, name, author,rented,request FROM books INNER JOIN users on books.user_id = users.user_id WHERE users.user_id=?', [user_id], (error, books)=>{
            if(error) {
                res.send({
                    success: false
                })
            }
            else{
                res.send({
                    success: true,
                    books: books
                })
            }
        })
    },

    addBook: (req, res) => {
        //Добавляем пароль и сохраняем в базе
        const title = req.body.title;
        const author = req.body.author;
        const user_id = req.body.user_id;
        mysqlDb.query('INSERT INTO books (title, author, user_id) VALUES (?,?,?)', [title, author, user_id], (err, resQuery) => {

            if (err) {
                console.log(err);
                return res.json({success: false, error: 'Па каким-то причинам не удалось завершить операцию'});
            }
            else {
                res.json({success: true, user: title});
            }
        });

    },
};

module.exports = data;