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