const fs = require('fs');
const path = require('path');
const formidable = require('formidable');
const { v1: uuidv1 } = require('uuid');

const Book = require('../../models/book');
const Author = require('../../models/author');
const Utils = require('../../utils/utils');

async function getBooks(req, res) {
    console.log(req.query);
    console.log(Utils.getDataRoot());

    let books = await Book.getBooks(req.query.book_title, req.query.author_name);

    books.forEach(elem => {
        elem.description_url = fs.readFileSync(path.join(Utils.getDataRoot() + elem.description_url), 'utf8');
    });

    console.log(books);
    res.json({ books });
}

async function addBook(req, res) {
    console.log(req.body);

    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
        console.log(fields);

        const id = uuidv1();
        const authorName = fields.author_name;
        const title = fields.book_title;

        const [ authorId, url, descUrl ] = await Promise.all([
            Author.getAuthorIdByName(authorName),
            Utils.createBookUrl(id, authorName, title, files.book_file),
            Utils.createBookDescriptionUrl(id, authorName, title, fields.book_desc)
        ]);

        await Book.addBook(id, authorId, title, descUrl, url);

        res.json({ result: 'Book was added successfully' });
    });
}

async function getBookFile(req, res) {
    console.log('params', req.params);
    try {
        const book = await Book.getBookById(req.params.id)
        const root = Utils.getFileRoot(book.url);
        res.sendFile(root);
    } catch (err) {
        console.log(err);
    }
}

module.exports = { getBooks, addBook, getBookFile };
