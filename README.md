# URLShortener
URLShortener launches web server that provides short-url service with web interface. 

## System requirements
mongoDB database

## Request

```
{hostname}/get_short?url={longUrl}
```

example:

```
my_site/get_short?url=https://www.iucnredlist.org/species/41197/10401660
```

returns short url with "text/plain" type of content 

## Quick start

```bash 
npm install
npm start
``` 
 
