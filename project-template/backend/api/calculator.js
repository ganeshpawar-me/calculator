let utility = require('../modules/utility');
const util = require('util');
const { resolve } = require('dns');
var jwt = require('jsonwebtoken');
var config = require()

module.exports = function(urlPrsr, app, authCheck, errorHandler, responder, mysqlConnection) {

    app.post("/api/calculator/user/signup", urlPrsr, (req, res) => { 

        try {

            let body = req.body;
            let username = req.body.username;
            let responseSent = false;

            let userQuery = "select id from user_details where username = ?";
            let params = [username];

            let mysqlPromise = util.promisify(utility.mysqlHandler);

            mysqlPromise(userQuery, params, mysqlConnection)
            .then((result) => {
                if(result.length > 0) {
                    let error = "Username is not available";
                    errorHandler.errorHandler(400, error, res, "ER400");
                    responseSent = true;
                } else {
                    let password = Math.random().toString(36).slice(-5);
                    let createUserQuery = "Insert into user_details (username, password) values (?, ?)";
                    params = [username, password];
                    return mysqlPromise(createUserQuery, params, mysqlConnection);
                }
            })
            .then((result) => {
                if(!responseSent) {
                    responder.respond({ 
                        message: "User created", 
                        data: result.insertId
                    }, res);    
                }
            })
            .catch((error) => {
                errorHandler.errorHandler(500, "somethinng went wrong", res, "Err500");
            })

        } catch(error) {
            errorHandler.errorHandler(500, "somethinng went wrong", res, "Err500");
        }

    });

    app.post("/api/calculator/user/signIn", urlPrsr, (req, res) => { 

        try {

            let body = req.body;
            let username = req.body.username;
            let password = req.body.password;

            let userPasswordQuery = "select id from user_details where username = ? and password = ?";
            let params = [username, password];

            let mysqlPromise = util.promisify(utility.mysqlHandler);

            mysqlPromise(userPasswordQuery, params, mysqlConnection)
            .then((result) => {
                if(result.length > 0) {

                    let authToken = jwt.sign({
                        data: result[0].id
                    }, "ezgb?fV+A&zjg=B(WoYVZtQM1E62=)", { expiresIn: '5h' });

                    responder.respond({ 
                        message: "Login successful",
                        data: authToken
                    }, res);   

                } else {
                    errorHandler.errorHandler(403, "Username or Password is wrong", res, "Err403");
                }
            })
            .catch((error) => {
                errorHandler.errorHandler(500, "somethinng went wrong", res, "Err500");
            })

        } catch(error) {
            errorHandler.errorHandler(500, "somethinng went wrong", res, "Err500");
        }

    });

    app.post("/api/calculator", urlPrsr, authCheck, (req, res) => { 

        try {

            let userId = req.userId;
            let body = req.body;

            let number1 = body.number1;
            let number2 = body.number2;
            let action = body.action;
            let result = 0;

            if(action == "add") {
                result = number1 + number2;
            }
            
            if(action == "sub") {
                result = number1 - number2;
            }

            let addCalculation = "insert into history ( user_id, number1, number2, result, action) values (?, ?, ?, ?, ?)";
            let params = [userId, number1, number2, result, action];

            let mysqlPromise = util.promisify(utility.mysqlHandler);

            
            mysqlPromise(addCalculation, params, mysqlConnection)
            .then((response) => {
                responder.respond({
                    result : result
                }, res);    
            })
            .catch((error) => {
                console.log(error);
                errorHandler.errorHandler(500, "somethinng went wrong", res, "Err500");
            })

        } catch(error) {
            console.log(error);
            errorHandler.errorHandler(500, "somethinng went wrong", res, "Err500");
        }

    });

    app.get("/api/calculator/history", urlPrsr, (req, res) => { 

        try {


            let queryParams = req.query;
            let action = queryParams.action;
            

            let getHistory = "select * from history where action = ?";
            let params = [action];

            let mysqlPromise = util.promisify(utility.mysqlHandler);

            mysqlPromise(getHistory, params, mysqlConnection)
            .then((result) => {
                responder.respond({
                    result : result
                }, res);
            })
            .catch((error) => {
                console.log(error);
                errorHandler.errorHandler(500, "somethinng went wrong", res, "Err500");
            })

        } catch(error) {
            console.log(error);
            errorHandler.errorHandler(500, "somethinng went wrong", res, "Err500");
        }

    });

    app.post("/api/user/signout", urlPrsr, (req, res) => { 

        try {

            var accessToken = req.headers["authorization"];
            let userId = "";

            if(!accessToken) {
                errorHandler.errorHandler(401, "somethinng went wrong", res);
                return;
            }
            

            jwt.verify(accessToken, "ezgb?fV+A&zjg=B(WoYVZtQM1E62=)", function(err, decoded) {
                if(err) {
                    console.log(err);
                    errorHandler.errorHandler(403, "Invalid Token", res);
                    return;
                } else {
                    userId = decoded.data;
                }
            })


            let revokeToken = "insert into revoked_tokens (token ) values (?)";
            let params = [accessToken];

            let mysqlPromise = util.promisify(utility.mysqlHandler);

            mysqlPromise(revokeToken, params, mysqlConnection)
            .then((response) => {
                responder.respond({
                    message : "Logged out successfully. You will br redirected to login page"
                }, res);
            })
            .catch((error) => {
                console.log(error);
                errorHandler.errorHandler(500, "somethinng went wrong", res, "Err500");
            })

        } catch(error) {
            console.log(error);
            errorHandler.errorHandler(500, "somethinng went wrong", res, "Err500");
        }

    });

};