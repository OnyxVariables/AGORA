#!/bin/bash

# Script para limpiar automáticamente todos los pods de Grafana
# Escala a 0, elimina pods stuck/evicted, y recrea con 1 pod limpio
echo "Limpiando pods de Grafana..."

echo "Escalando Grafana a 0 réplicas..."
kubectl scale deployment monitoring-grafana --replicas=0 -n besu

echo "Esperando eliminación de pods activos..."
sleep 10

echo "Eliminando pods en estado Failed/Evicted/Unknown..."
kubectl delete pods -n besu -l app.kubernetes.io/name=grafana --field-selector=status.phase=Failed --ignore-not-found
kubectl delete pods -n besu -l app.kubernetes.io/name=grafana --field-selector=status.phase=Evicted --ignore-not-found
kubectl delete pods -n besu -l app.kubernetes.io/name=grafana --field-selector=status.phase=Unknown --ignore-not-found
kubectl delete pods -n besu -l app.kubernetes.io/name=grafana --field-selector=status.phase=Pending --ignore-not-found

sleep 5

echo "Recreando Grafana con 1 pod limpio..."
kubectl scale deployment monitoring-grafana --replicas=1 -n besu

echo "Esperando que Grafana esté listo..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=grafana -n besu --timeout=60s

echo "Verificando estado final..."
kubectl get pods -n besu -l app.kubernetes.io/name=grafana

echo "Grafana limpio y listo!"
echo "Para acceder a Grafana:"
echo "kubectl port-forward svc/monitoring-grafana 3000:3000 -n besu"
echo "http://<IP_PUBLICA_MASTER>:30000"
