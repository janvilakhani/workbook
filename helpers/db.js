"use strict";
const mysql = require('mysql');

class Database {
    /**
     * Initialize connection
     *
     * @param config
     */
    constructor(config) {
        this.pool = mysql.createPool(config);
    }

    /**
     * @param sql
     * @param args
     * @returns {Promise}
     */
    query(sql, args) {
        return new Promise((resolve, reject) => {
            this.pool.getConnection(function(err, connection) {
                if (err) return reject(err);;
                let query = connection.query(sql, args, function(error, rows) {
                    connection.release();
                    if (error) return reject(error);
                    resolve(rows);
                });
                //LOG QUERY
                //console.log(query.sql);
            });
        });
    }

    /**
     * Close Database Connection
     *
     * @returns {Promise}
     */
    close() {
        return new Promise((resolve, reject) => {
            this.pool.end(err => {
                if (err) {
                    return reject(err);
                }

                resolve();
            });
        });
    }
}

module.exports = Database;