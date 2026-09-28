terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_project_service" "required_apis" {
  for_each = toset([
    "artifactregistry.googleapis.com",
    "compute.googleapis.com",
    "container.googleapis.com",
  ])

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

resource "google_artifact_registry_repository" "app" {
  project       = var.project_id
  location      = var.region
  repository_id = var.repository_name
  description   = "Container images for the construction expense app"
  format        = "DOCKER"

  depends_on = [google_project_service.required_apis]
}

data "google_project" "current" {
  project_id = var.project_id
}

resource "google_project_iam_member" "node_image_reader" {
  project = var.project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${data.google_project.current.number}-compute@developer.gserviceaccount.com"

  depends_on = [google_project_service.required_apis]
}

resource "google_container_cluster" "app" {
  project             = var.project_id
  name                = var.cluster_name
  location            = var.region
  enable_autopilot    = true
  deletion_protection = false

  depends_on = [google_project_service.required_apis]
}