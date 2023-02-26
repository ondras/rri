DENO := deno
LESSC := $(shell npm bin)/lessc

all: client/client.js client/client.css icons

client/client.css: src/css/*.less
	mkdir -p `dirname $@`
	$(LESSC) src/css/app.less > $@

client/client.js: $(shell find src -name "*.ts")
	mkdir -p `dirname $@`
	$(DENO) bundle -c deno.json src/client/app.ts > $@

icons: img/icon-192.png img/icon-512.png

img/icon-%.png: img/icon.svg
	rsvg-convert -w $* -h $* $< > $@

watch: all
	while inotifywait -e MODIFY -r src; do make $^ ; done

clean:
	rm -rf client
