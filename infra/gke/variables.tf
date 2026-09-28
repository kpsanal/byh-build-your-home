variable "project_id" {
  description = "Google Cloud project ID where the cluster and registry are created."
  type        = string
}

variable "region" {
  description = "Google Cloud region for GKE and Artifact Registry."
  type        = string
  default     = "us-central1"
}

variable "cluster_name" {
  description = "Name of the GKE Autopilot cluster."
  type        = string
  default     = "construction-expense-app"
}

variable "repository_name" {
  description = "Artifact Registry Docker repository name."
  type        = string
  default     = "construction-expense-app"
}

variable "database_name" {
  description = "Name of the PostgreSQL database for the app."
  type        = string
  default     = "homebuild"
}

variable "database_user" {
  description = "Application database user."
  type        = string
  default     = "homebuild_app"
}

variable "db_password" {
  description = "Password for the PostgreSQL application user. Stored in Terraform state; protect state files."
  type        = string
  sensitive   = true
}

variable "database_tier" {
  description = "Cloud SQL machine tier. Load test and resize before production traffic."
  type        = string
  default     = "db-custom-2-7680"
}