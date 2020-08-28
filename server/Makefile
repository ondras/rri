SHELL := /bin/bash
DENO := ~/deno/deno

run: importmap.json
#	$(DENO) --allow-net -c tsconfig.json server.ts 1234
	$(DENO) run --unstable --allow-net --importmap importmap.json -c tsconfig.json server.ts 1234 | tee >(logger -t rri)

importmap.json: ../src/*.ts
	echo '{"imports":{' > $@
	for i in $^; do \
		TS=file://`readlink -f $$i`; \
		JS=`echo -n $$TS | sed -e s/.ts$$/.js/`; \
		echo '"'$$JS'": "'$$TS'"', >> $@; \
	done; \
	echo '"":""}}' >> $@

docker-image:
	docker build -f Dockerfile -t ondras/rri ..

docker-run:
	docker run -i --network=host --env PORT=${PORT} ondras/rri

loop:
	while true; do make run; done

clean:
	rm -f importmap.json
