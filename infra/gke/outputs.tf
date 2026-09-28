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

output "database_connection_name" {
  description = "Cloud SQL connection name used by the Auth Proxy."
  value       = google_sql_database_instance.app.connection_name
}

output "database_name" {
  description = "PostgreSQL database name."
  value       = google_sql_database.app.name
}

output "database_user" {
  description = "PostgreSQL application username."
  value       = google_sql_user.app.name
}

output "app_runtime_service_account" {
  description = "Google service account used by the GKE app workload."
  value       = google_service_account.app_runtime.email
}