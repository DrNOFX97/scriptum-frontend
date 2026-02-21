# 📱 Scriptum Mobile v2.5

## Versão Mobile Moderna e Fluida

Experiência otimizada para dispositivos móveis e desktop com Progressive Web App (PWA).

---

## ✨ Características Mobile

### 🎯 **Interface Touch-First**
- Bottom navigation ergonômica
- Botões grandes e touch-friendly
- Gestos swipe para navegação
- Animações fluidas e responsivas

### 📦 **PWA (Progressive Web App)**
- Instalável como app nativa
- Funciona offline
- Ícone na home screen
- Notificações push (futuro)

### ⚡ **Performance Otimizada**
- Service Worker para cache inteligente
- Lazy loading de componentes
- Compressão de assets
- Preconnect para APIs

### 📱 **Responsivo (Mobile + Desktop)**
- Layout adaptativo automático
- Bottom nav em mobile (< 768px)
- Sidebar em desktop (≥ 768px)
- Safe area support (iOS notch)

---

## 🎨 Componentes Mobile

### **BottomNav**
```tsx
<BottomNav activeTab="sync" onTabChange={setActiveTab} />
```
Navegação inferior com 4 tabs principais.

### **MobileFileUpload**
```tsx
<MobileFileUpload
  type="video"
  accept="video/*"
  onFileSelect={handleFile}
/>
```
Upload otimizado com suporte para câmera (mobile).

### **MobileCard**
```tsx
<MobileCard
  title="Sincronização"
  description="MLX Whisper"
  icon={<FileVideo />}
  onClick={handleClick}
/>
```
Cards touch-friendly com ícones.

### **ResponsiveLayout**
```tsx
<ResponsiveLayout
  activeTab={activeTab}
  onTabChange={setActiveTab}
  sidebar={<Sidebar />}
>
  {content}
</ResponsiveLayout>
```
Layout que adapta mobile/desktop automaticamente.

---

## 🔧 Hooks Móveis

### **useSwipe**
```tsx
const swipeHandlers = useSwipe({
  onSwipeLeft: () => nextTab(),
  onSwipeRight: () => prevTab(),
  minSwipeDistance: 50,
});

<div {...swipeHandlers}>Swipe me!</div>
```

---

## 💾 PWA - Instalação

### **iOS (Safari)**
1. Abrir https://scriptum-v2-50.web.app
2. Tocar em "Compartilhar" (ícone quadrado com seta)
3. "Adicionar à Tela Inicial"
4. Tocar em "Adicionar"

### **Android (Chrome)**
1. Abrir https://scriptum-v2-50.web.app
2. Menu (3 pontos) → "Adicionar à tela inicial"
3. Confirmar

### **Desktop (Chrome/Edge)**
1. Ícone de instalação na barra de endereço
2. Ou Menu → "Instalar Scriptum"

---

## 🎨 CSS Utilities Mobile

### **Safe Area**
```css
.safe-area-top      /* Notch iPhone */
.safe-area-bottom   /* Home indicator */
.safe-area-inset    /* All insets */
```

### **Touch Optimization**
```css
.touch-manipulation  /* Disable long-press, etc */
.haptic-light       /* Scale on touch */
.haptic-medium
.haptic-heavy
```

### **Animations**
```css
.card-stack-item    /* Staggered entrance */
.modal-sheet        /* Slide up */
.skeleton           /* Loading shimmer */
```

---

## 📊 Performance

### **Métricas Alvo**
- FCP (First Contentful Paint): < 1.5s
- LCP (Largest Contentful Paint): < 2.5s
- TTI (Time to Interactive): < 3.5s
- CLS (Cumulative Layout Shift): < 0.1

### **Otimizações Aplicadas**
- ✅ Service Worker caching
- ✅ Lazy loading components
- ✅ Image optimization
- ✅ Preconnect DNS
- ✅ Code splitting
- ✅ Minified assets

---

## 🚀 Build & Deploy

### **Development**
```bash
npm run dev
```

### **Build**
```bash
npm run build
```

### **Deploy (Firebase)**
```bash
firebase deploy --only hosting
```

### **Preview Build**
```bash
npm run preview
```

---

## 🔮 Features Futuras

### **v2.6**
- [ ] Pull-to-refresh
- [ ] Background sync (uploads pendentes)
- [ ] Share API (compartilhar legendas)
- [ ] File System Access API

### **v2.7**
- [ ] Push notifications
- [ ] Offline editing
- [ ] IndexedDB cache
- [ ] WebRTC peer sharing

---

## 🐛 Troubleshooting

### **PWA não instala**
- Certifique-se que está em HTTPS
- Verifique se manifest.json está acessível
- Service Worker deve estar registrado
- Chrome DevTools → Application → Manifest

### **Offline não funciona**
- Service Worker deve estar ativo
- Chrome DevTools → Application → Service Workers
- Clear cache e recarregue

### **Layout quebrado em mobile**
- Viewport meta tag presente?
- Tailwind breakpoints corretos (md:)?
- Safe area insets configurados?

---

## 📖 Referencias

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Mobile Web Best Practices](https://web.dev/mobile/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://web.dev/add-manifest/)

---

**Criado por:** Scriptum Team
**Versão:** 2.5.0
**Data:** 2026-02-21
