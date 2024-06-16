const express = require('express');
const app = express();
const mysql = require('mysql2');
const PORT = 5000;
const { engine } = require('express-handlebars');
const fs = require('fs');

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: 'pass_hoka',
    database: 'db_memo'
});

app.listen(PORT, () => {
    console.log('サーバ起動中🚀');
})

app.use(express.urlencoded({ extended: true }));

/*
app.post('/', (req, res) => {
    if (!req.body) {
        return res.status(400).send('データを処理できませんでした');
    }

    let memoContent = req.body.data;
    let uploadfilePath = __dirname + '/upload/' + memoContent + '.txt';
    fs.writeFile(uploadfilePath, memoContent, (err) => {
        if (err) return res.status(500).send('アップロードに失敗しました');
    });

    const query_insert = "INSERT INTO Memos (user_id, title, content) VALUES (1, '" + memoContent + ".txt', '" + memoContent + "')";
    pool.getConnection((err, connection) => {
        connection.query(query_insert, (err, rows) => {
            connection.release();
            if (err) {
                console.log(err);
            }
            res.redirect('/');
        });
    });
});
*/
app.post('/', (req, res) => {
    const action = req.body.action;

    if (action === 'upload') {
        if (!req.body.data) {
            return res.status(400).send('データを処理できませんでした');
        }

        let memoContent = req.body.data;
        let uploadfilePath = path.join(__dirname, 'upload', memoContent + '.txt');
        fs.writeFile(uploadfilePath, memoContent, (err) => {
            if (err) return res.status(500).send('アップロードに失敗しました');

            // データベースに保存
            connection.query(
                'INSERT INTO Memos (user_id, title, content) VALUES (1, ?, ?)',
                [memoContent, memoContent],
                (err, result) => {
                    if (err) {
                        console.error('データベースへの保存に失敗しました:', err);
                        return res.status(500).send('データベースへの保存に失敗しました');
                    }
                    console.log('データベースに保存しました:', result);
                    res.redirect('/');
                }
            );
        });
    } else if (action === 'delete') {
        const filesToDelete = req.body.delete;

        if (!filesToDelete) {
            return res.status(400).send('削除するファイルが選択されていません');
        }

        filesToDelete.forEach(fileName => {
            // データベースから削除
            connection.query(
                'DELETE FROM Memos WHERE title = ?',
                [fileName],
                (err, result) => {
                    if (err) {
                        console.error('データベースからの削除に失敗しました:', err);
                        return res.status(500).send('データベースからの削除に失敗しました');
                    }
                    console.log('データベースから削除されました:', result);
                }
            );

            // ローカルフォルダから削除
            const filePath = path.join(__dirname, 'upload', fileName);
            fs.unlink(filePath, err => {
                if (err) {
                    console.error('ファイルの削除に失敗しました:', err);
                    return res.status(500).send('ファイルの削除に失敗しました');
                }
                console.log('ファイルが削除されました:', fileName);
            });
        });

        res.redirect('/');
    } else {
        res.status(400).send('不明なアクションです');
    }
});

app.get('/', (req, res) => {
    const query_get = 'SELECT * FROM Memos';

    pool.getConnection((err, connection) => {
        if (err) {
            console.log('MySQLサーバに接続できませんでした', err);
            res.status(500).send('MySQLサーバに接続できませんでした');
            return;
        }
        console.log('MySQLサーバに接続しました👍');

        connection.query(query_get, (err, rows) => {
            connection.release();
            if (err) {
                console.error('クエリの実行中にエラーが発生しました:', err);
                res.status(500).send('クエリの実行中にエラーが発生しました');
                return;
            }
            //console.log(rows);
            res.render('home', { rows });
        });
    });
});

function saveFileToDatabase(filename, content) {
    pool.query(
        'INSERT INTO uploaded_files (filename, content) VALUES (?, ?)',
        [filename, content],
        (err, result) => {
            if (err) {
                console.error('データベースへの保存に失敗しました:', err);
            } else {
                console.log('データベースに保存しました:', result);
            }
        }
    );
}