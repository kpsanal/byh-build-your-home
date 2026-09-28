# Deploy to Google Kubernetes Engine

This setup provisions a GKE Autopilot cluster, Artifact Registry, and a private, regional Cloud SQL for PostgreSQL instance with Terraform. The frontend is exposed through a Google Cloud load balancer; Nginx serves the React app and proxies `/api` requests to the backend. GKE connects to Cloud SQL through the Cloud SQL Auth Proxy using Workload Identity.

The app supports separate user accounts, with project, expense, material, and timeline data scoped to the signed-in account. The API is stateless and starts with two replicas; its HPA can scale to 20 replicas. This is a scalable starting architecture, not a promise of two million users: production capacity requires representative load tests, monitoring, and Cloud SQL/GKE sizing. The default database tier and HPA limit must be adjusted from measured traffic. Local development continues to use SQLite; GKE uses PostgreSQL.

The Cloud SQL database starts empty. Existing users and records in a local SQLite file are not copied automatically; migrate and verify that data before switching an existing deployment.

## Prerequisites

- A Google Cloud project with billing enabled
- Terraform, `gcloud`, Docker, and `kubectl`
- Permissions to enable APIs, create GKE, Cloud SQL, service accounts, IAM bindings, and Artifact Registry resources
- Docker authenticated to Artifact Registry in the selected region

Authenticate and select your project in PowerShell:

```powershell
gcloud auth login
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID
gcloud auth configure-docker us-central1-docker.pkg.dev
```

## Provision infrastructure

From `infra/gke`, enter the database password through a secure prompt and provision infrastructure. Terraform stores this password in its state; keep the state private and use a secured remote backend for team or production use.

```powershell
$databasePassword = Read-Host "Choose a strong PostgreSQL application password" -AsSecureString
$env:TF_VAR_db_password = [System.Net.NetworkCredential]::new("", $databasePassword).Password
terraform init
terraform apply -var="project_id=YOUR_PROJECT_ID"
$databasePasswordPlain = $env:TF_VAR_db_password
Remove-Item Env:TF_VAR_db_password
```

Connect `kubectl` to the new cluster:

```powershell
gcloud container clusters get-credentials construction-expense-app --region us-central1 --project YOUR_PROJECT_ID
```

If you changed the Terraform cluster name or region, use those values instead.

## Build and deploy

From the repository root, set the image tag and registry prefix, then build and push both images:

```powershell
$projectId = "YOUR_PROJECT_ID"
$region = "us-central1"
$registry = "$region-docker.pkg.dev/$projectId/construction-expense-app"
$tag = Get-Date -Format "yyyyMMddHHmmss"
$backendImage = "$registry/backend:$tag"
$frontendImage = "$registry/frontend:$tag"

docker build -t $backendImage ./backend
docker push $backendImage
docker build -t $frontendImage ./frontend
docker push $frontendImage
```

Build and push the images from the repository root:

```powershell
$projectId = "YOUR_PROJECT_ID"
$region = "us-central1"
$registry = "$region-docker.pkg.dev/$projectId/construction-expense-app"
$tag = Get-Date -Format "yyyyMMddHHmmss"
$backendImage = "$registry/backend:$tag"
$frontendImage = "$registry/frontend:$tag"

docker build -t $backendImage ./backend
docker push $backendImage
docker build -t $frontendImage ./frontend
docker push $frontendImage
```

Create the Kubernetes secret from prompted credentials. The database password is URL-escaped before it is placed in the connection string:

```powershell
$connectionName = terraform -chdir=infra/gke output -raw database_connection_name
$databaseName = terraform -chdir=infra/gke output -raw database_name
$databaseUser = terraform -chdir=infra/gke output -raw database_user
$appServiceAccount = terraform -chdir=infra/gke output -raw app_runtime_service_account
$escapedPassword = [System.Uri]::EscapeDataString($databasePasswordPlain)
$databaseUrl = "postgres://$databaseUser`:$escapedPassword@localhost:5432/$databaseName`?host=/cloudsql/$connectionName"
$jwtSecretSecure = Read-Host "Enter a long, random JWT signing secret" -AsSecureString
$jwtSecret = [System.Net.NetworkCredential]::new("", $jwtSecretSecure).Password

kubectl create secret generic app-secrets `
	--from-literal="JWT_SECRET=$jwtSecret" `
	--from-literal="DATABASE_URL=$databaseUrl"

$manifest = Get-Content .\infra\gke\k8s\app.yaml -Raw
$manifest = $manifest.Replace('${BACKEND_IMAGE}', $backendImage)
$manifest = $manifest.Replace('${FRONTEND_IMAGE}', $frontendImage)
$manifest = $manifest.Replace('${INSTANCE_CONNECTION_NAME}', $connectionName)
$manifest = $manifest.Replace('${APP_RUNTIME_SERVICE_ACCOUNT}', $appServiceAccount)
$manifest | kubectl apply -f -

Remove-Variable databasePasswordPlain, escapedPassword, databaseUrl, jwtSecret
```

Wait for the workloads and fetch the external address:

```powershell
kubectl rollout status deployment/backend
kubectl rollout status deployment/frontend
kubectl get service frontend
```

Open the `EXTERNAL-IP` shown for the `frontend` service. Provisioning the database and load balancer can take several minutes.

## Updates

Build and push images with a new tag, then repeat the manifest substitution and apply commands. Kubernetes rolls out the new frontend and backend images. PostgreSQL persists data independently of the API pods.

## Cleanup

Delete the Kubernetes resources and secret first:

```powershell
kubectl delete -f .\infra\gke\k8s\app.yaml
kubectl delete secret app-secrets
```

Then, from `infra/gke`, remove the Terraform-managed cluster, database, and registry. This permanently deletes the database; export or back it up first if its data matters:

```powershell
terraform destroy -var="project_id=YOUR_PROJECT_ID"
```

Cloud SQL, its regional standby, GKE, the load balancer, and Artifact Registry incur Google Cloud charges while provisioned.