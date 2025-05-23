build:
	rm -f .*.bun-build
	rm -f hops
	bun build src/cli.ts --compile --outfile hops
