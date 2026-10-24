include .env

# Subir VERSION en cada release: :latest sola no deja volver a una imagen anterior
VERSION := 1
IMAGE := southamerica-east1-docker.pkg.dev/audfarmfr/cosua-cre/front-cosua-cre

.PHONY: build local push login help

login:
	gcloud config set account adrian.gallegos@gmail.com
	gcloud config set project audfarmfr

build:
	docker build --no-cache \
		--tag $(IMAGE):$(VERSION) \
		--tag $(IMAGE):latest \
		--file Dockerfile.bun \
		--platform=linux/amd64 .

local:
	docker build --no-cache \
		--tag $(IMAGE):$(VERSION) \
		--tag $(IMAGE):latest \
		--file Dockerfile.bun .

push: login build
	docker push $(IMAGE):$(VERSION)
	docker push $(IMAGE):latest

help:
	@grep -E '^[a-zA-Z0-9_-]+:' Makefile | sed 's/:.*//' | sort
