FROM denoland/deno:latest
WORKDIR /rri
ENV PORT 80

COPY src ./src
COPY server ./server
EXPOSE $PORT
ENTRYPOINT deno --allow-net server/server.ts $PORT
