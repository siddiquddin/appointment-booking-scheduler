# Chronos Atelier — Full-Stack 3D Appointment & Booking Scheduler

A production-ready full-stack appointment and client scheduling application designed for modern clinics, salons, and studios. Pairs a scroll-choreographed **React Three Fiber** 3D booking landing experience with a zero-lag **Bento-grid Admin Workspace**, **Express + MongoDB Atlas** REST API (with overlap double-booking protection), **Docker Compose**, and **AWS** deployment guides.

---

## Architecture Overview

```text
appointment-booking-scheduler/
├── backend/                     # Node.js 20 + Express + Mongoose API
│   ├── src/
│   │   ├── config/db.js         # MongoDB Atlas connection w/ retry & state reporting
│   │   ├── models/              # Service, Client, Appointment (with compound index)
│   │   ├── middleware/          # Request validation & centralized JSON error handling
│   │   ├── controllers/         # CRUD + 409 conflict overlap engine + dashboard metrics
│   │   ├── routes/              # /api/services, /clients, /appointments, /dashboard, /health
│   │   ├── seed/seed.js         # Sample clinic/salon services, clients & appointments
│   │   ├── app.js               # Express app (helmet, cors, rate-limit, morgan)
│   │   └── server.js            # Entrypoint + graceful SIGINT/SIGTERM shutdown
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/                    # React 18 + Vite + Tailwind + R3F + Framer Motion
│   ├── src/
│   │   ├── api/client.js        # Typed fetch client using VITE_API_BASE_URL
│   │   ├── components/
│   │   │   ├── booking/         # <BookingHero3D />, Public Landing & Self-Booking Drawer
│   │   │   ├── admin/           # Dashboard Overview, Appointments, Clients, Services
│   │   │   └── ui/              # Modals, Confirm Dialog, Skeletons, Status Badges
│   │   ├── context/             # Global Toast & Dark/Light Surface Theme Contexts
│   │   └── hooks/               # Debounced search & reduced-motion utilities
│   ├── Dockerfile               # Multi-stage Vite build -> Nginx 1.27 Alpine
│   ├── nginx.conf               # SPA routing + /api/ reverse proxy
│   └── .dockerignore
├── docker-compose.yml           # Orchestrates frontend + backend over bridge network
├── .env.example
├── deploy-aws.sh                # Automated EC2 deployment script
└── README.md
```

---

## Quick Start (Local Development)

### 1. Environment Variables
```bash
cp .env.example .env
# Edit .env with your MongoDB Atlas connection string:
# MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/booking_scheduler?retryWrites=true&w=majority
```

### 2. Backend Setup & Seed
```bash
cd backend
npm install
npm run seed    # Populates sample services, clients & appointments
npm run dev     # Starts Express API on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev     # Starts Vite dev server on http://localhost:5173 (proxies /api to :5000)
```

---

## Docker Compose (Single-Command Run)

```bash
cp .env.example .env
# Set your MONGODB_URI inside .env
docker compose up --build -d
```

- Application UI: `http://localhost`
- Health Check: `http://localhost/api/health`

---

## API Reference

| Endpoint | Methods | Notes |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Returns `200 OK` when MongoDB is connected, `503` otherwise |
| `/api/services` | `GET`, `POST` | Supports `?activeOnly=true` and `?category=` |
| `/api/services/:id` | `GET`, `PUT`, `DELETE` | Full CRUD for service offerings |
| `/api/clients` | `GET`, `POST` | Supports `?search=` matching fullName, email, or phone |
| `/api/clients/:id` | `GET`, `PUT`, `DELETE` | Full CRUD for client directory |
| `/api/appointments` | `GET`, `POST` | Filters: `?date=YYYY-MM-DD`, `?status=`, `?staffName=`, `?clientId=` |
| `/api/appointments/:id` | `GET`, `PUT`, `DELETE` | Auto-calculates `endTime`; returns `409 Conflict` on staff time overlap |
| `/api/appointments/:id/status` | `PATCH` | Fast status update (`Scheduled`, `Completed`, `Cancelled`, `No-Show`) |
| `/api/dashboard/stats` | `GET` | Today's count, status totals, total clients, estimated revenue |

---

## AWS Deployment Guide

