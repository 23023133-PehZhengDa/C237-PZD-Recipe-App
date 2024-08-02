const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const app = express();

// Create MySQL connection
const connection = mysql.createConnection({
    //host: 'localhost',
    //user: 'root',
    //password: '',
    //database: 'onlinerecipeapp'
    host: 'mysql-pzdrecipeapp.alwaysdata.net',
    user: '371297',
    password: 'Imthesmiler_7774_',
    database: 'pzdrecipeapp_project'

});
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

app.set('view engine', 'ejs');

app.use(express.static('public'));

app.use(express.urlencoded({ extended: false }));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.mimetype.startsWith('image')) {
            cb(null, 'public/images');
        } else if (file.mimetype.startsWith('video')) {
            cb(null, 'public/videos');
        }
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });

app.get('/', (req, res) => {
    const category = req.query.category || 'all';
    let sql = 'SELECT * FROM recipes';
    let params = [];

    if (category !== 'all') {
        sql += ' WHERE category = ?';
        params.push(category);
    }

    connection.query(sql, params, (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving recipes');
        }
        res.render('index', { recipes: results });
    });
});

app.get('/recipe/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'SELECT * FROM recipes WHERE id = ?';
    connection.query(sql, [id], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving recipe by ID');
        }
        if (results.length > 0) {
            res.render('recipe', { recipe: results[0] });
        } else {
            res.status(404).send('Recipe not found');
        }
    });
});

app.get('/addRecipe', (req, res) => {
    res.render('addRecipe');
});

app.post('/addRecipe', upload.fields([{ name: 'image' }, { name: 'video' }]), (req, res) => {
    const { name, author, ingrediant, desc, instructions, time, nutrition, category } = req.body;
    let image, video;
    if (req.files.image) {
        image = req.files.image[0].filename;
    } else {
        image = null;
    }
    if (req.files.video) {
        video = req.files.video[0].filename;
    } else {
        video = null;
    }

    const sql = 'INSERT INTO recipes (image, video, name, author, ingrediant, `desc`, instructions, time, nutrition, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    connection.query(sql, [image, video, name, author, ingrediant, desc, instructions, time, nutrition, category], (error, results) => {
        if (error) {
            console.error("Error adding recipe:", error);
            res.status(500).send('Error adding recipe');
        } else {
            res.redirect('/');
        }
    });
});

app.get('/editRecipe/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'SELECT * FROM recipes WHERE id = ?';
    connection.query(sql, [id], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving recipe by ID');
        }
        if (results.length > 0) {
            res.render('editRecipe', { recipe: results[0] });
        } else {
            res.status(404).send('Recipe not found.');
        }
    });
});

app.post('/editRecipe/:id', upload.fields([{ name: 'image' }, { name: 'video' }]), (req, res) => {
    const id = req.params.id;
    const { name, author, ingrediant, desc, instructions, time, nutrition, category } = req.body;
    let image, video;

    if (req.files.image) {
        image = req.files.image[0].filename;
    } else {
        image = req.body.currentImage;  // Use the current image if no new image is uploaded
    }

    if (req.files.video) {
        video = req.files.video[0].filename;
    } else {
        video = req.body.currentVideo;  // Use the current video if no new video is uploaded
    }

    const sql = 'UPDATE recipes SET image = ?, video = ?, name = ?, author = ?, ingrediant = ?, `desc` = ?, instructions = ?, time = ?, nutrition = ?, category = ? WHERE id = ?';

    connection.query(sql, [image, video, name, author, ingrediant, desc, instructions, time, nutrition, category, id], (error, results) => {
        if (error) {
            console.error("Error updating recipe:", error);
            res.status(500).send('Error updating recipe');
        } else {
            res.redirect('/');
        }
    });
});

app.get('/deleteRecipe/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'DELETE FROM recipes WHERE id = ?';
    connection.query( sql , [id], (error, results) => {
        if (error) {
            //Handle any error that occurs during the database operation
            console.error("Error deleting recipe:", error);
            res.status(500).send('Error deleting recipe');
        } else {
            // Send a success response
            res.redirect('/');
        }
    });
});

app.get('/search', (req, res) => {
    const query = req.query.query;
    const sql = 'SELECT * FROM recipes WHERE name LIKE ?';
    connection.query(sql, [`%${query}%`], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving recipes');
        }
        res.render('index', { recipes: results });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
