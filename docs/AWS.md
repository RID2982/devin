# AWS Deployment Options

Auth no longer depends on AWS — this app uses a single hardcoded admin login (see [`ARCHITECTURE.md`](ARCHITECTURE.md)), so there's no Cognito User Pool to provision. The **database is** AWS, though: the app stores everything in DynamoDB, so an AWS account (or DynamoDB Local) is required to run it at all. This doc covers where to run the rest of it.

The server is a plain stateless Express app that reads all config from env vars, so it runs identically regardless of which path below you pick — nothing forces the choice, and it can change later without touching the code.

## The database: DynamoDB

Provision it once with `npm run db:migrate -w database` pointed at your account (`DYNAMODB_ENDPOINT` unset, `AWS_REGION` and `DYNAMODB_TABLE_PREFIX` set). It creates 22 tables on-demand billing by default, which for a single club's data costs approximately nothing and needs no capacity planning.

Two settings worth turning on that the script does not manage:
- **Point-in-time recovery** — DynamoDB's backup story, off by default. Enable it per table.
- **Deletion protection** — cheap insurance on the production tables.

`DYNAMODB_BILLING_MODE=PROVISIONED` switches `db:migrate` to provisioned capacity (with `DYNAMODB_READ_CAPACITY`/`DYNAMODB_WRITE_CAPACITY`) if a reserved-capacity commitment ever makes that cheaper.

## Option A — Simple: EC2

- One EC2 instance running the built server (`npm run build -w server && npm run start -w server`) and serving the built client (`npm run build -w client`, served as static files — either by the same Express process via `express.static` or a small Nginx in front).
- DynamoDB for the database — no instance to size, patch, or connect to a VPC. Give the EC2 instance profile the DynamoDB permissions listed in [`DEPLOYMENT.md`](DEPLOYMENT.md) and leave the credential env vars unset.
- File uploads on the instance's EBS volume initially (swap to S3 later behind the same `UPLOAD_DIR`-based interface if needed).
- TLS via an ALB + ACM certificate or Nginx + Let's Encrypt in front of the instance — required for the PWA install prompt and service worker to activate in production.

## Option B — Production-grade: ECS Fargate + S3

- Containerize the server (a `Dockerfile` following the existing `docker-compose.yml` conventions), deploy to ECS Fargate — no server management, auto-scaling.
- DynamoDB for data, accessed through the ECS **task role** (no static credentials in the task definition), S3 for uploads, CloudFront + S3 (or served from the container) for the client, ALB + ACM for TLS.
- DynamoDB needs no VPC endpoint to work, but adding a Gateway VPC endpoint for DynamoDB keeps that traffic off the NAT gateway and off your NAT bill.

## What's NOT automated yet

- No CloudFormation/CDK/Terraform — infra is provisioned manually, and `db:migrate` is the only scripted piece. Describing the 22 tables in IaC instead is a reasonable Phase 2 addition once the deployment target is chosen.
- No CI/CD pipeline.
- SES/SMTP for real email delivery — see [`ROADMAP.md`](ROADMAP.md).
