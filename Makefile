TSC := $(shell npm bin)/tsc
LESSC := $(shell npm bin)/lessc

all: src/*.ts app/app.css
	$(TSC)

app/app.css: src/css/*.less
	$(LESSC) src/css/app.less > $@

watch: all
	while inotifywait -e MODIFY -r src; do make $^ ; done
