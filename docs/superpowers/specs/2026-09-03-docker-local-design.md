# Docker Local Design

The existing React build and Node/SQLite API run in one production container. A multi-stage image installs and compiles the application, then copies only production dependencies, built assets, server sources, and shared types into a non-root runtime image.

Docker Compose binds port `8787` exclusively to `127.0.0.1` and mounts a named volume at `/app/data`, so game state survives container replacement. The image includes an HTTP health check against `/api/health`. No additional proxy, database container, or network layer is required.
