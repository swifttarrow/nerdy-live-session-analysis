.PHONY: run build test test:e2e lint setup

run:
	npm run dev

build:
	npm run build

test:
	npm test

test:e2e:
	npm run test:e2e

lint:
	npm run lint

setup:
	./scripts/setup.sh
