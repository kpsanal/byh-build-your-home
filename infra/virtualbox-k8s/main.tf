terraform {
  required_version = ">= 1.0"
}

resource "null_resource" "vagrant_up" {
  triggers = {
    vagrantfile = file("${path.module}/Vagrantfile")
  }

  provisioner "local-exec" {
    command     = "vagrant up --provider virtualbox"
    working_dir = path.module
  }

  provisioner "local-exec" {
    when        = destroy
    command     = "vagrant destroy -f"
    working_dir = path.module
  }
}
