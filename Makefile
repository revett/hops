build:
	rm -f .*.bun-build
	bun build src/cli.ts --compile --outfile hops
