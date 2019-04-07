# ex:ts=8:sw=8:noexpandtab
#.PHONY: clean

pack:
	@zip -r ../monocle.zip manifest.json icons common libs background.js content.js style.css content.js options;