const express = require("express");
const app = express();
const hb = require("express-handlebars");
const db = require("./db/db");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const bc = require("./db/bcrypt");
// const csurf = require("csurf");

app.use(
    cookieSession({
        secret: `yolo innit bruv`,
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);
app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: false }));

// app.use(csurf()); //middleware fore csurf
// app.use(function(req, res, next) {
//     //csurf handling requests and encrypting them
//     res.locals.csrfToken = req.csrfToken();
//     next();
// });

app.engine(
    "handlebars",
    hb({
        default: "main"
    })
);
app.set("view engine", "handlebars");

////////////////middleware

//global middleware

app.use(express.static("public"));

/////////////post and get reqs

///////////HOME PAGE // NEW USER PAGE//////////////
app.get("/", (req, res) => {
    console.log("hi Dr Crane");
    if (req.cookies.signed != "signed") {
        res.render("home", {
            layout: "main"
            // error: "Please fill in ALL fields or Log in" // link that to your handle bars main with {{ error }}
        });
    } else {
        res.redirect("/alreadysigned");
    }
});

app.post("/", (req, res, next) => {
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
                    // console.log(newUser);
                    req.session.userId = newUser.id;
                    // req.session.userId = req.session.signatureId;
                    res.redirect("/additionalinfo");
                });
            });
        }
    }
});
//.catch(err => {
//console.log(err);
// });

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
    console.log("from post rout of add info: ", req.session.userId);
    let userid = req.session.userId;
    let city = req.body.city;
    let cityCaps = city.toUpperCase();
    db.addInfo(Number(req.body.age), cityCaps, req.body.homepage, userid).then(
        newInfo => {
            console.log("new info: ", newInfo);
            res.redirect("/newsigner");
        }
    );
});

/////////////////LOGINPAGE///////////////////////
app.get("/loginpage", (req, res) => {
    res.render("loginpage", {
        layout: "main"
    });
});

