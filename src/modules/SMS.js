/**
 * Created by Awaismehmood on 7/16/17.
 */

let querystring = require('querystring');
let http = require('http');
let Config = require('../configurations/appConfig');

let sendSMS = function (mobile, message, source) {

    return new Promise(function (fulfill, reject) {
        if (mobile && message) {

            const postData = querystring.stringify({
                source: source || Config.SMS.SMS_SOURCE,
                to:mobile,
                text: message
            });

            const options = {
                hostname: Config.SMS.HOST,
                port: Config.SMS.PORT,
                path: Config.SMS.PATH,
                method: 'POST',
                headers: {
                    'Authorization': Config.SMS.SMS_AUTH,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = http.request(options, function (resp) {

                resp.setEncoding('utf8');
                console.log('SMS. STATUS: ' + resp.statusCode);
                // console.log('HEADERS: ' + JSON.stringify(resp.headers));

                let responseString = '';

                resp.on('data', function (data) {
                    responseString += data;
                });
                resp.on('end', function () {
                    try {
                        console.log('SMS. response: ' + responseString)
                        responseString = JSON.parse(responseString)

                        if (resp.statusCode === 200 && responseString.success) {

                            console.log('SMS. MessageId: ' + responseString.MessageId)
                            return fulfill(responseString)

                        } else {

                            return reject(new Error(responseString.message))
                        }
                    } catch (e) {

                        reject(e)

                    }
                });

            })

            req.on('error', (e) => {
                console.error(`SMS. error: ${e.message}`);
                reject(e)
            });

            req.write(postData);
            req.end();

        } else {
            console.log('SMS. Number(s) or Message not provided');
            reject(new Error(`Number(s) or Message not provided`))
        }
    })
}

module.exports = {
    sendSMS: sendSMS
}