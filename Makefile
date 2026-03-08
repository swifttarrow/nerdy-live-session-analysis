.PHONY: run build test lint setup

run:
	npm run dev

build:
	npm run build

test:
	npm test

lint:
	npm run lint

setup:
	npm install && node scripts/copy-wasm.js
