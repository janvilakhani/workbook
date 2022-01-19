var helper = require('./../helpers/helpers')
const config = require('../config/default.json');
var fs = require('fs')
var multiparty = require('multiparty')
const Database = require('./../helpers/db');
const DB = new Database(config.dbConfig);

module.exports.controller = function(app, io, socket_list) {
    const msg_success = "successfully";
    const msg_fail = "fail";
    app.post('/api/admin/payment', (req, res) => {
        helper.Dlog(req.body)
        var form = new multiparty.Form();
        form.parse(req, (err, fields, files) => {
            helper.CheckParameterValid(res,fields,['type','login_user_id','access_token'], () => {
                helper.removeSingleQuote(res,fields,(response)=>{
                    if(response.type=='add'){
                        helper.CheckParameterValid(res,fields,['date','amount','description','sub_user_id','process_type_id'],()=>{
                            DB.query('INSERT INTO `payments` (`date`, `amount`, `description`, `sub_user_id`, `user_id`, `process_type_id`) VALUES(?,?,?,?,?,?)',[response.date,response.amount,response.description,response.sub_user_id,response.login_user_id,response.process_type_id]).then((results)=>{
                                DB.query('INSERT INTO `transaction_history` (`type`,`payment_id`,`amount`,`process_type_id`,`date`,`user_id`,`sub_user_id`) VALUES(?,?,?,?,?,?,?)',[1,results.insertId,response.total,response.process_type_id,response.date,response.login_user_id,response.sub_user_id]).then((data)=>{
                                    if(results['affectedRows']>0){
                                        res.json({
                                            "success": true,
                                            "status": 1,
                                            "message":'payment added Successfully..!'
                                        });
                                    }else{
                                        res.json({
                                            "success": false,
                                            "status": 0,
                                            "message":msg_fail
                                        });
                                    }
                                }).catch(err=>{ console.log('_____payment trn add______',err)})
                            }).catch((err)=>{
                                console.log('_____payment add error______',err)
                            })
                        });
                    }
                    if(response.type=='edit'){
                        helper.CheckParameterValid(res,fields,['date','amount','description','sub_user_id','process_type_id','payment_id'],()=>{
                            DB.query('UPDATE `payments` SET `date`= ?,`amount`= ?,`description`= ?,`sub_user_id`= ?,`user_id`= ?,`process_type_id`= ? Where id = ?',[response.date,response.amount,response.description,response.sub_user_id,response.login_user_id,response.process_type_id,response.payment_id]).then((results)=>{
                                console.log('_+___________________',results);
                                debugger
                                DB.query('UPDATE `transaction_history` SET `payment_id`= ?,`amount`= ?,`process_type_id`= ?,`date`= ?,`user_id`= ?,`sub_user_id`= ?  Where payment_id = ?',[results.insertId,response.total,response.process_type_id,response.date,response.login_user_id,response.sub_user_id,response.payment_id]).then((data)=>{
                                    if(results['affectedRows']>0){
                                        res.json({
                                            "success": true,
                                            "status": 1,
                                            "message":'payment updated Successfully..!'
                                        });
                                    }else{
                                        res.json({
                                            "success": false,
                                            "status": 0,
                                            "message":msg_fail
                                        });
                                    }
                                }).catch(err=>{ console.log('_____payment trn add______',err)})
                            }).catch((err)=>{
                                console.log('_____payment add error______',err)
                            })
                        });
                    }
                });
            });
        });
    });
}