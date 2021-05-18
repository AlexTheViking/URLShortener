
const http = require('http');
const fs   = require('fs');
const port = 8080;
const shortUrlLength = 6;

const { MongoClient } = require("mongodb");
const mongoUrl = "mongodb://localhost:27017/";
const mongoDB = "url_shortener_db";
const mongoCollection = "shorts";
const mongoClient = new MongoClient(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true});

let db;
let collection;
let connection;
let promise = mongoClient.connect();
promise.then((resp)=>{
    connection = resp;
    db = connection.db(mongoDB);
    collection = db.collection(mongoCollection);
});
  

const stringAlpha = "abcdefjhijklmnopqrstuvwxyzABCDEFGHIJKLNMOPQRSTUVWXYZ";

async function saveShort(short, full){
    if(await collection.findOne({shortLink:short})){
        return false;
    }
    await collection.insertOne({shortLink:short, fullLink:full, uses:0});
    return true;
}

async function getShort(URL){
    let address;
    do{
        address = '';
        for(let i = 0; i < shortUrlLength; i++){
            let index = Math.round(- 0.5 + Math.random() * (stringAlpha.length));
            address += stringAlpha[index];
        }
    }while(! await saveShort(address, URL));
    
    return address;
}

async function getFull(short){
    let resp = await collection.findOne({shortLink:short});
    if(!resp){
        return false;    
    }
    await collection.updateOne({shortLink:short}, {$set: {uses : resp.uses + 1}});
    return resp.fullLink;
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

    let fullAddress = await getFull(path.slice(1));
    if(!fullAddress){
        return ["text/html", fs.readFileSync("./client/notfound.html")];
    }
    return [false, await fullAddress];
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
}).listen(port);

console.log(`Server running at http://127.0.0.1:${port}/`);
