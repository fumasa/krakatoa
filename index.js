const TeleBot = require('telebot');
const request = require('request');
const FeedParser = require('feedparser');

const bot = new TeleBot(process.env.TELEGRAM_BOT_TOKEN);

let feedList = [];

function readFeed(url) {
    return new Promise((resolve, reject) => {
        var req = request(url);
        var feedparser = new FeedParser();
        
        req.on('error', function (error) {
            reject(error);
        });
        
        req.on('response', function (res) {
            var stream = this;
            
            if (res.statusCode !== 200) {
                this.emit('error', new Error('Bad status code'));
            }
            else {
                stream.pipe(feedparser);
            }
        });
        
        feedparser.on('error', function (error) {
            reject(error);
        });
        
        feedparser.on('readable', function () {
            const stream = this;
            const meta = this.meta;
            const items = [];
            let item;
            
            while (item = stream.read()) {
                items.push(item);
            }

            resolve({ meta: meta, items: items });
        });
    })
}

bot.on(['/start', '/hello'], (msg) => msg.reply.text('Welcome!'));

bot.on(/^\/addfeed (.+)$/, (msg, props) => {
    const url = props.match[1];
    feedList.push(url);
    msg.reply.text('feed added!');
});

bot.on('/read', (msg) => {
    for (let i = 0; i < feedList.length; i++) {
        readFeed(feedList[i]).then((news) => {
            msg.reply.text(`news ${news.meta.title} ${news.items.length}`);
            for (let j = 0; j < news.items.length; j++) {
                msg.reply.text(`item ${news.items[j].link}`);
            }
        }).catch((error) => {
            msg.reply.text(`feed ${feedList[i]} error: ${error}`);
        });
    }
});

bot.on('/list', (msg) => {
    if (feedList.length > 0) {
        for (let i = 0; i < feedList.length; i++) {
            msg.reply.text(`feed: ${feedList[i]}`);
        }
    } else {
        msg.reply.text(`feed list empty`);
    }
});

bot.on('/test', (msg) => {
    feedList = [];
    feedList.push('http://g1.globo.com/dynamo/rss2.xml');
    msg.reply.text('test ready!');
});

bot.on('/clear', (msg) => {
    feedList = [];
    msg.reply.text('feed list cleared!');
});

// // On every text message
// bot.on('text', msg => {
//     let id = msg.from.id;
//     let text = msg.text;
//     return bot.sendMessage(id, `You said: ${ text }`);
// });

bot.connect();