TSC := $(shell npm bin)/tsc
LESSC := $(shell npm bin)/lessc
ROLLUP := $(shell npm bin)/rollup

all: app/app.bundle.js app/app.css icons server/importmap.json

app/app.bundle.js: .tsflag
	$(ROLLUP) app/app.js > $@

.tsflag: src/*.ts
	$(TSC)
	touch $@

app/app.css: src/css/*.less
	$(LESSC) src/css/app.less > $@

icons: img/icon-192.png img/icon-512.png

img/icon-%.png: img/icon.svg
	rsvg-convert -w $* -h $* $< > $@

server/importmap.json: src/*.ts
	echo '{"imports":{' > $@
	for i in $^; do \
		TS=file://`readlink -f $$i`; \
		JS=`echo -n $$TS | sed -e s/.ts$$/.js/`; \
		echo '"'$$JS'": "'$$TS'"', >> $@; \
	done; \
	echo '"fake-last-item":""}}' >> $@

graph.png: app/*.js
	$(shell npm bin)/rollup -c .rollup-graph.config.js app/app.js -o /dev/null --silent | dot -Tpng > $@


watch: all
	while inotifywait -e MODIFY -r src; do make $^ ; done
