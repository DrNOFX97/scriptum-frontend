# 🔥 Deploy Frontend no Firebase Hosting

## ✅ Tudo está PRONTO! Só falta fazer login e deploy.

---

## 🚀 PASSOS RÁPIDOS (5 minutos):

### 1️⃣ **Abre o Terminal** na pasta do projeto:

```bash
cd /Users/f.nuno/projetos/scriptum-v2.5
```

---

### 2️⃣ **Login no Firebase:**

```bash
firebase login
```

- Vai abrir o browser
- Faz login com a **mesma conta Google** que usaste no GCP
- Autoriza o acesso
- Volta ao terminal

---

### 3️⃣ **Criar projeto Firebase (se não existir):**

Opção A - Usar o mesmo projeto GCP:
```bash
# Usa o projeto "scriptum-v2-5" que já existe
firebase use scriptum-v2-5
```

Opção B - Criar novo projeto:
```bash
# Ou cria novo projeto Firebase
firebase projects:create
# Nome sugerido: scriptum-v2-5
```

---

### 4️⃣ **Inicializar Firebase Hosting:**

```bash
firebase init hosting
```

Responde:
- **Use an existing project?** → Yes
- **Select project:** → scriptum-v2-5 (ou o que criaste)
- **Public directory?** → `dist` ✅ (já configurado)
- **Configure as SPA?** → Yes ✅
- **Set up automatic builds with GitHub?** → No (por agora)
- **Overwrite dist/index.html?** → No ❌

---

### 5️⃣ **DEPLOY! 🚀**

```bash
firebase deploy
```

Aguarda ~30 segundos...

---

## 🎉 **Quando terminar:**

Vais ver algo como:

```
✔  Deploy complete!

Hosting URL: https://scriptum-v2-5.web.app
```

---

## 🧪 **Testa o site:**

Abre o URL que apareceu:
- `https://scriptum-v2-5.web.app`
- OU `https://scriptum-v2-5.firebaseapp.com`

---

## 🔄 **Atualizações futuras:**

Para atualizar o site:
```bash
npm run build
firebase deploy
```

---

## 📊 **Vantagens Firebase Hosting:**

✅ CDN global (rápido em todo o mundo)
✅ SSL/HTTPS automático
✅ Deploy em 30 segundos
✅ Rollback fácil (se algo correr mal)
✅ Free tier: 10GB storage + 360MB/dia
✅ Mesma plataforma que o backend (GCP)

---

## 🆘 **Problemas?**

### Erro: "Project not found"
```bash
# Lista projetos disponíveis
firebase projects:list

# Usa o ID correto
firebase use <project-id>
```

### Erro: "Permission denied"
- Confirma que fizeste login com a conta certa
- Verifica no console GCP: https://console.firebase.google.com

---

## ✅ **Depois de fazer deploy:**

1. Testa o site
2. Copia o URL Firebase
3. Avisa-me para verificar se tudo funciona!

---

**Boa sorte! É super rápido! 🚀**
