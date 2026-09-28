output "cluster_name" {
  description = "GKE cluster name."
  value       = google_container_cluster.app.name
}

output "region" {
  description = "GKE cluster and Artifact Registry region."
  value       = var.region
}

output "artifact_registry" {
  description = "Artifact Registry image prefix."
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.app.repository_id}"
}