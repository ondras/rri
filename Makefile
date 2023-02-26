TSC := npm exec -- tsc
LESSC := npm exec -- lessc
ROLLUP := npm exec -- rollup
FLAG := .build/.tsflag

all: client/client.js client/client.css icons

client/client.css: src/css/*.less
	mkdir -p `dirname $@`
	$(LESSC) src/css/app.less > $@

client/client.js: $(FLAG)
	mkdir -p `dirname $@`
	$(ROLLUP) .build/client/app.js > $@

$(FLAG): $(shell find src -name "*.ts")
	$(TSC)
	touch $@

icons: img/icon-192.png img/icon-512.png

img/icon-%.png: img/icon.svg
	rsvg-convert -w $* -h $* $< > $@

graph.png: .build/*.js
	$(shell npm bin)/rollup -c .rollup-graph.config.js .build/app.js -o /dev/null --silent | dot -Tpng > $@

watch: all
	while inotifywait -e MODIFY -r src; do make $^ ; done

clean:
	rm -rf client .build
