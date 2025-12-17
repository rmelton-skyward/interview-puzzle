# DevOps Code Puzzle - Infrastructure as Code

## About This Assessment

This is a take-home coding challenge designed to evaluate your DevOps engineering skills. Please complete the requirements appropriate for your position level.

## The Problem

Create infrastructure as code (IaC) to deploy a simple web application to a cloud provider. Your solution should demonstrate your understanding of infrastructure automation, cloud services, configuration management, and DevOps best practices.

## Application to Deploy

**We provide a sample application** in the `/sample-app` directory that you can use, or you can create your own.

The application should:
- Serve a web page showing deployment information
- Connect to a database (even just a simple read/write)
- Display environment (dev/staging/prod), timestamp, and cloud provider info

**Sample App Provided:**
- Location: `/sample-app` directory in this repository
- Language: Python (Flask)
- Database: SQLite (simplest option)
- Includes: Dockerfile, README, and all needed code
- **You can use this as-is or create your own in any language**

**The focus is on the infrastructure and deployment automation, not the application itself.**

## Requirements by Position Level

### All DevOps Engineers (All Positions)

**Infrastructure as Code:**
- Create IaC to provision and deploy infrastructure for the web application
- Use any IaC tool you're comfortable with (Terraform, CDK, Pulumi, CloudFormation, etc.)
- Deploy to any cloud provider (AWS, GCP, Azure, etc.) or use local alternatives (see Alternative Options below)
- **Must include at minimum:**
  - **Compute resource** running a web server/application (EC2, Container, VM, etc.)
  - **Database** (can be simple: SQLite file-based on the server, or managed DB like RDS/Cloud SQL)
    - Note: For SQLite, no separate database resource is needed - it's just a file on your compute instance
    - For managed databases, use free tiers where available
  - Basic network configuration
  - Security rules (only necessary ports open)
  - Public access to the deployed application
  - Application connects to database (even if just a simple read/write)

**Automation:**
- Create a script or simple pipeline to automate deployment
- Can be a bash script, Makefile, or basic CI/CD config
- Should validate and deploy infrastructure

**Documentation:**
- README with:
  - Prerequisites (tools, accounts needed)
  - Step-by-step deployment instructions
  - How to verify the deployment
  - How to tear down resources
  - Estimated costs (or note if using free tier)

**Deliverables:**
- IaC code that can be executed
- Deployment automation
- README documentation
- URL or instructions to access the deployed application
- Submit via a private GitHub repository

### Mid-Level Positions - Additional Requirements

In addition to the base requirements above:

