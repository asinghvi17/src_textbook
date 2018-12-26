// Objects
var express = require("express");
var app = express();
var server = require("http").Server(app);
var fs = require("fs");
global.uuid = require("uuid/v4");

// Path to database files
var path = __dirname + "/data/";

// Imports
var textbooks = require("./textbooks");

// Open database
const sqlite3 = require('sqlite3').verbose();
global.db = new sqlite3.Database(path + "offers.db", sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the database.');
});

global.db.serialize(() => {
  // Queries scheduled here will be serialized.
  global.db.run("CREATE TABLE textbooks(uuid NOT NULL PRIMARY KEY, bookName TEXT, isbn TEXT, author TEXT)", (err) =>{
    if (err){}
  });
  global.db.run("CREATE TABLE sellers(uuid NOT NULL PRIMARY KEY, name TEXT, \
  price DOUBLE, email TEXT, password TEXT, book_id, FOREIGN KEY (book_id) \
  REFERENCES textbooks(uuid))", (err) => {
    if (err){}
  });
  global.db.run("CREATE TABLE buyers(uuid NOT NULL PRIMARY KEY, name TEXT, \
  price DOUBLE, email TEXT, password TEXT, book_id, FOREIGN KEY (book_id) \
  REFERENCES textbooks(uuid))", (err) => {
    if (err){}
  });
  global.db.run("PRAGMA foreign_keys = ON", (err) => {
    if (err){}
  });
});

// body-parser
var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Static elements
app.use("/css", express.static(__dirname + "/css"));
app.use("/js", express.static(__dirname + "/js"));
app.use("/", express.static(__dirname + "/html"));

// Send homepage
app.get("/", function(req, res) {
  res.sendFile(__dirname + "/html/welcome.html");
});

// General method for sending buying/selling table
function get_table(req, res, table) {
  // Don't retrieve password, otherwise it's accessible client-side
  // Use an inner join to get the textbook name
  global.db.all("SELECT a.uuid, a.name, a.price, a.email, a.book_id, b.bookName FROM "
  + table + " AS a INNER JOIN textbooks AS b ON a.book_id = b.uuid", (err, rows) => {
    if (err) {
      throw err;
    }

    res.send(rows);
  });
}

// General method for inserting data
function post_entry(req, res, table) {
  var id = uuid();
  var name = req.body.name;
  var price = req.body.price;
  var email = req.body.email;
  var password = req.body.password;
  var book_id = req.body.book_id;

  if(!book_id) {
    book_id = textbooks.insert(req, res);
  }

  var data = [id, name, price, email, password, book_id];

  global.db.run("INSERT INTO " + table + " VALUES(?, ?, ?, ?, ?, ?)", data);
  get_table(req, res, table);
}

// General method for deleting data
function delete_entry(req, res, table) {
  var id = req.body.id;
  var password = req.body.password;

  global.db.all("SELECT password FROM " + table + " WHERE uuid = \"" + id +"\"", (err, rows) => {
    if (err) {
      throw err;
    }

    if(password === rows[0].password) {
      global.db.run("DELETE FROM " + table + " WHERE uuid = \"" + id + "\"");

      get_table(req, res, table);
    }
    else {
      res.send();
    }
  });
}

// GET request for getting selling data
app.get("/getSellData", function(req, res) {
  get_table(req, res, "sellers");
});

// GET request for getting buying data
app.get("/getBuyData", function(req, res) {
  get_table(req, res, "buyers");
});

// GET request for getting textbook data
app.get("/getTextbookData", textbooks.get_table);

// POST request for inserting sell data
app.post("/postSellData", function(req, res) {
  post_entry(req, res, "sellers");
});

// POST request for inserting buy data
app.post("/postBuyData", function(req, res) {
  post_entry(req, res, "buyers");
});

// DELETE request for deleting sell data
app.delete('/deleteSellData', function(req, res) {
  delete_entry(req, res, "sellers");
});

// DELETE request for deleting buy data
app.delete('/deleteBuyData', function(req, res) {
  delete_entry(req, res, "buyers");
});

// Listen on the server
server.listen(8080, function() {
  console.log("Server running on port 8080.")
});
