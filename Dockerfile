# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM node:22-alpine AS base
WORKDIR /usr/src/app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json /temp/dev/
RUN cd /temp/dev && npm install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json /temp/prod/
RUN cd /temp/prod && npm install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS release
COPY --from=install /temp/dev/node_modules node_modules
COPY . .
RUN mkdir -p /usr/src/app/.data && chmod 777 /usr/src/app/.data

# run the app
USER node
EXPOSE 3000/tcp
ENTRYPOINT [ "npm", "run", "bridge", "--", "--storage-path=.data", "--log-level=INFO" ]