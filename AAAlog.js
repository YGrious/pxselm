const fs = require('fs');
const path = require('path');
const axios = require('axios');

let finalResult = '';

const token = 'AT_dYOE9kIF9xFuG2UKy62rDAirSxNVJbIs';  //wxpluser的token
const uid = 'UID_QtPHmOg2HkZej0gV5niiN92oyAKS';       //wxpluser的被推送者uid

let prefix = 'pingxingsheng_elm'; //脚本名称前缀


if (process.argv.length > 2) {
  prefix = process.argv[2];
}

const logDir = path.join(__dirname, '../log');

let folders = [];
const folder1 = '${prefix}_ele_39coupon';
const folder2 = '${prefix}_ele_20coupon';  

if (fs.existsSync(path.join(logDir, folder1))) {
  folders.push(folder1); 
}
if (fs.existsSync(path.join(logDir, folder2))) {
  folders.push(folder2);
}

if (folders.length === 0) {
  console.error('指定文件夹不存在!');
  process.exit(1);
}

let hasLatestLog = false;

folders.forEach(folder => {
  let folderName;
  if (folder === folder1) {
    folderName = fs.readdirSync(path.join(logDir, folder)).length === 0 ? '39抢券两天内无日志' : '39';
  } else if (folder === folder2) {
    folderName = fs.readdirSync(path.join(logDir, folder)).length === 0 ? '20抢券两天内无日志' : '20';
  }

  const files = fs.readdirSync(path.join(logDir, folder));
  files.sort();
  const latest = files[files.length - 1];

  if (!latest) {
    console.log(folderName);
    return;
  }

  const file = path.join(logDir, folder, latest);
  const text = fs.readFileSync(file, 'utf8');
  const date = latest.match(/^\d{4}-\d{2}-\d{2}/)[0];
  const titleDate = formatDate(date);

  // if (!isInDateRange(titleDate)) {
  //   console.log('两天内无日志');  
  //   return;
  // }

  let result = processLog(text);

  if (result) {
    console.log(titleDate + '抢券成功:\n' + result);
    finalResult += result + '\n\n';
    hasLatestLog = true;
  }
});

if (!hasLatestLog) {
  console.log('两天内无日志');
}


function processLog(text) {
  const regex = /(\*{6} #(\d+) (\d+) \*{9}[\s\S]*?)(?=\*{6} #[\d\s]+\*{9}|\n*$)/g;
  let result = '';

  let match;
  let index = 1;

  while ((match = regex.exec(text)) !== null) {
    const [fullMatch, _, number, phone] = match;

    if (fullMatch.includes('抢券成功')) {
      const matchResult = fullMatch.match(/饿了么(\d+)抢券/);

      if (matchResult) {
        const amount = matchResult[1];
        result += formatPhone(phone, index, amount) + '\n';
        index++;
      }
    }
  }

  return result;
}


function formatPhone(phone, index, amount) {
  return '${index}.${phone.slice(0,3)}****${phone.slice(-4)}-${amount}现金券';
}

function formatDate(date) {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, '-'); 
}

function isInDateRange(date) {
  const today = new Date();
  const diff = (today - new Date(date)) / (1000 * 60 * 60 * 24);
  return diff <= 2;
}

function sendWxPush(content) {
  const token = '';
  const uid = '';
  const url = `http://wxpusher.zjiecode.com/api/send/message/${uid}`;

  axios.post(url, {
    appToken: token,
    content: content,
    contentType: 'markdown'
  });
}

sendWxPush(finalResult);