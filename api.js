var express = require('express'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var port = process.env.PORT || 8080,
    mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/test',
    appUrl = process.env.APP_URL || 'https://fcc-url-shortener-merraysy.c9users.io';
    
mongoose.connect(mongoURI);

var link = new Schema({
    id: {
        type: String,
        unique: true
    },
    link: {
        type: String,
        unique: true
    },
    short: String
});

var Link = mongoose.model('Link', link);

var app = express();

function isURL(str) {
    
    var re = /^(https?:\/\/)([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    
    return re.test(str);
    
}

function randomID() {
    
    return Math.floor(Math.random() * 0x10000).toString(16);
    
}

app.use(function(req, res, next) {
    
  req.url = req.url.replace(/^(\/new\/)(.+)/, function($0, $1, $2) {
    return $1 + encodeURIComponent($2);
  });
  
  next();
  
});

app.param('url', function(req, res, next, url) {
    
    if (isURL(url)) {
        
        req.url = url;
        
    } else {
        
        res.end('Invalid URL');
        
    }
    
    next();
    
});

app.get('/new/:url', function(req, res) {
    
    var url = req.url,
        id = randomID(),
        newLink = new Link();
        
    newLink.id = id;
    newLink.link = url;
    newLink.short = appUrl + '/' + id;
    
    newLink.save(function(err, url) {
        
       if (err) {
           
           if (err.code === 11000) {
               
                Link.findOne({
                   link: req.url
                }, function(err, link) {
                    
                    if (err) {
                        
                        Link.findOne({ id: id }, function(err, link) {
                            
                            if (err) {
                                console.log(err.message);
                                res.end('Unknown Error, please try again.');
                            };
                            
                            var found = {
                                link: link.link,
                                short: link.short
                            }
                            
                            res.json(found);
                        });
                        
                    };
                    
                    var found = {
                        link: link.link,
                        short: link.short
                    }
                    
                    res.json(found);
                    
                });
               
           };
           
           return;
       };
       
       var added = {
           link: url.link,
           short: url.short
       }
       
       res.json(added);
        
    });
    
});

app.param('id', function(req, res, next, id) {
        
    req.id = id;
    
    next();
    
});

app.get('/:id', function(req, res) {
    
    Link.findOne({
       id: req.id
    }, function(err, link) {
        if (err) console.log(err.message);
        
        res.redirect(302, link.link);
    });
    
});

app.get('/', function(req, res) {
   
   res.end('Add new link ' + appUrl + '/new/{your link}');
    
});

app.listen(port, function() {
    
    console.log('Listening on port ' + port + '...');
    
});