### Option A: AWS EC2 (Ubuntu 24.04 LTS) + Docker Compose

1. **Launch EC2 Instance**:
   - AMI: **Ubuntu Server 24.04 LTS (HVM)** (`t3.small` or `t3.medium` recommended).
   - Storage: `20 GB gp3` EBS volume.
   - Allocate an **Elastic IP** and associate it with your EC2 instance.
2. **Configure EC2 Security Group (Inbound Rules)**:
   - `SSH (TCP 22)` → Your trusted office/home IP only
   - `HTTP (TCP 80)` → `0.0.0.0/0`
   - `HTTPS (TCP 443)` → `0.0.0.0/0`
3. **Whitelist EC2 Elastic IP in MongoDB Atlas**:
   - In **MongoDB Atlas → Network Access → Add IP Address**, enter `<YOUR_EC2_ELASTIC_IP>/32`.
   - Confirm your Atlas database user has `readWrite` permissions on the `booking_scheduler` database.
4. **Deploy Application via `deploy-aws.sh`**:
   ```bash
   ssh -i your-key.pem ubuntu@<YOUR_EC2_ELASTIC_IP>
   git clone <your-repo-url> appointment-booking-scheduler
   cd appointment-booking-scheduler
   cp .env.example .env
   nano .env   # Set MONGODB_URI and CORS_ORIGIN=https://yourdomain.com
   chmod +x deploy-aws.sh
   ./deploy-aws.sh
   ```
5. **Seed Initial Data (Optional)**:
   ```bash
   docker compose exec backend npm run seed
   ```

---

### Option B: AWS ECR + AWS ECS (Fargate) + Application Load Balancer

1. **Create Two ECR Repositories**:
   ```bash
   aws ecr create-repository --repository-name scheduler-backend --region us-east-1
   aws ecr create-repository --repository-name scheduler-frontend --region us-east-1
   ```
2. **Authenticate, Build & Push Images**:
   ```bash
   ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
   REGION=us-east-1
   aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

   docker build -t $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/scheduler-backend:latest ./backend
   docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/scheduler-backend:latest

   docker build -t $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/scheduler-frontend:latest \
     --build-arg VITE_API_BASE_URL=/api ./frontend
   docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/scheduler-frontend:latest
   ```
3. **Configure ECS Fargate Task Definition**:
   - Container 1 (`backend`): Port `5000`, inject `MONGODB_URI` via **AWS Secrets Manager**, set `CORS_ORIGIN`.
   - Container 2 (`frontend`): Port `80`, update `nginx.conf` upstream `http://127.0.0.1:5000/api/` if running both containers in the same Fargate task (`awsvpc` localhost), or route `/api/*` via ALB path rules to a separate backend target group.
4. **Application Load Balancer (ALB) Target Group Health Checks**:
   - Backend target group health check path: **`/api/health`** (`200` matcher, interval `30s`).
   - Frontend target group health check path: **`/`**.
5. **MongoDB Atlas Access**:
   - Attach an **AWS NAT Gateway Elastic IP** (if tasks run in private subnets) and whitelist that NAT Elastic IP in **MongoDB Atlas Network Access**, or enable **MongoDB Atlas AWS PrivateLink**.

---

### Option C: SSL / HTTPS Setup

#### On EC2 with Let's Encrypt (Certbot + Nginx)
1. Point your domain's `A` record (`booking.yourdomain.com`) to your EC2 Elastic IP.
2. Install Certbot on the host (or terminate SSL on a host-level Nginx proxy forwarding to `http://127.0.0.1:80`):
   ```bash
   sudo apt-get install -y nginx certbot python3-certbot-nginx
   sudo certbot --nginx -d booking.yourdomain.com
   ```
3. Update `.env`:
   ```env
   CORS_ORIGIN=https://booking.yourdomain.com
   ```
   Then restart: `docker compose up -d --force-recreate backend`.

#### On ECS + ALB with AWS Certificate Manager (ACM)
1. Request a public TLS certificate in **AWS Certificate Manager (ACM)** for `booking.yourdomain.com` and complete DNS validation via Route 53.
2. Add an **HTTPS:443 Listener** to the ALB attaching your ACM certificate, forwarding to your target groups.
3. Add an HTTP:80 → HTTPS:443 `301` redirect rule on the ALB.
