DENO := ~/deno/deno
SHELL := /bin/bash

run:
	$(DENO) run --allow-net -c tsconfig.json server.ts 1234 | tee >(logger -t rri)

docker-image:
	docker build -f Dockerfile -t ondras/rri ..

docker-run:
	docker run -i --network=host --env PORT=${PORT} ondras/rri

loop:
	while true; do make run; done
