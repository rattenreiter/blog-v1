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

const blogPostSchema = new mongoose.Schema(
    {
        _id: {
            type: Number,
            required: [true, 'Set Automatic timestamp as ID']
        },
        postHeadline: {
            type: String,
            required: [true, 'A Post Headline is needed']
        },
        postBody: {
            type: String,
            required: [true, 'A Post needs a text!']
        },
        postExcerpt: {
            type: String,
            required: [true, 'Post Excerpt needed']
        },
        postLink: {
            type: String,
            required: [true, 'Post Link is needed']
        }
    }
);

const blogSiteSchema = new mongoose.Schema(
    {
        siteHeadline: {
            type: String,
            required: [true, 'The Page needs a headline']
        },
        siteText: String,
        siteLink: {
            type: String,
            required: [true, 'The Site Route is needed']
        }
    }
)

const Site = mongoose.model('Site', blogSiteSchema);
const Post = mongoose.model('Post', blogPostSchema);

// GLOBAL VARIABLES
// ---------------------------------------------
let ejsSiteObjects = {
    siteTitle: '',
    siteText: '',
    posts: []
};

let ejsPostObject = {
    siteTitle: '',
    siteText: ''
}

//ROUTES
// ---------------------------------------------

const siteConstructor = () => {
            Site.find((err, sites) => {
            if (err) {
                console.log(err);
            } else {
                sites.forEach((site) => {
                    app.get(site.siteLink, (req, res) => {
                        ejsSiteObjects.siteTitle = site.siteHeadline;
                        ejsSiteObjects.siteText = site.siteText;
                        if (site.siteHeadline === 'Home') {
                            let postArray = [];
                            Post.find((err, posts) => {
                                if (err) {
                                    console.log(err);
                                } else {
                                    posts.forEach((post) => {
                                        postArray.push(post);
                                    });
                                    ejsSiteObjects.posts = postArray;
                                }
                            });
                            
                            console.log(ejsSiteObjects.posts);
                            ejsSiteObjects.posts.forEach((post) => {
                                app.get(post.postLink, (request, response) => {
                                    ejsPostObject.siteTitle = post.postHeadline;
                                    ejsPostObject.siteText = post.postBody;
                                    response.render("post", ejsPostObject);
                                });
                            });
                        } else {
                            //ejsSiteObjects.posts = [];
                            console.log('Was machst Du hier?');
                        }
                        res.render("site", ejsSiteObjects);
                    });
                });
            }
        })
};

siteConstructor();


// POSTS
// ---------------------------------------------
app.post("/", (req, res) => {
    let postHeadline = req.body.postHeadline;
    let postText = req.body.postText;
    let postLink = postHeadline.replace(/[^0-9a-z\ ]/gi, '').toLocaleLowerCase();
    postLink = '/posts/' + postLink.replace(/ /g,'-');
    let postExcerpt = postText.slice(0, 100);

    const post = new Post(
        {
            _id: Date.now(),
            postHeadline: postHeadline,
            postBody : postText,
            postExcerpt: postExcerpt,
            postLink: postLink
        }
    )

    Post.insertMany([post], (err, posts) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Post Saved Successfully!');
        }
    });

    //ejsSiteObjects.posts.push(post);
    siteConstructor();
    res.redirect("/");
});

// SERVER
// ---------------------------------------------
app.listen(process.env.PORT || 3000, () => {
    console.log('Server ON on Port 3000');
});


