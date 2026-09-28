Overview

This directory contains Terraform orchestration that invokes Vagrant to create a small Kubernetes cluster on VirtualBox running Ubuntu 26 LTS (you may need to supply or build a box for Ubuntu 26).

Prerequisites

- Install VirtualBox
- Install Vagrant
- Install Terraform
- (Optional) Set `VAGRANT_BOX` env var to an Ubuntu 26 LTS compatible box (example: `export VAGRANT_BOX=generic/ubuntu2604`). If you don't have a 26 box, build one or substitute an available Ubuntu box and adjust instructions.

Files

- `main.tf` - Terraform null_resource that runs `vagrant up`/`vagrant destroy`.
- `Vagrantfile` - Defines 1 master and 2 worker VMs on VirtualBox.
- `scripts/bootstrap.sh` - Provisioning script run on each VM to install containerd and kubeadm, initialize master and join workers.

Usage

1. From this folder:

```bash
# optionally set VAGRANT_BOX if you have a ready Ubuntu 26 box
export VAGRANT_BOX=generic/ubuntu2604

terraform init
terraform apply
```

2. After `terraform apply` completes the cluster master kubeconfig will be available on the host at `kube/admin.conf` inside this folder. To use it:

```bash
export KUBECONFIG=$(pwd)/kube/admin.conf
kubectl get nodes
```

Notes & troubleshooting

- The Vagrant box may not exist for Ubuntu 26 yet. If so, either build a VirtualBox box for Ubuntu 26 or use a supported Ubuntu box and adjust the `VAGRANT_BOX` value.
- The provisioning assumes Internet access to download packages and containerd/kubernetes packages.
- If worker provisioning starts before the master finishes, the worker waits for `/vagrant/join_cmd.sh` to appear.

Security

This setup is for local development and testing only — do not use it in production.
