# AWS Deployment Options

Auth no longer depends on AWS — this app uses a single hardcoded admin login (see [`ARCHITECTURE.md`](ARCHITECTURE.md)), so there's no Cognito User Pool to provision. This doc only covers where to run the app if you deploy to AWS.

The server is a plain stateless Express app that reads all config from env vars, so it runs identically regardless of which path below you pick — nothing forces the choice, and it can change later without touching the code.

## Option A — Simple: EC2 + RDS
- One EC2 instance running the built server (`npm run build -w server && npm run start -w server`) and serving the built client (`npm run build -w client`, served as static files — either by the same Express process via `express.static` or a small Nginx in front).
- RDS Postgres for the database — set `DATABASE_URL` to the RDS endpoint.
- File uploads on the instance's EBS volume initially (swap to S3 later behind the same `UPLOAD_DIR`-based interface if needed).
- TLS via an ALB + ACM certificate or Nginx + Let's Encrypt in front of the instance — required for the PWA install prompt and service worker to activate in production.

## Option B — Production-grade: ECS Fargate + RDS + S3
- Containerize the server (a `Dockerfile` following the existing `docker-compose.yml` conventions), deploy to ECS Fargate — no server management, auto-scaling.
- RDS Postgres, S3 for uploads, CloudFront + S3 (or served from the container) for the client, ALB + ACM for TLS.

## What's NOT automated yet

- No CloudFormation/CDK/Terraform — infra is provisioned manually. Infrastructure-as-code is a reasonable Phase 2 addition once the deployment target is chosen.
- No CI/CD pipeline.
- SES/SMTP for real email delivery — see [`ROADMAP.md`](ROADMAP.md).
