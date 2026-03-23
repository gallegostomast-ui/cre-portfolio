include .env

.PHONY: build local push login help

login:
	gcloud config set account adrian.gallegos@gmail.com
	gcloud config set project audfarmfr

build:
	docker build --no-cache \
		--tag southamerica-east1-docker.pkg.dev/audfarmfr/cosua-cre/front-cosua-cre:latest \
		--file Dockerfile.bun \
		--platform=linux/amd64 .

local:
	docker build --no-cache \
		--tag southamerica-east1-docker.pkg.dev/audfarmfr/cosua-cre/front-cosua-cre:latest \
		--file Dockerfile.bun .

push: login build
	docker push southamerica-east1-docker.pkg.dev/audfarmfr/cosua-cre/front-cosua-cre:latest

help:
	@grep -E '^[a-zA-Z0-9_-]+:' Makefile | sed 's/:.*//' | sort
