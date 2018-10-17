const express = require("express");
const app = express();
const hb = require("express-handlebars");
const db = require("./db/db");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const bc = require("./db/bcrypt");
const csurf = require("csurf");

app.use(
    cookieSession({
        secret: `yolo innit bruv`,
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);
app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: false }));

app.use(csurf()); //middleware fore csurf

app.engine(
    "handlebars",
    hb({
        default: "main"
    })
);
app.set("view engine", "handlebars");

////////////////middleware
app.use(function(req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
});

//global middleware

app.use(express.static("public"));

/////////////post and get reqs

///////////HOME PAGE // NEW USER PAGE//////////////
app.get("/", (req, res) => {
    if (req.cookies.signed != "signed") {
        res.render("landingpage", {
            layout: "main",
            error: "Please fill in ALL fields or Log in" // link that to your handle bars main with {{ error }}
        });
    } else {
        res.redirect("/alreadysigned");
    }
});
app.get("/registration", (req, res) => {
    if (req.cookies.signed != "signed") {
        res.render("registration", {
            layout: "main",
            error: "Please fill in ALL fields or Log in" // link that to your handle bars main with {{ error }}
        });
    } else {
        res.redirect("/alreadysigned");
    }
});

app.post("/registration", (req, res, next) => {
    if (
        !req.body.firstname ||
        !req.body.lastname ||
        !req.body.email ||
        !req.body.password
    ) {
        res.render("home", {
            layout: "main",
            error: "Please fill in ALL fields or Log in" // link that to your handle bars main with {{ error }}
        });
    } else {
        let email = req.body.email;
        let emailToCheck = email.includes("@");
        // console.log(req.body);
        if (!emailToCheck) {
            res.render("home", {
                layout: "main",
                error: "Please use a proper email address" // link that to your handle bars main with {{ error }}
            });
        } else {
            bc.hashPassword(req.body.password).then(function(hashedPassword) {
                db.createUser(
                    req.body.firstname,
                    req.body.lastname,
                    req.body.email,
                    hashedPassword
                ).then(newUser => {
                    req.session.userId = newUser.id;
                    res.redirect("/additionalinfo");
                });
            });
        }
    }
});

///////////////////ADDITIONAL INFO PAGE/////////////////////

app.get("/additionalinfo", (req, res) => {
    // console.log(req.session.userId);
    if (req.body.age == "") {
        req.body.age = NULL;
    } else {
        if (!req.session.userId) {
            res.redirect("/");
        } else
            res.render("additionalinfo", {
                layout: "main"
            });
    }
});

//add 4th argument to addinfo db function req.ession.userId = 4th argument

app.post("/additionalinfo", (req, res, next) => {
    // console.log("from post rout of add info: ", req.session.userId);
    let userid = req.session.userId;
    let city = req.body.city;
    let cityCaps = city.toUpperCase();
    db.addInfo(Number(req.body.age), cityCaps, req.body.homepage, userid).then(
        newInfo => {
            res.redirect("/newsigner");
        }
    );
});

/////////////////LOGINPAGE///////////////////////
app.get("/login", (req, res) => {
    res.render("loginpage", {
        layout: "main"
    });
});

app.post("/login", (req, res, next) => {
    var comparePassword = "";

    if (req.body.email == "" || req.body.password == "") {
        res.render("loginpage", {
            layout: "main",
            error: "Please fill all the required information"
        });
    } else {
        db.returnUser(req.body.email)
            .then(user => {
                if (user == undefined) {
                    res.render("loginpage", {
                        layout: "main",
                        error: "User does not exist. Please register"
                    });
                } else {
                    console.log("user from login server", user);
                    bc.checkPassword(req.body.password, user.hashed_password)
                        .then(samePasswordChecker => {
                            // console.log(
                            //     "samePasswordChecker",
                            //     samePasswordChecker
                            // );
                            if (samePasswordChecker) {
                                req.session.userId = user.id;
                                db.getAllSigByUserId(req.session.userId).then(
                                    siginfo => {
                                        req.session.signatureId = siginfo.id;
                                        // console.log("req.session", req.session);
                                        res.redirect("/thankyoupage");
                                    }
                                );
                            } else {
                                res.render("loginpage", {
                                    layout: "main",
                                    error:
                                        "Wrong Password, please check and try again"
                                });
                            }
                        })
                        .catch(err => {
                            console.log(err);
                        });
                }
            })
            .catch(err => {
                console.log(err);
            });
    }
});

