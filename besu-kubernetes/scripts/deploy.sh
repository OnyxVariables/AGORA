#!/bin/bash
echo "Desplegando Red QBFT en Kubernetes"

# Creo los recursos en el orden correcto
kubectl create configmap besu-genesis-config \
  --from-file=../network-config/genesis.json \
  --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f ../k8s-manifests/secrets.yaml
kubectl apply -f ../k8s-manifests/service.yaml
kubectl apply -f ../k8s-manifests/statefulset.yaml

echo "Despliegue iniciado. Para verificar: kubectl get pods"
