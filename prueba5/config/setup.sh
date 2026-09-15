#!/bin/bash

# ==========================================
# Detectar IP del equipo principal
# ==========================================

HOST_IP=$(ip route get 8.8.8.8 | awk '{for(i=1;i<=NF;i++) if($i=="src") {print $(i+1); exit}}')

if [ -z "$HOST_IP" ]; then
    echo "Error: no se pudo detectar la IP del equipo."
    exit 1
fi


# ==========================================
# Crear archivo .env
# ==========================================

cat > .env <<EOF
HOST_IP=${HOST_IP}
PD_PORT=2379
API_PORT=3010
EOF


# ==========================================
# Cargar variables del .env
# ==========================================

set -a
source .env
set +a


# ==========================================
# Preparar cloud-init
# ==========================================

envsubst '${HOST_IP}' < tikv-cloud-init.yaml > tikv-cloud-init-generated.yaml


# ==========================================
# Mostrar configuración
# =====================================s=====

echo
echo "Configuración creada correctamente."
echo
cat .env

echo
echo "Cloud-init preparado en:"
echo "tikv-cloud-init-generated.yaml"