## Forked the repository and clone

i fork the repository called  https://github.com/khushi2706/Blog-App-using-MERN-stack/tree/main and i forked this repository to my github accond
https://github.com/shefeekar/Blog-App-using-MERN-stack/blob/main/.github/workflows/docker-image.yml

the app containing both clilent server .  in frontend application i made a dockerfile for building docker image  on client image 

```
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:1.25-alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

```

### Stage 1 – Build React App

- `FROM node:20-alpine`: Use a lightweight Node.js image.
- `WORKDIR /app`: Set working directory inside the container.
- `COPY package.json ...`: Copy dependency files.
- `RUN npm install`: Install dependencies.
- `COPY . .`: Copy all source code.
- `RUN npm run build`: Build the React app for production.

---

### Stage 2 – Serve with Nginx

- `FROM nginx:1.25-alpine`: Use a minimal Nginx image.
- `RUN rm ...`: Remove default Nginx files.
- `COPY --from=builder ...`: Copy the React build to Nginx folder.
- `EXPOSE 80`: Declare port 80 to be used.
- `CMD ...`: Start Nginx in the foreground

Then we chang e the /server/config/db.js file 

The change you made improves **flexibility and security** by allowing the MongoDB connection URL to be set via an **environment variable**.

---

### Original code:

```

mongoose.connect("mongodb://127.0.0.1:27017/BlogApp")

```

- This hardcodes the database connection string.
- Works only for local development (localhost).
- Cannot connect to different databases (e.g., in staging, production) without changing the code.

---

### Updated code:

```

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/BlogApp";
mongoose.connect(MONGO_URI)

```

- This checks if `MONGO_URI` is set in the environment.
- If it **is set**, it uses that value (e.g., a remote MongoDB Atlas URI).
- If not set, it **defaults** to local MongoDB (`127.0.0.1`).

then we have to create a  docker file for server app

### Dockerfile for the server app

```
Dockerfile
CopyEdit
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5001
CMD ["node", "server.js"]

```

### Step-by-Step Explanation

| Line | Description |
| --- | --- |
| `FROM node:20-alpine` | Uses a lightweight Node.js 20 image to reduce image size. |
| `WORKDIR /app` | Sets the working directory inside the container. |
| `COPY package*.json ./` | Copies dependency files (`package.json` and optionally `package-lock.json`). |
| `RUN npm install` | Installs backend dependencies. |
| `COPY . .` | Copies all project files to the container. |
| `EXPOSE 5001` | Exposes port 5001 used by the Express app. |
| `CMD ["node", "server.js"]` | Starts the backend server. |

## **docker-compose file** for locally building and running the full app with the client, server, and MongoDB services:

```yaml
yaml
CopyEdit
version: "3.8"

services:
  client:
    build: ./client
    ports:
      - "3000:80"
    depends_on:
      - server
    networks:
      - blog-net

  server:
    build: ./server
    ports:
      - "5001:5001"
    environment:
      - MONGO_URI=mongodb://root:pass@mongo:27017/BlogApp?authSource=admin
    depends_on:
      - mongo
    networks:
      - blog-net

  mongo:
    image: mongo:8.0.8
    volumes:
      - mongo-data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: pass
      MONGO_INITDB_DATABASE: BlogApp
    networks:
      - blog-net

volumes:
  mongo-data:

networks:
  blog-net:
    driver: bridge

```

### Key Points:

- **Client**: Builds the frontend React app and exposes it on port `3000`. It depends on the `server` service.
- **Server**: Builds the backend Node.js app and exposes it on port `5001`. It depends on the `mongo` service and uses a MongoDB URI to connect.
- **MongoDB**: Uses the official MongoDB image, and initializes the database with a root username and password.

### To Use:

1. Navigate to your project directory where `docker-compose.yml` is located.
2. Run the following command to build and start the containers:
    
    ```bash
    bash
    CopyEdit
    docker-compose up --build
    
    ```
    
3. After the containers start:
    - Access the frontend at `http://localhost:3000`
    - Access the backend at `http://localhost:5001`
    
    ![Screenshot (87).png](attachment:8cc24d07-00f0-4a32-ab59-a852490d32e0:Screenshot_(87).png)
    

## Workflowfile

created a workflow file to build and push docker images to docker hub using git hub action  location is .git/workflows/dockerimage.yml . and the file is name: Build and Push Docker Images to docker hub 

