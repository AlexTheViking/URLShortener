
const http = require('http');
const fs   = require('fs');
const port = 8080;
const shortUrlLength = 6;

const { MongoClient } = require("mongodb");
const mongoUrl = "mongodb://localhost:27017/";
const mongoDB = "url_shortener_db";
const mongoCollection = "shorts";
const mongoClient = new MongoClient(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true});



async function saveShort(short, full){
    let resp;
    let connection = await mongoClient.connect();
    const db = connection.db(mongoDB);
    const collection = db.collection(mongoCollection);
    try{
        const check = await collection.findOne({shortLink:short});
        if(!check){
            await collection.insertOne({shortLink:short, fullLink:full, uses:0});
            resp = true;
        }else{
            resp = false;
        }
    }finally{
        connection.close();
    }

    return true; 
}

async function checkFull(full){
    let resp;
    let connection = await mongoClient.connect();
    const db = connection.db(mongoDB);
    const collection = db.collection(mongoCollection);
    try{
        resp = await collection.findOne({fullLink:full});
        if(resp){
            resp = resp.shortLink;
        }else{
            resp = false;
        }
    }finally{
        connection.close();
    }
    
    return resp;
}

async function getShort(URL){

    readyShort = await checkFull(URL);
    if(readyShort){return readyShort};

    let string = "abcdefjhijklmnopqrstuvwxyz";
    string += string.toUpperCase();
    let address;
    
    do{
        address = '';
        for(let i = 0; i < shortUrlLength; i++){
            let index = Math.round(- 0.5 + Math.random() * (string.length));
            address += string[index];
        }
    }while(! await saveShort(address, URL));
    
    return address;
}

async function count(short){
    let resp;
    let connection = await mongoClient.connect();
    const db = connection.db(mongoDB);
    const collection = db.collection(mongoCollection);
    try{
        record = await collection.findOne({shortLink:short});
        await collection.updateOne({shortLink:short}, {$set: {uses : record.uses + 1}});
    }finally{
        connection.close();
    }
    return resp; 
}


async function getFull(short){
    let resp;
    let connection = await mongoClient.connect();
    const db = connection.db(mongoDB);
    const collection = db.collection(mongoCollection);
    try{
        resp = await collection.findOne({shortLink:short});
        if(resp){
            resp = "FULL>>>" + resp.fullLink;
            await count(short);
        }else{
            resp = false;
        }
    }finally{
        connection.close();
    }
    return resp; 
}

async function handleRequest(path, host){

    if(path == '/' || path == '/index.html'){
        return ["text/html", fs.readFileSync("./client/index.html")];
    }
    if(path == '/index.js'){
        return ["text/javascript", fs.readFileSync("./client/index.js")];
    }
    if(path == '/index.css'){
        return ["text/css", fs.readFileSync("./client/index.css")];
    }

    if(path.split('?url=')[0] == "/getshort"){
        return ["text/plain", host +'/'+ await getShort(path.split('?url=')[1])];
    }

    let fullAddress = await getFull(path.split('/').join(''));
        if(fullAddress){
            fullAddress = fullAddress.split(">>>");
        }else{
            return ["text/html", fs.readFileSync("./client/notfound.html")];    
        }
        

    if(fullAddress[0]=='FULL'){
        return [false, await fullAddress[1]];
    }else{
        return ["text/html", fs.readFileSync("./client/index.html")];
    }

    
    // favicon обработать
    //return [false,false];
    
}

http.createServer(async function (request, response) {
    const [contentType, content] = await handleRequest(request.url, request.headers.host);
    
    if(!contentType){
        response.writeHead(302, 
            { 'Location': content},
            { 'Content-Type': "text/html" }
            );
        response.end('', 'utf-8');
    }
    
    response.writeHead(200, { 'Content-Type': contentType });
    response.end(content, 'utf-8');
}).listen(8080);

console.log(`Server running at http://127.0.0.1:${port}/`);
