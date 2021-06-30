FROM node:14
ENV NODE_ENV=production
WORKDIR /app
COPY ["backend/package.json", "backend/package-lock.json*", "./"]
RUN npm install --production --prefix backend
COPY . .
CMD [ "node", "backend/index.js" ]