```
name: Build and Push Docker Images

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

env:
  DOCKERHUB_USERNAME: shefeekar  # Replace with your Docker Hub username
  CLIENT_IMAGE: blog-app-client  # Frontend image name
  SERVER_IMAGE: blog-app-server  # Backend image name

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      # Login to Docker Hub
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      # Build and Push Frontend (Client)
      - name: Build and Push Client Image
        uses: docker/build-push-action@v5
        with:
          context: ./client
          file: ./client/Dockerfile
          push: true
          tags: |
            ${{ env.DOCKERHUB_USERNAME }}/${{ env.CLIENT_IMAGE }}:latest
            ${{ env.DOCKERHUB_USERNAME }}/${{ env.CLIENT_IMAGE }}:${{ github.sha }}

      # Build and Push Backend (Server)
      - name: Build and Push Server Image
        uses: docker/build-push-action@v5
        with:
          context: ./server
          file: ./server/Dockerfile
          push: true
          tags: |
            ${{ env.DOCKERHUB_USERNAME }}/${{ env.SERVER_IMAGE }}:latest
            ${{ env.DOCKERHUB_USERNAME }}/${{ env.SERVER_IMAGE }}:${{ github.sha }}

```

![Screenshot (86).png](attachment:3305e18a-7faa-4a7f-ab4d-7806d7cc6f64:Screenshot_(86).png)

## **Workflow Overview**

The workflow, defined in **`.github/workflows/dockerimage.yml`**, performs the following tasks:

1. **Triggers** on **`push`** or **`pull_request`** to the **`main`** branch.
2. **Logs into Docker Hub** using secure credentials.
3. **Builds and pushes two Docker images**:
    - A **frontend (client)** image (**`blog-app-client`**)
    - A **backend (server)** image (**`blog-app-server`**)
4. **Tags images** with:
    - **`latest`** (for the most recent stable version)
    - The **Git commit SHA** (for traceability)

---

## **Key Components**

### **1. Workflow Triggers**

The workflow runs automatically when:

yaml

Copy

Download

```
on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]
```

This ensures that every code change in **`main`** (via direct push or merged PR) triggers a fresh build.

### **2. Docker Hub Authentication**

To push images, the workflow logs into Docker Hub using GitHub Secrets:

yaml

Copy

Download

```
- name: Login to Docker Hub
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}
```

**Security Note:**

- Never hardcode credentials—always use **GitHub Secrets**.
- The **`DOCKERHUB_TOKEN`** should be a **personal access token** (PAT) from Docker Hub.

### **3. Building & Pushing Images**

Each service (client and server) is built separately:

### **Frontend (Client) Image**

yaml

Copy

Download

```
- name: Build and Push Client Image
  uses: docker/build-push-action@v5
  with:
    context: ./client
    file: ./client/Dockerfile
    push: true
    tags: |
      ${{ env.DOCKERHUB_USERNAME }}/${{ env.CLIENT_IMAGE }}:latest
      ${{ env.DOCKERHUB_USERNAME }}/${{ env.CLIENT_IMAGE }}:${{ github.sha }}
```

### **Backend (Server) Image**

yaml

Copy

Download

```
- name: Build and Push Server Image
  uses: docker/build-push-action@v5
  with:
    context: ./server
    file: ./server/Dockerfile
    push: true
    tags: |
      ${{ env.DOCKERHUB_USERNAME }}/${{ env.SERVER_IMAGE }}:latest
      ${{ env.DOCKERHUB_USERNAME }}/${{ env.SERVER_IMAGE }}:${{ github.sha }}
```

**Why Two Tags?**

- **`latest`** → Always points to the newest stable version.
- **`${{ github.sha }}`** → Enables version-pinning for debugging and rollbacks.

then we deployed the applcation on the server using the image we pushed into the docker hub 

## final docker compose file for  the production

```
version: "3.8"

services:
  nginx:
    container_name: nginx
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - client
      - server
    networks:
      - blog-net

  client:
    build: ./client
    expose:
      - "80"
    depends_on:
      - server
    networks:
      - blog-net

  server:
    build: ./server
    expose:
      - "5001"
    environment:
      - MONGO_URI=mongodb://root:pass@mongo:27017/BlogApp?authSource=admin
    depends_on:
      - mongo
    networks:
      - blog-net

  mongo:
    image: mongo:8.0.8
    volumes:
      - mongo-data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: pass
      MONGO_INITDB_DATABASE: BlogApp
    networks:
      - blog-net

volumes:
  mongo-data:

networks:
  blog-net:
    driver: bridge
    name: blog-net
```

This project uses Docker Compose to run the full MERN stack application locally. The configuration is defined in a file named `docker-compose-pro.yml`. It sets up three main services: the frontend (React), the backend (Node.js/Express), and the MongoDB database. All services run in isolated containers and communicate over a shared Docker network.

## Docker Compose File Overview

Below is the complete content of the `docker-compose-pro.yml` file:

## Service Descriptions

### 1. Client (Frontend)

- **Directory**: `./client`
- **Base Image**: Uses a custom Dockerfile in the client directory.
- **Ports**: Maps container port 80 (default for Nginx) to host port 3000.
- **Dependencies**: Waits for the backend server to be ready before starting.
- **Network**: Connects to `blog-net` for internal communication.

### 2. Server (Backend)

- **Directory**: `./server`
- **Base Image**: Built from the custom server Dockerfile.
- **Ports**: Maps container port 5001 to host port 5001.
- **Environment Variable**:
    
    `MONGO_URI` defines the MongoDB connection string, referencing the `mongo` container with authentication credentials.
    
