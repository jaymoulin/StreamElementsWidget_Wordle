FROM node:alpine
RUN yarn global add browserify
WORKDIR /app
ENTRYPOINT ["browserify"]
CMD ["index.js", "-o", "bundle.js"]
