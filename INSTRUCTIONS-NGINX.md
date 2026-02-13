# Instructions pour Résoudre l'Erreur 413 et CORS

## Problème Actuel

Vous rencontrez deux erreurs :
1. **413 Request Entity Too Large** - Nginx rejette les fichiers volumineux
2. **CORS Error** - Les en-têtes CORS ne sont pas envoyés car la requête est rejetée avant d'atteindre Express

## Solution : Appliquer la Configuration Nginx

### Étape 1 : Se connecter au serveur

```bash
ssh votre-utilisateur@votre-serveur
```

### Étape 2 : Localiser le fichier de configuration Nginx

Le fichier se trouve généralement dans :
- `/etc/nginx/sites-available/api.novotel-tunis.com`
- Ou dans `/etc/nginx/nginx.conf`
- Ou dans `/etc/nginx/conf.d/api.novotel-tunis.com.conf`

Pour trouver le fichier :
```bash
sudo grep -r "api.novotel-tunis.com" /etc/nginx/
```

### Étape 3 : Sauvegarder la configuration actuelle

```bash
sudo cp /etc/nginx/sites-available/api.novotel-tunis.com /etc/nginx/sites-available/api.novotel-tunis.com.backup
```

### Étape 4 : Modifier la configuration

Ouvrez le fichier avec votre éditeur préféré :
```bash
sudo nano /etc/nginx/sites-available/api.novotel-tunis.com
```

Remplacez le bloc `server` pour `api.novotel-tunis.com` par cette configuration :

```nginx
# ----------------------
# Backend Novotel Tunis
# ----------------------
server {
    listen 443 ssl;
    server_name api.novotel-tunis.com;

    ssl_certificate /etc/letsencrypt/live/api.novotel-tunis.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.novotel-tunis.com/privkey.pem;

    # ⚠️ IMPORTANT : Permettre les uploads illimités
    client_max_body_size 0;

    # Timeouts pour les uploads volumineux
    client_body_timeout 300s;
    proxy_read_timeout 300s;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;

    # Headers CORS
    add_header Access-Control-Allow-Origin $http_origin always;
    add_header Access-Control-Allow-Credentials "true" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, PATCH" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, Accept" always;

    # Gérer les requêtes OPTIONS (preflight CORS)
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

### Étape 5 : Tester la configuration

```bash
sudo nginx -t
```

Vous devriez voir :
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Étape 6 : Recharger Nginx

```bash
sudo systemctl reload nginx
```

Ou si cela ne fonctionne pas :
```bash
sudo systemctl restart nginx
```

### Étape 7 : Vérifier que ça fonctionne

Testez l'upload d'un fichier depuis votre frontend. Les erreurs 413 et CORS devraient disparaître.

## Vérification

Pour vérifier que la configuration est active :
```bash
sudo nginx -T | grep -A 20 "api.novotel-tunis.com"
```

Vous devriez voir `client_max_body_size 0;` dans la configuration.

## En cas de problème

Si quelque chose ne fonctionne pas :

1. **Restaurer la sauvegarde** :
   ```bash
   sudo cp /etc/nginx/sites-available/api.novotel-tunis.com.backup /etc/nginx/sites-available/api.novotel-tunis.com
   sudo systemctl reload nginx
   ```

2. **Vérifier les logs Nginx** :
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Vérifier que Node.js écoute sur le bon port** :
   ```bash
   sudo netstat -tlnp | grep 5000
   ```

## Note Importante

- `client_max_body_size 0;` signifie **illimité** (pas de limite)
- Les timeouts sont configurés à 300 secondes (5 minutes) pour les gros fichiers
- Les en-têtes CORS sont configurés pour accepter toutes les origines autorisées
