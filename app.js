//REQUIRES
// ---------------------------------------------
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');

// APP SETUP
// ---------------------------------------------
const app = express();
app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended:true }));

// MONGOOSE DB SETUP
// ---------------------------------------------
mongoose.connect('mongodb://localhost:27017/KD_Blog_Site');

const siteSchema = new mongoose.Schema(
    {
        _id: {
            type: Number,
            required: [true, 'Set Current timestamp as ID']
        },
        siteHeadline: {
            type: String,
            required: [true, 'A Post Headline is needed']
        },
        siteBody: {
            type: String,
            required: [true, 'A Post needs a text!']
        },
        siteExcerpt: {
            type: String,
            required: [true, 'Post Excerpt needed']
        },
        siteLink: {
            type: String,
            required: [true, 'Post Link is needed']
        },
        siteType: {
            type: Boolean,
            required: [true, 'Site (true) or Post (false)']
        }
    }
);



const Site = mongoose.model('Site', siteSchema);


// GLOBAL VARIABLES
// ---------------------------------------------
let ejsSiteObjects = {
    siteTitle: '',
    siteText: '',
    posts: []
};
let i = 0;
let j = 0;
const siteConstructor = () => {
    const siteArray = [];
    const postArray = [];
    ejsSiteObjects.posts = [];

    Site.find((err, sites) => {
        if (err) {
            console.log(err);
        } else {
            sites.forEach((site) => {
                if (site.siteType) {    
                    siteArray.push(site);
                    i++;
                } else {
                    postArray.push(site);
                    j++;
                }
            });
            ejsSiteObjects.posts = postArray;
            siteArray.forEach((site) => {
                app.get(site.siteLink, (req, res) => {
                    ejsSiteObjects.siteTitle = site.siteHeadline;
                    ejsSiteObjects.siteText = site.siteBody;
                    res.render('site', ejsSiteObjects);
                });
            });
            postArray.forEach((post) => {
                app.get(post.siteLink, (req, res) => {
                    ejsSiteObjects.siteTitle = post.siteHeadline;
                    ejsSiteObjects.siteText = post.siteBody;
                    res.render('post', ejsSiteObjects);
                });
            })
        }
    });
console.log(i,j);
}



//ROUTES
// ---------------------------------------------
siteConstructor();



// POSTS
// ---------------------------------------------
app.post("/", (req, res) => {
    let postHeadline = req.body.postHeadline;
    let postText = req.body.postText;
    let postLink = postHeadline.replace(/[^0-9a-z\ ]/gi, '').toLocaleLowerCase();
    let postExcerpt = postText.slice(0, 100);
    let siteOrPost = false;
    let linkPrefix = '/posts/';
    console.log(req.body.siteOrPost);
    if (req.body.siteOrPost) {
        siteOrPost = true; 
        linkPrefix = '/';
    }
    postLink = linkPrefix + postLink.replace(/ /g,'-');

    const post = new Site(
        {
            _id: Date.now(),
            siteHeadline: postHeadline,
            siteBody : postText,
            siteExcerpt: postExcerpt,
            siteLink: postLink,
            siteType: siteOrPost
        }
    )

    Site.insertMany([post], (err, posts) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Post Saved Successfully!');
        }
    });

    // Recall siteConstructor
    const reConstruct = async () => {
        await siteConstructor();
        res.redirect("/");
    }

    reConstruct();    
  
});

// SERVER
// ---------------------------------------------
app.listen(process.env.PORT || 3000, () => {
    console.log('Server ON on Port 3000');
});