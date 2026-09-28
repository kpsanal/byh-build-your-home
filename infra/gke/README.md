# Deploy to Google Kubernetes Engine

This setup provisions a GKE Autopilot cluster and Artifact Registry with Terraform, builds the app containers, and deploys them to Kubernetes. The frontend is exposed through a Google Cloud load balancer; Nginx serves the React app and proxies `/api` requests to the private backend service.

The backend currently stores data in SQLite. The deployment therefore uses one backend replica and a persistent disk claim. This is suitable for a small deployment, but it is not a highly available database design. For multiple backend replicas or higher availability, migrate the database to a managed service such as Cloud SQL first.

## Prerequisites

- A Google Cloud project with billing enabled
- Terraform, `gcloud`, Docker, and `kubectl`
- Permissions to enable APIs, create GKE and Artifact Registry resources, and create load balancers
- Docker authenticated to Artifact Registry in the selected region

Authenticate and select your project in PowerShell:

```powershell
gcloud auth login
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID
gcloud auth configure-docker us-central1-docker.pkg.dev
```

## Provision infrastructure

From `infra/gke`:

```powershell
terraform init
terraform apply -var="project_id=YOUR_PROJECT_ID"
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

Create the JWT signing secret without putting it in a manifest:

```powershell
$jwtSecret = Read-Host "Enter a long, random JWT signing secret"
kubectl create secret generic app-secrets --from-literal="JWT_SECRET=$jwtSecret"
Remove-Variable jwtSecret
```

Substitute the pushed image names into the Kubernetes manifest and apply it:

```powershell
$manifest = Get-Content .\k8s\app.yaml -Raw
$manifest = $manifest.Replace('${BACKEND_IMAGE}', $backendImage)
$manifest = $manifest.Replace('${FRONTEND_IMAGE}', $frontendImage)
$manifest | kubectl apply -f -
```

Wait for the workloads and fetch the external address:

```powershell
kubectl rollout status deployment/backend
kubectl rollout status deployment/frontend
kubectl get service frontend
```

Open the `EXTERNAL-IP` shown for the `frontend` service. Provisioning a load balancer address can take a few minutes.

## Updates

Build and push images with a new tag, then repeat the manifest substitution and apply commands. Kubernetes rolls out the new frontend and backend images. The backend deployment uses a recreate strategy so the persistent SQLite disk is not mounted by two backend pods at once.

## Cleanup

Delete the Kubernetes resources and secret first:

```powershell
kubectl delete -f .\k8s\app.yaml
kubectl delete secret app-secrets
```

Then, from `infra/gke`, remove the Terraform-managed cluster and registry:

```powershell
terraform destroy -var="project_id=YOUR_PROJECT_ID"
```

The persistent volume's reclaim policy can retain the disk after deleting the claim. Check `kubectl get pv` and delete retained disks if you no longer need the database. Artifact Registry image storage and GKE resources incur Google Cloud charges while they exist.