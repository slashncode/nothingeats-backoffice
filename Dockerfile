# The build happens outside (CI runs `pnpm build` and `pnpm image:prepare`, which keeps only production
# dependencies, sharp for linux/amd64 and linux/arm64 included); the image only runs it. No RUN steps,
# so multi-arch builds need no emulation. Distroless: no shell, no package manager, user 65532.
FROM gcr.io/distroless/nodejs24-debian13:nonroot

WORKDIR /app
COPY package.json main.mjs ./
COPY node_modules/ ./node_modules/
COPY dist/ ./dist/
COPY seed/ ./seed/

ENV NODE_ENV=production
# The serving process relays the outbox; CLI runs leave it off.
ENV OUTBOX__RELAY_ENABLED=true
ENTRYPOINT ["/nodejs/bin/node", "--enable-source-maps", "/app/main.mjs"]
CMD ["serve"]
