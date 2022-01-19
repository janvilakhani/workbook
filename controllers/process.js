var helper = require('./../helpers/helpers')
const config = require('../config/default.json');
var fs = require('fs')
var multiparty = require('multiparty')
const Database = require('./../helpers/db');
const DB = new Database(config.dbConfig);

module.exports.controller = function(app, io, socket_list) {
    const msg_success = "successfully";
    const msg_fail = "fail";

    app.post('/api/admin/process', (req, res) => {
        helper.Dlog(req.body)
        var form = new multiparty.Form();
        form.parse(req, (err, fields, files) => {
            helper.CheckParameterValid(res,fields,['type'], () => {
                helper.removeSingleQuote(res,fields,(response)=>{
                        if(response.type=='add'){
                            helper.CheckParameterValid(res,fields,['type','user_id','access_token','name'], () => {
                                DB.query('INSERT INTO `process`(`name`) VALUES (?)',[response.name]).then((results) =>{
                                    if(results['affectedRows']>0){
                                        res.json({
                                            "success": true,
                                            "status": 1,
                                            "message":'Process added Successfully..!'
                                        });
                                    }else{
                                        res.json({
                                            "success": false,
                                            "status": 0,
                                            "message":msg_fail
                                        });
                                    }
                                });
                            })
                        }else if(response.type=='get'){
                            helper.CheckParameterValid(res,fields,['type','user_id','access_token'], () => {
                                DB.query('SELECT name FROM `process`',[response.name]).then((results) =>{
                                    if(results.length>0){
                                        res.json({
                                            "success": true,
                                            "status": 1,
                                            "data":results
                                        });
                                    }else{
                                        res.json({
                                            "success": false,
                                            "status": 0,
                                            "message":msg_fail,
                                            "data":[]
                                        });
                                    }
                                });
                            });
                        }else if(response.type=='edit'){
                            helper.CheckParameterValid(res,fields,['type','user_id','process_id','name','access_token'], () => {
                                DB.query('UPDATE `process` SET name=? WHERE `id`=?',[response.name,response.process_id]).then((results) =>{
                                    if(results['affectedRows']>0){
                                        res.json({
                                            "success": true,
                                            "status": 1,
                                            "message":'Process updated successfully..!',

                                        });
                                    }else{
                                        res.json({
                                            "success": false,
                                            "status": 0,
                                            "message":msg_fail,
                                        });
                                    }
                                });
                            })
                        }
                    });
                });
            });
        });

  

}