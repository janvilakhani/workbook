var helper = require('./../helpers/helpers')
var db = require('./../helpers/db_helpers')
var fs = require('fs')
var multiparty = require('multiparty')
var request = require('request')
const image_save_path = "./public/img/";
const config = require('../config/default.json');

const Database = require('./../helpers/db');
const DB = new Database(config.dbConfig);

module.exports.controller = function(app, io, socket_list) {
    //String value
    const msg_success = "successfully"
    const msg_fail = "fail"
    const msg_login_other_device = "Login other device"
    const msg_invalid_user_password = "invalid mobile or password"
    const msg_user_already_exits = "Already Exist."
    const msg_already_exits = "Email Already Exist."
    const msg_invalid_user = "invalid user"
    const msg_otp_code_fail = "Invalid OTP Code"
    const msg_otp_code = "OTP verify successfully"
    const msg_forgot_password = "forgot password successfully. please check your email inbox"
    const msg_email_send = "Email send Successfully"
    const msg_change_password = "Password change successfully"
    const msg_old_password_wrong = "Old password is wrong"
    const msg_user_success = "new user create successfully"
    const msg_user_faild= "new user not created..!"
        // console.log("data");
    app.post('/api/admin/login', (req, res) => {
        helper.Dlog(req.body)
        var reqObj = req.body;
        var form = new multiparty.Form();
        console.log(`reqObj`,reqObj);
        form.parse(req, (err, fields, files) => {
            helper.CheckParameterValid(res, fields, ['mobile', 'password'], () => {
                helper.removeSingleQuote(res,fields,(response)=>{
                    var auth_token = helper.create_request_token();
                    helper.Dlog("auth_token :-----------" + auth_token);
                    db.query('UPDATE `user_detail` SET `auth_token`= ?   WHERE `mobile` = ? AND `password` = ?', [auth_token, fields.mobile, fields.password], (err, result) => {
                        if (err) {
                            helper.ThrowHtmlError(err, res);
                            return
                        }
                        if (result['affectedRows'] == 1) {
        
                            db.query('SELECT `user_id`,`image_name`, `name`, `email`, `mobile`, `auth_token` FROM `user_detail` WHERE `mobile` = ?', [fields.mobile], (err, result) => {
                                if (err) {
                                    helper.ThrowHtmlError(err, res);
                                    return
                                }
                                if (result.length == 1) {
        
                                    // Other Deivce inLogin
                                    var user_id = result[0].user_id;
                                    if (socket_list['us_' + user_id] != null && io.sockets.connected[socket_list['us_' + user_id].socket_id]) {
        
                                        helper.Dlog(' Other login ---------------------------- ' + socket_list['us_' + user_id].socket_id);
                                        io.sockets.connected[socket_list['us_' + user_id].socket_id].emit('UpdateSocket', {
                                            "success": "false",
                                            "status": "0",
                                            "message": msg_login_other_device
                                        });
                                    }
        
                                    socket_list['us_' + user_id] = {
                                        'socket_id': reqObj.socket_id
                                    };
        
                                    response = {
                                        "success": true,
                                        "status": 1,
                                        "data": result[0]
                                    }
                                } else {
                                    response = {
                                        "success": false,
                                        "status": 0,
                                        "message": msg_invalid_user_password
                                    };
                                }
                                res.json(response)
                            });
                        } else {
                            res.json({
                                "success": "false",
                                "status": "0",
                                "message": msg_invalid_user_password
                            })
                        }
                    })
                });
            })
        });
    })

    app.post('/api/user_image_upload', (req, res) => {
        var form = new multiparty.Form();
        helper.Dlog(req.body);
        form.parse(req, (err, fields, files) => {
            if (err) {
                helper.ThrowHtmlError(err, res);
                return
            }
            helper.CheckParameterValid(res, fields, ['access_token', "user_id"], () => {

                helper.CheckParameterValid(res, files, ["image"], () => {
                    console.log(files);
                    // console.log(res);
                    var image_name = "profile/" + helper.file_name_generate(files.image[0].originalFilename.substring(files.image[0].originalFilename.lastIndexOf(".") + 1));;
                    var new_path = image_save_path + image_name;

                    fs.copyFile(files.image[0].path, new_path, () => {
                        if (err) {
                            helper.ThrowHtmlError(err, res);
                            return
                        }
                        db.query("UPDATE `user_detail` SET `image_name` = ? WHERE `user_id` = ?", [image_name, fields.user_id[0]], (err, result) => {
                            if (err) {
                                helper.ThrowHtmlError(err, res)
                                return
                            }
                            if (result.affectedRows > 0) {

                                res.json({
                                    "success": "true",
                                    "status": "1",
                                    "payload": [{ 'image': image_name }]
                                });

                            } else {
                                res.json({
                                    "success": "false",
                                    "status": "0",
                                    "message": msg_fail
                                });
                            }
                        })
                    })
                })
            })
        })
    })


    app.post('/api/admin/user_list', (req, res) => {
        helper.Dlog(req.body);
        var reqObj = req.body;

        helper.CheckParameterValid(res, reqObj, ['user_id', 'access_token'], () => {
            db.query('SELECT * FROM `user_detail` ', [], (err, result) => {
                if (err) {
                    helper.ThrowHtmlError(err, res);
                    return;
                }

                if (result.length > 0) {
                    console.log(result);
                    res.json({
                        'success': true,
                        'status': 1,
                        'data': result
                    })
                } else {
                    res.json({
                        'success': 'false',
                        'status': '0',
                        'payload': []
                    })
                }
            })
        })
    })

    app.post('/api/admin/signup',(req, res) =>{
        var form = new multiparty.Form();
        helper.Dlog(req.body);
        var reqObj = req.body;
        form.parse(req, (err, fields, files) => {
            helper.CheckParameterValid(res, fields, ['name','email','password','mobile'], () => {
                console.log("sdfdsfs",fields);
                helper.removeSingleQuote(res,fields,(response)=>{
                    console.log(`response`,response);
                    DB.query('INSERT INTO `user_detail` (`name`,`password`, `email`,`mobile`) VALUES(?,?,?,?)',[response.name,response.password,response.email,response.mobile]).then((results) => {
                        console.log("results",results);
                        if(results['affectedRows']>0){
                            res.json({
                                "success": true,
                                "status": 1,
                                "message":msg_user_success
                            });
                        }else{
                            res.json({
                                "success": false,
                                "status": 0,
                                "message":msg_user_faild
                            });
                        }
                    }).catch((err) => {
                        if(err.errno==1062){
                            res.json({
                                "success": false,
                                "status": 0,
                                "message": msg_user_already_exits
                            });
                        }
                        console.log(err);
                    })
                })
            });
        });
    });

    app.post('/api/admin/forgot-password',(req, res) =>{
        var form = new multiparty.Form();
        helper.Dlog(req.body);
        form.parse(req, (err, fields, files) => {
            helper.CheckParameterValid(res, fields, ['email','new_password','conform_password'], () => {
                helper.removeSingleQuote(res,fields,(response)=>{
                    console.log(`response`,response);
                    DB.query('SELECT * FROM `user_detail` WHERE email=?',[fields.email]).then((results) => {
                        console.log("results",response.new_password,'==',fields.conform_password,response.new_password==fields.conform_password);
                        
                         if(response.new_password==response.conform_password){
                             console.log('UPDATE `user_detail` SET `password` WHERE email = '+response.email);
                             
                            DB.query('UPDATE `user_detail` SET `password`= ? WHERE email = ?',[response.new_password,response.email]).then((userPass) =>{
                                if(userPass['affectedRows']>0){
                                     res.json({
                                        "success": true,
                                        "status":1,
                                        "message": 'Your password updated successfully..!'
                                    });
                                }else{
                                    res.json({
                                        "success":false,
                                        "status":0,
                                        "message": 'Your password not updated..!'
                                    });
                                }
                            }).catch((error) =>console.log(error));
                           
                            if(results.length<1){
                                res.json({
                                    "success": false,
                                    "status": 0,
                                    "message":'email not exites..!'
                                });
                            }
                         }else{
                            res.json({
                                "success": false,
                                "status": 0,
                                "message": 'new password and confirm password not match..!'
                            });
                         }
                    
                    }).catch((err) => {
                        if(err.errno==1062){
                            res.json({
                                "success": false,
                                "status": 0,
                                "message": msg_user_already_exits
                            });
                        }
                        console.log(err);
                    })
                })
            });
        });
    });

    app.post('/api/admin/change-password', (req, res) => {
        var form = new multiparty.Form();
        helper.Dlog(req.body);
        var reqObj = req.body;
        form.parse(req, (err, fields, files) => {
            helper.CheckParameterValid(res,fields, ['access_token', 'user_id','old_password','new_password','confirm_password'],()=>{
                helper.removeSingleQuote(res,fields,(response)=>{
                    DB.query('SELECT * FROM `user_detail` WHERE user_id = ?',[response.user_id]).then((resUser)=>{
        
                        var old_password = response.old_password;
                        var new_password = response.new_password;
                        var confirm_password = response.confirm_password;
                        console.log('old_password',old_password,'new_password',new_password,'confirm_password',confirm_password);
                        if(old_password==resUser[0].password){
                            if(new_password==confirm_password){
                                DB.query('UPDATE `user_detail` SET password = ? WHERE user_id = ?',[new_password,response.user_id]).then((resUserR)=>{
                                    if (resUserR.affectedRows > 0) {
                                        res.json({
                                            "status": 1,
                                            "message": 'password change successfully..!'
                                        });
                                    }else{
                                        res.json({
                                            "status": 0,
                                            "message": msg_fail
                                        });
                                    }
                                });
                            }else{
                                res.json({
                                    "status": 0,
                                    "message": 'new and confirm password not Match enter same Password..!'
                                });
                            }
                        }else{
                            res.json({
                                "status": 0,
                                "message": 'old password not Match enter vaild Password..!'
                            });
                        }
                    });
                });
            });
        });
    });

    app.post('/api/admin/user', (req, res) => {
        helper.Dlog(req.body);
        var form = new multiparty.Form();
        form.parse(req, (err, fields, files) => {
            helper.CheckParameterValid(res,fields,['type'], () => {
                helper.removeSingleQuote(res,fields,(response)=>{
                    if(response.type=='profileEdit'){
                        helper.CheckParameterValid(res,fields,['type','access_token','user_id','name','email','mobile'],async () => {
                            var image_name;
                            if(Object.keys(files).length>0){
                                var image_name = "profile/" + helper.file_name_generate(files.image[0].originalFilename.substring(files.image[0].originalFilename.lastIndexOf(".") + 1));;
                                var new_path = image_save_path + image_name;
                                await fs.copyFile(files.image[0].path, new_path,()=>{});
                            }else{
                                if(response.hasOwnProperty('image') && response.image){
                                    image_name=response.image;
                                }else{
                                    image_name='';
                                }
                            }
                            DB.query('UPDATE `user_detail` SET  `name`= ?,`email` = ?,`mobile` = ?,image_name = ? WHERE user_id = ?',[response.name,response.email,response.mobile,image_name,response.user_id]).then((results)=>{
                                if(results['affectedRows']>0){
                                    res.json({
                                        "success": true,
                                        "status": 1,
                                        "message":'updated successfully..!'
                                    });
                                }else{
                                    res.json({
                                        "success": false,
                                        "status": 1,
                                        "message":msg_fail
                                    });
                                }
                            });
                        }); 
                    }
                });
            });
        });
    })
}