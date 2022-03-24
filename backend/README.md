# Backend README.md

This document gives background on the backend and explains how to set it up.

The NestJS backend has separate controllers for each of the frontends.

## Setup

####Install npm packages
```bash
$ npm install
```

####Copy .env files and fill them
```bash
$ cp ./.env.dev.example ./.env.dev
$ cp ./.env.prod.example ./.env.prod
```

#### Run the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```