- **Dependencies**: Waits for the `mongo` service to be ready.
- **Network**: Shares `blog-net` with other services.

### 3. Mongo (Database)

- **Image**: `mongo:8.0.8`
- **Data Persistence**: Mounts the volume `mongo-data` to persist data on the host.
- **Environment Variables**:
    
    Sets up MongoDB with a root user, password, and initializes the `BlogApp` database.
    
- **Network**: Attached to `blog-net`.

## Supporting Components

### Volumes

- `mongo-data`: Stores MongoDB data on the host to ensure persistence across container restarts.

### Networks

- `blog-net`: A user-defined bridge network allowing internal communication between containers.

## How to Run the Project Locally

To start the application using this Compose file, run the following command from the project root:

```bash
bash
CopyEdit
docker compose -f docker-compose-pro.yml up --build

```

This command builds all Docker images and starts the containers. Once running, the application is accessible at:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5001`

This setup ensures that the full-stack application can be developed and tested in a consistent, containerized environment. It supports isolated service management, simplifies networking, and ensures reproducibility across environments.

If you need a separate setup for production deployment (such as on an EC2 instance or a managed Kubernetes cluster), that can also be documented separately. Let me know if you’d like that included

## Install prometheues and grafana node exporter and nginx node exporter using following docker-compose file

```
volumes:
    prometheus_data: {}
    grafana_data: {}

networks:
  blog-net:
    external: true

services:

  prometheus:
    image: prom/prometheus:main
    volumes:
      - ./prometheus/:/etc/prometheus/
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    ports:
      - 9090:9090
    networks:
      - blog-net
    restart: always

  node-exporter:
    image: prom/node-exporter
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command: 
      - '--path.procfs=/host/proc' 
      - '--path.sysfs=/host/sys'
      - --collector.filesystem.ignored-mount-points
      - "^/(sys|proc|dev|host|etc|rootfs/var/lib/docker/containers|rootfs/var/lib/docker/overlay2|rootfs/run/docker/netns|rootfs/var/lib/docker/aufs)($$|/)"
    ports:
      - 9100:9100
    networks:
      - blog-net
    restart: always
    deploy:
      mode: global

  nginx-exporter:
    image: nginx/nginx-prometheus-exporter:1.4.2
    ports:
      - 9113:9113
    command:
      - '--nginx.scrape-uri=http://nginx:8080/stub_status'
    networks:
      - blog-net
    restart: always
    deploy:
      mode: global

  grafana:
    image: grafana/grafana
    depends_on:
      - prometheus
    ports:
      - 3000:3000
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/:/etc/grafana/provisioning/
    environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
    - GF_USERS_ALLOW_SIGN_UP=false
    networks:
      - blog-net
    restart: always
```

## metrics pulling to prometheus

The `prometheus.yml` file tells Prometheus **what data to pull (scrape), from where (targets), how often, and how to label it**. It controls which services Prometheus monitors and how it collects their metrics
Prometheus is configured to self-monitor by scraping its own metrics, collect system statistics via a Node Exporter, and gather web server metrics from an NGINX Exporter, with all targets scraped every 30 seconds and a 10-second timeout per scrape.

```yaml
global:
  scrape_interval: 30s
  scrape_timeout: 10s

scrape_configs:
  - job_name: services
    metrics_path: /metrics
    static_configs:
      - targets:
          - 'prometheus:9090'
  - job_name: node_exporter
    static_configs:
      - targets:
          - 'node-exporter:9100'
  - job_name: 'nginx-exporter'
    static_configs:
      - targets:
          - 'nginx-exporter:9113'
```

## Set up grafana datasources

```yaml
apiVersion: 1

datasources:
  - name: prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    basicAuth: false
    isDefault: true
    jsonData:
      tlsAuth: false
      tlsAuthWithCACert: false
    editable: false
```

**it will be used to prometheus where is fetching data to grafana in our case grafana fetch data from the prometheus**

- : A *dashboard* is a **collection of visualizations** (panels) that display data queried from one or more data sources.
- **Purpose**: It organizes and presents data in graphs, tables, or alerts for monitoring and analysis.

```yaml
apiVersion: 1

providers:
- name: 'Prometheus'
  orgId: 1
  folder: ''
  type: file
  disableDeletion: false
  editable: true
  options:
    path: /etc/grafana/provisioning/dashboards
```

## Node exporter

![Screenshot (90).png](attachment:496bf8e6-929d-46b8-a0d4-2b63964e36c6:Screenshot_(90).png)

## prometheus

![Screenshot (91).png](attachment:419fd2a4-bf09-4a12-9fab-f77be71bb75a:Screenshot_(91).png)

## grafana visualisation node exporter

![Screenshot (89).png](attachment:7650f019-8f96-4a6b-8e35-ee97219d5e87:Screenshot_(89).png)
