FROM lukechannings/deno:v1.31.1
WORKDIR /rri
ENV PORT 80

RUN apt update && apt install -y make && apt clean

COPY src ./src
COPY server ./server

RUN cd server && rm -f importmap.json && make importmap.json

EXPOSE $PORT
ENTRYPOINT deno run --allow-net --importmap server/importmap.json server/server.ts $PORT
