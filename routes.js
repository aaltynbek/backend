const authController = require('./controllers/auth');
const userController = require('./controllers/user');
const routes = (app) => {
    app.post('/user', userController.getUsers);
    app.post('/user/register', authController.register);
    app.post('/allbooks', userController.allBooks);
    app.post('/mybooks', userController.myBooks);
    app.post('/addbook', userController.addBook);
    app.post('/rentedbooks', userController.rentedBooks);
};

module.exports = routes;