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
    "cloudsql.googleapis.com",
    "servicenetworking.googleapis.com",
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

resource "google_service_account" "app_runtime" {
  project      = var.project_id
  account_id   = "${substr(replace(var.cluster_name, "-", ""), 0, 23)}-rt"
  display_name = "${var.cluster_name} GKE workload identity"
}

resource "google_project_iam_member" "app_cloud_sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.app_runtime.email}"
}

resource "google_service_account_iam_member" "app_workload_identity" {
  service_account_id = google_service_account.app_runtime.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[default/app-runtime]"
}

resource "google_container_cluster" "app" {
  project             = var.project_id
  name                = var.cluster_name
  location            = var.region
  enable_autopilot    = true
  deletion_protection = false

  depends_on = [google_project_service.required_apis]
}

data "google_compute_network" "default" {
  name = "default"
}

resource "google_compute_global_address" "private_services" {
  project       = var.project_id
  name          = "${var.cluster_name}-private-services"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = data.google_compute_network.default.self_link

  depends_on = [google_project_service.required_apis]
}

resource "google_service_networking_connection" "private_services" {
  network                 = data.google_compute_network.default.self_link
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_services.name]
}

resource "google_sql_database_instance" "app" {
  project          = var.project_id
  name             = "${var.cluster_name}-db"
  region           = var.region
  database_version = "POSTGRES_16"
  deletion_protection = false

  settings {
    tier              = var.database_tier
    availability_type = "REGIONAL"
    disk_type         = "PD_SSD"
    disk_size         = 20
    disk_autoresize   = true

    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7

      backup_retention_settings {
        retained_backups = 7
        retention_unit   = "COUNT"
      }
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = data.google_compute_network.default.self_link
    }
  }

  depends_on = [google_service_networking_connection.private_services]
}

resource "google_sql_database" "app" {
  project  = var.project_id
  instance = google_sql_database_instance.app.name
  name     = var.database_name
}

resource "google_sql_user" "app" {
  project  = var.project_id
  instance = google_sql_database_instance.app.name
  name     = var.database_user
  password = var.db_password
}