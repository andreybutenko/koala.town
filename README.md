# koala.town

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

docker run -p 3000:3000 --name koala.town -d andreybutenko/koala.cat /etc/centos-releasetown
```