# Configuration du Serveur pour Uploads Illimités

## Problème : Erreur 413 (Request Entity Too Large)

L'erreur 413 se produit lorsque le serveur web (Nginx/Apache) devant votre application Node.js rejette les requêtes avant qu'elles n'atteignent Express.

## Solution : Configuration Nginx

### 1. Localiser le fichier de configuration Nginx

Le fichier de configuration se trouve généralement dans :
- `/etc/nginx/sites-available/api.novotel-tunis.com`
- Ou dans `/etc/nginx/nginx.conf` (configuration globale)

### 2. Modifier la configuration

Ajoutez ou modifiez ces directives dans le bloc `server` pour `api.novotel-tunis.com` :

```nginx
# Augmenter la limite de taille (10GB = effectivement illimité)
client_max_body_size 10G;

# Timeouts pour les uploads volumineux
client_body_timeout 300s;
proxy_read_timeout 300s;
proxy_connect_timeout 300s;
proxy_send_timeout 300s;

# Désactiver le buffering pour les gros fichiers
proxy_buffering off;
proxy_request_buffering off;
```

### 3. Appliquer la configuration

```bash
# Tester la configuration
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx
# ou
sudo service nginx reload
```

### 4. Vérifier la configuration

Après avoir modifié Nginx, testez l'upload d'un fichier volumineux. L'erreur 413 devrait disparaître.

## Configuration Apache (si utilisé)

Si vous utilisez Apache au lieu de Nginx, ajoutez dans `.htaccess` ou dans la configuration du serveur virtuel :

```apache
# Augmenter la limite de taille
LimitRequestBody 10737418240  # 10GB en octets

# Timeouts
Timeout 300
```

Puis redémarrez Apache :
```bash
sudo systemctl restart apache2
```

## Vérification

Pour vérifier que la configuration fonctionne :

1. Testez l'upload d'un fichier volumineux depuis votre frontend
2. Vérifiez les logs Nginx : `tail -f /var/log/nginx/api.novotel-tunis.com.error.log`
3. Vérifiez les logs de l'application Node.js

## Notes Importantes

- **Sécurité** : Des limites très élevées peuvent permettre des attaques DoS. Assurez-vous d'avoir d'autres mesures de sécurité en place.
- **Espace disque** : Vérifiez que vous avez suffisamment d'espace disque pour stocker les fichiers uploadés.
- **Mémoire** : Les gros fichiers peuvent consommer beaucoup de mémoire. Surveillez l'utilisation de la RAM.