app.post("/loginpage", (req, res, next) => {
    var comparePassword = "";

    if (req.body.email == "" || req.body.password == "") {
        res.render("loginpage", {
            layout: "main",
            error: "Please fill all the required information"
        });
    } else {
        db.returnAllUsers()
            .then(allUsers => {
                db.returnUser(req.body.email).then(user => {
                    console.log(user);
                });
                var arrayRow;
                var userId;
                for (var i = 0; i < allUsers.length; i++) {
                    if (allUsers[i].email == req.body.email) {
                        passToCompare = allUsers[i].hashed_password;
                        userId = allUsers[i].id;
                        arrayRow = i;
                    }
                }
                if (passToCompare == "") {
                    res.render("loginpage", {
                        layout: "main",
                        error: "No user found"
                    });
                } else {
                    bc.checkPassword(req.body.password, passToCompare)
                        .then(samePasswordChecker => {
                            console.log(
                                "are passwords the same?",
                                samePasswordChecker
                            );
                            if (samePasswordChecker) {
                                req.session.userId = userId;
                                res.redirect("/thankyoupage");
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
    console.log("get route user id: ", req.session.userId);
    // console.log(req.session);
    if (!req.session.userId) {
        res.redirect("/loginpage");
    }
    // else
    // {
    // console.log("what does this have? ", req.session.signatureId);
    // if (req.session.signatureId) {
    //     res.redirect("/thankyoupage");
    // }
    else {
        res.render("newsigner", {
            // csrfToken: req.csrfToken(),
            layout: "main"
        });

        // else {
        //     if (something is present)
        //     res.redirect("/alreadysigned");
    } // }
    // }
});

//make middleware to redirect people to the sign up page if they do not have a session value
// app.use()

app.post("/newsigner", (req, res) => {
    console.log("whole session in newsigner post rou: ", req.session);
    console.log("sigid: ", req.session.signatureId);
    var userid = req.session.userId;
    if (!req.body.firstname || !req.body.lastname || !req.body.signature) {
        res.render("newsigner", {
            layout: "main",
            error: "Please fill in ALL required fields"
        });
    } else {
        if (!req.session.signatureId) {
            console.log("newSig.id =", req.session.signatureId);

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
            console.log(
                "there should be no id here: ",
                req.session.signatureId
            );
            console.log("userid variable: ", userid);
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

// *****************USING bcrypt to get the password*****************************
//
// app.get("/hash-practice", (req, res) => {
//     bc.hashPassword("trustno1")
//         .then(hashedPassword => {
//             console.log("hashedPassword", hashedPassword);
//
//             bc.checkPassword("some nonesense password", hashedPassword).then(
//                 doThePasswordsMatch => {
//                     console.log("doThePasswordsMatch: ", doThePasswordsMatch);
//                 }
//             );
//         })
//         .catch(err => {
//             console.log(err);
//         });
// });

app.get("/thankyoupage/", (req, res) => {
    if (!req.session.userId) {
        res.redirect("/loginpage");
    }
    // else {
    //     if (req.session.sigId == 0) {
    //         res.redirect("/newsigner");
    //     }
    else {
        if (!req.session.signatureId) {
            res.redirect("/newsigner");
        } else {
            db.getSigById(req.session.userId)
                .then(sig => {
                    console.log(req.session.sigId);
                    console.log("it's getting here");
                    console.log("sig: ", sig);
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

// app.post("/thankyoupage", (req, res) => {
//     res.redirect("/viewsignatures");
// });

app.get("/viewsignatures/", (req, res) => {
    if (req.session.length == 0) {
        res.redirect("/loginpage");
    } else
        db.getSigPageInfo().then(allUsers => {
            console.log(allUsers);
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
    console.log("SignatureId from session: ", req.session.signatureId);
    let j = req.session.userId;
    console.log("session", req.session);
    db.getProfilePageInfo(j).then(allUsers => {
        console.log(allUsers);
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
    }
    // else {
    //     if (!req.session.sigId) {
    //         res.redirect("/newsigner");
    //     }
    else {
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
                        console.log(req.session.signatureImage);
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
                    console.log(updatedUser);
                    db.addInfo(
                        Number(req.body.age),
                        cityCaps,
                        req.body.homepage,
                        req.session.userId
                    ).then(newUser => {
                        // db.getSigById(req.session.userId).then(sig => {
                        //     console.log(sig.signature);
                        //
                        // });
                        console.log();
                        res.redirect("/thankyoupage");
                        // req.session.userId = newUser.id;
                        //

                        // req.session.signatureId = newSig.id;
                    });
                });
            });
        }
        // }
    }
    req.session.sigId = {};
});

app.get("/alreadysigned/", (req, res) => {
    if (!req.session.userId) {
        res.redirect("/");
    }
    // else {
    //     if (!req.session.sigId) {
    //         res.redirect("/newsigner");
    //     }
    else
        res.render("alreadysigned", {
            layout: "main"
        });
    // }
});

app.get("/loggedout", (req, res) => {
    req.session = null;
    res.render("loggedout", {
        layout: "main"
        // signature: signatureImage
    });
});

////////////////////////////ALREADY SIGNED PAGE///////////////////

//////////////////////////////LISTENING ON PORT////////////

app.listen(process.env.PORT || 8080, () => {
    console.log("go ahead caller, I'm listening");
});

// app.listen(process.env.PORT || 8080);

////////////////////

// ************************************************************

//single route
// function checkForSig(req, res, next) {
//     console.log("check for sig middle ware running");
//     console.log(req.session);
//     if (!req.session.signatureId) {
//         res.redirect("/");
//     } else {
//         console.log("you have a sigId, continue session");
//         next();
//     }
// }
// **************************
// for signers/:cityname
//
// app.get(('viewsignatures'/:cityname), (req, res, next) {
//         db.getCityFromInfo(req.params.cityname);
// })
