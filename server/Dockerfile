FROM denoland/deno:alpine
WORKDIR /rri
ENV PORT 80

COPY src ./src
COPY server ./server
COPY deno.json .
EXPOSE $PORT
ENTRYPOINT deno run -c deno.json --allow-net server/server.ts $PORT