**Enhanced Infrastructure:**
- Implement SSL/TLS (Let's Encrypt, AWS Certificate Manager, or self-signed)
- Add basic monitoring/health checks
- Configure environment-specific variables

**Configuration Management:**
- Use variables/parameters for configurable values
- Separate configuration from code
- Support at least 2 environments (dev and prod)

**Security:**
- Follow principle of least privilege for IAM/roles
- No hardcoded secrets or credentials
- Demonstrate secure secret management approach

**CI/CD Pipeline:**
- Implement a proper CI/CD pipeline (GitHub Actions, GitLab CI, Jenkins, etc.)
- Pipeline should validate, test, and deploy
- Include basic deployment gates or manual approval

### Senior Positions - Additional Requirements

In addition to all requirements above:

**Advanced Infrastructure:**
- Implement high availability OR auto-scaling (choose one)
- Set up centralized logging (CloudWatch Logs, Stackdriver, etc.)
- Implement monitoring and alerting with at least one tool

**Production Pipeline:**
- Multi-environment deployment (dev, staging, prod)
- Automated testing in pipeline
- Rollback capability

**Documentation:**
In your README, provide:
- Architecture diagram (can be ASCII art or draw.io)
- Design decisions and trade-offs
- How you would scale this system
- Security considerations

## Technology Stack

Use whatever technologies you're most comfortable with. This is a demonstration of your problem-solving ability and DevOps practices, not a test of specific tool knowledge.

**For reference, Skyward's DevOps stack includes:**
- IaC: Terraform
- CI/CD: Jenkins, GitHub Actions
- Cloud: AWS
- Containers: Docker, Kubernetes (EKS)
- Monitoring: CloudWatch, Datadog
- Configuration: Ansible (where needed)

You're welcome to use any of these technologies, but it's not required. Use what you know best or want to learn.

## Handling Ambiguity

**Real-world engineering often involves incomplete or unclear requirements.** When you encounter ambiguity in the challenge:

- Use your best judgment to make reasonable decisions
- Document your assumptions and reasoning in your README
- Be prepared to explain your interpretation during the technical review

Part of what we're evaluating is your ability to handle ambiguity, make thoughtful decisions, and articulate your reasoning. There may not always be a single "correct" answer - we want to see how you think through problems and justify your approach.

**If something is truly blocking your progress**, reach out to your recruiting contact with specific questions.

## Evaluation Criteria

We will review your submission based on:

- **Following instructions** - Did you complete the requirements for your level?
- **Code quality** - Is your IaC clean, readable, and well-organized?
- **Best practices** - Do you follow infrastructure and security best practices?
- **Documentation** - Can someone else deploy your infrastructure?
- **Security** - Are you following security best practices?
- **Reliability** - Is the infrastructure production-ready (for your level)?
- **Cost awareness** - Do you demonstrate consideration for costs?
- **Decision-making** - How well did you handle ambiguity and document your choices?

## Example Deployment Flow

**Basic Flow (All Levels):**
1. Clone the repository
2. Configure cloud provider credentials
3. Run IaC initialization command
4. Run IaC plan/preview command
5. Run IaC apply/deploy command
6. Access the deployed application URL
7. Verify application is running
8. Run IaC destroy command to clean up

**Mid-Level Flow:**
1. Clone repository
2. Configure cloud credentials and variables
3. Deploy to dev environment with dev configuration
4. Verify dev deployment with HTTPS enabled
5. Deploy to prod environment with prod configuration
6. Check monitoring dashboard for health status
7. Trigger CI/CD pipeline with a code change
8. Pipeline validates and deploys changes

**Senior Flow:**
1. Clone repository
2. Review architecture diagram in README
3. Deploy multi-environment infrastructure (dev, staging, prod)
4. Configure monitoring and alerting
5. Trigger CI/CD pipeline with application update
6. Pipeline runs tests, validates IaC, deploys with approval gates
7. Verify high availability OR auto-scaling configuration
8. Check logs in centralized logging system
9. Verify monitoring dashboards show metrics
10. Clean up all environments

## Important Notes

**Cost Management:**
- Be mindful of cloud costs
- Document what resources will incur charges
- Use free tiers where possible
- **Remember to destroy resources after evaluation**
- Consider setting up billing alerts

**This challenge can be completed for FREE using:**

**Cloud Free Tiers (Recommended):**
- **Oracle Cloud**: Always-free tier (2 VMs, databases, forever free) - Best option
- **GCP**: $300 credit for new accounts (12 months) + always-free e2-micro VM + Cloud SQL free tier
- **AWS**: Free tier for 12 months (EC2 t2.micro, RDS db.t2.micro/db.t3.micro, 5GB storage)
- **Azure**: $200 credit for new accounts (30 days) + some always-free services

**Free PaaS Options:**
- **Fly.io**: Free tier (3 shared VMs, 3GB storage, PostgreSQL)
- **Railway**: Free tier ($5/month credit, databases included)
- **Render**: Free tier (web services, PostgreSQL, Redis)
- **Supabase**: Free tier (PostgreSQL database with API)
- **PlanetScale**: Free tier (MySQL-compatible serverless database)
- **Neon**: Free tier (serverless PostgreSQL)

**Local Options (No cloud account needed):**
- **Docker Compose**: Local deployment with IaC automation
- **Vagrant**: Local VM provisioning with IaC
- **Port Tunneling for Public Access**:
  - **ngrok**: Free tier (temporary public URLs)
  - **localtunnel**: Free, open source
  - **Cloudflare Tunnel**: Free (cloudflared)
  - **Tailscale Funnel**: Free for personal use
- These local options are perfectly acceptable - document your approach

**Free Tools for Mid/Senior Requirements:**
- **SSL/TLS**: Let's Encrypt (free), Cloudflare (free), AWS Certificate Manager (free)
- **Monitoring**: CloudWatch free tier, Grafana Cloud free tier, Uptime Robot (free), Datadog free tier
- **Logging**: CloudWatch Logs free tier, Grafana Loki (self-hosted), ELK stack (self-hosted)
- **Secrets Management**: AWS Secrets Manager free tier, HashiCorp Vault (self-hosted), environment variables
- **CI/CD**: GitHub Actions (free tier), GitLab CI (free tier), Cirrus CI (free for public repos)

**Important:** If using paid cloud services, remember to destroy all resources immediately after evaluation to avoid charges.

## Bonus Points (Optional)

These are completely optional. Only consider if you've completed all requirements for your level and have extra time:

- **Demo Video or Screenshots**: Show your infrastructure deployment in action
  - Video: Quick Loom or screen recording showing deployment process, accessing the app, showing infrastructure
  - Screenshots: Infrastructure diagram, deployed app, monitoring dashboards, pipeline execution
  - Terminal recording: asciinema showing IaC commands and deployment
  - Either format is appreciated but not required
- **Load Balancer**: Add load balancing layer
- **DNS Setup**: Configure custom domain
- **Database Backups**: Automated backup strategy
- **Network Security**: Private subnets, NAT gateway, bastion host
- **Infrastructure Testing**: Terratest, Kitchen-Terraform, etc.
- **Runbooks**: Create operational runbooks
- **Disaster Recovery**: Document DR approach
- **Cost Optimization**: Document cost optimization strategy
- **Drift Detection**: Implement infrastructure drift detection
- **Compliance as Code**: Policy enforcement (OPA, Sentinel, etc.)
- **GitOps Workflow**: Implement ArgoCD, Flux, or similar
- **Service Mesh**: Implement Istio, Linkerd, or similar (if using containers)
- **Chaos Engineering**: Include chaos testing scripts
- **Infrastructure Documentation**: Auto-generated docs from IaC
- **Multi-Cloud**: Deploy to multiple cloud providers
- **Kubernetes**: Deploy to a managed Kubernetes service
- **Observability**: Full stack monitoring with traces, metrics, logs
- **Advanced Security**: WAF, DDoS protection, security scanning
- **Blue/Green or Canary Deployments**: Advanced deployment strategies

**Note:** We review any additional work beyond the requirements. Feel free to showcase your skills in areas you're passionate about!

**AI Integration:** Skyward builds and ships AI systems. Clever integration of AI capabilities (AI-powered deployment automation, intelligent monitoring, LLM-assisted operations) is always appreciated!

## Submission

Please submit your solution as a private GitHub repository with:
- IaC code in a clear directory structure
- Complete README with all instructions
- Any scripts or automation helpers
- CI/CD pipeline configuration files
- Architecture diagrams (for senior level)
- Grant access to the reviewers specified in your interview coordination email

**Important:** Include information on how to access your deployed application (URL) or include screenshots if you've torn down resources.

## Suggested Project Structure

```
/
├── README.md
├── infrastructure/
│   ├── terraform/ (or your IaC tool)
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── environments/
│   │       ├── dev.tfvars
│   │       └── prod.tfvars
│   └── scripts/
│       ├── deploy.sh
│       └── destroy.sh
├── .github/workflows/ (or other CI/CD)
│   └── deploy.yml
├── app/ (simple application)
│   └── index.html
└── docs/
    ├── architecture.md
    └── runbooks/
```

---

**Want to try a different track?**
- Backend: [README-BE.md](README-BE.md)
- Frontend: [README-FE.md](README-FE.md)
- Fullstack: [README-FS.md](README-FS.md)
