var helper = require('./../helpers/helpers')
const config = require('../config/default.json');
var fs = require('fs')
var multiparty = require('multiparty')
const Database = require('./../helpers/db');
const DB = new Database(config.dbConfig);


module.exports.controller = function(app, io, socket_list) {
    const msg_success = "successfully";
    const msg_user_already_exits = "Already Exist."
    const msg_fail = "fail";
    app.post('/api/admin/workers', (req, res) => {
        helper.Dlog(req.body)
        var form = new multiparty.Form();
        form.parse(req, (err, fields, files) => {
            helper.CheckParameterValid(res,fields,['type','login_user_id','access_token'], () => {
                helper.removeSingleQuote(res,fields,(response)=>{
                    if(response.type=='add'){
                        helper.CheckParameterValid(res,fields,[`date`,`diamond`,`weight`,`price`, `total`, `process_type_id`,`sub_user_id`], () => {

                            DB.query('INSERT INTO `workers`(`date`,`diamond`,`weight`,`price`, `total`, `process_type_id`, `user_id`, `sub_user_id`) VALUES(?,?,?,?,?,?,?,?)',[response.date,response.diamond,response.weight,response.price,response.total,response.process_type_id,response.login_user_id,response.sub_user_id]).then((results)=>{
                                DB.query('INSERT INTO `transaction_history` (`type`,`work_id`,`amount`,`process_type_id`,`date`,`user_id`,`sub_user_id`) VALUES(?,?,?,?,?,?,?)',[1,results.insertId,response.total,response.process_type_id,response.date,response.login_user_id,response.sub_user_id]).then((data)=>{
                                    if(results['affectedRows']>0){
                                        res.json({
                                            "success": true,
                                            "status": 1,
                                            "message":'worker added Successfully..!'
                                        });
                                    }else{
                                        res.json({
                                            "success": false,
                                            "status": 0,
                                            "message":msg_fail
                                        });
                                    }
                            });
                            }).catch((err)=>{
                                console.log('worker add error',err);
                            }) 
                        });
                    }
                    if(response.type=='edit'){
                        helper.CheckParameterValid(res,fields,[`date`,`diamond`,`weight`,`price`, `total`, `process_type_id`,`sub_user_id`,'worker_id'], () => {
                            DB.query('UPDATE `workers` SET `date`= ?,`diamond`= ?,`weight`= ?,`price`= ?,`total`= ?,`process_type_id`= ?,`user_id`= ?,`sub_user_id`= ? WHERE id=?',[response.date,response.diamond,response.weight,response.price,response.total,response.process_type_id,response.login_user_id,response.sub_user_id,response.worker_id]).then((results)=>{
                                if(results['affectedRows']>0){
                                    res.json({
                                        "success": true,
                                        "status": 1,
                                        "message":'worker updated Successfully..!'
                                    });
                                }else{
                                    res.json({
                                        "success": false,
                                        "status": 0,
                                        "message":msg_fail
                                    });
                                }
                            }).catch((err)=>{console.log(err)})
                        });
                    }

                    if(response.type=='date_wise'){
                        helper.CheckParameterValid(res,fields,[`date`,`process_type_id`,`sub_user_id`], () => {
                            DB.query('SELECT *,(select SUM(`diamond`) as diamond_total from workers WHERE `date`=? AND `process_type_id`=? AND `sub_user_id`=? ) as total FROM workers WHERE `date`=? AND `process_type_id`=? AND `sub_user_id`=?',[response.date,response.process_type_id,response.sub_user_id,response.date,response.process_type_id,response.sub_user_id]).then((results) => {

                                if(results.length > 0) {
                                    res.json({
                                        "success": true,
                                        "status": 1,
                                        "data":results,
                                        "message": 'data get'
                                    });
                                }else{
                                    res.json({
                                        "success": false,
                                        "status": 0,
                                        "data":[],
                                        "message": 'no data found'
                                    });
                                }
                            })    
                        });
                    }
                    if(response.type=='month'){
                        helper.CheckParameterValid(res,fields,[`date`,`process_type_id`,`sub_user_id`,`month`], () => {
                            DB.query('SELECT sub_user_id,`process_type_id`,`user_id`,sum(`diamond`) as diamond,sum(`weight`) as weight,sum(`total`) as total, (select SUM(`diamond`) as dimoand_total from workers WHERE `process_type_id`=? AND `sub_user_id`=? AND MONTH(`date`) =?) as total_diamond,(select SUM(`total`) as dimoand_total from workers WHERE `process_type_id`=? AND `sub_user_id`=? AND MONTH(`date`) = ? ) as total_amount FROM workers WHERE `process_type_id`=? AND `sub_user_id`=? AND MONTH(`date`) =? GROUP BY `date`',[response.process_type_id,response.sub_user_id,response.month,response.process_type_id,response.sub_user_id,response.month,response.process_type_id,response.sub_user_id,response.month]).then((results)=>{
                                if(results.length > 0) {
                                    res.json({
                                        "success": true,
                                        "status": 1,
                                        "data":results,
                                        "message": 'data get'
                                    });
                                }else{
                                    res.json({
                                        "success": false,
                                        "status": 0,
                                        "data":[],
                                        "message": 'no data found'
                                    });
                                }
                            }).catch((err)=>{
                                console.log(err)
                            })
                        });
                    }
                    

                });
            });
        });
    });


   
}