DENO := ~/deno/deno

run:
#	$(DENO) -r --allow-net -c tsconfig.json server.ts 1234
	$(DENO) -r --allow-net server.ts 1234

docker-image:
	docker build -f Dockerfile -t ondras/rri ..

docker-run:
	docker run -i --network=host --env PORT=${PORT} ondras/rri
