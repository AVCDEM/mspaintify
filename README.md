# 🎨 mspaintify

Site onde a pessoa desenha tosco no mouse e a IA gera uma versão fotorrealista. 100% gratuito para hospedar.

## Como funciona

1. Pessoa desenha no canvas
2. Gemini Vision (gratuito) descreve o desenho em texto
3. Pollinations.ai (gratuito) gera a imagem fotorrealista a partir da descrição
4. Adiciona marca d'água do mspaintify e botão de share no X

---

## 🚀 Deploy passo a passo (15 minutos)

### Passo 1 — Pegar a chave do Gemini (grátis)

1. Acesse https://aistudio.google.com/apikey
2. Faça login com sua conta Google
3. Clique em **"Create API key"**
4. Copie a chave (começa com `AIza...`) e guarde — você vai usar no Passo 4

> Free tier: ~1.500 requests/dia. Se estourar, paga centavos por extra ou troca para outro modelo.

### Passo 2 — Subir o código no GitHub

1. Crie conta em https://github.com (se ainda não tem)
2. Clique em **"New repository"** → nomeia como `mspaintify` → deixa público → **Create**
3. Na tela seguinte do GitHub, copie os comandos da seção "push an existing repository"

No terminal, dentro da pasta do projeto:

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/mspaintify.git
git push -u origin main
```

> Se nunca usou git, instale primeiro: https://git-scm.com/downloads
> Alternativa sem terminal: usa o GitHub Desktop (https://desktop.github.com/) — só arrasta a pasta e dá commit.

### Passo 3 — Deploy no Vercel (grátis)

1. Acesse https://vercel.com/signup → faça login com sua conta GitHub
2. Clique em **"Add New..."** → **"Project"**
3. Selecione o repositório `mspaintify` → clica **"Import"**
4. **NÃO clique em Deploy ainda** — vamos adicionar a variável de ambiente primeiro

### Passo 4 — Adicionar a chave do Gemini no Vercel

Ainda na tela de import do Vercel, antes de fazer deploy:

1. Expande a seção **"Environment Variables"**
2. Adiciona:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** sua chave do Gemini (a que você copiou no Passo 1)
3. Clica em **"Add"**
4. Agora sim, clica em **"Deploy"**

Aguarda 1-2 minutos. Quando terminar, o Vercel te dá uma URL tipo `mspaintify-abc123.vercel.app`. **Esse é seu site no ar.**

### Passo 5 — Customizar para sua moeda

Edita `pages/index.js`, no topo do arquivo:

```js
const TOKEN_TICKER = '$SEUTICKER';      // troca pelo ticker da sua moeda
const TWITTER_HANDLE = '@seuhandle';    // troca pelo handle oficial do X
const SHARE_HASHTAG = '#suahashtag';    // troca pela hashtag de campanha
```

Salva, dá `git push` e o Vercel re-deploya sozinho em 1 minuto.

### Passo 6 (opcional) — Domínio próprio

URL `.vercel.app` funciona, mas `mspaintify.fun` ou `.xyz` ($3-12/ano) é muito mais memorável.

1. Compra domínio em https://www.namecheap.com ou https://porkbun.com
2. No Vercel, vai em **Settings → Domains** do projeto
3. Adiciona o domínio e segue as instruções de DNS que aparecem
4. Em ~1h tá no ar

---

## 🧪 Rodar localmente (opcional, antes de deployar)

```bash
# instala dependências
npm install

# cria .env.local
cp .env.local.example .env.local
# edita .env.local e cola sua chave Gemini

# roda em dev
npm run dev
```

Abre http://localhost:3000

---

## 💰 Custos esperados

| Item | Custo |
|------|-------|
| Hospedagem Vercel | **R$ 0** (free tier aguenta milhares de visitas) |
| Gemini Vision | **R$ 0** até 1.500 requests/dia, depois ~R$ 0,005 por imagem |
| Pollinations.ai | **R$ 0** (público, sem limite divulgado) |
| Domínio (opcional) | R$ 15-60/ano |

Se o site explodir e estourar o free tier do Gemini, troca pra paid (~R$ 30-100/mês para uso pesado) ou move pra HuggingFace gratuito.

---

## 🔥 Estratégia de divulgação

- **Pin no perfil oficial do X:** post com vídeo de tela mostrando o antes/depois + link
- **Bait de influencer:** desenha o pfp deles, gera versão real, manda mention educada
- **Concurso diário:** melhor desenho do dia ganha shoutout/allocation
- **Dia temático:** "draw a CT meme day", "draw your token logo day"
- **Campanha de QRT:** comunidade desenha respostas a posts virais e cita o site

A viralidade do produto vem do **antes/depois ser engraçado**. Encoraja a galera a postar os dois lados (desenho + resultado) — isso é o que vai vender.

---

## 🐛 Troubleshooting

**"GEMINI_API_KEY not configured"**
→ Você esqueceu de adicionar a env var no Vercel. Settings → Environment Variables → adiciona e re-deploya.

**"Vision API failed"**
→ Sua chave do Gemini tá inválida ou estourou quota. Confere em https://aistudio.google.com/apikey

**"Timeout — try again"**
→ Pollinations tá lento. Acontece. Manda gerar de novo, geralmente vai na segunda.

**Imagem aparece sem marca d'água**
→ CORS do Pollinations bloqueou. Funciona normalmente em ~95% dos casos. Se persistir, me avisa.

---

## 📜 Licença

Faça o que quiser com isso. Boa sorte com a moeda 🚀
