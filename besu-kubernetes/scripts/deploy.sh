#!/bin/bash

# Create namespace if it doesn't exist
kubectl create namespace besu || true

echo "Desplegando Red QBFT en Kubernetes"
# Apply Kubernetes manifests on the besu namespace
kubectl create configmap besu-genesis-config \
  --from-file=../network-config/genesis.json \
  --dry-run=client -o yaml | kubectl apply -n besu -f -
kubectl apply -n besu -f ../k8s-manifests/secrets.yaml
kubectl apply -n besu -f ../k8s-manifests/service.yaml
kubectl apply -n besu -f ../k8s-manifests/statefulset.yaml
echo "Despliegue iniciado. Para verificar: kubectl get pods -n besu"

# Wait for the pod to be ready before deploying monitoring
echo "Instalando Prometheus y Grafana con Helm"
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm upgrade --install monitoring prometheus-community/kube-prometheus-stack \
  --namespace besu \
  --set grafana.adminPassword=admin \
  --set prometheus.prometheusSpec.podMetadataObjectSelector.matchLabels.app=besu-node \
  --set grafana.service.type=NodePort \
  --set grafana.service.nodePort=30000 \
  --wait

kubectl apply -f ../k8s-manifests/besu-servicemonitor.yaml

echo "Success Deploy. Accede a Grafana en el puerto 30000"
