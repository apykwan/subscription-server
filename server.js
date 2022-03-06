const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { readdirSync } = require('fs');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000; 
// db
mongoose
    .connect(process.env.DATABASE, {})
    .then(() => console.log("DB connected"))
    .catch((err) => console.log("DB Error => ", err));

// middlewares
app.use(express.json({ limit: "5mb" }));
app.use(cors());
app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

// autoload routes
readdirSync('./routes').map(route => app.use('/api', require(`./routes/${route}`)));

// load the index.html in public folder built by react
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
// });


// listen
app.listen(PORT, () => console.log(`This is server is running on port ${PORT}`));