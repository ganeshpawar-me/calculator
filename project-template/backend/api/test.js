module.exports = function(urlPrsr, app, errorHandler, responder) {

    app.post("/api/caluculator/add", urlPrsr, (req, res) => { 

        try {

            let body = req.body;

            let number1 =  body.number1;
            let number2 = body.number2;
    
            if(!number1) {
                errorHandler.errorHandler(400, "Number 1 is required", res, "Err400");
                return;
            }
    
            if(!number2) {
                errorHandler.errorHandler(400, "Bad request", res);
                return;
            }
    
            let addition = number1 + number2;
            
            responder.respond(addition, res);
    
    
        } catch(error) {
            errorHandler.errorHandler(500, "somethinng went wrong", res, "Err500");
        }

    });

};