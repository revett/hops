build:
	rm -f .*.bun-build
	rm -f hops
	bun build src/cli.ts --compile --outfile hops

release: build
	rm -rf dist
	mkdir dist
	$(eval RELEASE_FILENAME := dist/hops_$(VERSION)_darwin_arm64.tar.gz)
	tar -czvf $(RELEASE_FILENAME) hops LICENSE README.md
