# [Play koala.town!](https://koala.town/)

Koala Town is a small, fun place for koala lovers to hang out!

["Club Koala"](https://github.com/andreybutenko/club-koala) was originally built as part of CSE 154: Web Programming at the University of Washington in April 2019. Koala Town was re-written using Node and Socket.io (instead of PHP) in July 2021.

## Running locally

```
node backend/index.js
```

## Deployment to koala.town

### Build Docker Image

```
docker build -t andreybutenko/koala.town .

docker push andreybutenko/koala.town
```

### Deploy Docker Image

Running on `us-west-2/projects-a`

```
docker pull andreybutenko/koala.town

docker rm -f koala.town

docker run -p 3000:3000 --name koala.town -d andreybutenko/koala.town
```
