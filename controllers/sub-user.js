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
    const image_save_path = "./public/img/";
    app.post('/api/admin/sub-user', (req, res) => {
        helper.Dlog(req.body)
        var reqObj = req.body;
        var form = new multiparty.Form();
        console.log(`reqObj`,reqObj);
        form.parse(req, (err, fields, files) => {
            helper.CheckParameterValid(res,fields,['type'], () => {
                helper.removeSingleQuote(res,fields,(response)=>{
                    if(response.type === 'add'){
                        helper.CheckParameterValid(res,fields,['type','login_user_id','access_token','name','phone','email'],async () => {
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

                            DB.query('INSERT INTO `sub_users` (`user_id`, `name`, `phone`, `email`, `image`) VALUES(?,?,?,?,?)',[response.login_user_id,response.name,response.phone,response.email,image_name]).then((results)=>{
                                if(results['affectedRows']>0){
                                    res.json({
                                        "success": true,
                                        "status": 1,
                                        "message":'sub users add successsfully..!'
                                    });
                                }else{
                                    res.json({
                                        "success": false,
                                        "status": 0,
                                        "message":msg_fail
                                    });
                                }
                            }).catch(err=>{
                                if(err.errno==1062){
                                    res.json({
                                        "success": false,
                                        "status": 0,
                                        "message": msg_user_already_exits
                                    });
                                }
                                console.log(err)
                            })
                        });
                    }
                    if(response.type==='edit'){
                        helper.CheckParameterValid(res,fields,['type','login_user_id','access_token','name','phone','email','sub_user_id'],async () => {

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
    
                            DB.query('UPDATE `sub_users` SET `user_id`=?,`name`=?,`phone`=?,`email`=?,`image`=? WHERE `id`=?',[response.login_user_id,response.name,response.phone,response.email,image_name,response.sub_user_id]).then(results=>{
                                if(results['affectedRows']>0){
                                    res.json({
                                        "success": true,
                                        "status": 1,
                                        "message":'sub users updated successsfully..!'
                                    });
                                }else{
                                    res.json({
                                        "success": false,
                                        "status": 0,
                                        "message":msg_fail
                                    });
                                }
                            }).catch(err=>{
                                if(err.errno==1062){
                                    res.json({
                                        "success": false,
                                        "status": 0,
                                        "message": msg_user_already_exits
                                    });
                                }
                                console.log(err)
                            })
                        });

                    }
                    if(response.type=='get'){
                        helper.CheckParameterValid(res,fields,['type','login_user_id','access_token'],async () => {
                            DB.query('SELECT `id`,`user_id`, `name`, `phone`, `email`, `image`,`is_deleted` from sub_users  Where user_id=? and is_deleted=?',[response.login_user_id,0]).then(async(results)=>{
                                if(results.length>0){
                                    const arrayData=[];
                                    for(let i=0;i<results.length;i++){
                                        let user = results[i];
                                        await DB.query('SELECT *,process.name as process_name FROM sub_user_rates INNER JOIN process ON sub_user_rates.process_type_id=process.id WHERE `sub_users_id`=?',[user.id]).then(async(rateUsers)=>{
                                            if(rateUsers.length>0){
                                                const result = rateUsers.reduce(function (r, a) {
                                                    r[a.process_name] = r[a.process_name] || [];
                                                    r[a.process_name].push(a);
                                                    return r;
                                                }, Object.create(null));
                                                user.rateUsers=result;
                                            }else{
                                                user.rateUsers=[];
                                            }
                                            arrayData.push(user);

                                        }).catch(err=>{
                                            console.log('rate user error',err);
                                        })
                                    }
                                    console.log('arrayData',arrayData);
                                    await res.json({
                                        "success": true,
                                        "status": 1,
                                        "data":arrayData,
                                        "message": 'user data get.'
                                    });
                                }else{
                                    res.json({
                                        "success": false,
                                        "status": 0,
                                        "data":[],
                                        "message": 'no data found'
                                    });
                                }
                            }).catch(err=>{
                                console.log(err)
                            })
                        });
                    }
                    if(response.type=='delete'){
                        helper.CheckParameterValid(res,fields,['type','login_user_id','access_token','sub_user_id'],async () => {
                            DB.query('UPDATE `sub_users` SET  is_deleted=? WHERE id=?',[1,response.sub_user_id]).then((results)=>{
                                if(results['affectedRows']>0){
                                    res.json({
                                        "success": true,
                                        "status": 1,
                                        "message":'sub users deleted successsfully..!'
                                    });
                                }else{
                                    res.json({
                                        "success": false,
                                        "status": 0,
                                        "message":msg_fail
                                    });
                                }
                            });
                        });
                    }
                });
            });
        });
    });

    app.post('/api/admin/sub-user-rate', (req, res) => {
        helper.Dlog(req.body)
        var form = new multiparty.Form();
        form.parse(req, (err, fields, files) => {
            helper.CheckParameterValid(res,fields,['type'], () => {
                helper.removeSingleQuote(res,fields,(response)=>{
                    if(response.type=='add'){
                        helper.CheckParameterValid(res,fields,['type','login_user_id','access_token','rate_type','to','from','price','sub_users_id','process_type_id'],async () => {
                            DB.query('INSERT INTO `sub_user_rates` ( `type`, `rate_to`, `rate_from`, `price`, `sub_users_id`, `process_type_id`) VALUES (?,?,?,?,?,?)',[response.rate_type,response.to?response.to:0,response.from?response.from:0,response.price,response.sub_users_id,response.process_type_id]).then(results=>{
                                if(results['affectedRows']>0){
                                    res.json({
                                        "success": true,
                                        "status": 1,
                                        "message":'rate added Successfully..!'
                                    });
                                }else{
                                    res.json({
                                        "success": false,
                                        "status": 0,
                                        "message":msg_fail
                                    });
                                }
                            }).catch(err =>{
                                console.log(err)
                            });
                        });
                    }
                    if(response.type=='edit'){
                        helper.CheckParameterValid(res,fields,['type','login_user_id','access_token','rate_type','to','from','price','sub_users_id','process_type_id','user_rate_id'],async () => {
                            DB.query('UPDATE `sub_user_rates` SET `type`= ? ,`rate_to`= ? ,`rate_from`= ? ,`price`= ? ,`sub_users_id`= ? ,`process_type_id`= ?  Where id=?',[response.rate_type,response.to?response.to:0,response.from?response.from:0,response.price,response.sub_users_id,response.process_type_id,response.user_rate_id]).then(results=>{
                                if(results['affectedRows']>0){
                                    res.json({
                                        "success": true,
                                        "status": 1,
                                        "message":'rate updated Successfully..!'
                                    });
                                }else{
                                    res.json({
                                        "success": false,
                                        "status": 0,
                                        "message":msg_fail
                                    });
                                }
                            }).catch(err =>{
                                console.log(err)
                            });
                        });
                    }
                });
            });
        });
    });
    
}