//////////////////NEW SIGNER PAGE//////////////////
app.get("/newsigner", (req, res) => {
    //in here make a db query to chek if the user has a signature and redirect to the thank you page if they
    if (!req.session.userId) {
        res.redirect("/login");
    } else {
        res.render("newsigner", {
            layout: "main"
        });
    }
});

//make middleware to redirect people to the sign up page if they do not have a session value
// app.use()

app.post("/newsigner", (req, res) => {
    var userid = req.session.userId;
    if (!req.body.firstname || !req.body.lastname || !req.body.signature) {
        res.render("newsigner", {
            layout: "main",
            error: "Please fill in ALL required fields"
        });
    } else {
        if (!req.session.signatureId) {
            // console.log("newSig.id =", req.session.signatureId);

            db.insertSig(
                userid,
                req.body.firstname,
                req.body.lastname,
                req.body.signature
            ).then(newSig => {
                // console.log(newSig);
                req.session.signatureId = newSig.id;
                res.redirect("/thankyoupage");
            });
        } else {
            // console.log("userid variable: ", userid);
            db.updateSig(
                userid,
                req.body.firstname,
                req.body.lastname,
                req.body.signature
            ).then(newSig => {
                // console.log(newSig);
                req.session.signatureId = newSig.id;
                res.redirect("/thankyoupage");
            });
        }
    }
});

app.get("/thankyoupage/", (req, res) => {
    console.log("it's getting to the ty route and the session is", req.session);
    if (!req.session.userId) {
        res.redirect("/login");
    } else {
        if (!req.session.signatureId) {
            res.redirect("/newsigner");
        } else {
            db.getSigById(req.session.userId)
                .then(sig => {
                    // console.log("sig: ", sig);
                    res.render("thankyoupage", {
                        layout: "main",
                        image: sig.signature
                    });
                })
                .catch(function(err) {
                    console.log("err: ", err);
                });
        }
    }
});

app.get("/viewsignatures/", (req, res) => {
    if (req.session.length == 0) {
        res.redirect("/loginpage");
    } else
        db.getSigPageInfo().then(allUsers => {
            // console.log(allUsers);
            res.render("viewsignatures", {
                layout: "main",
                length: allUsers.length,
                content: allUsers
            });
        });
});

//////////////////////Cities filter from signers/////////////
app.get("/viewsignatures/:citySelected", (req, res) => {
    db.getSigPageInfo(req.params.citySelected).then(citySigners => {
        res.render("city", {
            layout: "main",
            logged: req.session.userId,
            content: citySigners,
            length: citySigners.length,
            city: req.params.citySelected
        });
    });
});

app.get("/editprofile", (req, res) => {
    // console.log("SignatureId from session: ", req.session.signatureId);
    let j = req.session.userId;
    // console.log("session", req.session);
    db.getProfilePageInfo(j).then(allUsers => {
        // console.log(allUsers);
        res.render("editprofile", {
            layout: "main",
            content: allUsers
        });
    });
});

// .then(db.addInfo)

app.post("/editprofile", (req, res) => {
    if (!req.session.userId) {
        res.redirect("/");
    } else {
        if (!req.body.password) {
            let city = req.body.city;
            let cityCaps = city.toUpperCase();
            db.updateUserWithoutPass(
                req.session.userId,
                req.body.first_name,
                req.body.last_name,
                req.body.email
            ).then(() =>
                db
                    .addInfo(
                        Number(req.body.age),
                        cityCaps,
                        req.body.homepage,
                        req.session.userId
                    )
                    .then(newUser => {
                        req.session.userId = newUser.id;
                        res.redirect("/thankyoupage");
                        // console.log(req.session.signatureImage);
                    })
            );
        } else {
            let city = req.body.city;
            let cityCaps = city.toUpperCase();
            bc.hashPassword(req.body.password).then(function(hashedPassword) {
                db.updateUserPass(
                    req.session.userId,
                    req.body.first_name,
                    req.body.last_name,
                    req.body.email,
                    hashedPassword
                ).then(updatedUser => {
                    // console.log(updatedUser);
                    db.addInfo(
                        Number(req.body.age),
                        cityCaps,
                        req.body.homepage,
                        req.session.userId
                    ).then(newUser => {
                        res.redirect("/thankyoupage");
                    });
                });
            });
        }
        // }
    }
    req.session.sigId = {};
});

////////////////////////////ALREADY SIGNED PAGE///////////////////

app.get("/loggedout", (req, res) => {
    req.session = null;
    res.redirect("/");
});

//////////////////////////////LISTENING ON PORT////////////

app.listen(process.env.PORT || 8080, () => {
    console.log("go ahead caller, I'm listening");
});

// ************************************************************
