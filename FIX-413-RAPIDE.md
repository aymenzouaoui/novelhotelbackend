# 🔧 FIX RAPIDE - Erreur 413

## ⚠️ PROBLÈME
L'erreur **413 Request Entity Too Large** vient de **Nginx** qui bloque les fichiers avant qu'ils n'atteignent Express.

## ✅ SOLUTION EN 3 ÉTAPES

### 1️⃣ Se connecter au serveur
```bash
ssh votre-utilisateur@api.novotel-tunis.com
# ou
ssh votre-utilisateur@IP_DU_SERVEUR
```

### 2️⃣ Modifier la configuration Nginx

Trouver le fichier :
```bash
sudo find /etc/nginx -name "*api.novotel-tunis.com*" -o -name "*novotel*"
```

Ou chercher directement :
```bash
sudo grep -r "api.novotel-tunis.com" /etc/nginx/
```

Éditer le fichier (remplacer `/etc/nginx/sites-available/api.novotel-tunis.com` par le chemin trouvé) :
```bash
sudo nano /etc/nginx/sites-available/api.novotel-tunis.com
```

### 3️⃣ Ajouter cette ligne dans le bloc `server { ... }`

Cherchez le bloc qui commence par :
```nginx
server {
    listen 443 ssl;
    server_name api.novotel-tunis.com;
```

**AJOUTEZ cette ligne juste après `server_name` :**
```nginx
server {
    listen 443 ssl;
    server_name api.novotel-tunis.com;
    
    # ⚠️ AJOUTER CETTE LIGNE :
    client_max_body_size 0;
    
    ssl_certificate /etc/letsencrypt/live/api.novotel-tunis.com/fullchain.pem;
    ...
```

### 4️⃣ Tester et recharger

```bash
# Tester la configuration
sudo nginx -t

# Si OK, recharger
sudo systemctl reload nginx
```

## 🎯 Configuration Complète Recommandée

Pour une solution complète avec CORS, remplacez tout le bloc `server` par :

```nginx
server {
    listen 443 ssl;
    server_name api.novotel-tunis.com;

    ssl_certificate /etc/letsencrypt/live/api.novotel-tunis.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.novotel-tunis.com/privkey.pem;

    # ⚠️ CRITIQUE : Uploads illimités
    client_max_body_size 0;
    client_body_timeout 300s;
    proxy_read_timeout 300s;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;

    # CORS headers
    add_header Access-Control-Allow-Origin $http_origin always;
    add_header Access-Control-Allow-Credentials "true" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, PATCH" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, Accept" always;

    if ($request_method = OPTIONS) {
        return 204;
    }

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_request_buffering off;
    }
}
```

## ✅ Vérification

Après modification, vérifiez que ça fonctionne :
```bash
sudo nginx -T | grep -A 5 "api.novotel-tunis.com" | grep "client_max_body_size"
```

Vous devriez voir : `client_max_body_size 0;`

## 🚨 IMPORTANT

**Sans cette modification Nginx, l'erreur 413 persistera** même si le code Express est correct.

Le fichier `nginx-config-updated.conf` contient la configuration complète prête à copier.
