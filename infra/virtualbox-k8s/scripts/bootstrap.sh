#!/usr/bin/env bash
set -euo pipefail
role=${1:-}

# Basic prerequisites and helpers
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y curl apt-transport-https ca-certificates gnupg lsb-release software-properties-common conntrack

# Disable swap
swapoff -a
sed -i '/ swap / s/^/#/' /etc/fstab || true

# Kernel modules and sysctl for k8s
cat <<EOF | tee /etc/modules-load.d/k8s.conf
br_netfilter
EOF
modprobe br_netfilter

cat <<EOF | tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.ipv4.ip_forward                 = 1
net.bridge.bridge-nf-call-ip6tables = 1
EOF
sysctl --system

# Install containerd
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y containerd.io

mkdir -p /etc/containerd
containerd config default > /etc/containerd/config.toml
systemctl restart containerd
systemctl enable containerd

# Install kubeadm, kubelet, kubectl
curl -fsSL https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -
echo "deb http://apt.kubernetes.io/ kubernetes-xenial main" | tee /etc/apt/sources.list.d/kubernetes.list
apt-get update
apt-get install -y kubelet kubeadm kubectl
apt-mark hold kubelet kubeadm kubectl
systemctl enable kubelet

# Ensure host network is available
HOST_IP=$(hostname -I | awk '{print $1}')

if [ "$role" = "master" ]; then
  # Initialize control plane
  kubeadm init --apiserver-advertise-address=${HOST_IP} --pod-network-cidr=10.244.0.0/16

  # Make kubeconfig available in /vagrant for host access
  mkdir -p /vagrant/kube
  KUBECONFIG=/etc/kubernetes/admin.conf kubectl --kubeconfig=/etc/kubernetes/admin.conf apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml || true
  cp /etc/kubernetes/admin.conf /vagrant/kube/admin.conf

  # Create join command for workers
  kubeadm token create --print-join-command > /vagrant/join_cmd.sh
  chmod +x /vagrant/join_cmd.sh

  echo "Master setup complete"
else
  # Worker: wait until the join command appears in /vagrant
  echo "Worker waiting for join command..."
  while [ ! -s /vagrant/join_cmd.sh ]; do
    sleep 5
  done
  /vagrant/join_cmd.sh
  echo "Worker joined cluster"
fi
