const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;


app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.static(path.join(__dirname, 'dist')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'mintbot.html'));
});

app.listen(port, () => {
  console.log(`Serveur run on http://localhost:${port}`);
});



